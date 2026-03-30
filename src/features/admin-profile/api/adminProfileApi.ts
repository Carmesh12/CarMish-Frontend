import { authJson } from '../../../lib/api';
import type { AdminDashboardResponse, AdminProfileResponse } from '../types';

export function getAdminProfile() {
  return authJson<AdminProfileResponse>('/admin/profile');
}

export function getAdminDashboard() {
  return authJson<AdminDashboardResponse>('/admin/dashboard');
}

export function patchAdminProfile(body: { firstName?: string; lastName?: string }) {
  return authJson<AdminProfileResponse>('/admin/profile', {
    method: 'PATCH',
    body: JSON.stringify(body),
  });
}
