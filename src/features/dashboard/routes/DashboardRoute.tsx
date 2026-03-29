import { Link, useNavigate } from 'react-router-dom';
import { notifyInfo } from '../../../lib/toast';
import { performLogout } from '../../../lib/logout';

export const DashboardRoute = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-mesh-bg flex flex-col">
      <header className="shrink-0 border-b border-mesh-border bg-mesh-surface/80 backdrop-blur-sm">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between gap-6">
          <div className="flex items-center gap-3 min-w-0">
            <span className="text-[0.65rem] uppercase tracking-[0.3em] text-mesh-gold font-medium shrink-0">
              CarMesh
            </span>
            <span className="h-4 w-px bg-mesh-border shrink-0" aria-hidden />
            <span className="text-sm text-mesh-muted truncate">Dashboard</span>
          </div>
          <nav className="flex items-center gap-4 text-sm">
            <button
              type="button"
              onClick={() => notifyInfo('Navigation and catalog will appear here in upcoming releases.')}
              className="text-mesh-muted hover:text-mesh-text transition-colors hidden sm:inline"
            >
              Browse
            </button>
            <Link
              to="/dashboard"
              className="text-mesh-gold font-medium border-b border-mesh-gold/80 pb-0.5"
            >
              Home
            </Link>
            <Link
              to="/account"
              className="text-mesh-muted hover:text-mesh-text transition-colors"
            >
              My account
            </Link>
            <button
              type="button"
              onClick={() => performLogout(navigate)}
              className="py-2 px-4 rounded-[var(--radius-mesh-sm)] text-sm font-medium bg-mesh-gold text-[#111111] hover:bg-mesh-gold-hover transition-colors"
            >
              Sign out
            </button>
          </nav>
        </div>
      </header>

      <main className="flex-1 flex flex-col items-center justify-center p-6 sm:p-10">
        <div className="w-full max-w-lg rounded-[var(--radius-mesh)] border border-mesh-border bg-mesh-card p-10 sm:p-12 text-center shadow-[var(--shadow-mesh-card)]">
          <p className="text-[0.65rem] uppercase tracking-[0.28em] text-mesh-gold mb-4">Overview</p>
          <h1 className="text-2xl sm:text-3xl font-semibold text-mesh-text tracking-tight">
            Welcome to your garage
          </h1>
          <p className="mt-4 text-mesh-muted text-sm leading-relaxed">
            You are signed in. Orders, listings, and account tools will live here as the product grows.
          </p>
          <div className="mt-10 h-px w-12 bg-mesh-border mx-auto" aria-hidden />
          <p className="mt-6 text-xs text-mesh-muted">
            Need another account?{' '}
            <Link to="/signup" className="text-mesh-gold hover:text-mesh-gold-hover font-medium">
              Register
            </Link>
          </p>
        </div>
      </main>
    </div>
  );
};
