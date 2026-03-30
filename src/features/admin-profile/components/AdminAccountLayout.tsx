import type { ReactNode } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { performLogout } from '../../../lib/logout';

type AdminAccountLayoutProps = {
  title: string;
  subtitle?: string;
  children: ReactNode;
};

export function AdminAccountLayout({
  title,
  subtitle,
  children,
}: AdminAccountLayoutProps) {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const onAdminHome = pathname.startsWith('/admin/dashboard');
  const onProfile = pathname.startsWith('/admin/profile');

  return (
    <div className="min-h-screen bg-mesh-bg flex flex-col">
      <header className="shrink-0 border-b border-mesh-border bg-mesh-surface/80 backdrop-blur-sm">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between gap-6">
          <div className="flex items-center gap-3 min-w-0">
            <span className="text-[0.65rem] uppercase tracking-[0.3em] text-mesh-gold font-medium shrink-0">
              CarMesh
            </span>
            <span className="h-4 w-px bg-mesh-border shrink-0" aria-hidden />
            <span className="text-sm text-mesh-muted truncate">{title}</span>
          </div>
          <nav className="flex items-center gap-3 sm:gap-4 text-sm flex-wrap justify-end">
            <Link
              to="/dashboard"
              className="text-mesh-muted hover:text-mesh-text transition-colors hidden sm:inline"
            >
              Home
            </Link>
            <Link
              to="/admin/dashboard"
              className={
                onAdminHome
                  ? 'text-mesh-gold font-medium border-b border-mesh-gold/80 pb-0.5'
                  : 'text-mesh-muted hover:text-mesh-text transition-colors'
              }
            >
              Admin
            </Link>
            <Link
              to="/admin/profile"
              className={
                onProfile
                  ? 'text-mesh-gold font-medium border-b border-mesh-gold/80 pb-0.5'
                  : 'text-mesh-muted hover:text-mesh-text transition-colors'
              }
            >
              Profile
            </Link>
            <button
              type="button"
              onClick={() => performLogout(navigate)}
              className="py-2 px-3 sm:px-4 rounded-[var(--radius-mesh-sm)] text-sm font-medium bg-mesh-gold text-[#111111] hover:bg-mesh-gold-hover transition-colors"
            >
              Sign out
            </button>
          </nav>
        </div>
      </header>

      <main className="flex-1 p-6 sm:p-10">
        <div className="max-w-2xl mx-auto w-full">
          {subtitle ? (
            <div className="mb-8">
              <p className="text-[0.65rem] uppercase tracking-[0.28em] text-mesh-gold mb-2">
                Admin account
              </p>
              <h1 className="text-2xl sm:text-3xl font-semibold text-mesh-text tracking-tight">
                {subtitle}
              </h1>
            </div>
          ) : null}
          {children}
        </div>
      </main>
    </div>
  );
}
