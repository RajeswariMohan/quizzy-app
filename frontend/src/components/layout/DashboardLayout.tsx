import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import {
  Award,
  BarChart3,
  BookOpen,
  ChevronLeft,
  GraduationCap,
  LayoutDashboard,
  LogOut,
  Menu,
  Settings,
  Users,
} from 'lucide-react';
import { useState } from 'react';
import { cn } from '@/lib/cn';
import { useAuthStore } from '@/store/authStore';
import { useTenantTheme } from '@/hooks/useTenantTheme';
import type { UserRole } from '@/types/auth';

interface NavItem {
  to: string;
  label: string;
  icon: typeof LayoutDashboard;
  roles: UserRole[];
}

const NAV_ITEMS: NavItem[] = [
  { to: '/student', label: 'Dashboard', icon: LayoutDashboard, roles: ['STUDENT'] },
  { to: '/student/leaderboard', label: 'Leaderboard', icon: Award, roles: ['STUDENT'] },
  { to: '/teacher', label: 'Dashboard', icon: LayoutDashboard, roles: ['TEACHER', 'SCHOOL_ADMIN'] },
  { to: '/teacher/quizzes', label: 'Quizzes', icon: BookOpen, roles: ['TEACHER', 'SCHOOL_ADMIN'] },
  { to: '/teacher/analytics', label: 'Analytics', icon: BarChart3, roles: ['TEACHER', 'SCHOOL_ADMIN'] },
  { to: '/parent', label: 'Insights', icon: Users, roles: ['PARENT'] },
];

function roleHome(role: UserRole): string {
  if (role === 'STUDENT') return '/student';
  if (role === 'PARENT') return '/parent';
  return '/teacher';
}

export function DashboardLayout() {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const { user, logout } = useAuthStore();
  const { tenantProfile } = useTenantTheme();
  const navigate = useNavigate();

  const items = NAV_ITEMS.filter((item) => user && item.roles.includes(user.role));

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="flex min-h-screen bg-surface">
      {/* Sidebar — desktop */}
      <aside
        className={cn(
          'hidden flex-col border-r border-gray-200 bg-ink text-white transition-all duration-300 lg:flex',
          collapsed ? 'w-[72px]' : 'w-64',
        )}
      >
        <div className="flex items-center gap-3 border-b border-white/10 p-4">
          {tenantProfile.logoUrl ? (
            <img src={tenantProfile.logoUrl} alt="" className="h-9 w-9 rounded-lg object-cover" />
          ) : (
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary font-bold">
              Q
            </div>
          )}
          {!collapsed && (
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold">{tenantProfile.schoolName}</p>
              <p className="text-xs text-white/60">Quizzy Portal</p>
            </div>
          )}
        </div>

        <nav className="flex-1 space-y-1 p-3">
          {items.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                cn(
                  'flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition',
                  isActive ? 'bg-primary text-white' : 'text-white/70 hover:bg-white/10',
                )
              }
            >
              <Icon className="h-5 w-5 shrink-0" />
              {!collapsed && <span>{label}</span>}
            </NavLink>
          ))}
        </nav>

        <div className="space-y-1 border-t border-white/10 p-3">
          <button
            type="button"
            className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-white/70 hover:bg-white/10"
          >
            <Settings className="h-5 w-5" />
            {!collapsed && 'Settings'}
          </button>
          <button
            type="button"
            onClick={handleLogout}
            className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-white/70 hover:bg-white/10"
          >
            <LogOut className="h-5 w-5" />
            {!collapsed && 'Logout'}
          </button>
        </div>
      </aside>

      {/* Mobile drawer */}
      {mobileOpen && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <button
            type="button"
            className="absolute inset-0 bg-black/40"
            onClick={() => setMobileOpen(false)}
            aria-label="Close menu"
          />
          <aside className="relative flex h-full w-64 flex-col bg-ink text-white">
            <div className="p-4 font-semibold">{tenantProfile.schoolName}</div>
            <nav className="flex-1 space-y-1 p-3">
              {items.map(({ to, label, icon: Icon }) => (
                <NavLink
                  key={to}
                  to={to}
                  onClick={() => setMobileOpen(false)}
                  className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm hover:bg-white/10"
                >
                  <Icon className="h-5 w-5" />
                  {label}
                </NavLink>
              ))}
            </nav>
          </aside>
        </div>
      )}

      <div className="flex min-w-0 flex-1 flex-col">
        {/* Top bar */}
        <header className="sticky top-0 z-30 flex items-center justify-between border-b border-gray-200 bg-white/90 px-4 py-3 backdrop-blur md:px-6">
          <div className="flex items-center gap-3">
            <button
              type="button"
              className="rounded-lg p-2 hover:bg-gray-100 lg:hidden"
              onClick={() => setMobileOpen(true)}
            >
              <Menu className="h-5 w-5" />
            </button>
            <button
              type="button"
              className="hidden rounded-lg p-2 hover:bg-gray-100 lg:inline-flex"
              onClick={() => setCollapsed((c) => !c)}
            >
              <ChevronLeft className={cn('h-5 w-5 transition', collapsed && 'rotate-180')} />
            </button>
            <div className="flex items-center gap-2 lg:hidden">
              <GraduationCap className="h-5 w-5 text-primary" />
              <span className="font-semibold">{tenantProfile.schoolName}</span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="hidden text-right sm:block">
              <p className="text-sm font-medium">{user?.displayName ?? user?.email}</p>
              <p className="text-xs text-muted">{user?.role.replace('_', ' ')}</p>
            </div>
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-sm font-bold text-primary">
              {(user?.displayName ?? 'U').charAt(0).toUpperCase()}
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-auto p-4 md:p-6">
          <Outlet />
        </main>

        {/* Mobile bottom nav */}
        <nav className="flex border-t border-gray-200 bg-white lg:hidden">
          {items.slice(0, 4).map(({ to, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                cn(
                  'flex flex-1 flex-col items-center gap-1 py-2 text-xs',
                  isActive ? 'text-primary' : 'text-muted',
                )
              }
            >
              <Icon className="h-5 w-5" />
            </NavLink>
          ))}
        </nav>
      </div>
    </div>
  );
}

export function useRoleRedirect() {
  const user = useAuthStore((s) => s.user);
  return user ? roleHome(user.role) : '/login';
}
