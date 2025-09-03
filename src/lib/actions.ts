'use server';

import type {
  AdvancedSearchRequest,
  ApiResponse,
  ChannelResult,
  PlaylistResult,
  VideoDetails,
  VideoResult,
} from './types';

// In a real app, this would come from environment variables

async function fetcher<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<ApiResponse<T>> {
  try {
    const response = await fetch(`${process.env.API_BASE_URL}${endpoint}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        'X-API-KEY': process.env.API_KEY || '',
        ...options.headers,
      },
    });

    if (!response.ok) {
      const contentType = response.headers.get('content-type');
      let errorMessage;
      if (contentType && contentType.includes('application/json')) {
        const errorData = await response.json();
        errorMessage = errorData.message || `API Error: ${response.statusText}`;
      } else {
        errorMessage = `API Error: ${response.status} ${response.statusText}`;
      }
      throw new Error(errorMessage);
    }

    return response.json();
  } catch (error) {
    console.error(`API call to ${endpoint} failed:`, error);
    if (error instanceof TypeError && error.message.includes('fetch failed')) {
      return {
        status: 'Error',
        message:
          'Cannot connect to the backend service. It might be unavailable.',
        data: null,
        timestamp: new Date().toISOString(),
      };
    }
    if (error instanceof Error) {
      return {
        status: 'Error',
        message: error.message,
        data: null,
        timestamp: new Date().toISOString(),
      };
    }
    return {
      status: 'Error',
      message: 'An unknown network error occurred.',
      data: null,
      timestamp: new Date().toISOString(),
    };
  }
}

export async function searchVideos(
  query: string,
  maxResults: number = 25,
  pageToken?: string | null,
): Promise<ApiResponse<VideoResult[]>> {
  const params = new URLSearchParams({ query, maxResults: String(maxResults) });
  if (pageToken) params.append('pageToken', pageToken);
  return fetcher(`/api/YouTubeSearch/videos?${params.toString()}`);
}

export async function advancedSearchVideos(
  body: AdvancedSearchRequest
): Promise<ApiResponse<VideoResult[]>> {
  return fetcher('/api/YouTubeSearch/videos/advanced', {
    method: 'POST',
    body: JSON.stringify(body),
  });
}

export async function searchChannels(
  query: string,
  maxResults: number = 25,
  pageToken?: string | null,
): Promise<ApiResponse<ChannelResult[]>> {
  const params = new URLSearchParams({ query, maxResults: String(maxResults) });
  if (pageToken) params.append('pageToken', pageToken);
  return fetcher(`/api/YouTubeSearch/channels?${params.toString()}`);
}

export async function searchPlaylists(
  query: string,
  maxResults: number = 25,
  pageToken?: string | null,
): Promise<ApiResponse<PlaylistResult[]>> {
  const params = new URLSearchParams({ query, maxResults: String(maxResults) });
  if (pageToken) params.append('pageToken', pageToken);
  return fetcher(`/api/YouTubeSearch/playlists?${params.toString()}`);
}

export async function getVideoDetails(
  videoId: string
): Promise<ApiResponse<VideoDetails>> {
  return fetcher(`/api/YouTubeSearch/videos/${videoId}/details`);
}
