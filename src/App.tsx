import { Routes, Route, Navigate } from 'react-router-dom';
import { LoginRoute } from './features/auth/routes/LoginRoute';
import { SignupRoute } from './features/auth/routes/SignupRoute';
import { ForgotPasswordRoute } from './features/auth/routes/ForgotPasswordRoute';
import { ResetPasswordRoute } from './features/auth/routes/ResetPasswordRoute';
import { DashboardRoute } from './features/dashboard/routes/DashboardRoute';
import { AccountDashboardRoute } from './features/user-account/routes/AccountDashboardRoute';
import { AccountProfileRoute } from './features/user-account/routes/AccountProfileRoute';
import { VendorDashboardRoute } from './features/vendor-profile/routes/VendorDashboardRoute';
import { VendorProfileRoute } from './features/vendor-profile/routes/VendorProfileRoute';
import { AdminDashboardRoute } from './features/admin-profile/routes/AdminDashboardRoute';
import { AdminProfileRoute } from './features/admin-profile/routes/AdminProfileRoute';
import { ProtectedRoute } from './components/ProtectedRoute';
import { RoleProtectedRoute } from './components/RoleProtectedRoute';

function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginRoute />} />
      <Route path="/signup" element={<SignupRoute />} />
      <Route path="/forgot-password" element={<ForgotPasswordRoute />} />
      <Route path="/reset-password" element={<ResetPasswordRoute />} />
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <DashboardRoute />
          </ProtectedRoute>
        }
      />
      <Route
        path="/account"
        element={
          <ProtectedRoute>
            <AccountDashboardRoute />
          </ProtectedRoute>
        }
      />
      <Route
        path="/account/profile"
        element={
          <ProtectedRoute>
            <AccountProfileRoute />
          </ProtectedRoute>
        }
      />
      <Route
        path="/vendor/dashboard"
        element={
          <RoleProtectedRoute role="VENDOR">
            <VendorDashboardRoute />
          </RoleProtectedRoute>
        }
      />
      <Route
        path="/vendor/profile"
        element={
          <RoleProtectedRoute role="VENDOR">
            <VendorProfileRoute />
          </RoleProtectedRoute>
        }
      />
      <Route
        path="/admin/dashboard"
        element={
          <RoleProtectedRoute role="ADMIN">
            <AdminDashboardRoute />
          </RoleProtectedRoute>
        }
      />
      <Route
        path="/admin/profile"
        element={
          <RoleProtectedRoute role="ADMIN">
            <AdminProfileRoute />
          </RoleProtectedRoute>
        }
      />
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  )
}

export default App
