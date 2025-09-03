export interface VideoResult {
  videoId: string | null;
  title: string | null;
  description: string | null;
  channelTitle: string | null;
  channelId: string | null;
  publishedAt: string | null;
  thumbnailUrl: string | null;
  videoUrl: string | null;
}

export interface ChannelResult {
  channelId: string | null;
  title: string | null;
  description: string | null;
  publishedAt: string | null;
  thumbnailUrl: string | null;
  channelUrl: string | null;
}

export interface PlaylistResult {
  playlistId: string | null;
  title: string | null;
  description: string | null;
  channelTitle: string | null;
  channelId: string | null;
  publishedAt: string | null;
  thumbnailUrl: string | null;
  playlistUrl: string | null;
}

export interface VideoDetails {
  videoId: string | null;
  title: string | null;
  description: string | null;
  channelTitle: string | null;
  channelId: string | null;
  publishedAt: string | null;
  thumbnailUrl: string | null;
  videoUrl: string | null;
  viewCount: bigint | null;
  likeCount: bigint | null;
  commentCount: bigint | null;
  duration: string | null;
  tags: string[] | null;
}

export interface AdvancedSearchRequest {
  query: string;
  maxResults?: number;
  order?: string | null;
  publishedAfter?: string | null;
  publishedBefore?: string | null;
  regionCode?: string | null;
  relevanceLanguage?: string | null;
  videoDuration?: string | null;
}

export interface ApiResponse<T> {
  status: string | null;
  message: string | null;
  data: T | null;
  timestamp: string;
  nextPageToken?: string | null;
  prevPageToken?: string | null;
}
