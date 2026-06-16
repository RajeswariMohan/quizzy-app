import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { useAuthStore } from '@/store/authStore';
import type { DevSeedRole } from '@/api/auth.api';
import { roleHome } from '@/utils/roleHome';

const QUICK_ROLES: { role: DevSeedRole; label: string }[] = [
  { role: 'teacher', label: 'Teacher' },
  { role: 'student', label: 'Student' },
  { role: 'parent', label: 'Parent' },
  { role: 'schooladmin', label: 'Admin' },
  { role: 'superadmin', label: 'Super Admin' },
];

/** Developer JWT login — quick role buttons or manual paste */
export function DevLoginPage() {
  const [token, setToken] = useState('');
  const { loginWithToken, loginWithDevRole, isLoading, error } = useAuthStore();
  const navigate = useNavigate();

  const finishIfAuthenticated = () => {
    const state = useAuthStore.getState();
    if (state.isAuthenticated && state.user) {
      navigate(roleHome(state.user.role), { replace: true });
    }
  };

  const handleQuickLogin = async (role: DevSeedRole) => {
    await loginWithDevRole(role);
    finishIfAuthenticated();
  };

  const handlePasteLogin = async () => {
    await loginWithToken(token);
    finishIfAuthenticated();
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-surface p-4">
      <div className="w-full max-w-md rounded-2xl border border-gray-200 bg-white p-6 shadow-card">
        <Link to="/" className="mb-4 inline-flex items-center gap-1 text-sm text-muted">
          <ArrowLeft className="h-4 w-4" /> Back
        </Link>
        <h1 className="text-lg font-bold text-ink">Developer token login</h1>
        <p className="mt-1 text-sm text-muted">
          Quick login uses the running API so the JWT secret always matches. You are sent to that
          role&apos;s dashboard after sign-in.
        </p>
        <p className="mt-2 text-xs text-muted">
          <strong>Admin</strong> = school admin ({' '}
          <code className="rounded bg-gray-100 px-1">schooladmin</code>).{' '}
          <strong>Super Admin</strong> = platform. CLI{' '}
          <code className="rounded bg-gray-100 px-1">npm run issue-token -- admin</code> issues
          Super Admin, not School Admin.
        </p>

        <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-3">
          {QUICK_ROLES.map(({ role, label }) => (
            <Button
              key={role}
              type="button"
              variant="outline"
              className="text-sm"
              disabled={isLoading}
              data-testid={`dev-login-${role}`}
              onClick={() => void handleQuickLogin(role)}
            >
              {label}
            </Button>
          ))}
        </div>

        <div className="my-5 flex items-center gap-3">
          <div className="h-px flex-1 bg-gray-200" />
          <span className="text-xs text-muted">or paste token</span>
          <div className="h-px flex-1 bg-gray-200" />
        </div>

        <p className="text-xs text-muted">
          From terminal:{' '}
          <code className="rounded bg-gray-100 px-1">npm run issue-token -- teacher</code>
          <br />
          Paste the full line starting with <code className="rounded bg-gray-100 px-1">eyJ</code>.
        </p>
        <textarea
          className="mt-2 min-h-[80px] w-full rounded-xl border border-gray-200 px-3 py-2 font-mono text-xs"
          placeholder="eyJhbGciOiJIUzI1NiIs..."
          value={token}
          onChange={(e) => setToken(e.target.value)}
        />
        {error && <p className="mt-2 text-sm text-danger">{error}</p>}
        <Button
          className="mt-4 w-full"
          onClick={() => void handlePasteLogin()}
          disabled={!token.trim() || isLoading}
        >
          {isLoading ? 'Signing in…' : 'Sign in with pasted token'}
        </Button>
      </div>
    </div>
  );
}
