'use client';

import { useState, useTransition, useCallback, useReducer, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  searchVideos,
  advancedSearchVideos,
  searchChannels,
  searchPlaylists,
} from '@/lib/actions';
import type {
  VideoResult,
  ChannelResult,
  PlaylistResult,
  AdvancedSearchRequest,
  ApiResponse,
} from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Search, ArrowLeft, ArrowRight, AlertTriangle } from 'lucide-react';
import VideoCard from '@/components/search/VideoCard';
import ChannelCard from '@/components/search/ChannelCard';
import PlaylistCard from '@/components/search/PlaylistCard';
import AdvancedSearch from '@/components/search/AdvancedSearch';

type SearchResultData = VideoResult[] | ChannelResult[] | PlaylistResult[];

type CacheKey = string;

type CacheEntry = {
  results: SearchResultData;
  nextPageToken?: string | null;
  prevPageToken?: string | null;
  error?: string | null;
};

type SearchCache = {
  videos: Record<CacheKey, CacheEntry>;
  channels: Record<CacheKey, CacheEntry>;
  playlists: Record<CacheKey, CacheEntry>;
};

type SearchState = {
  currentSearch: AdvancedSearchRequest;
  activeTab: 'videos' | 'channels' | 'playlists';
  cache: SearchCache;
  isHydrated: boolean;
};

type SearchAction =
  | { type: 'SET_SEARCH_PARAMS'; payload: AdvancedSearchRequest }
  | { type: 'SET_ACTIVE_TAB'; payload: 'videos' | 'channels' | 'playlists' }
  | { type: 'SET_SEARCH_RESULTS'; payload: { tab: 'videos' | 'channels' | 'playlists'; key: CacheKey; data: ApiResponse<any> } }
  | { type: 'SET_SEARCH_ERROR'; payload: { tab: 'videos' | 'channels' | 'playlists'; key: CacheKey; message: string } }
  | { type: 'CLEAR_ERROR'; payload: { tab: 'videos' | 'channels' | 'playlists'; key: CacheKey } }
  | { type: 'HYDRATE_STATE'; payload: Partial<SearchState> };

// Function to create a consistent cache key from search parameters
const createCacheKey = (params: AdvancedSearchRequest) => {
  const keyParams = { ...params };
  // sort keys to ensure consistency
  const sortedKeys = Object.keys(keyParams).sort() as Array<keyof AdvancedSearchRequest>;
  const relevantParams: any = {};
  for (const key of sortedKeys) {
    if (keyParams[key] !== undefined && keyParams[key] !== null && keyParams[key] !== '') {
       relevantParams[key] = keyParams[key];
    }
  }
  return new URLSearchParams(relevantParams).toString();
};

const initialState: SearchState = {
  currentSearch: { query: '' },
  activeTab: 'videos',
  cache: { videos: {}, channels: {}, playlists: {} },
  isHydrated: false,
};

function searchReducer(state: SearchState, action: SearchAction): SearchState {
  switch (action.type) {
    case 'SET_SEARCH_PARAMS':
      return { ...state, currentSearch: action.payload };
    case 'SET_ACTIVE_TAB':
      return { ...state, activeTab: action.payload };
    case 'SET_SEARCH_RESULTS': {
      const { tab, key, data } = action.payload;
      const newCacheForTab = {
        ...state.cache[tab],
        [key]: {
          results: data.data,
          nextPageToken: data.nextPageToken,
          prevPageToken: data.prevPageToken,
          error: null,
        },
      };
      return {
        ...state,
        cache: { ...state.cache, [tab]: newCacheForTab },
      };
    }
    case 'SET_SEARCH_ERROR': {
      const { tab, key, message } = action.payload;
      const newCacheForTab = {
        ...state.cache[tab],
        [key]: {
          ...(state.cache[tab][key] as CacheEntry),
          results: [],
          error: message,
        },
      };
      return {
        ...state,
        cache: { ...state.cache, [tab]: newCacheForTab },
      };
    }
    case 'CLEAR_ERROR': {
      const { tab, key } = action.payload;
      if (!state.cache[tab][key]) return state;
      const newCacheForTab = {
        ...state.cache[tab],
        [key]: {
          ...state.cache[tab][key],
          error: null,
        },
      };
      return {
        ...state,
        cache: { ...state.cache, [tab]: newCacheForTab },
      };
    }
    case 'HYDRATE_STATE':
        const hydratedState = { ...state, ...action.payload, isHydrated: true };
        const urlSearch = searchParamsToAdvancedRequest(new URLSearchParams(window.location.search));
        if (urlSearch.query) {
            hydratedState.currentSearch = urlSearch;
        }
        return hydratedState;
    default:
      return state;
  }
}

const CACHE_KEY = 'tubeSleuthSearchCache';

