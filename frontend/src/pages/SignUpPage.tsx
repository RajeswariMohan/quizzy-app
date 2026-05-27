import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { PasswordInput } from '@/components/ui/PasswordInput';
import { FieldSelect } from '@/components/ui/FieldSelect';
import { BOARDS } from '@/constants/academics';
import { fetchRegisterAcademicOptions } from '@/api/registerAcademics.api';
import { logApiError } from '@/api/client';
import { useAuthStore } from '@/store/authStore';
import { roleHome } from '@/utils/roleHome';
import type { UserRole } from '@/types/auth';

type SignupRole = Extract<UserRole, 'STUDENT' | 'PARENT' | 'TEACHER'>;

export function SignUpPage() {
  const navigate = useNavigate();
  const { register, isLoading, error, isAuthenticated, user } = useAuthStore();
  const [step, setStep] = useState<'account' | 'profile'>('account');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<SignupRole>('STUDENT');
  const [board, setBoard] = useState('CBSE');
  const [grade, setGrade] = useState('');
  const [subject, setSubject] = useState('');
  const [gradeOptions, setGradeOptions] = useState<string[]>([]);
  const [subjectOptions, setSubjectOptions] = useState<string[]>([]);
  const [childEmail, setChildEmail] = useState('');

  useEffect(() => {
    fetchRegisterAcademicOptions()
      .then((cfg) => {
        setGradeOptions(cfg.grades);
        setSubjectOptions(cfg.subjects);
        if (cfg.grades.length > 0) setGrade(cfg.grades[0]);
        if (cfg.subjects.length > 0) setSubject(cfg.subjects[0]);
      })
      .catch((err) => logApiError('Load signup academics failed', err));
  }, []);

  useEffect(() => {
    if (isAuthenticated && user) {
      navigate(roleHome(user.role), { replace: true });
    }
  }, [isAuthenticated, user, navigate]);

  const handleAccountNext = (e: React.FormEvent) => {
    e.preventDefault();
    if (role === 'STUDENT') {
      setStep('profile');
    } else {
      void submitRegistration();
    }
  };

  const submitRegistration = async () => {
    await register({
      email: email.trim(),
      password,
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      role,
      ...(role === 'STUDENT'
        ? { board, grade, subject }
        : role === 'PARENT' && childEmail.trim()
          ? { studentEmail: childEmail.trim() }
          : {}),
    });
    const state = useAuthStore.getState();
    if (state.isAuthenticated && state.user) {
      navigate(roleHome(state.user.role));
    }
  };

  return (
    <div className="flex min-h-screen flex-col bg-gradient-to-b from-primary/10 via-white to-secondary/5">
      <div className="mx-auto w-full max-w-md flex-1 px-5 py-8">
        <Link
          to="/"
          className="mb-6 inline-flex items-center gap-1 text-sm text-muted hover:text-ink"
        >
          <ArrowLeft className="h-4 w-4" /> Back
        </Link>

        {step === 'account' ? (
          <>
            <h1 className="text-2xl font-bold text-ink">Create account</h1>
            <p className="mt-1 text-sm text-muted">Join Quizzy to learn and track progress</p>

            <form onSubmit={handleAccountNext} className="mt-6 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1 block text-sm font-medium text-ink">First name</label>
                  <input
                    required
                    className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-ink">Last name</label>
                  <input
                    required
                    className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                  />
                </div>
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-ink">I am a</label>
                <div className="grid grid-cols-3 gap-2">
                  {(['STUDENT', 'PARENT', 'TEACHER'] as const).map((r) => (
                    <button
                      key={r}
                      type="button"
                      onClick={() => setRole(r)}
                      className={`rounded-xl border px-2 py-2 text-xs font-medium capitalize ${
                        role === r
                          ? 'border-primary bg-primary/10 text-primary'
                          : 'border-gray-200 text-muted'
                      }`}
                    >
                      {r.toLowerCase()}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-ink">Email</label>
                <input
                  type="email"
                  required
                  autoComplete="email"
                  className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-ink">Password</label>
                <PasswordInput
                  required
                  minLength={8}
                  autoComplete="new-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>

              {role === 'PARENT' && (
                <div>
                  <label className="mb-1 block text-sm font-medium text-ink">
                    Child&apos;s school email <span className="text-muted">(optional)</span>
                  </label>
                  <input
                    type="email"
                    placeholder="student@school.com"
                    className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm"
                    value={childEmail}
                    onChange={(e) => setChildEmail(e.target.value)}
                  />
                  <p className="mt-1 text-xs text-muted">
                    Link now if your child already has a student account at this school.
                  </p>
                </div>
              )}

              {error && (
                <p className="rounded-xl bg-danger/10 px-3 py-2 text-sm text-danger">{error}</p>
              )}

              <Button type="submit" className="w-full py-3" disabled={isLoading}>
                {role === 'STUDENT' ? 'Continue' : isLoading ? 'Creating…' : 'Sign Up'}
              </Button>
            </form>
          </>
        ) : (
          <>
            <h1 className="text-2xl font-bold text-ink">Tell us about you</h1>
            <p className="mt-1 text-sm text-muted">We&apos;ll personalize quizzes for your level</p>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                void submitRegistration();
              }}
              className="mt-6 space-y-4"
            >
              <FieldSelect label="Board" value={board} options={BOARDS} onChange={setBoard} />
              <FieldSelect label="Grade" value={grade} options={gradeOptions} onChange={setGrade} />
              <FieldSelect
                label="Subject"
                value={subject}
                options={subjectOptions}
                onChange={setSubject}
              />

              {error && (
                <p className="rounded-xl bg-danger/10 px-3 py-2 text-sm text-danger">{error}</p>
              )}

              <Button type="submit" className="w-full py-3" disabled={isLoading}>
                {isLoading ? 'Creating account…' : 'Continue'}
              </Button>
              <Button
                type="button"
                variant="outline"
                className="w-full"
                onClick={() => setStep('account')}
              >
                Back
              </Button>
            </form>
          </>
        )}

        <p className="mt-6 text-center text-sm text-muted">
          Already have an account?{' '}
          <Link to="/login" className="font-medium text-primary hover:underline">
            Login
          </Link>
        </p>
      </div>
    </div>
  );
}

