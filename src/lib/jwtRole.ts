export type AccountRole = 'USER' | 'VENDOR' | 'ADMIN';

export function getRoleFromAccessToken(): AccountRole | null {
  const token = localStorage.getItem('accessToken');
  if (!token) return null;
  try {
    const payload = JSON.parse(atob(token.split('.')[1])) as { role?: string };
    const r = payload.role;
    if (r === 'USER' || r === 'VENDOR' || r === 'ADMIN') return r;
  } catch {
    return null;
  }
  return null;
}

export function getAccountHomePath(role: AccountRole | null): string {
  if (role === 'USER') return '/account';
  if (role === 'VENDOR') return '/vendor/dashboard';
  if (role === 'ADMIN') return '/admin/dashboard';
  return '/dashboard';
}
