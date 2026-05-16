import { type ReactNode, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  Car,
  LayoutDashboard,
  User,
  Heart,
  MessageSquareText,
  ShoppingCart,
  CalendarClock,
  Truck,
  PlusCircle,
  Flag,
  Bell,
  LogOut,
  Menu,
  X,
  ChevronLeft,
  ChevronRight,
  Boxes,
} from 'lucide-react';
import { LanguageSwitcher } from '../LanguageSwitcher';
import { useAuthStore } from '../../stores/authStore';
import { useNotificationStore } from '../../stores/notificationStore';
import { performLogout } from '../../lib/logout';

interface NavItem {
  label: string;
  path: string;
  icon: ReactNode;
}

function useNavItems(): NavItem[] {
  const { t } = useTranslation();
  const role = useAuthStore((s) => s.role);

  if (role === 'VENDOR') {
    return [
      { label: t('nav.dashboard'), path: '/vendor/dashboard', icon: <LayoutDashboard size={18} /> },
      { label: t('nav.profile'), path: '/vendor/profile', icon: <User size={18} /> },
      { label: t('nav.myVehicles'), path: '/vendor/vehicles', icon: <Truck size={18} /> },
      { label: t('vendor.addVehicle'), path: '/vendor/vehicles/new', icon: <PlusCircle size={18} /> },
      { label: t('nav.purchases'), path: '/vendor/purchases', icon: <ShoppingCart size={18} /> },
      { label: t('nav.rentals'), path: '/vendor/rentals', icon: <CalendarClock size={18} /> },
    ];
  }

  if (role === 'ADMIN') {
    return [
      { label: t('nav.dashboard'), path: '/admin/dashboard', icon: <LayoutDashboard size={18} /> },
      { label: t('nav.profile'), path: '/admin/profile', icon: <User size={18} /> },
      { label: t('nav.reports'), path: '/admin/reports', icon: <Flag size={18} /> },
    ];
  }

  return [
    { label: t('nav.dashboard'), path: '/user/dashboard', icon: <LayoutDashboard size={18} /> },
    { label: t('nav.profile'), path: '/user/profile', icon: <User size={18} /> },
    { label: t('nav.favorites'), path: '/user/favorites', icon: <Heart size={18} /> },
    { label: t('nav.my3d'), path: '/user/personal-3d', icon: <Boxes size={18} /> },
    { label: 'Chatbot', path: '/user/chat', icon: <MessageSquareText size={18} /> },
    { label: t('nav.purchases'), path: '/user/purchases', icon: <ShoppingCart size={18} /> },
    { label: t('nav.rentals'), path: '/user/rentals', icon: <CalendarClock size={18} /> },
  ];
}

