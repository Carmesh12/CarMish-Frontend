export type ProfileCompletion = {
  percentage: number;
  completedFields: string[];
  missingFields: string[];
};

export type AdminProfileResponse = {
  accountId: string;
  email: string;
  role: string;
  isActive: boolean;
  firstName: string;
  lastName: string;
  accountCreatedAt: string;
  accountUpdatedAt: string;
  profileCreatedAt: string;
  profileUpdatedAt: string;
};

export type AdminDashboardResponse = {
  greeting: {
    fullName: string;
    email: string;
  };
  accountSummary: {
    role: string;
    isActive: boolean;
    memberSince: string;
  };
  profileCompletion: ProfileCompletion;
  quickActions: { id: string; label: string; path: string }[];
};
