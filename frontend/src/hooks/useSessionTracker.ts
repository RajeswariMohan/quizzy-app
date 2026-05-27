import { useEffect } from 'react';
import { logoutSession, sendSessionHeartbeat } from '@/api/auth.api';
import { logApiError } from '@/api/client';
import { useAuthStore } from '@/store/authStore';

const HEARTBEAT_MS = 2 * 60 * 1000;

/**
 * Keeps the server-side session active while the user has the app open.
 */
export function useSessionTracker() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);

  useEffect(() => {
    if (!isAuthenticated) return;

    const ping = () => {
      sendSessionHeartbeat().catch((err) => logApiError('Session heartbeat failed', err));
    };

    ping();
    const interval = window.setInterval(ping, HEARTBEAT_MS);

    const onVisible = () => {
      if (document.visibilityState === 'visible') {
        ping();
      }
    };
    document.addEventListener('visibilitychange', onVisible);

    return () => {
      clearInterval(interval);
      document.removeEventListener('visibilitychange', onVisible);
    };
  }, [isAuthenticated]);
}

export async function endSessionOnLogout(): Promise<void> {
  try {
    await logoutSession();
  } catch (err) {
    logApiError('Logout session end failed', err);
  }
}
