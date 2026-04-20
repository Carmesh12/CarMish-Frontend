import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { LayoutDashboard, Car, ShoppingCart, CalendarDays, UserCog } from 'lucide-react';
import { getVendorDashboard } from '../api/vendorProfileApi';
import type { VendorDashboardResponse } from '../types';
import { resolveMediaUrl } from '../../../lib/api';
import { Card } from '../../../components/ui/Card';
import { Spinner } from '../../../components/ui/Spinner';
import { Badge } from '../../../components/ui/Badge';
import { Button } from '../../../components/ui/Button';

const ACTION_ICONS: Record<string, React.ReactNode> = {
  editProfile: <UserCog size={16} />,
  myVehicles: <Car size={16} />,
  purchases: <ShoppingCart size={16} />,
  rentals: <CalendarDays size={16} />,
};

const VERIFICATION_VARIANT: Record<string, 'warning' | 'success' | 'danger' | 'default'> = {
  PENDING: 'warning',
  VERIFIED: 'success',
  REJECTED: 'danger',
};

export function VendorDashboardPage() {
  const { t } = useTranslation();
  const [data, setData] = useState<VendorDashboardResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    getVendorDashboard()
      .then((d) => { if (!cancelled) setData(d); })
      .catch((e: unknown) => {
        if (!cancelled) setError(e instanceof Error ? e.message : 'Failed to load dashboard');
      })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, []);

  if (loading) return <Spinner label={t('common.loading')} />;
  if (error) return <Card><p className="text-sm text-red-400" role="alert">{error}</p></Card>;
  if (!data) return null;

  const logoUrl = resolveMediaUrl(data.greeting.logoUrl);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3 mb-2">
        <LayoutDashboard size={22} className="text-mesh-gold" />
        <h1 className="text-2xl font-bold text-mesh-text">{t('dashboard.vendorDashboard')}</h1>
      </div>

      {/* Greeting */}
      <Card>
        <div className="flex flex-col sm:flex-row sm:items-center gap-6">
          <div className="shrink-0">
            {logoUrl ? (
              <img src={logoUrl} alt="" className="w-20 h-20 rounded-[var(--radius-mesh-sm)] object-cover border border-mesh-border bg-mesh-surface" />
            ) : (
              <div className="w-20 h-20 rounded-[var(--radius-mesh-sm)] bg-mesh-surface border border-mesh-border flex items-center justify-center text-mesh-muted text-2xl font-bold">
                {data.greeting.businessName.charAt(0)}
              </div>
            )}
          </div>
          <div className="min-w-0">
            <p className="text-sm text-mesh-muted">{t('dashboard.welcome')}</p>
            <p className="text-xl font-semibold text-mesh-text truncate">{data.greeting.businessName}</p>
            <p className="text-sm text-mesh-muted truncate">{data.greeting.contactPersonName}</p>
            <p className="text-xs text-mesh-muted truncate mt-1">{data.greeting.email}</p>
          </div>
          <div className="sm:ms-auto flex flex-col gap-2 items-start sm:items-end">
            <Badge variant={VERIFICATION_VARIANT[data.accountSummary.verificationStatus] ?? 'default'}>
              {t('profile.verificationStatus')}: {data.accountSummary.verificationStatus}
            </Badge>
            <Badge variant={data.accountSummary.isActive ? 'success' : 'danger'}>
              {data.accountSummary.isActive ? 'Active' : 'Inactive'}
            </Badge>
          </div>
        </div>
      </Card>

      {/* Account Summary */}
      <Card>
        <h2 className="text-sm font-medium uppercase tracking-wider text-mesh-muted mb-4">
          {t('profile.accountInfo')}
        </h2>
        <dl className="grid gap-3 text-sm sm:grid-cols-3">
          <div>
            <dt className="text-mesh-muted">{t('common.status')}</dt>
            <dd className="text-mesh-text font-medium">{data.accountSummary.role}</dd>
          </div>
          <div>
            <dt className="text-mesh-muted">{t('profile.verificationStatus')}</dt>
            <dd className="text-mesh-text font-medium">{data.accountSummary.verificationStatus}</dd>
          </div>
          <div>
            <dt className="text-mesh-muted">{t('profile.memberSince')}</dt>
            <dd className="text-mesh-text font-medium">
              {new Date(data.accountSummary.memberSince).toLocaleDateString(undefined, {
                year: 'numeric', month: 'long', day: 'numeric',
              })}
            </dd>
          </div>
        </dl>
      </Card>

      {/* Profile Completion */}
      <Card>
        <h2 className="text-sm font-medium uppercase tracking-wider text-mesh-muted mb-4">
          {t('dashboard.profileCompletion')}
        </h2>
        <div className="flex items-center gap-4 mb-4">
          <div className="flex-1 h-2 rounded-full bg-mesh-surface overflow-hidden border border-mesh-border">
            <div
              className="h-full bg-mesh-gold transition-[width] duration-500"
              style={{ width: `${data.profileCompletion.percentage}%` }}
            />
          </div>
          <span className="text-mesh-text font-semibold tabular-nums">
            {data.profileCompletion.percentage}%
          </span>
        </div>
        {data.profileCompletion.missingFields.length > 0 && (
          <p className="text-xs text-mesh-muted">
            Missing: {data.profileCompletion.missingFields.join(', ')}
          </p>
        )}
      </Card>

      {/* Quick Actions */}
      <Card>
        <h2 className="text-sm font-medium uppercase tracking-wider text-mesh-muted mb-4">
          {t('dashboard.quickActions')}
        </h2>
        <div className="flex flex-wrap gap-3">
          {data.quickActions.map((action) => (
            <Link key={action.id} to={action.path}>
              <Button variant="secondary" size="sm">
                {ACTION_ICONS[action.id] ?? <LayoutDashboard size={16} />}
                {action.label}
              </Button>
            </Link>
          ))}
        </div>
      </Card>
    </div>
  );
}
