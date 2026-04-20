import { Routes, Route, Navigate } from 'react-router-dom';
import { ProtectedRoute } from './components/ProtectedRoute';
import { RoleProtectedRoute } from './components/RoleProtectedRoute';
import { MainLayout } from './components/layouts/MainLayout';
import { AuthLayout } from './components/layouts/AuthLayout';
import { DashboardLayout } from './components/layouts/DashboardLayout';

import { LoginPage } from './features/auth/routes/LoginPage';
import { SignupPage } from './features/auth/routes/SignupPage';
import { ForgotPasswordPage } from './features/auth/routes/ForgotPasswordPage';
import { ResetPasswordPage } from './features/auth/routes/ResetPasswordPage';
import { CatalogPage } from './features/vehicles/routes/CatalogPage';
import { VehicleDetailPage } from './features/vehicles/routes/VehicleDetailPage';
import { UserDashboardPage } from './features/user-account/routes/UserDashboardPage';
import { UserProfilePage } from './features/user-account/routes/UserProfilePage';
import { FavoritesPage } from './features/favorites/routes/FavoritesPage';
import { UserPurchasesPage } from './features/purchase-requests/routes/UserPurchasesPage';
import { UserRentalsPage } from './features/rental-requests/routes/UserRentalsPage';
import { VendorDashboardPage } from './features/vendor-profile/routes/VendorDashboardPage';
import { VendorProfilePage } from './features/vendor-profile/routes/VendorProfilePage';
import { VehicleManagementPage } from './features/vendor-profile/routes/VehicleManagementPage';
import { VehicleFormPage } from './features/vendor-profile/routes/VehicleFormPage';
import { VendorPurchasesPage } from './features/purchase-requests/routes/VendorPurchasesPage';
import { VendorRentalsPage } from './features/rental-requests/routes/VendorRentalsPage';
import { AdminDashboardPage } from './features/admin-profile/routes/AdminDashboardPage';
import { AdminProfilePage } from './features/admin-profile/routes/AdminProfilePage';
import { ReportsManagementPage } from './features/reports/routes/ReportsManagementPage';

function App() {
  return (
    <Routes>
      {/* Auth */}
      <Route path="/login" element={<AuthLayout><LoginPage /></AuthLayout>} />
      <Route path="/signup" element={<AuthLayout><SignupPage /></AuthLayout>} />
      <Route path="/forgot-password" element={<AuthLayout><ForgotPasswordPage /></AuthLayout>} />
      <Route path="/reset-password" element={<AuthLayout><ResetPasswordPage /></AuthLayout>} />

      {/* Public */}
      <Route path="/" element={<Navigate to="/vehicles" replace />} />
      <Route path="/vehicles" element={<MainLayout><CatalogPage /></MainLayout>} />
      <Route path="/vehicles/:id" element={<MainLayout><VehicleDetailPage /></MainLayout>} />

      {/* User */}
      <Route path="/user/dashboard" element={<ProtectedRoute><RoleProtectedRoute role="USER"><DashboardLayout><UserDashboardPage /></DashboardLayout></RoleProtectedRoute></ProtectedRoute>} />
      <Route path="/user/profile" element={<ProtectedRoute><RoleProtectedRoute role="USER"><DashboardLayout><UserProfilePage /></DashboardLayout></RoleProtectedRoute></ProtectedRoute>} />
      <Route path="/user/favorites" element={<ProtectedRoute><RoleProtectedRoute role="USER"><DashboardLayout><FavoritesPage /></DashboardLayout></RoleProtectedRoute></ProtectedRoute>} />
      <Route path="/user/purchases" element={<ProtectedRoute><RoleProtectedRoute role="USER"><DashboardLayout><UserPurchasesPage /></DashboardLayout></RoleProtectedRoute></ProtectedRoute>} />
      <Route path="/user/rentals" element={<ProtectedRoute><RoleProtectedRoute role="USER"><DashboardLayout><UserRentalsPage /></DashboardLayout></RoleProtectedRoute></ProtectedRoute>} />

      {/* Vendor */}
      <Route path="/vendor/dashboard" element={<ProtectedRoute><RoleProtectedRoute role="VENDOR"><DashboardLayout><VendorDashboardPage /></DashboardLayout></RoleProtectedRoute></ProtectedRoute>} />
      <Route path="/vendor/profile" element={<ProtectedRoute><RoleProtectedRoute role="VENDOR"><DashboardLayout><VendorProfilePage /></DashboardLayout></RoleProtectedRoute></ProtectedRoute>} />
      <Route path="/vendor/vehicles" element={<ProtectedRoute><RoleProtectedRoute role="VENDOR"><DashboardLayout><VehicleManagementPage /></DashboardLayout></RoleProtectedRoute></ProtectedRoute>} />
      <Route path="/vendor/vehicles/new" element={<ProtectedRoute><RoleProtectedRoute role="VENDOR"><DashboardLayout><VehicleFormPage /></DashboardLayout></RoleProtectedRoute></ProtectedRoute>} />
      <Route path="/vendor/vehicles/:id/edit" element={<ProtectedRoute><RoleProtectedRoute role="VENDOR"><DashboardLayout><VehicleFormPage /></DashboardLayout></RoleProtectedRoute></ProtectedRoute>} />
      <Route path="/vendor/purchases" element={<ProtectedRoute><RoleProtectedRoute role="VENDOR"><DashboardLayout><VendorPurchasesPage /></DashboardLayout></RoleProtectedRoute></ProtectedRoute>} />
      <Route path="/vendor/rentals" element={<ProtectedRoute><RoleProtectedRoute role="VENDOR"><DashboardLayout><VendorRentalsPage /></DashboardLayout></RoleProtectedRoute></ProtectedRoute>} />

      {/* Admin */}
      <Route path="/admin/dashboard" element={<ProtectedRoute><RoleProtectedRoute role="ADMIN"><DashboardLayout><AdminDashboardPage /></DashboardLayout></RoleProtectedRoute></ProtectedRoute>} />
      <Route path="/admin/profile" element={<ProtectedRoute><RoleProtectedRoute role="ADMIN"><DashboardLayout><AdminProfilePage /></DashboardLayout></RoleProtectedRoute></ProtectedRoute>} />
      <Route path="/admin/reports" element={<ProtectedRoute><RoleProtectedRoute role="ADMIN"><DashboardLayout><ReportsManagementPage /></DashboardLayout></RoleProtectedRoute></ProtectedRoute>} />

      {/* Catch-all */}
      <Route path="*" element={<Navigate to="/vehicles" replace />} />
    </Routes>
  );
}

export default App;
