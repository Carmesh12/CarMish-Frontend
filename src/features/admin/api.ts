import { authJson } from '../../lib/api';
import type { ThreeDPrintRequest, ThreeDPrintRequestListResponse } from '../vehicle-3d/api/vehicle3dApi';

export type AdminDashboardRange = 'week' | 'month' | 'year' | 'all';

export type AdminAiInsight = {
  type: 'success' | 'warning' | 'info';
  title: string;
  message: string;
  action?: string;
  source: 'ai' | 'fallback';
};

export type AdminDashboardAnalytics = {
  kpis: {
    totalUsers: number;
    totalVendors: number;
    totalVehicles: number;
    activeListings: number;
    totalRevenue: number;
    purchaseRevenue: number;
    rentalRevenue: number;
    pendingVendors: number;
    openReports: number;
    totalRequests: number;
    approvalRate: number;
  };
  growth: {
    newUsersInRange: number;
    newVendorsInRange: number;
    newVehiclesInRange: number;
  };
  vendors: { approved: number; pending: number; rejected: number };
  reports: { pending: number; reviewed: number; resolved: number; dismissed: number };
  topVendors: { id: string; businessName: string; email: string; vehicles: number; purchaseRequests: number; rentalRequests: number }[];
  topReportedVehicles: { vehicleId: string; title: string; brand: string; vendorName: string; reportCount: number }[];
};

export type AdminDashboardResponse = {
  range: AdminDashboardRange;
  greeting: { fullName: string; email: string };
  accountSummary: { role: string; isActive: boolean; memberSince: string };
  profileCompletion: { percentage: number; completedFields: string[]; missingFields: string[] };
  analytics: AdminDashboardAnalytics;
  quickActions: { id: string; label: string; path: string }[];
};

export type AdminInsightsResponse = {
  range: AdminDashboardRange;
  insights: AdminAiInsight[];
};

export type AdminChatResponse = {
  answer: string;
  source: 'ai' | 'fallback';
  suggestions: string[];
};

export type PendingVendor = {
  id: string;
  accountId: string;
  businessName: string;
  contactPersonName: string;
  phoneNumber: string | null;
  businessAddress: string | null;
  logoUrl: string | null;
  verificationStatus: string;
  createdAt: string;
  account: { id: string; email: string; createdAt: string; isActive: boolean };
};

export type VendorListItem = PendingVendor & {
  _count: { vehicles: number; purchaseRequests: number; rentalRequests: number };
};

export type AccountListItem = {
  id: string;
  email: string;
  role: string;
  isActive: boolean;
  createdAt: string;
  user?: { firstName: string; lastName: string } | null;
  vendor?: { businessName: string; verificationStatus: string } | null;
  admin?: { firstName: string; lastName: string } | null;
  _count: { reports: number };
};

export type ReportGrouped = {
  vehicleId: string;
  vehicleTitle: string;
  vehicleBrand: string;
  vehicleModel: string;
  listingStatus: string;
  vendorId: string;
  vendorName: string;
  vendorAccountId: string;
  reportCount: number;
  pendingCount: number;
  latestReportDate: string;
  severity: 'low' | 'medium' | 'high';
  reports: {
    id: string;
    reason: string;
    description: string | null;
    status: string;
    createdAt: string;
    reporterAccount: { email: string };
  }[];
};

export type ThreadMessage = {
  id: string;
  threadId: string;
  senderAccountId: string;
  body: string;
  isRead: boolean;
  createdAt: string;
  senderAccount?: { email: string; role: string };
};

export type Thread = {
  id: string;
  adminAccountId: string;
  vendorAccountId: string;
  subject: string;
  context: string;
  contextEntityId: string | null;
  isClosed: boolean;
  createdAt: string;
  updatedAt: string;
  messages: ThreadMessage[];
  vendorAccount?: { email: string; vendor?: { businessName: string } | null };
  adminAccount?: { email: string; admin?: { firstName: string; lastName: string } | null };
};

export type Paginated<T> = {
  data: T[];
  meta: { total: number; page: number; limit: number; totalPages: number };
};

export function getAdminDashboard(range: AdminDashboardRange = 'month') {
  return authJson<AdminDashboardResponse>(`/admin/dashboard?range=${range}`);
}

export function getAdminDashboardInsights(range: AdminDashboardRange = 'month') {
  return authJson<AdminInsightsResponse>(`/admin/dashboard/insights?range=${range}`);
}

