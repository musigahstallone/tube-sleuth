import type { VideoResult } from '@/lib/types';
import Link from 'next/link';
import Image from 'next/image';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CalendarDays, User } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

type VideoCardProps = {
  video: VideoResult;
};

export default function VideoCard({ video }: VideoCardProps) {
  const publishedDate = video.publishedAt ? new Date(video.publishedAt) : null;
  const timeAgo = publishedDate ? formatDistanceToNow(publishedDate, { addSuffix: true }) : 'N/A';

  return (
    <Link href={`/video/${video.videoId}`} className="group block">
      <Card className="h-full flex flex-col transition-all duration-300 hover:shadow-xl hover:-translate-y-1">
        <CardHeader className="p-0">
          <div className="aspect-video relative overflow-hidden rounded-t-lg">
            <Image
              src={video.thumbnailUrl || 'https://picsum.photos/320/180'}
              alt={video.title || 'Video thumbnail'}
              fill
              className="object-cover transition-transform duration-300 group-hover:scale-105"
              data-ai-hint="video thumbnail"
            />
          </div>
        </CardHeader>
        <CardContent className="p-4 flex-grow">
          <CardTitle className="text-base leading-snug mb-2 group-hover:text-primary transition-colors">
            {video.title}
          </CardTitle>
          <p className="text-sm text-muted-foreground line-clamp-2">{video.description}</p>
        </CardContent>
        <CardFooter className="p-4 pt-0 text-xs text-muted-foreground flex flex-col items-start gap-2">
           <div className="flex items-center gap-2">
            <User className="w-3 h-3"/>
            <span>{video.channelTitle}</span>
          </div>
          <div className="flex items-center gap-2">
            <CalendarDays className="w-3 h-3"/>
            <span>{timeAgo}</span>
          </div>
        </CardFooter>
      </Card>
    </Link>
  );
}
