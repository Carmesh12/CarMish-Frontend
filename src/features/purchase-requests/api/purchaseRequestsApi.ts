import { authJson } from '../../../lib/api';
import type { PurchaseRequest } from '../types';

export const purchaseRequestsApi = {
  create: (body: { vehicleId: string; offeredPrice?: number; message?: string }) =>
    authJson<PurchaseRequest>('/purchase-requests', {
      method: 'POST',
      body: JSON.stringify(body),
    }),
  getMyRequests: () => authJson<PurchaseRequest[]>('/purchase-requests/me'),
  getVendorRequests: () => authJson<PurchaseRequest[]>('/purchase-requests/vendor/me'),
  getById: (id: string) => authJson<PurchaseRequest>(`/purchase-requests/${id}`),
  updateStatus: (id: string, status: 'APPROVED' | 'REJECTED') =>
    authJson<PurchaseRequest>(`/purchase-requests/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    }),
};
