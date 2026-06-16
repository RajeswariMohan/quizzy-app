import { useCallback, useEffect, useMemo, useState } from 'react';
import { User, Save, KeyRound } from 'lucide-react';
import { Card, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { PasswordInput } from '@/components/ui/PasswordInput';
import { GradeSectionFields } from '@/components/school-admin/GradeSectionFields';
import { changePassword, fetchProfile, updateProfile } from '@/api/profile.api';
import { getApiErrorMessage, logApiError } from '@/api/client';
import { useAuthStore } from '@/store/authStore';
import { useSchoolAcademics } from '@/hooks/useSchoolAcademics';
import { formatDateTime } from '@/lib/formatDateTime';
import type { UserProfile } from '@/types/profile';

const ROLE_LABELS: Record<string, string> = {
  SUPER_ADMIN: 'Super Admin',
  SCHOOL_ADMIN: 'School Admin',
  TEACHER: 'Teacher',
  STUDENT: 'Student',
  PARENT: 'Parent',
};

export function ProfilePage() {
  const refreshAuthProfile = useAuthStore((s) => s.refreshProfile);
  const { grades: schoolGrades, gradeSections: storeGradeSections } = useSchoolAcademics();

  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [grade, setGrade] = useState('');
  const [section, setSection] = useState('');

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [isLoading, setIsLoading] = useState(true);
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [isSavingPassword, setIsSavingPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const load = useCallback(() => {
    setIsLoading(true);
    setError(null);
    fetchProfile()
      .then((p) => {
        setProfile(p);
        setFirstName(p.firstName);
        setLastName(p.lastName);
        setDisplayName(p.displayName);
        setAvatarUrl(p.avatarUrl ?? '');
        setGrade(p.grade ?? '');
        setSection(p.section ?? '');
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
      })
      .catch((err) => {
        logApiError('Load profile failed', err);
        setError(getApiErrorMessage(err, 'Could not load your profile.'));
      })
      .finally(() => setIsLoading(false));
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const profileAcademics = useMemo(() => {
    if (
      profile?.academicOptions?.gradeSections &&
      Object.keys(profile.academicOptions.gradeSections).length > 0
    ) {
      return {
        grades: profile.academicOptions.grades ?? schoolGrades,
        gradeSections: profile.academicOptions.gradeSections,
        sections: [],
        subjects: [],
        subscriptionTier: 'STANDARD' as const,
      };
    }
    return null;
  }, [profile, schoolGrades, storeGradeSections]);

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile) return;
    setIsSavingProfile(true);
    setError(null);
    setSuccess(null);
    try {
      const updated = await updateProfile({
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        displayName: displayName.trim(),
        avatarUrl: avatarUrl.trim(),
        ...(profile.role === 'STUDENT'
          ? { grade: grade.trim() || undefined, section: section.trim() || undefined }
          : {}),
      });
      setProfile(updated);
      await refreshAuthProfile();
      setSuccess('Profile updated.');
    } catch (err) {
      logApiError('Update profile failed', err);
      setError(getApiErrorMessage(err, 'Could not save profile.'));
    } finally {
      setIsSavingProfile(false);
    }
  };

  const needsPasswordSetup = profile?.requiresPasswordSetup === true;

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!needsPasswordSetup && !currentPassword.trim()) {
      setError('Enter your current password.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setError('New passwords do not match.');
      return;
    }
    if (newPassword.length < 8) {
      setError('New password must be at least 8 characters.');
      return;
    }
    setIsSavingPassword(true);
    setError(null);
    setSuccess(null);
    try {
      await changePassword({
        ...(needsPasswordSetup ? {} : { currentPassword: currentPassword.trim() }),
        newPassword,
      });
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      if (profile) {
        setProfile({ ...profile, requiresPasswordSetup: false });
      }
      setSuccess(
        needsPasswordSetup ? 'Password set successfully.' : 'Password changed successfully.',
      );
    } catch (err) {
      logApiError('Change password failed', err);
      setError(getApiErrorMessage(err, 'Could not change password.'));
    } finally {
      setIsSavingPassword(false);
    }
  };

  if (isLoading && !profile) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  if (!profile) {
    return (
      <Card>
        <p className="text-danger">{error ?? 'Profile not available.'}</p>
        <Button variant="outline" className="mt-3" onClick={load}>
          Retry
        </Button>
      </Card>
    );
  }

  const gradeOptions =
    profile.academicOptions?.grades.length
      ? profile.academicOptions.grades
      : schoolGrades;

  const initials = (displayName || firstName || 'U').charAt(0).toUpperCase();

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-ink">My profile</h1>
        <p className="text-muted">Manage your account details and password</p>
      </div>

      <Card>
        <div className="flex flex-wrap items-center gap-4">
          {avatarUrl.trim() ? (
            <img
              src={avatarUrl.trim()}
              alt=""
              className="h-16 w-16 rounded-full object-cover ring-2 ring-primary/20"
            />
          ) : (
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 text-xl font-bold text-primary">
              {initials}
            </div>
          )}
          <div className="min-w-0">
            <p className="text-lg font-semibold text-ink">{displayName || profile.email}</p>
            <p className="text-sm text-muted">
              {ROLE_LABELS[profile.role] ?? profile.role}
              {profile.schoolName ? ` · ${profile.schoolName}` : ''}
            </p>
            {profile.role === 'STUDENT' && (
              <p className="mt-1 text-sm text-muted">
                {profile.xpPoints} XP · {profile.currentStreak} day streak
              </p>
            )}
          </div>
        </div>
      </Card>

      {error && (
        <Card>
          <p className="text-sm text-danger">{error}</p>
        </Card>
      )}
      {success && (
        <Card>
          <p className="text-sm text-success">{success}</p>
        </Card>
      )}

      <Card>
        <CardTitle className="flex items-center gap-2">
          <User className="h-5 w-5 text-primary" />
          Personal information
        </CardTitle>
        <form onSubmit={(e) => void handleSaveProfile(e)} className="mt-4 space-y-4">
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-sm font-medium text-ink">First name</label>
              <input
                className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm outline-none focus:border-primary"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                required
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-ink">Last name</label>
              <input
                className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm outline-none focus:border-primary"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                required
              />
            </div>
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-ink">Display name</label>
            <input
              className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm outline-none focus:border-primary"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="How your name appears in the app"
              data-testid="profile-display-name"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-ink">Email</label>
            <input
              className="w-full rounded-xl border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-muted"
              value={profile.email}
              readOnly
            />
            <p className="mt-1 text-xs text-muted">Contact your school admin to change your email.</p>
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-ink">Avatar URL</label>
            <input
              className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm outline-none focus:border-primary"
              value={avatarUrl}
              onChange={(e) => setAvatarUrl(e.target.value)}
              placeholder="https://… (optional)"
            />
          </div>

          {profile.role === 'STUDENT' && (
            <GradeSectionFields
              grade={grade}
              section={section}
              onGradeChange={setGrade}
              onSectionChange={setSection}
              academics={profileAcademics}
            />
          )}

          <Button type="submit" disabled={isSavingProfile} data-testid="profile-save">
            <Save className="h-4 w-4" />
            {isSavingProfile ? 'Saving…' : 'Save profile'}
          </Button>
        </form>
      </Card>

      <Card>
        <CardTitle className="flex items-center gap-2">
          <KeyRound className="h-5 w-5 text-primary" />
          {needsPasswordSetup ? 'Set password' : 'Change password'}
        </CardTitle>
        {needsPasswordSetup && (
          <p className="mt-1 text-sm text-muted">
            You signed in without a password (e.g. quick login). Choose a password to sign in with
            email next time.
          </p>
        )}
        <form onSubmit={(e) => void handleChangePassword(e)} className="mt-4 space-y-3">
          {!needsPasswordSetup && (
            <div>
              <label className="mb-1 block text-sm font-medium text-ink">Current password</label>
              <PasswordInput
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                autoComplete="current-password"
                required
              />
            </div>
          )}
          <div>
            <label className="mb-1 block text-sm font-medium text-ink">New password</label>
            <PasswordInput
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              autoComplete="new-password"
              minLength={8}
              required
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-ink">Confirm new password</label>
            <PasswordInput
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              autoComplete="new-password"
              minLength={8}
              required
            />
          </div>
          <Button type="submit" variant="outline" disabled={isSavingPassword}>
            {isSavingPassword
              ? 'Updating…'
              : needsPasswordSetup
                ? 'Set password'
                : 'Update password'}
          </Button>
        </form>
      </Card>

      <Card className="!p-4">
        <p className="text-xs text-muted">
          Member since {formatDateTime(profile.createdAt)} · Last updated{' '}
          {formatDateTime(profile.updatedAt)}
        </p>
      </Card>
    </div>
  );
}
