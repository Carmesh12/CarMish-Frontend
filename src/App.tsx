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
import { VerifyEmailPage } from './features/auth/routes/VerifyEmailPage';
import { CatalogPage } from './features/vehicles/routes/CatalogPage';
import { VehicleDetailPage } from './features/vehicles/routes/VehicleDetailPage';
import { UserDashboardPage } from './features/user-account/routes/UserDashboardPage';
import { UserProfilePage } from './features/user-account/routes/UserProfilePage';
import { PublicUserPage } from './features/user-account/routes/PublicUserPage';
import { FavoritesPage } from './features/favorites/routes/FavoritesPage';
import { UserPurchasesPage } from './features/purchase-requests/routes/UserPurchasesPage';
import { UserRentalsPage } from './features/rental-requests/routes/UserRentalsPage';
import { ChatbotPage } from './features/chat/routes/ChatbotPage';
import { PublicVendorPage } from './features/vendor-profile/routes/PublicVendorPage';
import { VendorDashboardPage } from './features/vendor-profile/routes/VendorDashboardPage';
import { VendorProfilePage } from './features/vendor-profile/routes/VendorProfilePage';
import { VehicleManagementPage } from './features/vendor-profile/routes/VehicleManagementPage';
import { VehicleFormPage } from './features/vendor-profile/routes/VehicleFormPage';
import { VendorPurchasesPage } from './features/purchase-requests/routes/VendorPurchasesPage';
import { VendorRentalsPage } from './features/rental-requests/routes/VendorRentalsPage';
import { AdminDashboardPage } from './features/admin/routes/AdminDashboardPage';
import { AdminProfilePage } from './features/admin-profile/routes/AdminProfilePage';
import { ReportsManagementPage } from './features/admin/routes/ReportsManagementPage';
import { VendorRequestsPage } from './features/admin/routes/VendorRequestsPage';
import { AccountsManagementPage } from './features/admin/routes/AccountsManagementPage';
import { PrintRequestsPage } from './features/admin/routes/PrintRequestsPage';
import { LocalModelPreviewPage } from './features/3dgeneration';
import { VehiclePublic3dPage } from './features/vehicle-3d/routes/VehiclePublic3dPage';
import { VendorVehicleGenerate3dPage } from './features/vehicle-3d/routes/VendorVehicleGenerate3dPage';
import { UserPersonal3dPage } from './features/vehicle-3d/routes/UserPersonal3dPage';
import { VendorMessagesPage } from './features/messaging/routes/VendorMessagesPage';
import { AdminMessagesPage } from './features/messaging/routes/AdminMessagesPage';
import { UserMessagesPage } from './features/messaging/routes/UserMessagesPage';

