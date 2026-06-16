import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { PasswordInput } from '@/components/ui/PasswordInput';
import { FieldSelect } from '@/components/ui/FieldSelect';
import { SignupEnrollmentFields } from '@/components/signup/SignupEnrollmentFields';
import { SchoolUserRoleButtons } from '@/components/school-admin/SchoolUserRoleButtons';
import { PublicLayout } from '@/components/layout/PublicLayout';
import { fetchRegisterAcademicOptions } from '@/api/registerAcademics.api';
import { fetchRegisterSchools, type RegisterSchoolOption } from '@/api/registerSchools.api';
import { checkUsernameAvailability } from '@/api/auth.api';
import { logApiError } from '@/api/client';
import { useAuthStore } from '@/store/authStore';
import { roleHome } from '@/utils/roleHome';
import { useDebouncedValue } from '@/hooks/useDebouncedValue';
import { validateUsername } from '@/utils/username';
import {
  inferGradeKind,
  resolveSeniorEnrollmentValue,
  seniorEnrollmentUiModel,
} from '@/utils/gradeStructure';
import {
  boardsForRegisterSchoolName,
  resolveRegisterSchoolId,
  uniqueRegisterSchoolNames,
} from '@/utils/registerSchoolOptions';
import {
  PARENT_EMAIL_HINT,
  PARENT_SIGNUP_HINT,
  USERNAME_HINT,
} from '@/utils/schoolUserOnboarding';
import type { UserRole } from '@/types/auth';

type SignupRole = Extract<UserRole, 'STUDENT' | 'PARENT' | 'TEACHER'>;

const OTHER_SCHOOL_VALUE = '__other__';

