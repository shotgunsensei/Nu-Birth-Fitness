import { YouTubeChannel, YouTubePlaylist, YouTubeVideo, PaginatedResponse } from '../types/youtube';
import { parseISODurationToSeconds } from '../utils/format';

const API_KEY = import.meta.env.VITE_YOUTUBE_API_KEY;
const BASE_URL = 'https://www.googleapis.com/youtube/v3';

export class YouTubeAPIError extends Error {
  constructor(message: string, public status?: number) {
    super(message);
    this.name = 'YouTubeAPIError';
  }
}

async function fetchYoutube<T>(endpoint: string, params: Record<string, string>): Promise<T> {
  if (!API_KEY) {
    throw new YouTubeAPIError('Missing VITE_YOUTUBE_API_KEY environment variable');
  }

  const searchParams = new URLSearchParams({ ...params, key: API_KEY });
  const response = await fetch(`${BASE_URL}${endpoint}?${searchParams}`);
  
  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new YouTubeAPIError(
      error.error?.message || `YouTube API error: ${response.status}`,
      response.status
    );
  }
  
  return response.json();
}

export async function resolveChannel(handle: string): Promise<YouTubeChannel> {
  const data = await fetchYoutube<any>('/channels', {
    part: 'snippet,contentDetails,brandingSettings,statistics',
    forHandle: handle
  });

  if (!data.items?.length) {
    throw new YouTubeAPIError('Channel not found', 404);
  }

  const channel = data.items[0];
  return {
    id: channel.id,
    title: channel.snippet.title,
    description: channel.snippet.description,
    customUrl: channel.snippet.customUrl,
    thumbnails: channel.snippet.thumbnails,
    subscriberCount: channel.statistics.subscriberCount,
    videoCount: channel.statistics.videoCount,
    viewCount: channel.statistics.viewCount,
    uploadsPlaylistId: channel.contentDetails.relatedPlaylists.uploads,
    bannerUrl: channel.brandingSettings?.image?.bannerExternalUrl,
  };
}

export async function getVideos(ids: string[]): Promise<YouTubeVideo[]> {
  if (!ids.length) return [];
  
  // YouTube API allows max 50 ids per request
  const batches = [];
  for (let i = 0; i < ids.length; i += 50) {
    batches.push(ids.slice(i, i + 50));
  }

  const results = await Promise.all(
    batches.map(batch =>
      fetchYoutube<any>('/videos', {
        part: 'snippet,contentDetails,statistics,player,status',
        id: batch.join(',')
      })
    )
  );

  const videos: YouTubeVideo[] = [];
  results.forEach(res => {
    if (res.items) {
      res.items.forEach((item: any) => {
        if (item.status?.embeddable) {
          const duration = item.contentDetails.duration;
          videos.push({
            id: item.id,
            title: item.snippet.title,
            description: item.snippet.description,
            publishedAt: item.snippet.publishedAt,
            thumbnails: item.snippet.thumbnails,
            channelId: item.snippet.channelId,
            channelTitle: item.snippet.channelTitle,
            duration: duration,
            durationSeconds: parseISODurationToSeconds(duration),
            viewCount: item.statistics?.viewCount,
            likeCount: item.statistics?.likeCount,
            embeddable: item.status.embeddable
          });
        }
      });
    }
  });

  return videos;
}

export async function getPlaylistItems(
  playlistId: string, 
  pageToken?: string,
  maxResults: number = 50
): Promise<PaginatedResponse<string>> {
  const params: Record<string, string> = {
    part: 'snippet,contentDetails',
    playlistId,
    maxResults: maxResults.toString()
  };
  
  if (pageToken) {
    params.pageToken = pageToken;
  }

  const data = await fetchYoutube<any>('/playlistItems', params);
  
  const videoIds = data.items
    ?.map((item: any) => item.contentDetails.videoId)
    .filter(Boolean) || [];

  return {
    items: videoIds,
    nextPageToken: data.nextPageToken,
    prevPageToken: data.prevPageToken,
    totalResults: data.pageInfo?.totalResults || 0
  };
}

export async function getChannelPlaylists(
  channelId: string,
  pageToken?: string
): Promise<PaginatedResponse<YouTubePlaylist>> {
  const params: Record<string, string> = {
    part: 'snippet,contentDetails',
    channelId,
    maxResults: '50'
  };
  
  if (pageToken) {
    params.pageToken = pageToken;
  }

  const data = await fetchYoutube<any>('/playlists', params);
  
  const playlists: YouTubePlaylist[] = (data.items || []).map((item: any) => ({
    id: item.id,
    title: item.snippet.title,
    description: item.snippet.description,
    publishedAt: item.snippet.publishedAt,
    thumbnails: item.snippet.thumbnails,
    channelId: item.snippet.channelId,
    channelTitle: item.snippet.channelTitle,
    itemCount: item.contentDetails.itemCount
  }));

  return {
    items: playlists,
    nextPageToken: data.nextPageToken,
    prevPageToken: data.prevPageToken,
    totalResults: data.pageInfo?.totalResults || 0
  };
}
