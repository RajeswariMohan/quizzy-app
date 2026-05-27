import { useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { GraduationCap } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { LoginHeroIllustration } from '@/components/auth/LoginHeroIllustration';
import { useAuthStore } from '@/store/authStore';
import { roleHome } from '@/utils/roleHome';

export function WelcomePage() {
  const navigate = useNavigate();
  const { isAuthenticated, user } = useAuthStore();

  useEffect(() => {
    if (isAuthenticated && user) {
      navigate(roleHome(user.role), { replace: true });
    }
  }, [isAuthenticated, user, navigate]);

  return (
    <div className="flex min-h-screen flex-col bg-gradient-to-b from-primary/10 via-white to-secondary/5">
      <div className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center px-5 py-10">
        <div className="text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-primary text-white shadow-lg shadow-primary/30">
            <GraduationCap className="h-9 w-9" />
          </div>
          <h1 className="mt-5 text-4xl font-bold tracking-tight text-ink">Quizzy</h1>
          <p className="mt-2 text-base font-medium text-primary">Learn. Practice. Excel.</p>
          <p className="mt-1 text-sm text-muted">Quiz platform for schools</p>
        </div>

        <LoginHeroIllustration />

        <div className="mt-8 space-y-3">
          <Button className="w-full py-3.5 text-base" onClick={() => navigate('/login')}>
            Login
          </Button>
          <Button
            variant="outline"
            className="w-full border-primary py-3.5 text-base text-primary hover:bg-primary/5"
            onClick={() => navigate('/signup')}
          >
            Sign Up
          </Button>
          <button
            type="button"
            disabled
            className="flex w-full items-center justify-center gap-2 rounded-xl border border-gray-200 bg-white py-3.5 text-sm font-medium text-muted opacity-60"
            title="Google sign-in coming soon"
          >
            <span className="flex h-6 w-6 items-center justify-center rounded-full border border-gray-200 text-xs font-bold text-[#4285F4]">
              G
            </span>
            Login with Google
          </button>
        </div>

        <p className="mt-10 text-center text-xs leading-relaxed text-muted">
          By continuing, you agree to our{' '}
          <span className="text-primary">Terms</span> &{' '}
          <span className="text-primary">Privacy Policy</span>
        </p>

        <p className="mt-4 text-center text-xs text-muted">
          Developer?{' '}
          <Link to="/login/dev" className="text-primary underline-offset-2 hover:underline">
            Token login
          </Link>
        </p>
      </div>
    </div>
  );
}
