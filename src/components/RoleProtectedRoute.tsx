import type { ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import {
  getAccountHomePath,
  getRoleFromAccessToken,
  type AccountRole,
} from '../lib/jwtRole';

type RoleProtectedRouteProps = {
  role: AccountRole;
  children: ReactNode;
};

export function RoleProtectedRoute({ role, children }: RoleProtectedRouteProps) {
  const token = localStorage.getItem('accessToken');
  if (!token) {
    return <Navigate to="/login" replace />;
  }
  const actual = getRoleFromAccessToken();
  if (!actual) {
    return <Navigate to="/login" replace />;
  }
  if (actual !== role) {
    return <Navigate to={getAccountHomePath(actual)} replace />;
  }
  return children;
}
