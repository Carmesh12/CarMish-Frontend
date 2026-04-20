export interface RentalRequest {
  id: string;
  vehicleId: string;
  userId: string;
  vendorId: string;
  startDate: string;
  endDate: string;
  totalPrice: string | null;
  message: string | null;
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'CANCELLED' | 'COMPLETED';
  createdAt: string;
  updatedAt: string;
}
