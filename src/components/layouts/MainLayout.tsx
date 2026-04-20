import { type ReactNode, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  Car,
  LogIn,
  UserPlus,
  Menu,
  X,
  User,
  LogOut,
  LayoutDashboard,
} from 'lucide-react';
import { LanguageSwitcher } from '../LanguageSwitcher';
import { useAuthStore, getAccountHomePath } from '../../stores/authStore';
import { performLogout } from '../../lib/logout';
import { Button } from '../ui/Button';

export function MainLayout({ children }: { children: ReactNode }) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { isAuthenticated, role } = useAuthStore();
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="min-h-screen flex flex-col bg-mesh-bg">
      <header className="sticky top-0 z-40 bg-white/[0.03] backdrop-blur-xl border-b border-white/[0.06]">
        <div className="max-w-7xl mx-auto flex items-center justify-between px-4 sm:px-6 h-16">
          <Link to="/vehicles" className="flex items-center gap-2 shrink-0 group">
            <Car size={28} className="text-mesh-gold group-hover:drop-shadow-[0_0_8px_rgba(212,168,83,0.4)] transition-all duration-300" />
            <span className="text-xl font-bold tracking-tight text-gradient-gold hidden sm:inline">CarMesh</span>
          </Link>

          <nav className="hidden md:flex items-center gap-6">
            <Link to="/vehicles" className="text-sm text-mesh-muted hover:text-mesh-text transition-colors duration-200">
              {t('nav.vehicles')}
            </Link>
          </nav>

          <div className="hidden md:flex items-center gap-3">
            <LanguageSwitcher compact />
            {isAuthenticated ? (
              <>
                <Link to={getAccountHomePath(role)}>
                  <Button variant="ghost" size="sm">
                    <LayoutDashboard size={16} />
                    {t('nav.dashboard')}
                  </Button>
                </Link>
                <Button variant="outline" size="sm" onClick={() => performLogout(navigate)}>
                  <LogOut size={16} />
                  {t('nav.logout')}
                </Button>
              </>
            ) : (
              <>
                <Link to="/login">
                  <Button variant="ghost" size="sm">
                    <LogIn size={16} />
                    {t('nav.login')}
                  </Button>
                </Link>
                <Link to="/signup">
                  <Button variant="primary" size="sm">
                    <UserPlus size={16} />
                    {t('nav.signup')}
                  </Button>
                </Link>
              </>
            )}
          </div>

          <button
            className="md:hidden text-mesh-muted hover:text-mesh-text cursor-pointer"
            onClick={() => setMobileOpen(!mobileOpen)}
          >
            {mobileOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>

        {mobileOpen && (
          <div className="md:hidden border-t border-white/[0.06] bg-white/[0.03] backdrop-blur-xl p-4 space-y-3">
            <Link to="/vehicles" className="block text-sm text-mesh-muted hover:text-mesh-text py-2" onClick={() => setMobileOpen(false)}>
              {t('nav.vehicles')}
            </Link>
            {isAuthenticated ? (
              <>
                <Link to={getAccountHomePath(role)} className="flex items-center gap-2 text-sm text-mesh-muted hover:text-mesh-text py-2" onClick={() => setMobileOpen(false)}>
                  <User size={16} />
                  {t('nav.dashboard')}
                </Link>
                <button className="flex items-center gap-2 text-sm text-mesh-muted hover:text-mesh-text py-2 cursor-pointer" onClick={() => { setMobileOpen(false); performLogout(navigate); }}>
                  <LogOut size={16} />
                  {t('nav.logout')}
                </button>
              </>
            ) : (
              <>
                <Link to="/login" className="flex items-center gap-2 text-sm text-mesh-muted hover:text-mesh-text py-2" onClick={() => setMobileOpen(false)}>
                  <LogIn size={16} />
                  {t('nav.login')}
                </Link>
                <Link to="/signup" className="flex items-center gap-2 text-sm text-mesh-gold py-2" onClick={() => setMobileOpen(false)}>
                  <UserPlus size={16} />
                  {t('nav.signup')}
                </Link>
              </>
            )}
            <div className="pt-2 border-t border-white/[0.06]">
              <LanguageSwitcher />
            </div>
          </div>
        )}
      </header>

      <main className="flex-1">{children}</main>

      <footer className="relative border-t border-white/[0.06] bg-white/[0.02]">
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-mesh-gold/20 to-transparent" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <Car size={20} className="text-mesh-gold" />
              <span className="font-bold text-gradient-gold">CarMesh</span>
            </div>
            <p className="text-sm text-mesh-muted">
              &copy; {new Date().getFullYear()} CarMesh. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
