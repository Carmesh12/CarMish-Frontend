import { Routes, Route, Navigate } from 'react-router-dom';
import { LoginRoute } from './features/auth/routes/LoginRoute';
import { SignupRoute } from './features/auth/routes/SignupRoute';
import { ForgotPasswordRoute } from './features/auth/routes/ForgotPasswordRoute';
import { ResetPasswordRoute } from './features/auth/routes/ResetPasswordRoute';
import { DashboardRoute } from './features/dashboard/routes/DashboardRoute';
import { ProtectedRoute } from './components/ProtectedRoute';

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
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  )
}

export default App
