import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/store/authStore';
import { roleHome } from '@/utils/roleHome';

/** Optional: redirect logged-in users to role home. Not used on /, /login, /signup, or /login/dev. */
export function useRedirectIfAuthenticated(): void {
  const navigate = useNavigate();
  const { isAuthenticated, user } = useAuthStore();

  useEffect(() => {
    if (isAuthenticated && user) {
      navigate(roleHome(user.role), { replace: true });
    }
  }, [isAuthenticated, user, navigate]);
}
