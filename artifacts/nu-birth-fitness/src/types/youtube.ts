export interface YouTubeThumbnail {
  url: string;
  width: number;
  height: number;
}

export interface YouTubeThumbnails {
  default: YouTubeThumbnail;
  medium: YouTubeThumbnail;
  high: YouTubeThumbnail;
  standard?: YouTubeThumbnail;
  maxres?: YouTubeThumbnail;
}

export interface YouTubeChannel {
  id: string;
  title: string;
  description: string;
  customUrl: string;
  thumbnails: YouTubeThumbnails;
  subscriberCount: string;
  videoCount: string;
  viewCount: string;
  uploadsPlaylistId: string;
  bannerUrl?: string;
}

export interface YouTubeVideo {
  id: string;
  title: string;
  description: string;
  publishedAt: string;
  thumbnails: YouTubeThumbnails;
  channelId: string;
  channelTitle: string;
  duration: string;
  durationSeconds: number;
  viewCount?: string;
  likeCount?: string;
  embeddable: boolean;
}

export interface YouTubePlaylist {
  id: string;
  title: string;
  description: string;
  publishedAt: string;
  thumbnails: YouTubeThumbnails;
  channelId: string;
  channelTitle: string;
  itemCount: number;
}

export interface PaginatedResponse<T> {
  items: T[];
  nextPageToken?: string;
  prevPageToken?: string;
  totalResults: number;
}
