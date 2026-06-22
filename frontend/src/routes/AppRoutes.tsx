import type { ReactNode } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { StudentDashboard } from '@/pages/StudentDashboard';
import { StudentLeaderboardPage } from '@/pages/StudentLeaderboardPage';
import { StudentTakeQuizPage } from '@/pages/StudentTakeQuizPage';
import { TeacherDashboard } from '@/pages/TeacherDashboard';
import { TeacherQuizzesPage } from '@/pages/TeacherQuizzesPage';
import { TeacherAnalyticsPage } from '@/pages/TeacherAnalyticsPage';
import { ParentDashboard } from '@/pages/ParentDashboard';
import { LoginPage } from '@/pages/LoginPage';
import { WelcomePage } from '@/pages/WelcomePage';
import { AboutPage } from '@/pages/AboutPage';
import { ContactPage } from '@/pages/ContactPage';
import { SignUpPage } from '@/pages/SignUpPage';
import { DevLoginPage } from '@/pages/DevLoginPage';
import { AdminOverviewPage } from '@/pages/admin/AdminOverviewPage';
import { AdminSchoolsPage } from '@/pages/admin/AdminSchoolsPage';
import { AdminAnalyticsPage } from '@/pages/admin/AdminAnalyticsPage';
import { AdminSettingsPage } from '@/pages/admin/AdminSettingsPage';
import { AdminPackagesPage } from '@/pages/admin/AdminPackagesPage';
import { SchoolAdminDashboardPage } from '@/pages/school-admin/SchoolAdminDashboardPage';
import { SchoolAdminUsersPage } from '@/pages/school-admin/SchoolAdminUsersPage';
import { SchoolAdminAcademicsPage } from '@/pages/school-admin/SchoolAdminAcademicsPage';
import { StudentProgressPage } from '@/pages/StudentProgressPage';
import { StudentProgressDetailPage } from '@/pages/StudentProgressDetailPage';
import { StudentQuizProgressPage } from '@/pages/StudentQuizProgressPage';
import { FeedbackPage } from '@/pages/FeedbackPage';
import { AdminFeedbackPage } from '@/pages/admin/AdminFeedbackPage';
import { DataBackupPage } from '@/pages/DataBackupPage';
import { ProfilePage } from '@/pages/ProfilePage';
import { useAuthStore } from '@/store/authStore';
import type { UserRole } from '@/types/auth';
import { roleHome } from '@/utils/roleHome';

function ProtectedRoute({ children, roles }: { children: ReactNode; roles?: UserRole[] }) {
  const { isAuthenticated, isLoading, user } = useAuthStore();

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  if (roles && user && !roles.includes(user.role)) {
    return <Navigate to={roleHome(user.role)} replace />;
  }

  return <>{children}</>;
}

export function AppRoutes() {
  const { isAuthenticated, user } = useAuthStore();

  return (
    <Routes>
      <Route path="/" element={<WelcomePage />} />
      <Route path="/about" element={<AboutPage />} />
      <Route path="/contact" element={<ContactPage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/signup" element={<SignUpPage />} />
      <Route path="/join/:schoolSlug" element={<SignUpPage />} />
      <Route path="/login/dev" element={<DevLoginPage />} />
      <Route
        element={
          <ProtectedRoute>
            <DashboardLayout />
          </ProtectedRoute>
        }
      >
        <Route
          path="student"
          element={
            <ProtectedRoute roles={['STUDENT']}>
              <StudentDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="student/leaderboard"
          element={
            <ProtectedRoute roles={['STUDENT']}>
              <StudentLeaderboardPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="feedback"
          element={
            <ProtectedRoute roles={['STUDENT', 'PARENT', 'SCHOOL_ADMIN']}>
              <FeedbackPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="student/quizzes/:quizId"
          element={
            <ProtectedRoute roles={['STUDENT']}>
              <StudentTakeQuizPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="teacher"
          element={
            <ProtectedRoute roles={['TEACHER', 'SUPER_ADMIN']}>
              <TeacherDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="teacher/quizzes"
          element={
            <ProtectedRoute roles={['TEACHER', 'SCHOOL_ADMIN', 'SUPER_ADMIN']}>
              <TeacherQuizzesPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="teacher/analytics"
          element={
            <ProtectedRoute roles={['TEACHER', 'SCHOOL_ADMIN', 'SUPER_ADMIN']}>
              <TeacherAnalyticsPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="school-admin"
          element={
            <ProtectedRoute roles={['SCHOOL_ADMIN']}>
              <SchoolAdminDashboardPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="school-admin/users"
          element={
            <ProtectedRoute roles={['SCHOOL_ADMIN']}>
              <SchoolAdminUsersPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="school-admin/academics"
          element={
            <ProtectedRoute roles={['SCHOOL_ADMIN']}>
              <SchoolAdminAcademicsPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="school-admin/data"
          element={
            <ProtectedRoute roles={['SCHOOL_ADMIN']}>
              <DataBackupPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="parent"
          element={
            <ProtectedRoute roles={['PARENT']}>
              <ParentDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="progress"
          element={
            <ProtectedRoute roles={['TEACHER', 'SCHOOL_ADMIN', 'SUPER_ADMIN', 'PARENT']}>
              <StudentProgressPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="progress/students/:studentId"
          element={
            <ProtectedRoute roles={['TEACHER', 'SCHOOL_ADMIN', 'SUPER_ADMIN', 'PARENT']}>
              <StudentProgressDetailPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="progress/students/:studentId/quizzes/:quizId"
          element={
            <ProtectedRoute roles={['TEACHER', 'SCHOOL_ADMIN', 'SUPER_ADMIN', 'PARENT']}>
              <StudentQuizProgressPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="admin"
          element={
            <ProtectedRoute roles={['SUPER_ADMIN']}>
              <AdminOverviewPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="admin/schools"
          element={
            <ProtectedRoute roles={['SUPER_ADMIN']}>
              <AdminSchoolsPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="admin/analytics"
          element={
            <ProtectedRoute roles={['SUPER_ADMIN']}>
              <AdminAnalyticsPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="admin/packages"
          element={
            <ProtectedRoute roles={['SUPER_ADMIN']}>
              <AdminPackagesPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="admin/settings"
          element={
            <ProtectedRoute roles={['SUPER_ADMIN']}>
              <AdminSettingsPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="admin/feedback"
          element={
            <ProtectedRoute roles={['SUPER_ADMIN']}>
              <AdminFeedbackPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="admin/data"
          element={
            <ProtectedRoute roles={['SUPER_ADMIN']}>
              <DataBackupPage />
            </ProtectedRoute>
          }
        />
        <Route path="profile" element={<ProfilePage />} />
      </Route>
      <Route
        path="*"
        element={
          <Navigate
            to={
              isAuthenticated && user
                ? roleHome(user.role)
                : '/'
            }
            replace
          />
        }
      />
    </Routes>
  );
}