export function askAdminAnalytics(body: { message: string; range?: AdminDashboardRange }) {
  return authJson<AdminChatResponse>('/admin/dashboard/insights/chat', { method: 'POST', body: JSON.stringify(body) });
}

export function getAdminPendingVendors(page = 1, limit = 10) {
  return authJson<Paginated<PendingVendor>>(`/admin/vendors/pending?page=${page}&limit=${limit}`);
}

export function getAdminPendingCount() {
  return authJson<number>('/admin/vendors/pending/count');
}

export function getAdminAllVendors(page = 1, limit = 10, status?: string, search?: string) {
  const params = new URLSearchParams({ page: String(page), limit: String(limit) });
  if (status) params.set('status', status);
  if (search) params.set('search', search);
  return authJson<Paginated<VendorListItem>>(`/admin/vendors?${params}`);
}

export function approveVendor(vendorId: string) {
  return authJson<{ message: string }>(`/admin/vendors/${vendorId}/approve`, { method: 'PATCH' });
}

export function rejectVendor(vendorId: string, reason?: string) {
  return authJson<{ message: string }>(`/admin/vendors/${vendorId}/reject`, { method: 'PATCH', body: JSON.stringify({ reason }) });
}

export function messageVendor(vendorId: string, subject: string, body: string) {
  return authJson<Thread>(`/admin/vendors/${vendorId}/message`, { method: 'POST', body: JSON.stringify({ subject, body }) });
}

export function getAdminAccounts(page = 1, limit = 10, role?: string, isActive?: string, search?: string) {
  const params = new URLSearchParams({ page: String(page), limit: String(limit) });
  if (role) params.set('role', role);
  if (isActive) params.set('isActive', isActive);
  if (search) params.set('search', search);
  return authJson<Paginated<AccountListItem>>(`/admin/accounts?${params}`);
}

export function deactivateAccount(accountId: string, reason?: string) {
  return authJson<{ message: string }>(`/admin/accounts/${accountId}/deactivate`, { method: 'PATCH', body: JSON.stringify({ reason }) });
}

export function activateAccount(accountId: string) {
  return authJson<{ message: string }>(`/admin/accounts/${accountId}/activate`, { method: 'PATCH' });
}

export function getGroupedReports(status?: string) {
  const params = status ? `?status=${status}` : '';
  return authJson<{ data: ReportGrouped[]; meta: { totalVehicles: number; totalReports: number } }>(`/reports/admin/grouped${params}`);
}

export function resolveAllReports(vehicleId: string) {
  return authJson<{ message: string }>(`/reports/vehicle/${vehicleId}/resolve-all`, { method: 'PATCH' });
}

export function dismissAllReports(vehicleId: string) {
  return authJson<{ message: string }>(`/reports/vehicle/${vehicleId}/dismiss-all`, { method: 'PATCH' });
}

export function hideVehicleListing(vehicleId: string) {
  return authJson<{ message: string }>(`/reports/vehicle/${vehicleId}/hide`, { method: 'PATCH' });
}

export function discussWithVendor(vehicleId: string, subject: string, body: string) {
  return authJson<Thread>(`/reports/vehicle/${vehicleId}/discuss`, { method: 'POST', body: JSON.stringify({ subject, body }) });
}

export function getMyThreads(page = 1, limit = 20) {
  return authJson<Paginated<Thread>>(`/admin/messaging/threads?page=${page}&limit=${limit}`);
}

export function getThread(threadId: string) {
  return authJson<Thread>(`/admin/messaging/threads/${threadId}`);
}

export function replyToThread(threadId: string, body: string) {
  return authJson<ThreadMessage>(`/admin/messaging/threads/${threadId}/reply`, { method: 'POST', body: JSON.stringify({ body }) });
}

export function getAdminPrintRequests(page = 1, limit = 10, status?: string) {
  const params = new URLSearchParams({ page: String(page), limit: String(limit) });
  if (status) params.set('status', status);
  return authJson<ThreeDPrintRequestListResponse>(`/admin/3d-print-requests?${params}`);
}

export function updatePrintRequestStatus(
  requestId: string,
  status: 'PENDING' | 'APPROVED' | 'REJECTED',
  adminResponse?: string,
) {
  return authJson<ThreeDPrintRequest>(`/admin/3d-print-requests/${requestId}/status`, {
    method: 'PATCH',
    body: JSON.stringify({ status, adminResponse }),
  });
}
