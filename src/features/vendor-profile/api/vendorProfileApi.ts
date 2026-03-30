import { authJson } from '../../../lib/api';
import type { VendorDashboardResponse, VendorProfileResponse } from '../types';

export function getVendorProfile() {
  return authJson<VendorProfileResponse>('/vendor/profile');
}

export function getVendorDashboard() {
  return authJson<VendorDashboardResponse>('/vendor/dashboard');
}

export function patchVendorProfile(body: {
  businessName?: string;
  contactPersonName?: string;
  phoneNumber?: string;
  businessAddress?: string;
  logoUrl?: string;
}) {
  return authJson<VendorProfileResponse>('/vendor/profile', {
    method: 'PATCH',
    body: JSON.stringify(body),
  });
}
