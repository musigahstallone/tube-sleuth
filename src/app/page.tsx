import { Suspense } from 'react';
import SearchPage from '@/components/search/SearchPage';
import { Loader2 } from 'lucide-react';

export default function Home() {
  return (
    <Suspense fallback={<div className="flex h-[80vh] w-full items-center justify-center"><Loader2 className="h-10 w-10 animate-spin text-primary" /></div>}>
      <SearchPage />
    </Suspense>
  );
}
