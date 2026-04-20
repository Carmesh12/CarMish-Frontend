import { create } from 'zustand';

export type AccountRole = 'USER' | 'VENDOR' | 'ADMIN';

export interface AuthUser {
  id: string;
  email: string;
  role: AccountRole;
  profile: Record<string, unknown> | null;
}

interface AuthState {
  user: AuthUser | null;
  accessToken: string | null;
  refreshToken: string | null;
  role: AccountRole | null;
  isAuthenticated: boolean;
  isHydrated: boolean;

  login: (data: { accessToken: string; refreshToken: string; user: AuthUser }) => void;
  setTokens: (accessToken: string, refreshToken: string) => void;
  setUser: (user: AuthUser) => void;
  logout: () => void;
  hydrate: () => void;
}

function decodeRole(token: string): AccountRole | null {
  try {
    const payload = JSON.parse(atob(token.split('.')[1])) as { role?: string };
    const r = payload.role;
    if (r === 'USER' || r === 'VENDOR' || r === 'ADMIN') return r;
  } catch {
    /* invalid token */
  }
  return null;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  accessToken: null,
  refreshToken: null,
  role: null,
  isAuthenticated: false,
  isHydrated: false,

  login: ({ accessToken, refreshToken, user }) => {
    localStorage.setItem('accessToken', accessToken);
    localStorage.setItem('refreshToken', refreshToken);
    set({
      user,
      accessToken,
      refreshToken,
      role: user.role,
      isAuthenticated: true,
    });
  },

  setTokens: (accessToken, refreshToken) => {
    localStorage.setItem('accessToken', accessToken);
    localStorage.setItem('refreshToken', refreshToken);
    const role = decodeRole(accessToken);
    set({ accessToken, refreshToken, role });
  },

  setUser: (user) => {
    set({ user, role: user.role, isAuthenticated: true });
  },

  logout: () => {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    set({
      user: null,
      accessToken: null,
      refreshToken: null,
      role: null,
      isAuthenticated: false,
    });
  },

  hydrate: () => {
    const accessToken = localStorage.getItem('accessToken');
    const refreshToken = localStorage.getItem('refreshToken');
    if (accessToken) {
      const role = decodeRole(accessToken);
      set({
        accessToken,
        refreshToken,
        role,
        isAuthenticated: true,
        isHydrated: true,
      });
    } else {
      set({ isHydrated: true });
    }
  },
}));

export function getAccountHomePath(role: AccountRole | null): string {
  if (role === 'USER') return '/user/dashboard';
  if (role === 'VENDOR') return '/vendor/dashboard';
  if (role === 'ADMIN') return '/admin/dashboard';
  return '/vehicles';
}