export function SignUpPage() {
  const navigate = useNavigate();
  const { register, isLoading, error } = useAuthStore();
  const [step, setStep] = useState<'account' | 'profile'>('account');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [usernameError, setUsernameError] = useState<string | null>(null);
  const [usernameChecking, setUsernameChecking] = useState(false);
  const [usernameAvailable, setUsernameAvailable] = useState<boolean | null>(null);
  const debouncedUsername = useDebouncedValue(username, 400);
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<SignupRole>('STUDENT');
  const [schools, setSchools] = useState<RegisterSchoolOption[]>([]);
  const [otherSchoolId, setOtherSchoolId] = useState('');
  const [schoolName, setSchoolName] = useState('');
  const [selectedBoard, setSelectedBoard] = useState('');
  const [signupSchoolNote, setSignupSchoolNote] = useState('');
  const [parentEmail, setParentEmail] = useState('');
  const [grade, setGrade] = useState('');
  const [section, setSection] = useState('');
  const [seniorDepartment, setSeniorDepartment] = useState('');
  const [seniorSectionLetter, setSeniorSectionLetter] = useState('');
  const [gradeOptions, setGradeOptions] = useState<string[]>([]);
  const [gradeSections, setGradeSections] = useState<Record<string, string[]>>({});
  const [schoolsError, setSchoolsError] = useState<string | null>(null);
  const [parentPortalEnabled, setParentPortalEnabled] = useState(true);

  const isOtherSchool = Boolean(otherSchoolId && schoolName === OTHER_SCHOOL_VALUE);
  const requiresSchool = role === 'STUDENT' || role === 'PARENT' || role === 'TEACHER';

  const schoolNameOptions = useMemo(
    () => uniqueRegisterSchoolNames(schools),
    [schools],
  );

  const boardOptions = useMemo(() => {
    if (!schoolName || isOtherSchool) return [];
    return boardsForRegisterSchoolName(schools, schoolName);
  }, [schools, schoolName, isOtherSchool]);

  const schoolId = useMemo(() => {
    if (isOtherSchool) return otherSchoolId;
    if (!schoolName) return '';
    return resolveRegisterSchoolId(schools, schoolName, selectedBoard || null) ?? '';
  }, [schools, schoolName, selectedBoard, isOtherSchool, otherSchoolId]);

  const resolvedEnrollmentSection = useMemo(() => {
    if (!grade) return '';
    const flat = gradeSections[grade] ?? [];
    if (inferGradeKind(grade) === 'senior_secondary') {
      const model = seniorEnrollmentUiModel(flat);
      if (model.mode === 'legacy_section_list') return section;
      return resolveSeniorEnrollmentValue(flat, seniorDepartment, seniorSectionLetter);
    }
    return section;
  }, [grade, gradeSections, section, seniorDepartment, seniorSectionLetter]);

  const profileStepComplete = useMemo(() => {
    if (!grade) return false;
    const flat = gradeSections[grade] ?? [];
    if (inferGradeKind(grade) === 'senior_secondary') {
      const model = seniorEnrollmentUiModel(flat);
      if (model.mode === 'legacy_section_list') return Boolean(section);
      if (model.mode === 'department_only') return Boolean(seniorDepartment);
      return Boolean(seniorDepartment && seniorSectionLetter);
    }
    return Boolean(section);
  }, [grade, gradeSections, section, seniorDepartment, seniorSectionLetter]);

  const schoolSelectOptions = useMemo(() => {
    const options = schoolNameOptions.map((name) => ({ value: name, label: name }));
    if (otherSchoolId) {
      options.push({ value: OTHER_SCHOOL_VALUE, label: 'My school is not listed' });
    }
    return options;
  }, [schoolNameOptions, otherSchoolId]);

  const effectiveBoard = useMemo(() => {
    if (isOtherSchool) return selectedBoard || null;
    if (selectedBoard) return selectedBoard;
    const match = schools.find((s) => s.id === schoolId);
    return match?.board ?? null;
  }, [isOtherSchool, selectedBoard, schools, schoolId]);

  useEffect(() => {
    fetchRegisterSchools()
      .then((data) => {
        setSchools(data.schools);
        setOtherSchoolId(data.otherSchoolId);
        const names = uniqueRegisterSchoolNames(data.schools);
        const initialName =
          names[0] ?? (data.otherSchoolId ? OTHER_SCHOOL_VALUE : '');
        setSchoolName(initialName);
        if (initialName && initialName !== OTHER_SCHOOL_VALUE) {
          const boards = boardsForRegisterSchoolName(data.schools, initialName);
          setSelectedBoard(boards[0] ?? '');
        } else {
          setSelectedBoard('');
        }
      })
      .catch((err) => {
        logApiError('Load register schools failed', err);
        setSchoolsError('Could not load schools. Please try again later.');
      });
  }, []);

  useEffect(() => {
    if (!schoolId || role === 'TEACHER') return;
    const schoolFromList = schools.find((s) => s.id === schoolId);
    fetchRegisterAcademicOptions(schoolId)
      .then((cfg) => {
        const map =
          cfg.gradeSections && Object.keys(cfg.gradeSections).length > 0
            ? cfg.gradeSections
            : Object.fromEntries(cfg.grades.map((g) => [g, cfg.sections]));
        setGradeSections(map);
        setGradeOptions(cfg.grades);
        const boardFromConfig = cfg.board?.trim();
        const boardFromSchool =
          boardFromConfig ||
          schoolFromList?.board?.trim() ||
          boardsForRegisterSchoolName(schools, schoolName)[0] ||
          '';
        if (boardFromSchool) {
          setSelectedBoard((prev) => (prev === boardFromSchool ? prev : boardFromSchool));
        }
        setParentPortalEnabled(cfg.parentPortalEnabled ?? true);
        const firstGrade = cfg.grades[0] ?? '';
        setGrade(firstGrade);
        setSection(map[firstGrade]?.[0] ?? '');
      })
      .catch((err) => logApiError('Load signup academics failed', err));
  }, [schoolId, role, schools, schoolName, selectedBoard]);

  useEffect(() => {
    if (!schoolName || schoolName === OTHER_SCHOOL_VALUE) {
      if (schoolName === OTHER_SCHOOL_VALUE) setSelectedBoard('');
      return;
    }
    const boards = boardsForRegisterSchoolName(schools, schoolName);
    setSelectedBoard((prev) => (boards.includes(prev) ? prev : (boards[0] ?? '')));
  }, [schoolName, schools]);

  useEffect(() => {
    if (role === 'PARENT' && !parentPortalEnabled) {
      setRole('STUDENT');
    }
  }, [role, parentPortalEnabled]);

  useEffect(() => {
    if (!grade) {
      setSection('');
      setSeniorDepartment('');
      setSeniorSectionLetter('');
      return;
    }

    const flat = gradeSections[grade] ?? [];
    if (inferGradeKind(grade) === 'senior_secondary') {
      const model = seniorEnrollmentUiModel(flat);
      if (model.mode === 'legacy_section_list') {
        setSection((prev) => (flat.includes(prev) ? prev : (flat[0] ?? '')));
        setSeniorDepartment('');
        setSeniorSectionLetter('');
        return;
      }
      setSection('');
      setSeniorDepartment((prev) =>
        model.departments.includes(prev) ? prev : (model.departments[0] ?? ''),
      );
      setSeniorSectionLetter((prev) =>
        model.sectionLetters.includes(prev) ? prev : (model.sectionLetters[0] ?? ''),
      );
      return;
    }

    setSeniorDepartment('');
    setSeniorSectionLetter('');
    setSection((prev) => (flat.includes(prev) ? prev : (flat[0] ?? '')));
  }, [grade, gradeSections]);

  useEffect(() => {
    if (role !== 'STUDENT' || !schoolId) {
      setUsernameAvailable(null);
      setUsernameError(null);
      return;
    }

    const formatError = validateUsername(debouncedUsername);
    if (!debouncedUsername.trim()) {
      setUsernameAvailable(null);
      setUsernameError(null);
      return;
    }
    if (formatError) {
      setUsernameAvailable(false);
      setUsernameError(formatError);
      return;
    }

    let cancelled = false;
    setUsernameChecking(true);
    checkUsernameAvailability(schoolId, debouncedUsername)
      .then((res) => {
        if (cancelled) return;
        setUsernameAvailable(res.available);
        setUsernameError(res.available ? null : (res.reason ?? 'This username is already taken'));
      })
      .catch((err) => {
        if (cancelled) return;
        logApiError('Username availability check failed', err);
        setUsernameAvailable(null);
        setUsernameError(null);
      })
      .finally(() => {
        if (!cancelled) setUsernameChecking(false);
      });

    return () => {
      cancelled = true;
    };
  }, [debouncedUsername, schoolId, role]);

  const handleBackToAccount = () => {
    useAuthStore.setState({ error: null });
    setStep('account');
  };

  const handleAccountNext = (e: React.FormEvent) => {
    e.preventDefault();
    if (role === 'STUDENT') {
      if (requiresSchool && !schoolId) {
        return;
      }
      if (isOtherSchool && !signupSchoolNote.trim()) {
        return;
      }
      const formatError = validateUsername(username);
      if (formatError) {
        setUsernameError(formatError);
        return;
      }
      if (usernameAvailable === false) {
        return;
      }
      setStep('profile');
    } else {
      void submitRegistration();
    }
  };

  const submitRegistration = async () => {
    await register({
      ...(role === 'STUDENT'
        ? { username: username.trim() }
        : { email: email.trim() }),
      password,
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      role,
      ...(requiresSchool && schoolId ? { schoolId } : {}),
      ...(role === 'STUDENT'
        ? {
            ...(effectiveBoard ? { board: effectiveBoard } : {}),
            grade,
            section: resolvedEnrollmentSection,
            parentEmail: parentEmail.trim(),
            ...(isOtherSchool ? { signupSchoolNote: signupSchoolNote.trim() } : {}),
          }
        : {}),
    });
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
                  autoComplete="given-name"
                  className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-ink">Last name</label>
                <input
                  required
                  autoComplete="family-name"
                  className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                />
              </div>
            </div>

            <SchoolUserRoleButtons
              value={role}
              onChange={setRole}
              parentPortalEnabled={parentPortalEnabled}
            />

            {requiresSchool && (
              <>
                <div>
                  <label className="mb-1 block text-sm font-medium text-ink">School</label>
                  <select
                    required
                    disabled={schoolSelectOptions.length === 0}
                    className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-primary disabled:bg-gray-50"
                    value={schoolName}
                    onChange={(e) => setSchoolName(e.target.value)}
                  >
                    {schoolSelectOptions.length === 0 && (
                      <option value="">Loading schools…</option>
                    )}
                    {schoolSelectOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                  <p className="mt-1 text-xs text-muted">
                    {schoolNameOptions.length === 0
                      ? 'No schools are onboarded yet. Choose “My school is not listed” and tell us your school name and address below.'
                      : 'Onboarded schools only. Same name listed once — pick your board below if your school offers more than one.'}
                  </p>
                </div>
                {!isOtherSchool && schoolName && boardOptions.length > 0 && (
                  <FieldSelect
                    label="Board"
                    value={selectedBoard}
                    options={boardOptions}
                    onChange={setSelectedBoard}
                    required
                    disabled={boardOptions.length === 0}
                    placeholder="Select board"
                  />
                )}
                {!isOtherSchool && schoolName && boardOptions.length === 0 && (
                  <p className="text-xs text-muted">
                    No board is configured for this school yet. Your school admin can set it during
                    onboarding.
                  </p>
                )}
                {schoolsError && (
                  <p className="text-sm text-danger" role="alert">
                    {schoolsError}
                  </p>
                )}
                {!isOtherSchool && schoolName && !schoolId && (
                  <p className="text-sm text-danger" role="alert">
                    Select a board to continue.
                  </p>
                )}
                {isOtherSchool && (
                  <div>
                    <label className="mb-1 block text-sm font-medium text-ink">
                      School name and address
                    </label>
                    <textarea
                      required
                      rows={3}
                      maxLength={500}
                      placeholder="Springfield Public School, 123 Main St, City, State"
                      className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                      value={signupSchoolNote}
                      onChange={(e) => setSignupSchoolNote(e.target.value)}
                    />
                  </div>
                )}
              </>
            )}

            <div>
              {role === 'STUDENT' ? (
                <>
                  <label className="mb-1 block text-sm font-medium text-ink">Username</label>
                  <input
                    type="text"
                    required
                    autoComplete="username"
                    spellCheck={false}
                    minLength={3}
                    maxLength={30}
                    pattern="[a-zA-Z0-9._-]+"
                    placeholder="e.g. alex.2024"
                    className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                    value={username}
                    onChange={(e) => {
                      setUsername(e.target.value);
                      setUsernameAvailable(null);
                      setUsernameError(null);
                    }}
                  />
                  <p className="mt-1 text-xs text-muted">{USERNAME_HINT}</p>
                  {usernameChecking && (
                    <p className="mt-1 text-xs text-muted">Checking availability…</p>
                  )}
                  {!usernameChecking && usernameAvailable === true && (
                    <p className="mt-1 text-xs text-success">Username is available</p>
                  )}
                  {usernameError && (
                    <p className="mt-1 text-xs text-danger" role="alert">
                      {usernameError}
                    </p>
                  )}
                </>
              ) : (
                <>
                  <label className="mb-1 block text-sm font-medium text-ink">Email</label>
                  <input
                    type="email"
                    required
                    autoComplete="email"
                    className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </>
              )}
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

            {role === 'STUDENT' && (
              <div>
                <label className="mb-1 block text-sm font-medium text-ink">Parent email</label>
                <input
                  type="email"
                  required
                  autoComplete="email"
                  placeholder="parent@example.com"
                  className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                  value={parentEmail}
                  onChange={(e) => setParentEmail(e.target.value)}
                />
                <p className="mt-1 text-xs text-muted">{PARENT_EMAIL_HINT}</p>
              </div>
            )}

            {role === 'PARENT' && (
              <p className="text-sm text-muted">{PARENT_SIGNUP_HINT}</p>
            )}

            {error && step === 'account' && (
              <p className="rounded-xl bg-danger/10 px-3 py-2 text-sm text-danger" role="alert">
                {error}
              </p>
            )}

            <Button
              type="submit"
              className="w-full py-3"
              disabled={
                isLoading ||
                (requiresSchool && (!schoolId || (!isOtherSchool && boardOptions.length > 0 && !selectedBoard))) ||
                (role === 'STUDENT' &&
                  (usernameChecking || usernameAvailable === false || !!validateUsername(username)))
              }
            >
              {role === 'STUDENT' ? 'Continue' : isLoading ? 'Creating…' : 'Sign up'}
            </Button>
          </form>
        </>
      ) : (
        <>
          <h1 className="text-2xl font-bold text-ink">Tell us about you</h1>
          <p className="mt-1 text-sm text-muted">
            Select your grade and section at {schoolName === OTHER_SCHOOL_VALUE ? 'your school' : schoolName || 'school'}
          </p>

          <div className="mt-6 space-y-4">
            {effectiveBoard && (
              <div>
                <span className="mb-1 block text-sm font-medium text-ink">Board</span>
                <div className="rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-ink">
                  {effectiveBoard}
                </div>
              </div>
            )}
            <SignupEnrollmentFields
              grade={grade}
              gradeOptions={gradeOptions}
              gradeSections={gradeSections}
              section={section}
              seniorDepartment={seniorDepartment}
              seniorSectionLetter={seniorSectionLetter}
              onGradeChange={setGrade}
              onSectionChange={setSection}
              onSeniorDepartmentChange={setSeniorDepartment}
              onSeniorSectionLetterChange={setSeniorSectionLetter}
            />

            {error && (
              <p className="rounded-xl bg-danger/10 px-3 py-2 text-sm text-danger" role="alert">
                {error}
              </p>
            )}

            <Button
              type="button"
              className="w-full py-3"
              disabled={isLoading || !profileStepComplete}
              onClick={() => void submitRegistration()}
            >
              {isLoading ? 'Creating account…' : 'Continue'}
            </Button>
            <Button
              type="button"
              variant="outline"
              className="w-full"
              disabled={isLoading}
              onClick={handleBackToAccount}
            >
              Back
            </Button>
          </div>
        </>
      )}

      <p className="mt-6 text-center text-sm text-muted">
        Already have an account?{' '}
        <Link to="/login" className="font-medium text-primary hover:underline">
          Sign in
        </Link>
      </p>
    </PublicLayout>
  );
}
