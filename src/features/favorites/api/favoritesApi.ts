import { authJson } from '../../../lib/api';
import type { Vehicle } from '../../vehicles/types';

interface FavoriteWithVehicle {
  id: string;
  userId: string;
  vehicleId: string;
  createdAt: string;
  vehicle: Vehicle & { images: { id: string; imageUrl: string; isPrimary: boolean }[] };
}

export const favoritesApi = {
  getMyFavorites: () => authJson<FavoriteWithVehicle[]>('/favorites/my'),
  check: (vehicleId: string) => authJson<{ isFavorited: boolean }>(`/favorites/${vehicleId}/check`),
  toggle: (vehicleId: string) => authJson<{ isFavorited: boolean }>(`/favorites/${vehicleId}/toggle`, { method: 'POST' }),
  add: (vehicleId: string) => authJson(`/favorites/${vehicleId}`, { method: 'POST' }),
  remove: (vehicleId: string) => authJson(`/favorites/${vehicleId}`, { method: 'DELETE' }),
};
