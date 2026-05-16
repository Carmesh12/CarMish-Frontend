export interface Vehicle {
  id: string;
  vendorId: string;
  title: string;
  description: string | null;
  brand: string;
  model: string;
  year: number;
  color: string | null;
  fuelType: string | null;
  transmission: string | null;
  mileage: number | null;
  price: string | null;
  rentalPricePerDay: string | null;
  listingType: 'SALE' | 'RENT' | 'BOTH';
  listingStatus: 'DRAFT' | 'PUBLISHED' | 'HIDDEN' | 'ARCHIVED';
  availabilityStatus: 'AVAILABLE' | 'SOLD' | 'RENTED' | 'UNAVAILABLE';
  locationCity: string | null;
  createdAt: string;
  updatedAt: string;
  /** Present on vehicle detail responses when the backend includes 3D listing metadata */
  has3DModel?: boolean;
  threeDModelUrl?: string | null;
  images?: VehicleImage[];
  vendor?: { businessName: string; contactPersonName: string; logoUrl: string | null };
}

export interface VehicleImage {
  id: string;
  vehicleId: string;
  imageUrl: string;
  angleLabel: string | null;
  sortOrder: number;
  isPrimary: boolean;
  uploadedAt: string;
}

export interface VehicleListResponse {
  data: Vehicle[];
  meta: { total: number; page: number; limit: number; totalPages: number };
}

export interface VehicleQueryParams {
  search?: string;
  brand?: string;
  model?: string;
  locationCity?: string;
  yearFrom?: number;
  yearTo?: number;
  priceMin?: number;
  priceMax?: number;
  fuelType?: string;
  transmission?: string;
  listingType?: string;
  availabilityStatus?: string;
  sortBy?: 'price' | 'year' | 'createdAt';
  sortOrder?: 'asc' | 'desc';
  page?: number;
  limit?: number;
}

export interface Review {
  id: string;
  vehicleId: string;
  userId: string;
  rating: number;
  comment: string | null;
  createdAt: string;
  updatedAt: string;
  user?: { firstName: string; lastName: string; profileImageUrl: string | null };
}

export interface ReviewListResponse {
  data: Review[];
  meta: { total: number; page: number; limit: number; totalPages: number };
}
