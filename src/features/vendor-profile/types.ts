import type { Vehicle } from '../vehicles/types';

export type ProfileCompletion = {
  percentage: number;
  completedFields: string[];
  missingFields: string[];
};

export type VendorDashboardRange = 'week' | 'month' | 'year' | 'all';

export type VendorRequestStatusCounts = {
  total: number;
  pending: number;
  approved: number;
  rejected: number;
  cancelled: number;
  completed: number;
};

export type VendorTrendPoint = {
  label: string;
  purchase: number;
  rental: number;
  total: number;
};

export type VendorVehiclePerformance = {
  id: string;
  title: string;
  subtitle: string;
  requests: number;
  favorites: number;
  reviews?: number;
  estimatedRevenue?: number;
  score?: number;
};

export type VendorAiInsight = {
  type: 'success' | 'warning' | 'info';
  title: string;
  message: string;
  action?: string;
  source: 'ai' | 'fallback';
};

export type VendorDashboardAnalytics = {
  kpis: {
    estimatedRevenue: number;
    purchaseRevenue: number;
    rentalRevenue: number;
    activeListings: number;
    pendingRequests: number;
    approvalRate: number;
    rejectionRate: number;
    averageRating: number;
    favorites: number;
    reports: number;
  };
  inventory: {
    total: number;
    published: number;
    draft: number;
    hidden: number;
    archived: number;
    available: number;
    sold: number;
    rented: number;
    unavailable: number;
  };
  requests: {
    total: number;
    purchase: VendorRequestStatusCounts;
    rental: VendorRequestStatusCounts;
  };
  trends: VendorTrendPoint[];
  topVehicles: VendorVehiclePerformance[];
  underperformingVehicles: VendorVehiclePerformance[];
  insights: VendorAiInsight[];
};

export type VendorProfileResponse = {
  accountId: string;
  email: string;
  role: string;
  isActive: boolean;
  businessName: string;
  contactPersonName: string;
  phoneNumber: string | null;
  businessAddress: string | null;
  logoUrl: string | null;
  verificationStatus: string;
  accountCreatedAt: string;
  accountUpdatedAt: string;
  profileCreatedAt: string;
  profileUpdatedAt: string;
};

export type PublicVendorProfileResponse = {
  accountId: string;
  email: string;
  businessName: string;
  contactPersonName: string;
  phoneNumber: string | null;
  businessAddress: string | null;
  logoUrl: string | null;
  verificationStatus: string;
  memberSince: string;
  profileCreatedAt: string;
  vehicles: Vehicle[];
};

export type VendorDashboardResponse = {
  range: VendorDashboardRange;
  greeting: {
    businessName: string;
    contactPersonName: string;
    email: string;
    logoUrl: string | null;
  };
  accountSummary: {
    role: string;
    isActive: boolean;
    verificationStatus: string;
    memberSince: string;
  };
  profileCompletion: ProfileCompletion;
  analytics: VendorDashboardAnalytics;
  quickActions: { id: string; label: string; path: string }[];
};

export type VendorDashboardInsightsResponse = {
  range: VendorDashboardRange;
  insights: VendorAiInsight[];
};

export type VendorAnalyticsChatResponse = {
  answer: string;
  source: 'ai' | 'fallback';
  suggestions: string[];
};
