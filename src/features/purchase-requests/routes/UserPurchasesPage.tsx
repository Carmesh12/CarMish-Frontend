import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ShoppingCart } from 'lucide-react';
import { purchaseRequestsApi } from '../api/purchaseRequestsApi';
import type { PurchaseRequest } from '../types';
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

export function UserPurchasesPage() {
  const { t } = useTranslation();
  const [requests, setRequests] = useState<PurchaseRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    purchaseRequestsApi.getMyRequests()
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
        <ShoppingCart size={22} className="text-mesh-gold" />
        <h1 className="text-2xl font-bold text-mesh-text">{t('purchase.myRequests')}</h1>
        <Badge variant="gold">{requests.length}</Badge>
      </div>

      {requests.length === 0 ? (
        <EmptyState
          icon={<ShoppingCart size={48} />}
          title={t('purchase.noRequests')}
        />
      ) : (
        <Card padding={false}>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-mesh-border text-mesh-muted text-xs uppercase tracking-wider">
                  <th className="text-start p-4">{t('purchase.vehicle')}</th>
                  <th className="text-start p-4">{t('purchase.offeredPrice')}</th>
                  <th className="text-start p-4 hidden sm:table-cell">{t('common.message')}</th>
                  <th className="text-start p-4">{t('common.status')}</th>
                  <th className="text-start p-4">{t('common.date')}</th>
                </tr>
              </thead>
              <tbody>
                {requests.map((req) => (
                  <tr key={req.id} className="border-b border-mesh-border/50 hover:bg-mesh-surface/50 transition-colors">
                    <td className="p-4 text-mesh-text font-medium">{req.vehicleId.slice(0, 8)}…</td>
                    <td className="p-4 text-mesh-gold font-semibold">
                      {req.offeredPrice ? `$${Number(req.offeredPrice).toLocaleString()}` : '—'}
                    </td>
                    <td className="p-4 text-mesh-muted truncate max-w-[200px] hidden sm:table-cell">
                      {req.message || '—'}
                    </td>
                    <td className="p-4">
                      <Badge variant={STATUS_VARIANT[req.status] ?? 'default'}>
                        {t(`purchase.${req.status.toLowerCase()}`)}
                      </Badge>
                    </td>
                    <td className="p-4 text-mesh-muted">
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
