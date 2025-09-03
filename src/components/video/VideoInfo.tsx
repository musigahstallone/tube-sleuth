import type { VideoDetails } from '@/lib/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Eye, ThumbsUp, MessageSquare, Clock, CalendarDays, User } from 'lucide-react';
import { format, formatDistanceToNow } from 'date-fns';
import { Separator } from '@/components/ui/separator';

function formatCount(count: bigint | number | null | undefined): string {
    if (count === null || count === undefined) return 'N/A';
    const num = Number(count);
    if (num < 1000) return num.toString();
    if (num < 1000000) return `${(num / 1000).toFixed(1)}K`;
    if (num < 1000000000) return `${(num / 1000000).toFixed(1)}M`;
    return `${(num / 1000000000).toFixed(1)}B`;
}

function StatItem({ icon: Icon, value, label }: { icon: React.ElementType, value: string, label: string }) {
    return (
        <div className="flex items-center gap-3 p-4 rounded-lg bg-secondary">
            <div className="bg-primary/10 p-3 rounded-full">
                <Icon className="w-6 h-6 text-primary" />
            </div>
            <div>
                <div className="text-xl font-bold text-foreground">{value}</div>
                <div className="text-sm text-muted-foreground">{label}</div>
            </div>
        </div>
    );
}

export default function VideoInfo({ details }: { details: VideoDetails }) {
  const publishedDate = details.publishedAt ? new Date(details.publishedAt) : null;
  
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-2xl md:text-3xl font-headline">{details.title}</CardTitle>
        <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-muted-foreground pt-2">
            <div className="flex items-center gap-2">
                <User className="w-4 h-4" />
                <span>{details.channelTitle}</span>
            </div>
            {publishedDate && 
                <div className="flex items-center gap-2">
                    <CalendarDays className="w-4 h-4" />
                    <span>{formatDistanceToNow(publishedDate, { addSuffix: true })}</span>
                </div>
            }
             {details.duration && 
                <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4" />
                    <span>{details.duration.replace('PT', '').replace('H', 'h ').replace('M', 'm ').replace('S', 's')}</span>
                </div>
            }
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
            <StatItem icon={Eye} value={formatCount(details.viewCount)} label="Views" />
            <StatItem icon={ThumbsUp} value={formatCount(details.likeCount)} label="Likes" />
            <StatItem icon={MessageSquare} value={formatCount(details.commentCount)} label="Comments" />
        </div>
        
        <Separator className="my-6" />

        <div className="prose prose-sm dark:prose-invert max-w-none">
          <p className="text-foreground whitespace-pre-wrap">{details.description}</p>
        </div>

        {details.tags && details.tags.length > 0 && (
          <div className="mt-6">
            <h3 className="text-sm font-semibold mb-2 text-muted-foreground">Tags</h3>
            <div className="flex flex-wrap gap-2">
              {details.tags.map((tag) => (
                <Badge key={tag} variant="secondary">{tag}</Badge>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
