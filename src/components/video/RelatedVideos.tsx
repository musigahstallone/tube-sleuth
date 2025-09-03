import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Lightbulb, Search } from 'lucide-react';
import Link from 'next/link';
import { Button } from '../ui/button';

type RelatedVideosProps = {
  suggestions: string[];
  currentVideoId: string;
};

export default function RelatedVideos({ suggestions, currentVideoId }: RelatedVideosProps) {
  const filteredSuggestions = suggestions.slice(0, 10);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Lightbulb className="w-6 h-6 text-primary" />
          <span>AI Recommendations</span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {filteredSuggestions.length > 0 ? (
          <ul className="space-y-3">
            {filteredSuggestions.map((title, index) => (
              <li key={index} className="group flex items-start gap-2 text-sm">
                <div className="mt-1 w-2 h-2 rounded-full bg-accent shrink-0"></div>
                <div className="flex-1">
                    <span className="group-hover:text-primary transition-colors">{title}</span>
                    <Link href={`/?q=${encodeURIComponent(title)}`} legacyBehavior>
                        <Button variant="ghost" size="icon" className="ml-2 h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity">
                            <Search className="h-4 w-4" />
                            <span className="sr-only">Search for this video</span>
                        </Button>
                    </Link>
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-muted-foreground">No related videos found.</p>
        )}
      </CardContent>
    </Card>
  );
}
