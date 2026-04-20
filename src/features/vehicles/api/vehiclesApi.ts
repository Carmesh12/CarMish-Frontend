import { authJson } from '../../../lib/api';
import type { Vehicle, VehicleImage, VehicleListResponse, VehicleQueryParams, ReviewListResponse } from '../types';

function buildQuery(params: VehicleQueryParams): string {
  const q = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== '' && value !== null) {
      q.set(key, String(value));
    }
  });
  const str = q.toString();
  return str ? `?${str}` : '';
}

export const vehiclesApi = {
  list: (params: VehicleQueryParams = {}) =>
    authJson<VehicleListResponse>(`/vehicles${buildQuery(params)}`),

  getById: (id: string) =>
    authJson<Vehicle>(`/vehicles/${id}`),

  getImages: (vehicleId: string) =>
    authJson<VehicleImage[]>(`/vehicles/${vehicleId}/images`),

  getReviews: (vehicleId: string, page = 1, limit = 10) =>
    authJson<ReviewListResponse>(`/vehicles/${vehicleId}/reviews?page=${page}&limit=${limit}`),

  createReview: (vehicleId: string, body: { rating: number; comment?: string }) =>
    authJson(`/vehicles/${vehicleId}/reviews`, {
      method: 'POST',
      body: JSON.stringify(body),
    }),

  create: (body: Record<string, unknown>) =>
    authJson<Vehicle>('/vehicles', {
      method: 'POST',
      body: JSON.stringify(body),
    }),

  update: (id: string, body: Record<string, unknown>) =>
    authJson<Vehicle>(`/vehicles/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(body),
    }),

  updateListingStatus: (id: string, listingStatus: string) =>
    authJson<Vehicle>(`/vehicles/${id}/listing-status`, {
      method: 'PATCH',
      body: JSON.stringify({ listingStatus }),
    }),

  updateAvailability: (id: string, availabilityStatus: string) =>
    authJson<Vehicle>(`/vehicles/${id}/availability`, {
      method: 'PATCH',
      body: JSON.stringify({ availabilityStatus }),
    }),

  archive: (id: string) =>
    authJson(`/vehicles/${id}`, { method: 'DELETE' }),

  getMyVehicles: () =>
    authJson<Vehicle[]>('/vehicles/my'),

  uploadImages: (vehicleId: string, files: File[]) => {
    const formData = new FormData();
    files.forEach((f) => formData.append('images', f));
    const token = localStorage.getItem('accessToken');
    const headers = new Headers();
    if (token) headers.set('Authorization', `Bearer ${token}`);
    return fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3000'}/vehicles/${vehicleId}/images`, {
      method: 'POST',
      headers,
      body: formData,
    }).then((r) => r.json()) as Promise<VehicleImage[]>;
  },

  reorderImages: (vehicleId: string, imageIds: string[]) =>
    authJson<VehicleImage[]>(`/vehicles/${vehicleId}/images/reorder`, {
      method: 'PATCH',
      body: JSON.stringify({ imageIds }),
    }),

  setPrimaryImage: (imageId: string) =>
    authJson(`/vehicle-images/${imageId}/set-primary`, { method: 'PATCH' }),

  deleteImage: (imageId: string) =>
    authJson(`/vehicle-images/${imageId}`, { method: 'DELETE' }),
};
