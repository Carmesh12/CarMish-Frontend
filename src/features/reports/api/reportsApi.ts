import { authJson } from '../../../lib/api';
import type { Report, ReportListResponse } from '../types';

export const reportsApi = {
  create: (body: { vehicleId: string; reason: string; description?: string }) =>
    authJson<Report>('/reports', {
      method: 'POST',
      body: JSON.stringify(body),
    }),
  getAdminReports: (page = 1, limit = 10) =>
    authJson<ReportListResponse>(`/reports/admin?page=${page}&limit=${limit}`),
  updateStatus: (id: string, status: 'REVIEWED' | 'RESOLVED' | 'DISMISSED') =>
    authJson<Report>(`/reports/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    }),
};
