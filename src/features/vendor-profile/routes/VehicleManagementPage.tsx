import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Car, Plus, Eye, EyeOff, Archive, Pencil } from 'lucide-react';
import { vehiclesApi } from '../../vehicles/api/vehiclesApi';
import type { Vehicle } from '../../vehicles/types';
import { resolveMediaUrl } from '../../../lib/api';
import { notifySuccess, notifyError } from '../../../lib/toast';
import { Card } from '../../../components/ui/Card';
import { Spinner } from '../../../components/ui/Spinner';
import { Badge } from '../../../components/ui/Badge';
import { Button } from '../../../components/ui/Button';
import { EmptyState } from '../../../components/ui/EmptyState';

const LISTING_STATUS_VARIANT: Record<string, 'default' | 'success' | 'warning' | 'danger'> = {
  DRAFT: 'default',
  PUBLISHED: 'success',
  HIDDEN: 'warning',
  ARCHIVED: 'danger',
};

const AVAILABILITY_VARIANT: Record<string, 'success' | 'info' | 'warning' | 'danger'> = {
  AVAILABLE: 'success',
  SOLD: 'info',
  RENTED: 'warning',
  UNAVAILABLE: 'danger',
};

export function VehicleManagementPage() {
  const { t } = useTranslation();
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionId, setActionId] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    vehiclesApi.getMyVehicles()
      .then((data) => { if (!cancelled) setVehicles(data); })
      .catch((e: unknown) => { if (!cancelled) setError(e instanceof Error ? e.message : 'Failed to load'); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, []);

  const handleStatusChange = async (id: string, status: string) => {
    setActionId(id);
    try {
      const updated = await vehiclesApi.updateListingStatus(id, status);
      setVehicles((prev) => prev.map((v) => (v.id === id ? updated : v)));
      notifySuccess(`${t('vehicles.listingType')}: ${status}`);
    } catch (err: unknown) {
      notifyError(err instanceof Error ? err.message : 'Action failed');
    } finally {
      setActionId(null);
    }
  };

  const handleArchive = async (id: string) => {
    setActionId(id);
    try {
      await vehiclesApi.archive(id);
      setVehicles((prev) => prev.filter((v) => v.id !== id));
      notifySuccess(t('vendor.archive'));
    } catch (err: unknown) {
      notifyError(err instanceof Error ? err.message : 'Archive failed');
    } finally {
      setActionId(null);
    }
  };

  if (loading) return <Spinner label={t('common.loading')} />;
  if (error) return <Card><p className="text-sm text-red-400" role="alert">{error}</p></Card>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-3">
          <Car size={22} className="text-mesh-gold" />
          <h1 className="text-2xl font-bold text-mesh-text">{t('vendor.myVehicles')}</h1>
          <Badge variant="gold">{vehicles.length}</Badge>
        </div>
        <Link to="/vendor/vehicles/new">
          <Button size="sm">
            <Plus size={16} />
            {t('vendor.addVehicle')}
          </Button>
        </Link>
      </div>

      {vehicles.length === 0 ? (
        <EmptyState
          icon={<Car size={48} />}
          title={t('vendor.noVehicles')}
          action={
            <Link to="/vendor/vehicles/new">
              <Button size="sm">
                <Plus size={16} />
                {t('vendor.addVehicle')}
              </Button>
            </Link>
          }
        />
      ) : (
        <Card padding={false}>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-mesh-border text-mesh-muted text-xs uppercase tracking-wider">
                  <th className="text-start p-4">{t('vendor.vehicleTitle')}</th>
                  <th className="text-start p-4 hidden md:table-cell">{t('vehicles.brand')}</th>
                  <th className="text-start p-4 hidden lg:table-cell">{t('vehicles.year')}</th>
                  <th className="text-start p-4">{t('common.price')}</th>
                  <th className="text-start p-4">{t('vendor.listingStatus')}</th>
                  <th className="text-start p-4 hidden sm:table-cell">{t('vendor.availabilityStatus')}</th>
                  <th className="text-start p-4">{t('common.actions')}</th>
                </tr>
              </thead>
              <tbody>
                {vehicles.map((v) => {
                  const primaryImg = v.images?.find((i) => i.isPrimary) ?? v.images?.[0];
                  const imgUrl = resolveMediaUrl(primaryImg?.imageUrl ?? null);

                  return (
                    <tr key={v.id} className="border-b border-mesh-border/50 hover:bg-mesh-surface/50 transition-colors">
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          {imgUrl ? (
                            <img src={imgUrl} alt="" className="w-10 h-10 rounded-[var(--radius-mesh-sm)] object-cover border border-mesh-border" />
                          ) : (
                            <div className="w-10 h-10 rounded-[var(--radius-mesh-sm)] bg-mesh-surface border border-mesh-border" />
                          )}
                          <span className="text-mesh-text font-medium truncate max-w-[160px]">{v.title}</span>
                        </div>
                      </td>
                      <td className="p-4 text-mesh-muted hidden md:table-cell">{v.brand} {v.model}</td>
                      <td className="p-4 text-mesh-muted hidden lg:table-cell">{v.year}</td>
                      <td className="p-4">
                        {v.price && <span className="text-mesh-gold font-semibold">${Number(v.price).toLocaleString()}</span>}
                        {v.rentalPricePerDay && (
                          <span className="text-mesh-muted text-xs block">
                            ${Number(v.rentalPricePerDay).toLocaleString()}{t('vehicles.perDay')}
                          </span>
                        )}
                      </td>
                      <td className="p-4">
                        <Badge variant={LISTING_STATUS_VARIANT[v.listingStatus] ?? 'default'}>
                          {t(`vehicles.${v.listingStatus.toLowerCase()}`)}
                        </Badge>
                      </td>
                      <td className="p-4 hidden sm:table-cell">
                        <Badge variant={AVAILABILITY_VARIANT[v.availabilityStatus] ?? 'default'}>
                          {t(`vehicles.${v.availabilityStatus.toLowerCase()}`)}
                        </Badge>
                      </td>
                      <td className="p-4">
                        <div className="flex items-center gap-1.5">
                          <Link to={`/vendor/vehicles/${v.id}/edit`}>
                            <Button variant="ghost" size="sm" title={t('common.edit')}>
                              <Pencil size={14} />
                            </Button>
                          </Link>
                          {v.listingStatus !== 'PUBLISHED' && (
                            <Button
                              variant="ghost"
                              size="sm"
                              title={t('vendor.publish')}
                              loading={actionId === v.id}
                              onClick={() => handleStatusChange(v.id, 'PUBLISHED')}
                            >
                              <Eye size={14} />
                            </Button>
                          )}
                          {v.listingStatus === 'PUBLISHED' && (
                            <Button
                              variant="ghost"
                              size="sm"
                              title={t('vendor.unpublish')}
                              loading={actionId === v.id}
                              onClick={() => handleStatusChange(v.id, 'HIDDEN')}
                            >
                              <EyeOff size={14} />
                            </Button>
                          )}
                          <Button
                            variant="ghost"
                            size="sm"
                            title={t('vendor.archive')}
                            loading={actionId === v.id}
                            onClick={() => handleArchive(v.id)}
                          >
                            <Archive size={14} />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  );
}
