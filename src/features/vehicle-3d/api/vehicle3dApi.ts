import { authFormData, authJson } from "../../../lib/api";

export type Create3dJobResponse = { jobId: string };

export type ThreeDGenerationConfig = {
  mockMode: boolean;
  mode: "demo" | "real";
  requiresModelUpload: boolean;
  requiresFourImages: boolean;
  configured: boolean;
  message: string | null;
};

export type ThreeDJobStatusResponse = {
  id: string;
  status: string;
  errorMessage: string | null;
  modelId: string | null;
  modelUrl: string | null;
};

export type Personal3dModelSummary = {
  id: string;
  modelUrl: string;
  title: string | null;
  generatedAt: string;
  fileFormat: string | null;
};

export type ThreeDPrintRequest = {
  id: string;
  requesterAccountId: string;
  vehicle3DModelId: string | null;
  personalVehicle3DModelId: string | null;
  modelType: "VEHICLE_LISTING" | "PERSONAL";
  modelUrlSnapshot: string;
  title: string | null;
  message: string | null;
  adminResponse: string | null;
  status: "PENDING" | "APPROVED" | "REJECTED" | "CANCELLED";
  requestedAt: string;
  reviewedAt: string | null;
  requester?: {
    email: string;
    role: string;
    user?: { firstName: string; lastName: string; phoneNumber: string | null } | null;
    vendor?: { businessName: string; contactPersonName: string; phoneNumber: string | null } | null;
  };
  vehicleModel?: {
    id: string;
    vehicle?: { id: string; title: string; brand: string; model: string };
  } | null;
  personalModel?: { id: string; title: string | null } | null;
};

export type ThreeDPrintRequestListResponse = {
  data: ThreeDPrintRequest[];
  meta: { total: number; page: number; limit: number; totalPages: number };
};

export const vehicle3dApi = {
  getConfig: () => authJson<ThreeDGenerationConfig>("/3d-generation/config"),

  getPublicModelUrl: (vehicleId: string) =>
    authJson<{ modelId: string; modelUrl: string }>(`/vehicles/${vehicleId}/3d`),

  createVendorJobWithModel: (vehicleId: string, model: File) => {
    const fd = new FormData();
    fd.append("model", model);
    return authFormData<Create3dJobResponse>(
      `/vendors/me/vehicles/${vehicleId}/3d-jobs`,
      fd,
    );
  },

  createVendorJob: (
    vehicleId: string,
    files: { front: File; left: File; back: File; right: File },
  ) => {
    const fd = new FormData();
    fd.append("front", files.front);
    fd.append("left", files.left);
    fd.append("back", files.back);
    fd.append("right", files.right);
    return authFormData<Create3dJobResponse>(
      `/vendors/me/vehicles/${vehicleId}/3d-jobs`,
      fd,
    );
  },

  getVendorJob: (vehicleId: string, jobId: string) =>
    authJson<ThreeDJobStatusResponse>(
      `/vendors/me/vehicles/${vehicleId}/3d-jobs/${jobId}`,
    ),

  createPersonalJobWithModel: (model: File, title?: string) => {
    const fd = new FormData();
    fd.append("model", model);
    if (title?.trim()) fd.append("title", title.trim());
    return authFormData<Create3dJobResponse>("/users/me/personal-3d-jobs", fd);
  },

  createPersonalJob: (
    files: { front: File; left: File; back: File; right: File },
    title?: string,
  ) => {
    const fd = new FormData();
    fd.append("front", files.front);
    fd.append("left", files.left);
    fd.append("back", files.back);
    fd.append("right", files.right);
    if (title?.trim()) fd.append("title", title.trim());
    return authFormData<Create3dJobResponse>("/users/me/personal-3d-jobs", fd);
  },

  getPersonalJob: (jobId: string) =>
    authJson<ThreeDJobStatusResponse>(`/users/me/personal-3d-jobs/${jobId}`),

  listPersonalModels: () =>
    authJson<Personal3dModelSummary[]>("/users/me/personal-3d-models"),

  createPrintRequest: (body: {
    vehicle3DModelId?: string;
    personalVehicle3DModelId?: string;
    title?: string;
    message?: string;
  }) =>
    authJson<ThreeDPrintRequest>("/3d-print-requests", {
      method: "POST",
      body: JSON.stringify(body),
    }),

  listMyPrintRequests: (page = 1, limit = 10) =>
    authJson<ThreeDPrintRequestListResponse>(
      `/3d-print-requests/my?page=${page}&limit=${limit}`,
    ),
};
