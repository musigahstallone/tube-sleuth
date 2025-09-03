'use client';

import { useEffect, useState } from 'react';
import { Wifi, WifiOff } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';

export default function NetworkStatus() {
  const [isOnline, setIsOnline] = useState(true);

  useEffect(() => {
    // Set initial status
    if (typeof window !== 'undefined' && typeof window.navigator.onLine !== 'undefined') {
      setIsOnline(window.navigator.onLine);
    }

    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return (
    <AnimatePresence>
      {!isOnline && (
        <motion.div
          initial={{ y: '-100%', opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: '-100%', opacity: 0 }}
          transition={{ duration: 0.3 }}
          className="fixed top-0 left-0 right-0 z-50 bg-destructive text-destructive-foreground p-2 text-center text-sm flex items-center justify-center gap-2"
        >
          <WifiOff className="w-4 h-4" />
          You are currently offline. Please check your internet connection.
        </motion.div>
      )}
    </AnimatePresence>
  );
}
