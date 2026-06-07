export interface Vehicle {
  id: string;
  vendorId: string;
  title: string;
  description: string | null;
  brand: string;
  model: string;
  trim: string | null;
  year: number;
  condition: 'NEW' | 'USED';
  color: string | null;
  fuelType: string | null;
  engineType: string;
  engineCapacity: string;
  horsepower: number;
  transmission: string | null;
  drivetrain: 'FWD' | 'RWD' | 'AWD' | 'FOUR_WD';
  cylinders: number | null;
  acceleration: string | null;
  topSpeed: number | null;
  fuelConsumption: string | null;
  fuelTankCapacity: number | null;
  bodyType: 'SUV' | 'SEDAN' | 'HATCHBACK' | 'COUPE' | 'TRUCK' | 'VAN' | 'WAGON' | 'CONVERTIBLE';
  doors: number;
  wheelsSize: string | null;
  seats: number;
  interiorMaterial: 'LEATHER' | 'FABRIC' | 'MIXED';
  hasSunroof: boolean;
  hasNavigation: boolean;
  hasBluetooth: boolean;
  hasCamera: boolean;
  mileage: number | null;
  price: string | null;
  currency: 'USD' | 'JOD';
  negotiable: boolean;
  rentalPricePerDay: string | null;
  listingType: 'SALE' | 'RENT' | 'BOTH';
  listingStatus: 'DRAFT' | 'PUBLISHED' | 'HIDDEN' | 'ARCHIVED';
  availabilityStatus: 'AVAILABLE' | 'SOLD' | 'RESERVED' | 'RENTED' | 'UNAVAILABLE';
  mainImageUrl: string | null;
  vinNumber: string | null;
  locationCity: string | null;
  locationCountry: string;
  createdAt: string;
  updatedAt: string;
  /** Present on vehicle detail responses when the backend includes 3D listing metadata */
  has3DModel?: boolean;
  threeDModelUrl?: string | null;
  images?: VehicleImage[];
  vendor?: { accountId: string; businessName: string; contactPersonName: string; logoUrl: string | null };
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
  engineType?: string;
  transmission?: string;
  condition?: string;
  drivetrain?: string;
  bodyType?: string;
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
