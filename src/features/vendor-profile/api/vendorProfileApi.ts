import { authFormData, authJson } from '../../../lib/api';
import type {
  VendorDashboardRange,
  VendorDashboardInsightsResponse,
  VendorDashboardResponse,
  VendorAnalyticsChatResponse,
  VendorProfileResponse,
} from '../types';

export function getVendorProfile() {
  return authJson<VendorProfileResponse>('/vendor/profile');
}

export function getVendorDashboard(range: VendorDashboardRange = 'month') {
  return authJson<VendorDashboardResponse>(`/vendor/dashboard?range=${range}`);
}

export function getVendorDashboardInsights(range: VendorDashboardRange = 'month') {
  return authJson<VendorDashboardInsightsResponse>(`/vendor/dashboard/insights?range=${range}`);
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

export type VendorLogoUploadResponse = {
  message: string;
  logoUrl: string;
};

export function patchVendorLogo(file: File) {
  const formData = new FormData();
  formData.append('image', file);
  return authFormData<VendorLogoUploadResponse>('/vendor/profile/logo', formData, {
    method: 'PATCH',
  });
}

export function patchVendorPassword(body: {
  currentPassword: string;
  newPassword: string;
  confirmNewPassword: string;
}) {
  return authJson<{ message: string }>('/vendor/profile/password', {
    method: 'PATCH',
    body: JSON.stringify(body),
  });
}

export function askVendorAnalytics(body: {
  message: string;
  range?: VendorDashboardRange;
}) {
  return authJson<VendorAnalyticsChatResponse>('/vendor/dashboard/insights/chat', {
    method: 'POST',
    body: JSON.stringify(body),
  });
}
