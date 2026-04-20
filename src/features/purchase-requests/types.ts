export interface PurchaseRequest {
  id: string;
  vehicleId: string;
  userId: string;
  vendorId: string;
  offeredPrice: string | null;
  message: string | null;
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'CANCELLED' | 'COMPLETED';
  createdAt: string;
  updatedAt: string;
}
