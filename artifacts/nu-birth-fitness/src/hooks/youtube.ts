import { useQuery, useInfiniteQuery, useQueryClient } from '@tanstack/react-query';
import { resolveChannel, getPlaylistItems, getVideos, getChannelPlaylists, YouTubeAPIError } from '../api/youtube';
import { YouTubeVideo, YouTubePlaylist } from '../types/youtube';

const CHANNEL_HANDLE = '@NU-BirthFitness';
const STALE_TIME_CHANNEL = 1000 * 60 * 60; // 1 hour
const STALE_TIME_VIDEOS = 1000 * 60 * 30; // 30 minutes

export function useYouTubeKeyCheck() {
  return !!import.meta.env.VITE_YOUTUBE_API_KEY;
}

export function useChannel() {
  return useQuery({
    queryKey: ['youtube', 'channel', CHANNEL_HANDLE],
    queryFn: () => resolveChannel(CHANNEL_HANDLE),
    staleTime: STALE_TIME_CHANNEL,
    retry: (failureCount, error) => {
      if (error instanceof YouTubeAPIError && error.status === 404) return false;
      return failureCount < 2;
    }
  });
}

export function useUploads(enabled = true) {
  const { data: channel } = useChannel();
  const uploadsPlaylistId = channel?.uploadsPlaylistId;

  return useInfiniteQuery({
    queryKey: ['youtube', 'uploads', uploadsPlaylistId],
    queryFn: async ({ pageParam }: { pageParam?: string }) => {
      if (!uploadsPlaylistId) throw new Error('No uploads playlist ID');
      
      const res = await getPlaylistItems(uploadsPlaylistId, pageParam);
      const videos = await getVideos(res.items);
      
      return {
        videos,
        nextPageToken: res.nextPageToken,
        totalResults: res.totalResults
      };
    },
    enabled: enabled && !!uploadsPlaylistId,
    getNextPageParam: (lastPage) => lastPage.nextPageToken,
    initialPageParam: undefined as string | undefined,
    staleTime: STALE_TIME_VIDEOS
  });
}

export function useVideo(videoId: string, enabled = true) {
  const queryClient = useQueryClient();

  return useQuery({
    queryKey: ['youtube', 'video', videoId],
    queryFn: async () => {
      const videos = await getVideos([videoId]);
      if (!videos.length) throw new Error('Video not found');
      return videos[0];
    },
    enabled: enabled && !!videoId,
    staleTime: STALE_TIME_VIDEOS,
    initialData: () => {
      // Try to find it in the infinite query cache
      const uploads = queryClient.getQueryData<any>(['youtube', 'uploads']);
      if (uploads?.pages) {
        for (const page of uploads.pages) {
          const video = page.videos?.find((v: YouTubeVideo) => v.id === videoId);
          if (video) return video;
        }
      }
      return undefined;
    }
  });
}

export function usePlaylists() {
  const { data: channel } = useChannel();
  
  return useInfiniteQuery({
    queryKey: ['youtube', 'playlists', channel?.id],
    queryFn: async ({ pageParam }: { pageParam?: string }) => {
      if (!channel?.id) throw new Error('No channel ID');
      return getChannelPlaylists(channel.id, pageParam);
    },
    enabled: !!channel?.id,
    getNextPageParam: (lastPage) => lastPage.nextPageToken,
    initialPageParam: undefined as string | undefined,
    staleTime: STALE_TIME_CHANNEL
  });
}

export function usePlaylistItems(playlistId: string, enabled = true) {
  return useInfiniteQuery({
    queryKey: ['youtube', 'playlistItems', playlistId],
    queryFn: async ({ pageParam }: { pageParam?: string }) => {
      const res = await getPlaylistItems(playlistId, pageParam);
      const videos = await getVideos(res.items);
      return {
        videos,
        nextPageToken: res.nextPageToken
      };
    },
    enabled: enabled && !!playlistId,
    getNextPageParam: (lastPage) => lastPage.nextPageToken,
    initialPageParam: undefined as string | undefined,
    staleTime: STALE_TIME_VIDEOS
  });
}

export function useMultipleVideos(videoIds: string[]) {
  return useQuery({
    queryKey: ['youtube', 'multiple-videos', videoIds.join(',')],
    queryFn: () => getVideos(videoIds),
    enabled: videoIds.length > 0,
    staleTime: STALE_TIME_VIDEOS
  });
}
