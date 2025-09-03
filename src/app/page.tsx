'use client';

import { useState, useTransition } from 'react';
import {
  searchVideos,
  advancedSearchVideos,
  searchChannels,
  searchPlaylists,
} from '@/lib/actions';
import type { VideoResult, ChannelResult, PlaylistResult, AdvancedSearchRequest } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Search } from 'lucide-react';
import VideoCard from '@/components/search/VideoCard';
import ChannelCard from '@/components/search/ChannelCard';
import PlaylistCard from '@/components/search/PlaylistCard';
import AdvancedSearch from '@/components/search/AdvancedSearch';
import { suggestRelatedVideos } from '@/ai/flows/suggest-related-videos';

type SearchResults = {
  videos: VideoResult[];
  channels: ChannelResult[];
  playlists: PlaylistResult[];
};

export default function Home() {
  const [query, setQuery] = useState('');
  const [activeTab, setActiveTab] = useState('videos');
  const [results, setResults] = useState<SearchResults>({
    videos: [],
    channels: [],
    playlists: [],
  });
  const [isPending, startTransition] = useTransition();
  const { toast } = useToast();

  const handleSearch = (currentQuery: string, currentTab: string) => {
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
        if (currentTab === 'videos') {
          response = await searchVideos(currentQuery);
        } else if (currentTab === 'channels') {
          response = await searchChannels(currentQuery);
        } else {
          response = await searchPlaylists(currentQuery);
        }

        if (response.data) {
          setResults((prev) => ({ ...prev, [currentTab]: response.data }));
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
  };
  
  const handleAdvancedSearch = (data: AdvancedSearchRequest) => {
    startTransition(async () => {
      try {
        const response = await advancedSearchVideos(data);
        if (response.data) {
          setResults((prev) => ({ ...prev, videos: response.data }));
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
    handleSearch(query, activeTab);
  };

  const onTabChange = (value: string) => {
    setActiveTab(value);
    if (query) {
      // Re-run search for the new tab if a query already exists
      handleSearch(query, value);
    }
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
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          <Button type="submit" size="icon" disabled={isPending}>
            {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
          </Button>
          <AdvancedSearch onSearch={handleAdvancedSearch} defaultQuery={query} />
        </div>
      </form>

      <Tabs value={activeTab} onValueChange={onTabChange} className="w-full">
        <TabsList className="grid w-full grid-cols-3 max-w-md mx-auto">
          <TabsTrigger value="videos">Videos</TabsTrigger>
          <TabsTrigger value="channels">Channels</TabsTrigger>
          <TabsTrigger value="playlists">Playlists</TabsTrigger>
        </TabsList>
        <TabsContent value="videos" className="mt-6">
          {isPending && activeTab === 'videos' ? (
             <div className="flex justify-center items-center p-10"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 animate-in fade-in-50">
              {results.videos.map((video) => (
                <VideoCard key={video.videoId} video={video} />
              ))}
            </div>
          )}
        </TabsContent>
        <TabsContent value="channels" className="mt-6">
           {isPending && activeTab === 'channels' ? (
             <div className="flex justify-center items-center p-10"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 animate-in fade-in-50">
              {results.channels.map((channel) => (
                <ChannelCard key={channel.channelId} channel={channel} />
              ))}
            </div>
          )}
        </TabsContent>
        <TabsContent value="playlists" className="mt-6">
           {isPending && activeTab === 'playlists' ? (
             <div className="flex justify-center items-center p-10"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 animate-in fade-in-50">
              {results.playlists.map((playlist) => (
                <PlaylistCard key={playlist.playlistId} playlist={playlist} />
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
      
      { !isPending && results.videos.length === 0 && results.channels.length === 0 && results.playlists.length === 0 &&
        <div className="text-center text-muted-foreground mt-16">
          <p>Ready to start your search.</p>
          <p className="text-sm">Enter a term above to begin exploring YouTube.</p>
        </div>
      }
    </div>
  );
}
