import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/store/authStore';
import { roleHome } from '@/utils/roleHome';

/** Sends logged-in users to their role home (public auth/marketing pages). */
export function useRedirectIfAuthenticated(): void {
  const navigate = useNavigate();
  const { isAuthenticated, user } = useAuthStore();

  useEffect(() => {
    if (isAuthenticated && user) {
      navigate(roleHome(user.role), { replace: true });
    }
  }, [isAuthenticated, user, navigate]);
}
