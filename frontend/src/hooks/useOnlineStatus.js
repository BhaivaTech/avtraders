// src/hooks/useOnlineStatus.js
// Hook to detect online/offline status and show a banner when offline.

import { useState, useEffect, useCallback } from 'react';

/**
 * Returns { isOnline, wasOffline, dismissOfflineNotice }
 *
 * - isOnline: current navigator.onLine status (reactive)
 * - wasOffline: true if the user was offline at any point since last page load
 * - dismissOfflineNotice: call to hide the "you're back online" banner
 */
export function useOnlineStatus() {
  const [isOnline, setIsOnline] = useState(() => {
    if (typeof navigator !== 'undefined') return navigator.onLine;
    return true;
  });
  const [wasOffline, setWasOffline] = useState(false);
  const [showReconnected, setShowReconnected] = useState(false);

  const handleOnline = useCallback(() => {
    setIsOnline(true);
    if (wasOffline) {
      setShowReconnected(true);
      // Auto-hide reconnection notice after 5 seconds
      setTimeout(() => setShowReconnected(false), 5000);
    }
  }, [wasOffline]);

  const handleOffline = useCallback(() => {
    setIsOnline(false);
    setWasOffline(true);
    setShowReconnected(false);
  }, []);

  useEffect(() => {
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [handleOnline, handleOffline]);

  const dismissOfflineNotice = useCallback(() => {
    setShowReconnected(false);
  }, []);

  return {
    isOnline,
    wasOffline,
    showReconnected,
    dismissOfflineNotice,
  };
}
