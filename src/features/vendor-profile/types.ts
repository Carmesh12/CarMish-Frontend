export type ProfileCompletion = {
  percentage: number;
  completedFields: string[];
  missingFields: string[];
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

export type VendorDashboardResponse = {
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
  quickActions: { id: string; label: string; path: string }[];
};