const searchParamsToAdvancedRequest = (params: URLSearchParams): AdvancedSearchRequest => {
    const search: AdvancedSearchRequest = { query: params.get('query') || '' };
    if (params.has('maxResults')) search.maxResults = Number(params.get('maxResults'));
    if (params.has('order')) search.order = params.get('order');
    if (params.has('publishedAfter')) search.publishedAfter = params.get('publishedAfter');
    if (params.has('publishedBefore')) search.publishedBefore = params.get('publishedBefore');
    if (params.has('videoDuration')) search.videoDuration = params.get('videoDuration');
    return search;
}


export default function SearchPage() {
  const [state, dispatch] = useReducer(searchReducer, initialState);
  const [isPending, startTransition] = useTransition();
  const { toast } = useToast();
  const router = useRouter();
  const searchParams = useSearchParams();

  // Hydrate state from localStorage and URL on initial render
  useEffect(() => {
    try {
      const storedState = localStorage.getItem(CACHE_KEY);
       if (storedState) {
        const parsedState = JSON.parse(storedState);
        dispatch({ type: 'HYDRATE_STATE', payload: parsedState });
      } else {
        dispatch({ type: 'HYDRATE_STATE', payload: {} });
      }
    } catch (error) {
      console.error('Could not load state from localStorage', error);
      dispatch({ type: 'HYDRATE_STATE', payload: {} });
    }
  }, []);

  // Persist state to localStorage whenever it changes
  useEffect(() => {
    if (state.isHydrated) {
      try {
        const stateToStore = {
          currentSearch: state.currentSearch,
          activeTab: state.activeTab,
          cache: state.cache,
        };
        localStorage.setItem(CACHE_KEY, JSON.stringify(stateToStore));
      } catch (error) {
        console.error('Could not save state to localStorage', error);
      }
    }
  }, [state]);

  // Effect to perform search when URL changes
  useEffect(() => {
    if (state.isHydrated) {
        const urlSearch = searchParamsToAdvancedRequest(searchParams);
        const currentKey = createCacheKey(urlSearch);
        const stateKey = createCacheKey(state.currentSearch);

        if (urlSearch.query && currentKey !== stateKey) {
            dispatch({ type: 'SET_SEARCH_PARAMS', payload: urlSearch });
            performSearch(urlSearch, state.activeTab);
        }
    }
  }, [searchParams, state.isHydrated]);

  const updateURL = (params: AdvancedSearchRequest) => {
    const searchParams = new URLSearchParams();
    for (const [key, value] of Object.entries(params)) {
        if (value !== undefined && value !== null && value !== '') {
            searchParams.set(key, String(value));
        }
    }
    router.push(`/?${searchParams.toString()}`);
  }

  const performSearch = useCallback(
    async (
      searchRequest: AdvancedSearchRequest,
      tab: 'videos' | 'channels' | 'playlists',
      pageToken?: string | null
    ) => {
      if (!searchRequest.query) {
        toast({ title: 'Search query is empty', description: 'Please enter a search term.', variant: 'destructive' });
        return;
      }
      
      startTransition(async () => {
        const key = createCacheKey(searchRequest);
        dispatch({ type: 'CLEAR_ERROR', payload: { tab, key } });

        try {
          let response;
          const searchBody = { ...searchRequest, maxResults: 12 };

          if (tab === 'videos') {
            response = await advancedSearchVideos({ ...searchBody, pageToken });
          } else {
            // Basic search for channels and playlists as they don't have advanced options
            const simpleQuery = searchRequest.query;
            const maxResults = 12;
            if (tab === 'channels') {
              response = await searchChannels(simpleQuery, maxResults, pageToken);
            } else {
              response = await searchPlaylists(simpleQuery, maxResults, pageToken);
            }
          }

          if (response.data) {
            dispatch({ type: 'SET_SEARCH_RESULTS', payload: { tab, key, data: response } });
          } else {
            throw new Error(response.message || 'No data returned');
          }
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
          dispatch({ type: 'SET_SEARCH_ERROR', payload: { tab, key, message: `Could not fetch ${tab}: ${errorMessage}` } });
        }
      });
    },
    [toast]
  );
  
  const handleAdvancedSearch = (data: AdvancedSearchRequest) => {
    dispatch({ type: 'SET_SEARCH_PARAMS', payload: data });
    dispatch({ type: 'SET_ACTIVE_TAB', payload: 'videos' });
    updateURL(data);
    performSearch(data, 'videos');
  };

  const onFormSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const newSearch = { query: state.currentSearch.query }; // Simple search resets filters
    dispatch({ type: 'SET_SEARCH_PARAMS', payload: newSearch });
    updateURL(newSearch);
    performSearch(newSearch, state.activeTab);
  };
  
  const onTabChange = (value: string) => {
    const newTab = value as 'videos' | 'channels' | 'playlists';
    dispatch({ type: 'SET_ACTIVE_TAB', payload: newTab });
    const currentKey = createCacheKey(state.currentSearch);
    if (state.currentSearch.query && !state.cache[newTab][currentKey]) {
      performSearch(state.currentSearch, newTab);
    }
  };

  const handlePageChange = (token: string | null | undefined) => {
    if (token) {
      performSearch(state.currentSearch, state.activeTab, token);
    }
  };

  const currentCacheKey = createCacheKey(state.currentSearch);
  const currentCacheEntry = state.cache[state.activeTab]?.[currentCacheKey];
  const results = currentCacheEntry?.results || [];
  const currentError = currentCacheEntry?.error;
  
  const renderPagination = () => {
    if (!currentCacheEntry || isPending || currentError) return null;
    return (
      <div className="flex justify-center items-center gap-4 mt-8">
        <Button onClick={() => handlePageChange(currentCacheEntry.prevPageToken)} disabled={!currentCacheEntry.prevPageToken || isPending}>
          <ArrowLeft className="mr-2 h-4 w-4" /> Previous
        </Button>
        <Button onClick={() => handlePageChange(currentCacheEntry.nextPageToken)} disabled={!currentCacheEntry.nextPageToken || isPending}>
          Next <ArrowRight className="ml-2 h-4 w-4" />
        </Button>
      </div>
    );
  };
  
  const renderContent = (tab: 'videos' | 'channels' | 'playlists') => {
    const tabCacheKey = createCacheKey(state.currentSearch);
    const tabCacheEntry = state.cache[tab]?.[tabCacheKey];
    const tabResults = tabCacheEntry?.results || [];
    const tabError = tabCacheEntry?.error;

    if (!state.isHydrated) {
      return <div className="flex justify-center items-center p-10"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
    }
    
    if (isPending && state.activeTab === tab) {
      return <div className="flex justify-center items-center p-10"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
    }

    if (tabError) {
      return (
        <div className="text-center text-destructive mt-16 flex flex-col items-center gap-4">
          <AlertTriangle className="w-10 h-10" />
          <p className="font-semibold">An Error Occurred</p>
          <p className="text-sm max-w-md">{tabError}</p>
        </div>
      );
    }

    if (tabResults.length === 0 && state.currentSearch.query) {
      return <div className="text-center text-muted-foreground mt-16"><p>No results found for "{state.currentSearch.query}".</p></div>;
    }

    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 animate-in fade-in-50">
        {tab === 'videos' && (tabResults as VideoResult[]).map((video) => <VideoCard key={video.videoId} video={video} />)}
        {tab === 'channels' && (tabResults as ChannelResult[]).map((channel) => <ChannelCard key={channel.channelId} channel={channel} />)}
        {tab === 'playlists' && (tabResults as PlaylistResult[]).map((playlist) => <PlaylistCard key={playlist.playlistId} playlist={playlist} />)}
      </div>
    );
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="text-center mb-10">
        <h1 className="text-4xl md:text-5xl font-bold font-headline mb-2 bg-clip-text text-transparent bg-gradient-to-r from-primary to-accent">
          Tube Sleuth
        </h1>
        <p className="text-muted-foreground text-lg">Your AI-Powered YouTube Companion</p>
      </div>

      <form onSubmit={onFormSubmit} className="max-w-2xl mx-auto mb-8">
        <div className="flex w-full items-center space-x-2 bg-card p-2 rounded-lg shadow-md">
          <Input
            type="search"
            placeholder="Search for videos, channels, or playlists..."
            className="flex-grow border-0 focus-visible:ring-0 focus-visible:ring-offset-0 text-base"
            value={state.currentSearch.query}
            onChange={(e) => dispatch({ type: 'SET_SEARCH_PARAMS', payload: { ...state.currentSearch, query: e.target.value }})}
          />
          <Button type="submit" size="icon" disabled={isPending}>
            {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
          </Button>
          <AdvancedSearch onSearch={handleAdvancedSearch} defaultValues={state.currentSearch} />
        </div>
      </form>

      <Tabs value={state.activeTab} onValueChange={onTabChange} className="w-full">
        <TabsList className="grid w-full grid-cols-3 max-w-md mx-auto">
          <TabsTrigger value="videos">Videos</TabsTrigger>
          <TabsTrigger value="channels">Channels</TabsTrigger>
          <TabsTrigger value="playlists">Playlists</TabsTrigger>
        </TabsList>
        <TabsContent value="videos" className="mt-6">
          {renderContent('videos')}
        </TabsContent>
        <TabsContent value="channels" className="mt-6">
           {renderContent('channels')}
        </TabsContent>
        <TabsContent value="playlists" className="mt-6">
           {renderContent('playlists')}
        </TabsContent>
      </Tabs>
      
      {renderPagination()}

      {!isPending && results.length === 0 && !state.currentSearch.query && state.isHydrated && !currentError && (
        <div className="text-center text-muted-foreground mt-16">
          <p>Ready to start your search.</p>
          <p className="text-sm">Enter a term above to begin exploring YouTube.</p>
        </div>
      )}
    </div>
  );
}
