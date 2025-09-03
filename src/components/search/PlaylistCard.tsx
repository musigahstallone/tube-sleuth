import type { PlaylistResult } from '@/lib/types';
import Image from 'next/image';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { ListVideo } from 'lucide-react';

type PlaylistCardProps = {
  playlist: PlaylistResult;
};

export default function PlaylistCard({ playlist }: PlaylistCardProps) {
  return (
    <a href={playlist.playlistUrl || '#'} target="_blank" rel="noopener noreferrer" className="group block">
      <Card className="h-full flex flex-col transition-all duration-300 hover:shadow-xl hover:-translate-y-1">
        <CardHeader className="p-0">
           <div className="aspect-video relative overflow-hidden rounded-t-lg bg-accent/20 flex items-center justify-center">
            <Image
              src={playlist.thumbnailUrl || 'https://picsum.photos/320/180'}
              alt={playlist.title || 'Playlist thumbnail'}
              fill
              className="object-cover transition-transform duration-300 group-hover:scale-105"
              data-ai-hint="music album"
            />
             <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                <ListVideo className="w-12 h-12 text-white/70" />
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-4 flex-grow">
          <CardTitle className="text-base leading-snug mb-2 group-hover:text-primary transition-colors">
            {playlist.title}
          </CardTitle>
        </CardContent>
        <CardFooter className="p-4 pt-0 text-xs text-muted-foreground">
          <span>By {playlist.channelTitle}</span>
        </CardFooter>
      </Card>
    </a>
  );
}
