import { authJson } from '../../../lib/api';
import type { RentalRequest } from '../types';

export const rentalRequestsApi = {
  create: (body: { vehicleId: string; startDate: string; endDate: string; message?: string }) =>
    authJson<RentalRequest>('/rental-requests', {
      method: 'POST',
      body: JSON.stringify(body),
    }),
  getMyRequests: () => authJson<RentalRequest[]>('/rental-requests/me'),
  getVendorRequests: () => authJson<RentalRequest[]>('/rental-requests/vendor/me'),
  getById: (id: string) => authJson<RentalRequest>(`/rental-requests/${id}`),
  updateStatus: (id: string, status: 'APPROVED' | 'REJECTED') =>
    authJson<RentalRequest>(`/rental-requests/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    }),
};
