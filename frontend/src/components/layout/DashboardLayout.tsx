import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import {
  Award,
  BarChart3,
  BookOpen,
  Building2,
  ClipboardList,
  MessageSquare,
  Database,
  ChevronLeft,
  GraduationCap,
  LayoutDashboard,
  LogOut,
  Menu,
  Settings,
  SlidersHorizontal,
  User,
  Users,
} from 'lucide-react';
import { useState } from 'react';
import { cn } from '@/lib/cn';
import { useAuthStore } from '@/store/authStore';
import { useSessionTracker } from '@/hooks/useSessionTracker';
import { useTenantTheme } from '@/hooks/useTenantTheme';
import { useSchoolFeatures } from '@/hooks/useSchoolFeatures';
import type { UserRole } from '@/types/auth';
import { roleHome } from '@/utils/roleHome';

interface NavItem {
  to: string;
  label: string;
  icon: typeof LayoutDashboard;
  roles: UserRole[];
  /** Match pathname exactly (avoids highlighting Dashboard when on a child route) */
  end?: boolean;
}

const NAV_ITEMS: NavItem[] = [
  { to: '/student', label: 'Dashboard', icon: LayoutDashboard, roles: ['STUDENT'], end: true },
  { to: '/student/leaderboard', label: 'Leaderboard', icon: Award, roles: ['STUDENT'] },
  { to: '/feedback', label: 'Feedback', icon: MessageSquare, roles: ['STUDENT'] },
  {
    to: '/teacher',
    label: 'Dashboard',
    icon: LayoutDashboard,
    roles: ['TEACHER'],
    end: true,
  },
  {
    to: '/teacher/quizzes',
    label: 'Quizzes',
    icon: BookOpen,
    roles: ['TEACHER'],
  },
  {
    to: '/teacher/analytics',
    label: 'Analytics',
    icon: BarChart3,
    roles: ['TEACHER'],
  },
  {
    to: '/progress',
    label: 'Progress',
    icon: ClipboardList,
    roles: ['TEACHER'],
  },
  { to: '/parent', label: 'Insights', icon: Users, roles: ['PARENT'], end: true },
  { to: '/feedback', label: 'Feedback', icon: MessageSquare, roles: ['PARENT'] },
  {
    to: '/progress',
    label: 'Progress',
    icon: ClipboardList,
    roles: ['PARENT'],
  },
  { to: '/school-admin', label: 'School', icon: LayoutDashboard, roles: ['SCHOOL_ADMIN'], end: true },
  { to: '/school-admin/users', label: 'Users', icon: Users, roles: ['SCHOOL_ADMIN'] },
  {
    to: '/school-admin/academics',
    label: 'Academics',
    icon: GraduationCap,
    roles: ['SCHOOL_ADMIN'],
  },
  {
    to: '/teacher/quizzes',
    label: 'Quizzes',
    icon: BookOpen,
    roles: ['SCHOOL_ADMIN'],
  },
  {
    to: '/teacher/analytics',
    label: 'Analytics',
    icon: BarChart3,
    roles: ['SCHOOL_ADMIN'],
  },
  {
    to: '/progress',
    label: 'Progress',
    icon: ClipboardList,
    roles: ['SCHOOL_ADMIN'],
  },
  { to: '/feedback', label: 'Feedback', icon: MessageSquare, roles: ['SCHOOL_ADMIN'] },
  { to: '/school-admin/data', label: 'Backup', icon: Database, roles: ['SCHOOL_ADMIN'] },
  { to: '/admin', label: 'Platform', icon: LayoutDashboard, roles: ['SUPER_ADMIN'], end: true },
  { to: '/admin/schools', label: 'Schools', icon: Building2, roles: ['SUPER_ADMIN'] },
  { to: '/admin/packages', label: 'Packages', icon: SlidersHorizontal, roles: ['SUPER_ADMIN'] },
  { to: '/admin/analytics', label: 'Analytics', icon: BarChart3, roles: ['SUPER_ADMIN'] },
  { to: '/admin/settings', label: 'Features', icon: Settings, roles: ['SUPER_ADMIN'] },
  { to: '/admin/feedback', label: 'Feedback', icon: MessageSquare, roles: ['SUPER_ADMIN'] },
  { to: '/admin/data', label: 'Backup', icon: Database, roles: ['SUPER_ADMIN'] },
  {
    to: '/teacher/quizzes',
    label: 'Quizzes',
    icon: BookOpen,
    roles: ['SUPER_ADMIN'],
  },
  {
    to: '/progress',
    label: 'Progress',
    icon: ClipboardList,
    roles: ['SUPER_ADMIN'],
  },
];

