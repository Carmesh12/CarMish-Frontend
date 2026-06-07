export type UserProfileResponse = {
  accountId: string;
  email: string;
  role: string;
  isActive: boolean;
  firstName: string;
  lastName: string;
  phoneNumber: string | null;
  city: string | null;
  address: string | null;
  profileImageUrl: string | null;
  accountCreatedAt: string;
  accountUpdatedAt: string;
  profileCreatedAt: string;
  profileUpdatedAt: string;
};

export type PublicUserProfileResponse = {
  accountId: string;
  firstName: string;
  lastName: string;
  city: string | null;
  profileImageUrl: string | null;
  memberSince: string;
  profileCreatedAt: string;
};

export type ProfileCompletion = {
  percentage: number;
  completedFields: string[];
  missingFields: string[];
};

export type UserDashboardResponse = {
  greeting: {
    fullName: string;
    email: string;
    profileImageUrl: string | null;
  };
  accountSummary: {
    role: string;
    isActive: boolean;
    memberSince: string;
  };
  profileCompletion: ProfileCompletion;
  quickActions: { id: string; label: string; path: string }[];
};
