import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { GraduationCap } from 'lucide-react';
import { Card, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { useAuthStore } from '@/store/authStore';
import { fetchHealth } from '@/api/auth.api';
import { logApiError } from '@/api/client';

export function LoginPage() {
  const [token, setToken] = useState('');
  const [apiStatus, setApiStatus] = useState<string | null>(null);
  const { loginWithToken, isLoading, error, user } = useAuthStore();
  const navigate = useNavigate();

  const checkBackend = async () => {
    try {
      const health = await fetchHealth();
      setApiStatus(`${health.service}: ${health.status}`);
    } catch (err) {
      logApiError('Health check failed', err);
      setApiStatus('Backend unreachable');
    }
  };

  const handleLogin = async () => {
    await loginWithToken(token.trim());
    const role = useAuthStore.getState().user?.role;
    if (role === 'STUDENT') navigate('/student');
    else if (role === 'PARENT') navigate('/parent');
    else navigate('/teacher');
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-primary/10 via-surface to-secondary/10 p-4">
      <Card className="w-full max-w-md">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary text-white">
            <GraduationCap className="h-7 w-7" />
          </div>
          <div>
            <CardTitle className="text-xl">Quizzy Portal</CardTitle>
            <p className="text-sm text-muted">Multi-tenant quiz platform</p>
          </div>
        </div>

        <p className="mt-4 text-sm text-muted">
          Paste a JWT from the backend to sign in. Your role (student, teacher, etc.) is
          encoded in the token — use{' '}
          <code className="rounded bg-gray-100 px-1 text-xs">npm run issue-token -- student</code>{' '}
          for a student profile.
        </p>

        <textarea
          className="mt-3 min-h-[80px] w-full rounded-xl border border-gray-200 px-3 py-2 font-mono text-xs"
          placeholder="Bearer token…"
          value={token}
          onChange={(e) => setToken(e.target.value)}
        />

        {error && <p className="mt-2 text-sm text-danger">{error}</p>}
        {user && <p className="mt-2 text-sm text-success">Signed in as {user.role}</p>}

        <div className="mt-4 flex flex-wrap gap-2">
          <Button onClick={handleLogin} disabled={!token.trim() || isLoading}>
            {isLoading ? 'Verifying…' : 'Sign in'}
          </Button>
          <Button variant="outline" onClick={checkBackend}>
            Test API
          </Button>
        </div>
        {apiStatus && <p className="mt-2 text-xs text-muted">API: {apiStatus}</p>}
      </Card>
    </div>
  );
}
