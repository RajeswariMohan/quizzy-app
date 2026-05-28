import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { PasswordInput } from '@/components/ui/PasswordInput';
import { PublicLayout } from '@/components/layout/PublicLayout';
import { useAuthStore } from '@/store/authStore';
import { roleHome } from '@/utils/roleHome';
import { useRedirectIfAuthenticated } from '@/hooks/useRedirectIfAuthenticated';

export function LoginPage() {
  const navigate = useNavigate();
  useRedirectIfAuthenticated();
  const { loginWithCredentials, isLoading, error } = useAuthStore();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await loginWithCredentials(email.trim(), password);
    const state = useAuthStore.getState();
    if (state.isAuthenticated && state.user) {
      navigate(roleHome(state.user.role));
    }
  };

  return (
    <PublicLayout narrow>
      <Link
        to="/"
        className="mb-6 inline-flex items-center gap-1 text-sm text-muted hover:text-ink"
      >
        <ArrowLeft className="h-4 w-4" aria-hidden /> Back to home
      </Link>

      <h1 className="text-2xl font-bold text-ink">Welcome back</h1>
      <p className="mt-1 text-sm text-muted">Sign in to continue learning</p>

      <form onSubmit={handleSubmit} className="mt-8 space-y-4">
        <div>
          <label htmlFor="login-email" className="mb-1 block text-sm font-medium text-ink">
            Email
          </label>
          <input
            id="login-email"
            type="email"
            required
            autoComplete="email"
            className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
            placeholder="you@school.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>
        <div>
          <label htmlFor="login-password" className="mb-1 block text-sm font-medium text-ink">
            Password
          </label>
          <PasswordInput
            id="login-password"
            required
            minLength={8}
            autoComplete="current-password"
            placeholder="At least 8 characters"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>

        {error && (
          <p className="rounded-xl bg-danger/10 px-3 py-2 text-sm text-danger" role="alert">
            {error}
          </p>
        )}

        <Button type="submit" className="w-full py-3" disabled={isLoading}>
          {isLoading ? 'Signing in…' : 'Sign in'}
        </Button>
      </form>

      <p className="mt-6 text-center text-sm text-muted">
        New here?{' '}
        <Link to="/signup" className="font-medium text-primary hover:underline">
          Create an account
        </Link>
      </p>
    </PublicLayout>
  );
}
