import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { LayoutDashboard, Shield, FileText, UserCog } from 'lucide-react';
import { getAdminDashboard } from '../api/adminProfileApi';
import type { AdminDashboardResponse } from '../types';
import { Card } from '../../../components/ui/Card';
import { Spinner } from '../../../components/ui/Spinner';
import { Badge } from '../../../components/ui/Badge';
import { Button } from '../../../components/ui/Button';

const ACTION_ICONS: Record<string, React.ReactNode> = {
  editProfile: <UserCog size={16} />,
  reports: <FileText size={16} />,
};

export function AdminDashboardPage() {
  const { t } = useTranslation();
  const [data, setData] = useState<AdminDashboardResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    getAdminDashboard()
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

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3 mb-2">
        <Shield size={22} className="text-mesh-gold" />
        <h1 className="text-2xl font-bold text-mesh-text">{t('dashboard.adminDashboard')}</h1>
      </div>

      {/* Greeting */}
      <Card>
        <div className="flex flex-col sm:flex-row sm:items-center gap-4">
          <div className="w-16 h-16 rounded-full bg-mesh-surface border border-mesh-border flex items-center justify-center text-mesh-gold shrink-0">
            <Shield size={28} />
          </div>
          <div className="min-w-0">
            <p className="text-sm text-mesh-muted">{t('dashboard.welcome')}</p>
            <p className="text-xl font-semibold text-mesh-text truncate">{data.greeting.fullName}</p>
            <p className="text-sm text-mesh-muted truncate">{data.greeting.email}</p>
          </div>
          <div className="sm:ms-auto">
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
