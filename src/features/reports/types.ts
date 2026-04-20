export interface Report {
  id: string;
  vehicleId: string;
  reporterAccountId: string;
  reason: string;
  description: string | null;
  status: 'PENDING' | 'REVIEWED' | 'RESOLVED' | 'DISMISSED';
  reviewedByAdminId: string | null;
  createdAt: string;
  reviewedAt: string | null;
  vehicle?: { title: string; brand: string };
  reporterAccount?: { email: string };
}

export interface ReportListResponse {
  data: Report[];
  meta: { total: number; page: number; limit: number; totalPages: number };
}
