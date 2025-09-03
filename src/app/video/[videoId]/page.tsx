import { getVideoDetails } from '@/lib/actions';
import { notFound } from 'next/navigation';
import { suggestRelatedVideos } from '@/ai/flows/suggest-related-videos';
import VideoPlayer from '@/components/video/VideoPlayer';
import VideoInfo from '@/components/video/VideoInfo';
import RelatedVideos from '@/components/video/RelatedVideos';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Terminal } from 'lucide-react';

export default async function VideoPage({ params }: { params: { videoId: string } }) {
  const { videoId } = params;
  
  if (!videoId) {
    notFound();
  }

  const videoDetailsResponse = await getVideoDetails(videoId);

  if (!videoDetailsResponse.data) {
     return (
      <div className="container mx-auto p-4 md:p-8">
        <Alert variant="destructive">
          <Terminal className="h-4 w-4" />
          <AlertTitle>Video Not Found</AlertTitle>
          <AlertDescription>
            The video you are looking for could not be found or there was an error fetching its details.
            Message: {videoDetailsResponse.message || 'Unknown error.'}
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  const videoDetails = videoDetailsResponse.data;

  // Fetch AI suggestions in parallel
  const relatedVideos = await suggestRelatedVideos({ query: videoDetails.title || '' });

  return (
    <div className="container mx-auto p-4 md:p-8">
      <div className="grid lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          <div className="mb-6">
            <VideoPlayer videoId={videoDetails.videoId!} />
          </div>
          <VideoInfo details={videoDetails} />
        </div>
        <div className="lg:col-span-1">
          <RelatedVideos 
            suggestions={relatedVideos.relatedVideos}
            currentVideoId={videoDetails.videoId!} 
          />
        </div>
      </div>
    </div>
  );
}