function App() {
  return (
    <Routes>
      {/* Auth */}
      <Route path="/login" element={<AuthLayout hideHeader><LoginPage /></AuthLayout>} />
      <Route path="/signup" element={<AuthLayout hideHeader><SignupPage /></AuthLayout>} />
      <Route path="/forgot-password" element={<AuthLayout><ForgotPasswordPage /></AuthLayout>} />
      <Route path="/reset-password" element={<AuthLayout><ResetPasswordPage /></AuthLayout>} />
      <Route path="/verify-email" element={<AuthLayout><VerifyEmailPage /></AuthLayout>} />

      {/* Public */}
      <Route path="/" element={<Navigate to="/vehicles" replace />} />
      <Route path="/vehicles" element={<MainLayout><CatalogPage /></MainLayout>} />
      <Route path="/vehicles/:id" element={<MainLayout><VehicleDetailPage /></MainLayout>} />
      <Route path="/vehicles/:id/3d" element={<MainLayout><VehiclePublic3dPage /></MainLayout>} />
      <Route path="/vendors/:accountId" element={<MainLayout><PublicVendorPage /></MainLayout>} />
      <Route path="/users/:accountId" element={<MainLayout><PublicUserPage /></MainLayout>} />
      <Route path="/local-3d" element={<MainLayout><LocalModelPreviewPage /></MainLayout>} />

      {/* User */}
      <Route path="/user/dashboard" element={<ProtectedRoute><RoleProtectedRoute role="USER"><DashboardLayout><UserDashboardPage /></DashboardLayout></RoleProtectedRoute></ProtectedRoute>} />
      <Route path="/user/profile" element={<ProtectedRoute><RoleProtectedRoute role="USER"><DashboardLayout><UserProfilePage /></DashboardLayout></RoleProtectedRoute></ProtectedRoute>} />
      <Route path="/user/favorites" element={<ProtectedRoute><RoleProtectedRoute role="USER"><DashboardLayout><FavoritesPage /></DashboardLayout></RoleProtectedRoute></ProtectedRoute>} />
      <Route path="/user/purchases" element={<ProtectedRoute><RoleProtectedRoute role="USER"><DashboardLayout><UserPurchasesPage /></DashboardLayout></RoleProtectedRoute></ProtectedRoute>} />
      <Route path="/user/rentals" element={<ProtectedRoute><RoleProtectedRoute role="USER"><DashboardLayout><UserRentalsPage /></DashboardLayout></RoleProtectedRoute></ProtectedRoute>} />
      <Route path="/user/personal-3d" element={<ProtectedRoute><RoleProtectedRoute role="USER"><DashboardLayout><UserPersonal3dPage /></DashboardLayout></RoleProtectedRoute></ProtectedRoute>} />
      <Route path="/user/chat" element={<ProtectedRoute><RoleProtectedRoute role="USER"><DashboardLayout><ChatbotPage /></DashboardLayout></RoleProtectedRoute></ProtectedRoute>} />
      <Route path="/user/messages" element={<ProtectedRoute><RoleProtectedRoute role="USER"><DashboardLayout><UserMessagesPage /></DashboardLayout></RoleProtectedRoute></ProtectedRoute>} />

      {/* Vendor */}
      <Route path="/vendor/dashboard" element={<ProtectedRoute><RoleProtectedRoute role="VENDOR"><DashboardLayout><VendorDashboardPage /></DashboardLayout></RoleProtectedRoute></ProtectedRoute>} />
      <Route path="/vendor/profile" element={<ProtectedRoute><RoleProtectedRoute role="VENDOR"><DashboardLayout><VendorProfilePage /></DashboardLayout></RoleProtectedRoute></ProtectedRoute>} />
      <Route path="/vendor/vehicles" element={<ProtectedRoute><RoleProtectedRoute role="VENDOR"><DashboardLayout><VehicleManagementPage /></DashboardLayout></RoleProtectedRoute></ProtectedRoute>} />
      <Route path="/vendor/vehicles/new" element={<ProtectedRoute><RoleProtectedRoute role="VENDOR"><DashboardLayout><VehicleFormPage /></DashboardLayout></RoleProtectedRoute></ProtectedRoute>} />
      <Route path="/vendor/vehicles/:id/edit" element={<ProtectedRoute><RoleProtectedRoute role="VENDOR"><DashboardLayout><VehicleFormPage /></DashboardLayout></RoleProtectedRoute></ProtectedRoute>} />
      <Route path="/vendor/vehicles/:id/generate-3d" element={<ProtectedRoute><RoleProtectedRoute role="VENDOR"><DashboardLayout><VendorVehicleGenerate3dPage /></DashboardLayout></RoleProtectedRoute></ProtectedRoute>} />
      <Route path="/vendor/purchases" element={<ProtectedRoute><RoleProtectedRoute role="VENDOR"><DashboardLayout><VendorPurchasesPage /></DashboardLayout></RoleProtectedRoute></ProtectedRoute>} />
      <Route path="/vendor/rentals" element={<ProtectedRoute><RoleProtectedRoute role="VENDOR"><DashboardLayout><VendorRentalsPage /></DashboardLayout></RoleProtectedRoute></ProtectedRoute>} />
      <Route path="/vendor/messages" element={<ProtectedRoute><RoleProtectedRoute role="VENDOR"><DashboardLayout><VendorMessagesPage /></DashboardLayout></RoleProtectedRoute></ProtectedRoute>} />

      {/* Admin */}
      <Route path="/admin/dashboard" element={<ProtectedRoute><RoleProtectedRoute role="ADMIN"><DashboardLayout><AdminDashboardPage /></DashboardLayout></RoleProtectedRoute></ProtectedRoute>} />
      <Route path="/admin/profile" element={<ProtectedRoute><RoleProtectedRoute role="ADMIN"><DashboardLayout><AdminProfilePage /></DashboardLayout></RoleProtectedRoute></ProtectedRoute>} />
      <Route path="/admin/vendors" element={<ProtectedRoute><RoleProtectedRoute role="ADMIN"><DashboardLayout><VendorRequestsPage /></DashboardLayout></RoleProtectedRoute></ProtectedRoute>} />
      <Route path="/admin/reports" element={<ProtectedRoute><RoleProtectedRoute role="ADMIN"><DashboardLayout><ReportsManagementPage /></DashboardLayout></RoleProtectedRoute></ProtectedRoute>} />
      <Route path="/admin/accounts" element={<ProtectedRoute><RoleProtectedRoute role="ADMIN"><DashboardLayout><AccountsManagementPage /></DashboardLayout></RoleProtectedRoute></ProtectedRoute>} />
      <Route path="/admin/print-requests" element={<ProtectedRoute><RoleProtectedRoute role="ADMIN"><DashboardLayout><PrintRequestsPage /></DashboardLayout></RoleProtectedRoute></ProtectedRoute>} />
      <Route path="/admin/messages" element={<ProtectedRoute><RoleProtectedRoute role="ADMIN"><DashboardLayout><AdminMessagesPage /></DashboardLayout></RoleProtectedRoute></ProtectedRoute>} />

      {/* Catch-all */}
      <Route path="*" element={<Navigate to="/vehicles" replace />} />
    </Routes>
  );
}

export default App;