export function DashboardLayout() {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const { user, logout } = useAuthStore();
  const { tenantProfile } = useTenantTheme();
  const navigate = useNavigate();
  useSessionTracker();

  const { features } = useSchoolFeatures();

  const items = NAV_ITEMS.filter((item) => {
    if (!user || !item.roles.includes(user.role)) return false;
    if (item.to === '/student/leaderboard' && !features.studentLeaderboardEnabled) return false;
    return true;
  });
  const settingsPath = user?.role === 'SUPER_ADMIN' ? '/admin/settings' : undefined;

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <div className="flex h-screen overflow-hidden bg-surface">
      {/* Sidebar — desktop */}
      <aside
        className={cn(
          'hidden h-full shrink-0 flex-col border-r border-gray-200 bg-ink text-white transition-all duration-300 lg:flex',
          collapsed ? 'w-[72px]' : 'w-64',
        )}
      >
        <div className="flex shrink-0 items-center gap-3 border-b border-white/10 p-4">
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

        <nav className="min-h-0 flex-1 space-y-1 overflow-y-auto overflow-x-hidden p-3">
          {items.map(({ to, label, icon: Icon, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
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

        <div className="shrink-0 space-y-1 border-t border-white/10 p-3">
          <button
            type="button"
            onClick={() => settingsPath && navigate(settingsPath)}
            disabled={!settingsPath}
            className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-white/70 hover:bg-white/10 disabled:opacity-40"
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
          <aside className="relative flex h-full max-h-screen w-64 flex-col bg-ink text-white">
            <div className="shrink-0 border-b border-white/10 p-4">
              <p className="font-semibold">{tenantProfile.schoolName}</p>
              <p className="text-xs text-white/60">Quizzy Portal</p>
            </div>
            <nav className="min-h-0 flex-1 space-y-1 overflow-y-auto p-3">
              {items.map(({ to, label, icon: Icon, end }) => (
                <NavLink
                  key={to}
                  to={to}
                  end={end}
                  onClick={() => setMobileOpen(false)}
                  className={({ isActive }) =>
                    cn(
                      'flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition',
                      isActive ? 'bg-primary text-white' : 'text-white/70 hover:bg-white/10',
                    )
                  }
                >
                  <Icon className="h-5 w-5" />
                  {label}
                </NavLink>
              ))}
            </nav>
            <div className="shrink-0 space-y-1 border-t border-white/10 p-3">
              <button
                type="button"
                onClick={() => {
                  setMobileOpen(false);
                  handleLogout();
                }}
                className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-white/70 hover:bg-white/10"
              >
                <LogOut className="h-5 w-5" />
                Logout
              </button>
            </div>
          </aside>
        </div>
      )}

      <div className="flex min-h-0 min-w-0 flex-1 flex-col">
        {/* Top bar */}
        <header className="relative z-30 flex shrink-0 items-center justify-between border-b border-gray-200 bg-white/90 px-4 py-3 backdrop-blur md:px-6">
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

          <div className="flex items-center gap-2 sm:gap-3">
            <div className="relative">
              <button
                type="button"
                onClick={() => setProfileMenuOpen((v) => !v)}
                className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-sm font-bold text-primary hover:ring-2 hover:ring-primary/30"
                title="Account menu"
                aria-label="Account menu"
                aria-haspopup="menu"
                aria-expanded={profileMenuOpen}
              >
                {user?.avatarUrl ? (
                  <img
                    src={user.avatarUrl}
                    alt=""
                    className="h-full w-full rounded-full object-cover"
                  />
                ) : (
                  (user?.displayName ?? 'U').charAt(0).toUpperCase()
                )}
              </button>
              {profileMenuOpen && (
                <>
                  <button
                    type="button"
                    className="fixed inset-0 z-10 cursor-default"
                    aria-label="Close account menu"
                    onClick={() => setProfileMenuOpen(false)}
                  />
                  <div
                    className="absolute right-0 z-20 mt-2 w-64 rounded-xl border border-gray-200 bg-white p-2 shadow-lg"
                    role="menu"
                  >
                    <div className="border-b border-gray-100 px-2 py-2">
                      <p className="truncate text-sm font-medium text-ink">
                        {user?.displayName ?? user?.email}
                      </p>
                      <p className="text-xs text-muted">{user?.role.replace('_', ' ')}</p>
                    </div>
                    <button
                      type="button"
                      className="mt-1 flex w-full items-center gap-2 rounded-lg px-2 py-2 text-left text-sm hover:bg-gray-100"
                      onClick={() => {
                        setProfileMenuOpen(false);
                        navigate('/profile');
                      }}
                      role="menuitem"
                    >
                      <User className="h-4 w-4" />
                      My profile
                    </button>
                    {settingsPath && (
                      <button
                        type="button"
                        className="flex w-full items-center gap-2 rounded-lg px-2 py-2 text-left text-sm hover:bg-gray-100"
                        onClick={() => {
                          setProfileMenuOpen(false);
                          navigate(settingsPath);
                        }}
                        role="menuitem"
                      >
                        <Settings className="h-4 w-4" />
                        Settings
                      </button>
                    )}
                    <button
                      type="button"
                      className="flex w-full items-center gap-2 rounded-lg px-2 py-2 text-left text-sm text-danger hover:bg-danger/10"
                      onClick={() => {
                        setProfileMenuOpen(false);
                        void handleLogout();
                      }}
                      role="menuitem"
                    >
                      <LogOut className="h-4 w-4" />
                      Logout
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </header>

        <main className="flex-1 min-h-0 overflow-auto p-4 md:p-6">
          <Outlet />
        </main>

        {/* Mobile bottom nav */}
        <nav className="flex shrink-0 border-t border-gray-200 bg-white lg:hidden">
          {items.slice(0, 4).map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                cn(
                  'flex flex-1 flex-col items-center gap-0.5 py-2 text-[10px] font-medium',
                  isActive ? 'text-primary' : 'text-muted',
                )
              }
            >
              <Icon className="h-5 w-5" />
              <span className="truncate px-1">{label.split(' ')[0]}</span>
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
