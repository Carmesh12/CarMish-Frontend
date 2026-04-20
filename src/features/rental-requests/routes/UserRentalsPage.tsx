import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { CalendarDays } from 'lucide-react';
import { rentalRequestsApi } from '../api/rentalRequestsApi';
import type { RentalRequest } from '../types';
import { Card } from '../../../components/ui/Card';
import { Spinner } from '../../../components/ui/Spinner';
import { Badge } from '../../../components/ui/Badge';
import { EmptyState } from '../../../components/ui/EmptyState';

const STATUS_VARIANT: Record<string, 'warning' | 'success' | 'danger' | 'info' | 'default'> = {
  PENDING: 'warning',
  APPROVED: 'success',
  REJECTED: 'danger',
  CANCELLED: 'default',
  COMPLETED: 'info',
};

export function UserRentalsPage() {
  const { t } = useTranslation();
  const [requests, setRequests] = useState<RentalRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    rentalRequestsApi.getMyRequests()
      .then((data) => { if (!cancelled) setRequests(data); })
      .catch((e: unknown) => { if (!cancelled) setError(e instanceof Error ? e.message : 'Failed to load'); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, []);

  if (loading) return <Spinner label={t('common.loading')} />;
  if (error) return <Card><p className="text-sm text-red-400" role="alert">{error}</p></Card>;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <CalendarDays size={22} className="text-mesh-gold" />
        <h1 className="text-2xl font-bold text-mesh-text">{t('rental.myRequests')}</h1>
        <Badge variant="gold">{requests.length}</Badge>
      </div>

      {requests.length === 0 ? (
        <EmptyState
          icon={<CalendarDays size={48} />}
          title={t('rental.noRequests')}
        />
      ) : (
        <Card padding={false}>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-mesh-border text-mesh-muted text-xs uppercase tracking-wider">
                  <th className="text-start p-4">{t('purchase.vehicle')}</th>
                  <th className="text-start p-4">{t('rental.startDate')}</th>
                  <th className="text-start p-4">{t('rental.endDate')}</th>
                  <th className="text-start p-4">{t('rental.totalPrice')}</th>
                  <th className="text-start p-4">{t('common.status')}</th>
                  <th className="text-start p-4 hidden sm:table-cell">{t('common.date')}</th>
                </tr>
              </thead>
              <tbody>
                {requests.map((req) => (
                  <tr key={req.id} className="border-b border-mesh-border/50 hover:bg-mesh-surface/50 transition-colors">
                    <td className="p-4 text-mesh-text font-medium">{req.vehicleId.slice(0, 8)}…</td>
                    <td className="p-4 text-mesh-text">{new Date(req.startDate).toLocaleDateString()}</td>
                    <td className="p-4 text-mesh-text">{new Date(req.endDate).toLocaleDateString()}</td>
                    <td className="p-4 text-mesh-gold font-semibold">
                      {req.totalPrice ? `$${Number(req.totalPrice).toLocaleString()}` : '—'}
                    </td>
                    <td className="p-4">
                      <Badge variant={STATUS_VARIANT[req.status] ?? 'default'}>
                        {t(`rental.${req.status.toLowerCase()}`)}
                      </Badge>
                    </td>
                    <td className="p-4 text-mesh-muted hidden sm:table-cell">
                      {new Date(req.createdAt).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  );
}
