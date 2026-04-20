import { Navigate } from 'react-router-dom';
import { useAuthStore, getAccountHomePath } from '../stores/authStore';
import type { AccountRole } from '../stores/authStore';
import type { ReactNode } from 'react';

interface Props {
  role: AccountRole;
  children: ReactNode;
}

export function RoleProtectedRoute({ role, children }: Props) {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const currentRole = useAuthStore((s) => s.role);

  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (currentRole !== role) {
    return <Navigate to={getAccountHomePath(currentRole)} replace />;
  }
  return <>{children}</>;
}
