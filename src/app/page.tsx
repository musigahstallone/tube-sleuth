'use client';

import { useState, useTransition, useCallback, useReducer, useEffect } from 'react';
import {
  searchVideos,
  advancedSearchVideos,
  searchChannels,
  searchPlaylists,
} from '@/lib/actions';
import type { VideoResult, ChannelResult, PlaylistResult, AdvancedSearchRequest, ApiResponse } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Search, ArrowLeft, ArrowRight } from 'lucide-react';
import VideoCard from '@/components/search/VideoCard';
import ChannelCard from '@/components/search/ChannelCard';
import PlaylistCard from '@/components/search/PlaylistCard';
import AdvancedSearch from '@/components/search/AdvancedSearch';
import { suggestRelatedVideos } from '@/ai/flows/suggest-related-videos';
import { useSearchParams } from 'next/navigation';

type SearchResultData = VideoResult[] | ChannelResult[] | PlaylistResult[];

type CacheEntry = {
    results: SearchResultData;
    nextPageToken?: string | null;
    prevPageToken?: string | null;
};

type SearchCache = {
  videos: Record<string, CacheEntry>;
  channels: Record<string, CacheEntry>;
  playlists: Record<string, CacheEntry>;
};

type SearchState = {
  query: string;
  activeTab: 'videos' | 'channels' | 'playlists';
  cache: SearchCache;
  isHydrated: boolean;
};

type SearchAction =
  | { type: 'SET_QUERY'; payload: string }
  | { type: 'SET_ACTIVE_TAB'; payload: 'videos' | 'channels' | 'playlists' }
  | { type: 'SET_SEARCH_RESULTS'; payload: { tab: 'videos' | 'channels' | 'playlists', query: string, data: ApiResponse<any> } }
  | { type: 'HYDRATE_STATE'; payload: Partial<SearchState> };

const initialState: SearchState = {
  query: '',
  activeTab: 'videos',
  cache: { videos: {}, channels: {}, playlists: {} },
  isHydrated: false,
};

function searchReducer(state: SearchState, action: SearchAction): SearchState {
  switch (action.type) {
    case 'SET_QUERY':
      return { ...state, query: action.payload };
    case 'SET_ACTIVE_TAB':
      return { ...state, activeTab: action.payload };
    case 'SET_SEARCH_RESULTS': {
      const { tab, query, data } = action.payload;
      const newCacheForTab = {
          ...state.cache[tab],
          [query]: {
              results: data.data,
              nextPageToken: data.nextPageToken,
              prevPageToken: data.prevPageToken,
          }
      };
      return { 
          ...state, 
          cache: { ...state.cache, [tab]: newCacheForTab },
      };
    }
    case 'HYDRATE_STATE':
        return { ...state, ...action.payload, isHydrated: true };
    default:
      return state;
  }
}

const CACHE_KEY = 'tubeSleuthSearchCache';

