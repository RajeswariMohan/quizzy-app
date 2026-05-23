import type { ReactNode } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { StudentDashboard } from '@/pages/StudentDashboard';
import { TeacherDashboard } from '@/pages/TeacherDashboard';
import { ParentDashboard } from '@/pages/ParentDashboard';
import { LoginPage } from '@/pages/LoginPage';
import { useAuthStore } from '@/store/authStore';
import type { UserRole } from '@/types/auth';

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
    return <Navigate to="/login" replace />;
  }

  if (roles && user && !roles.includes(user.role)) {
    return <Navigate to={homeForRole(user.role)} replace />;
  }

  return <>{children}</>;
}

function homeForRole(role: UserRole): string {
  if (role === 'STUDENT') return '/student';
  if (role === 'PARENT') return '/parent';
  return '/teacher';
}

export function AppRoutes() {
  const { isAuthenticated, isLoading, user } = useAuthStore();

  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <DashboardLayout />
          </ProtectedRoute>
        }
      >
        <Route
          index
          element={
            isLoading ? null : (
              <Navigate to={user ? homeForRole(user.role) : '/login'} replace />
            )
          }
        />
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
              <StudentDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="teacher"
          element={
            <ProtectedRoute roles={['TEACHER', 'SCHOOL_ADMIN', 'SUPER_ADMIN']}>
              <TeacherDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="teacher/quizzes"
          element={
            <ProtectedRoute roles={['TEACHER', 'SCHOOL_ADMIN', 'SUPER_ADMIN']}>
              <TeacherDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="teacher/analytics"
          element={
            <ProtectedRoute roles={['TEACHER', 'SCHOOL_ADMIN', 'SUPER_ADMIN']}>
              <TeacherDashboard />
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
      </Route>
      <Route
        path="*"
        element={<Navigate to={isAuthenticated ? '/' : '/login'} replace />}
      />
    </Routes>
  );
}
