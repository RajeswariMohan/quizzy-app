import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  type ReactNode,
} from 'react';
import { useAuthStore } from '@/store/authStore';
import type { TenantProfile } from '@/types/auth';

function hexToRgbChannels(hex: string): string {
  const normalized = hex.replace('#', '');
  const full =
    normalized.length === 3
      ? normalized
          .split('')
          .map((c) => c + c)
          .join('')
      : normalized;
  const num = parseInt(full, 16);
  const r = (num >> 16) & 255;
  const g = (num >> 8) & 255;
  const b = num & 255;
  return `${r} ${g} ${b}`;
}

interface ThemeContextValue {
  tenantProfile: TenantProfile;
  primaryColor: string;
  secondaryColor: string;
  applyTenantBranding: (profile: Partial<TenantProfile>) => void;
}

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const tenantProfile = useAuthStore((s) => s.tenantProfile);
  const setTenantBranding = useAuthStore((s) => s.setTenantBranding);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);

  useEffect(() => {
    if (!isAuthenticated) return;

    const root = document.documentElement;
    root.style.setProperty('--color-primary', hexToRgbChannels(tenantProfile.primaryColor));
    root.style.setProperty('--color-secondary', hexToRgbChannels(tenantProfile.secondaryColor));
    root.style.setProperty('--color-primary-hex', tenantProfile.primaryColor);
    root.style.setProperty('--color-secondary-hex', tenantProfile.secondaryColor);
  }, [tenantProfile, isAuthenticated]);

  const applyTenantBranding = useCallback(
    (profile: Partial<TenantProfile>) => setTenantBranding(profile),
    [setTenantBranding],
  );

  const value = useMemo(
    () => ({
      tenantProfile,
      primaryColor: tenantProfile.primaryColor,
      secondaryColor: tenantProfile.secondaryColor,
      applyTenantBranding,
    }),
    [tenantProfile, applyTenantBranding],
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTenantTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext);
  if (!ctx) {
    throw new Error('useTenantTheme must be used within ThemeProvider');
  }
  return ctx;
}
