import type { ChannelResult } from '@/lib/types';
import Image from 'next/image';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { User } from 'lucide-react';

type ChannelCardProps = {
  channel: ChannelResult;
};

export default function ChannelCard({ channel }: ChannelCardProps) {
  return (
    <a href={channel.channelUrl || '#'} target="_blank" rel="noopener noreferrer" className="group block">
      <Card className="h-full flex flex-col items-center text-center transition-all duration-300 hover:shadow-xl hover:-translate-y-1">
        <CardHeader className="p-6">
          <Avatar className="h-24 w-24 border-4 border-background group-hover:border-primary transition-colors duration-300 shadow-lg">
            <AvatarImage src={channel.thumbnailUrl || ''} alt={channel.title || 'Channel avatar'} data-ai-hint="person portrait" />
            <AvatarFallback>
              <User className="w-10 h-10 text-muted-foreground" />
            </AvatarFallback>
          </Avatar>
        </CardHeader>
        <CardContent className="p-4 pt-0 flex-grow">
          <CardTitle className="text-lg leading-snug mb-2 group-hover:text-primary transition-colors">
            {channel.title}
          </CardTitle>
          <p className="text-sm text-muted-foreground line-clamp-3">{channel.description}</p>
        </CardContent>
      </Card>
    </a>
  );
}