export function DashboardLayout({ children }: { children: ReactNode }) {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const isRtl = i18n.language === 'ar';
  const navItems = useNavItems();
  const unreadCount = useNotificationStore((s) => s.unreadCount);
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  const CollapseIcon = isRtl
    ? (collapsed ? ChevronLeft : ChevronRight)
    : (collapsed ? ChevronRight : ChevronLeft);

  return (
    <div className="min-h-screen flex bg-mesh-bg">
      {/* Desktop Sidebar */}
      <aside
        className={`hidden lg:flex flex-col border-e border-white/[0.06] bg-white/[0.02] backdrop-blur-xl transition-all duration-300 ${
          collapsed ? 'w-[68px]' : 'w-60'
        }`}
      >
        <div className="relative flex items-center gap-2 px-4 h-16 border-b border-white/[0.06] shrink-0">
          <Link to="/vehicles" className="flex items-center gap-2 group">
            <Car size={24} className="text-mesh-gold group-hover:drop-shadow-[0_0_8px_rgba(212,168,83,0.4)] transition-all duration-300" />
            {!collapsed && <span className="text-lg font-bold tracking-tight text-gradient-gold">CarMesh</span>}
          </Link>
        </div>

        <nav className="flex-1 py-4 space-y-1 overflow-y-auto px-2">
          {navItems.map((item) => {
            const active = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                title={collapsed ? item.label : undefined}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-[var(--radius-mesh-sm)] transition-all duration-200 text-sm ${
                  active
                    ? 'bg-mesh-gold/[0.08] text-mesh-gold font-medium shadow-[inset_2px_0_0_var(--color-mesh-gold)] rtl:shadow-[inset_-2px_0_0_var(--color-mesh-gold)]'
                    : 'text-mesh-muted hover:text-mesh-text hover:bg-white/[0.04]'
                }`}
              >
                {item.icon}
                {!collapsed && <span>{item.label}</span>}
              </Link>
            );
          })}
        </nav>

        <div className="p-2 border-t border-white/[0.06] space-y-1">
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-[var(--radius-mesh-sm)] text-mesh-muted hover:text-mesh-text hover:bg-white/[0.04] transition-all duration-200 text-sm cursor-pointer"
          >
            <CollapseIcon size={18} />
            {!collapsed && <span>{collapsed ? '' : t('common.close')}</span>}
          </button>
          <button
            onClick={() => performLogout(navigate)}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-[var(--radius-mesh-sm)] text-mesh-muted hover:text-red-400 hover:bg-red-500/[0.08] transition-all duration-200 text-sm cursor-pointer"
          >
            <LogOut size={18} />
            {!collapsed && <span>{t('nav.logout')}</span>}
          </button>
        </div>
      </aside>

      {/* Main content area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top bar */}
        <header className="sticky top-0 z-30 flex items-center justify-between h-16 px-4 sm:px-6 border-b border-white/[0.06] bg-white/[0.02] backdrop-blur-xl">
          <button
            className="lg:hidden text-mesh-muted hover:text-mesh-text cursor-pointer"
            onClick={() => setMobileOpen(true)}
          >
            <Menu size={24} />
          </button>

          <div className="flex-1" />

          <div className="flex items-center gap-3">
            <LanguageSwitcher compact />
            <Link
              to="/vehicles"
              className="text-sm text-mesh-muted hover:text-mesh-text transition-colors duration-200"
            >
              {t('nav.vehicles')}
            </Link>
            <button
              onClick={() => {
                const role = useAuthStore.getState().role;
                if (role === 'USER') navigate('/user/dashboard');
                else if (role === 'VENDOR') navigate('/vendor/dashboard');
                else if (role === 'ADMIN') navigate('/admin/dashboard');
              }}
              className="relative text-mesh-muted hover:text-mesh-text transition-colors duration-200 cursor-pointer"
            >
              <Bell size={20} />
              {unreadCount > 0 && (
                <span className="absolute -top-1.5 -end-1.5 w-4 h-4 bg-gradient-to-r from-mesh-gold to-mesh-gold-hover text-mesh-bg text-[10px] font-bold rounded-full flex items-center justify-center shadow-[0_0_8px_rgba(212,168,83,0.3)]">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </button>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto mesh-gradient-bg">
          <div className="relative z-10 max-w-6xl mx-auto">{children}</div>
        </main>
      </div>

      {/* Mobile sidebar overlay */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden animate-[fadeIn_200ms_ease-out]">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setMobileOpen(false)} />
          <aside className="absolute inset-y-0 start-0 w-64 bg-mesh-surface/95 backdrop-blur-xl border-e border-white/[0.06] flex flex-col">
            <div className="flex items-center justify-between px-4 h-16 border-b border-white/[0.06]">
              <Link to="/vehicles" className="flex items-center gap-2 group" onClick={() => setMobileOpen(false)}>
                <Car size={24} className="text-mesh-gold" />
                <span className="text-lg font-bold text-gradient-gold">CarMesh</span>
              </Link>
              <button onClick={() => setMobileOpen(false)} className="text-mesh-muted hover:text-mesh-text cursor-pointer">
                <X size={20} />
              </button>
            </div>
            <nav className="flex-1 py-4 space-y-1 overflow-y-auto px-2">
              {navItems.map((item) => {
                const active = location.pathname === item.path;
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    onClick={() => setMobileOpen(false)}
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-[var(--radius-mesh-sm)] transition-all duration-200 text-sm ${
                      active
                        ? 'bg-mesh-gold/[0.08] text-mesh-gold font-medium'
                        : 'text-mesh-muted hover:text-mesh-text hover:bg-white/[0.04]'
                    }`}
                  >
                    {item.icon}
                    <span>{item.label}</span>
                  </Link>
                );
              })}
            </nav>
            <div className="p-2 border-t border-white/[0.06]">
              <button
                onClick={() => { setMobileOpen(false); performLogout(navigate); }}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-[var(--radius-mesh-sm)] text-mesh-muted hover:text-red-400 hover:bg-red-500/[0.08] transition-all duration-200 text-sm cursor-pointer"
              >
                <LogOut size={18} />
                <span>{t('nav.logout')}</span>
              </button>
            </div>
          </aside>
        </div>
      )}
    </div>
  );
}