export default function Home() {
  const [state, dispatch] = useReducer(searchReducer, initialState);
  const [isPending, startTransition] = useTransition();
  const { toast } = useToast();
  const searchParams = useSearchParams();

  // Hydrate state from localStorage on initial render
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
      console.error("Could not load state from localStorage", error);
      dispatch({ type: 'HYDRATE_STATE', payload: {} });
    }
  }, []);

  // Persist state to localStorage whenever it changes
  useEffect(() => {
    if (state.isHydrated) {
      try {
        const stateToStore = {
          query: state.query,
          activeTab: state.activeTab,
          cache: state.cache
        };
        localStorage.setItem(CACHE_KEY, JSON.stringify(stateToStore));
      } catch (error) {
        console.error("Could not save state to localStorage", error);
      }
    }
  }, [state]);

  // Handle search from URL query parameter on initial load
   useEffect(() => {
    const urlQuery = searchParams.get('q');
    if (urlQuery && state.isHydrated && urlQuery !== state.query) {
      dispatch({ type: 'SET_QUERY', payload: urlQuery });
      handleSearch(urlQuery, state.activeTab);
    }
  }, [searchParams, state.isHydrated]);

  const currentCacheEntry = state.cache[state.activeTab][state.query];
  const results = currentCacheEntry?.results || [];

  const handleSearch = useCallback(async (currentQuery: string, currentTab: 'videos' | 'channels' | 'playlists', pageToken?: string | null) => {
    if (!currentQuery) {
      toast({
        title: 'Search query is empty',
        description: 'Please enter a search term.',
        variant: 'destructive',
      });
      return;
    }

    startTransition(async () => {
      try {
        let response;
        const maxResults = 12; // Fetch 12 results for better grid layout
        if (currentTab === 'videos') {
          response = await searchVideos(currentQuery, maxResults, pageToken);
        } else if (currentTab === 'channels') {
          response = await searchChannels(currentQuery, maxResults, pageToken);
        } else {
          response = await searchPlaylists(currentQuery, maxResults, pageToken);
        }

        if (response.data) {
          dispatch({ type: 'SET_SEARCH_RESULTS', payload: { tab: currentTab, query: currentQuery, data: response } });
        } else {
          throw new Error(response.message || 'No data returned');
        }
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
        toast({
          title: 'Search Failed',
          description: `Could not fetch ${currentTab}: ${errorMessage}`,
          variant: 'destructive',
        });
      }
    });
  }, [toast]);
  
  const handleAdvancedSearch = (data: AdvancedSearchRequest) => {
    startTransition(async () => {
      try {
        const response = await advancedSearchVideos({...data, maxResults: 12 });
        if (response.data) {
          dispatch({ type: 'SET_SEARCH_RESULTS', payload: { tab: 'videos', query: data.query, data: response } });
          dispatch({ type: 'SET_QUERY', payload: data.query });
          dispatch({ type: 'SET_ACTIVE_TAB', payload: 'videos' });
        } else {
          throw new Error(response.message || 'No data returned');
        }
      } catch (error) {
         const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
        toast({
          title: 'Advanced Search Failed',
          description: `Could not fetch videos: ${errorMessage}`,
          variant: 'destructive',
        });
      }
    });
  };

  const onFormSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    handleSearch(state.query, state.activeTab);
  };

  const onTabChange = (value: string) => {
    const newTab = value as 'videos' | 'channels' | 'playlists';
    dispatch({ type: 'SET_ACTIVE_TAB', payload: newTab });
    if (state.query && !state.cache[newTab][state.query]) {
      handleSearch(state.query, newTab);
    }
  };

  const handlePageChange = (token: string | null | undefined) => {
      if (token) {
          handleSearch(state.query, state.activeTab, token);
      }
  }

  const renderPagination = () => {
    if (!currentCacheEntry || isPending) return null;
    return (
        <div className="flex justify-center items-center gap-4 mt-8">
            <Button 
                onClick={() => handlePageChange(currentCacheEntry.prevPageToken)}
                disabled={!currentCacheEntry.prevPageToken || isPending}
            >
                <ArrowLeft className="mr-2 h-4 w-4" /> Previous
            </Button>
            <Button 
                onClick={() => handlePageChange(currentCacheEntry.nextPageToken)}
                disabled={!currentCacheEntry.nextPageToken || isPending}
            >
                Next <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
        </div>
    );
  }
  
  const renderContent = (tab: 'videos' | 'channels' | 'playlists') => {
    const tabResults = state.cache[tab][state.query]?.results || [];

    if (!state.isHydrated) {
        return <div className="flex justify-center items-center p-10"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
    }
    
    if (isPending && state.activeTab === tab) {
      return <div className="flex justify-center items-center p-10"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
    }
    if(tabResults.length === 0 && state.query) {
      return <div className="text-center text-muted-foreground mt-16"><p>No results found for "{state.query}".</p></div>
    }

    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 animate-in fade-in-50">
        {tab === 'videos' && (tabResults as VideoResult[]).map((video) => <VideoCard key={video.videoId} video={video} />)}
        {tab === 'channels' && (tabResults as ChannelResult[]).map((channel) => <ChannelCard key={channel.channelId} channel={channel} />)}
        {tab === 'playlists' && (tabResults as PlaylistResult[]).map((playlist) => <PlaylistCard key={playlist.playlistId} playlist={playlist} />)}
      </div>
    )
  }

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
            value={state.query}
            onChange={(e) => dispatch({ type: 'SET_QUERY', payload: e.target.value })}
          />
          <Button type="submit" size="icon" disabled={isPending}>
            {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
          </Button>
          <AdvancedSearch onSearch={handleAdvancedSearch} defaultQuery={state.query} />
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

      { !isPending && results.length === 0 && !state.query && state.isHydrated &&
        <div className="text-center text-muted-foreground mt-16">
          <p>Ready to start your search.</p>
          <p className="text-sm">Enter a term above to begin exploring YouTube.</p>
        </div>
      }
    </div>
  );
}
