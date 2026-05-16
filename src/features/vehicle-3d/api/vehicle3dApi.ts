import { authFormData, authJson } from '../../../lib/api';

export function isThreeDMockMode(): boolean {
  return import.meta.env.VITE_THREE_D_MOCK_MODE === 'true';
}

export type Create3dJobResponse = { jobId: string };

export type ThreeDGenerationConfig = { mockMode: boolean };

export type ThreeDJobStatusResponse = {
  id: string;
  status: string;
  errorMessage: string | null;
  modelUrl: string | null;
};

export type Personal3dModelSummary = {
  id: string;
  modelUrl: string;
  title: string | null;
  generatedAt: string;
  fileFormat: string | null;
};

export const vehicle3dApi = {
  getConfig: () => authJson<ThreeDGenerationConfig>('/3d-generation/config'),

  getPublicModelUrl: (vehicleId: string) =>
    authJson<{ modelUrl: string }>(`/vehicles/${vehicleId}/3d`),

  createVendorJobWithModel: (vehicleId: string, model: File) => {
    const fd = new FormData();
    fd.append('model', model);
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
    fd.append('front', files.front);
    fd.append('left', files.left);
    fd.append('back', files.back);
    fd.append('right', files.right);
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
    fd.append('model', model);
    if (title?.trim()) fd.append('title', title.trim());
    return authFormData<Create3dJobResponse>('/users/me/personal-3d-jobs', fd);
  },

  createPersonalJob: (
    files: { front: File; left: File; back: File; right: File },
    title?: string,
  ) => {
    const fd = new FormData();
    fd.append('front', files.front);
    fd.append('left', files.left);
    fd.append('back', files.back);
    fd.append('right', files.right);
    if (title?.trim()) fd.append('title', title.trim());
    return authFormData<Create3dJobResponse>('/users/me/personal-3d-jobs', fd);
  },

  getPersonalJob: (jobId: string) =>
    authJson<ThreeDJobStatusResponse>(`/users/me/personal-3d-jobs/${jobId}`),

  listPersonalModels: () =>
    authJson<Personal3dModelSummary[]>('/users/me/personal-3d-models'),
};
