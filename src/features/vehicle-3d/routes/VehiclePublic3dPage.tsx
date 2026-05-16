import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ArrowLeft } from 'lucide-react';
import { LocalModelViewer } from '../../3dgeneration';
import { vehicle3dApi } from '../api/vehicle3dApi';
import { Button } from '../../../components/ui/Button';
import { Spinner } from '../../../components/ui/Spinner';
import { Card } from '../../../components/ui/Card';

export function VehiclePublic3dPage() {
  const { t } = useTranslation();
  const { id } = useParams<{ id: string }>();
  const [modelUrl, setModelUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    let cancelled = false;
    vehicle3dApi
      .getPublicModelUrl(id)
      .then((r) => {
        if (!cancelled) setModelUrl(r.modelUrl);
      })
      .catch((e: unknown) => {
        if (!cancelled) setError(e instanceof Error ? e.message : 'Failed to load');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-[50vh] flex items-center justify-center">
        <Spinner label={t('common.loading')} />
      </div>
    );
  }

  if (error || !modelUrl) {
    return (
      <div className="max-w-lg mx-auto space-y-4 py-12">
        <Card>
          <p className="text-sm text-red-400" role="alert">
            {error ?? t('detail.threeDUnavailable', '3D model is not available.')}
          </p>
        </Card>
        <Link to={id ? `/vehicles/${id}` : '/vehicles'}>
          <Button variant="outline" size="sm">
            <ArrowLeft size={16} className="me-1 rtl:me-0 rtl:ms-1" />
            {t('detail.backToVehicle', 'Back to vehicle')}
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6 py-4">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold text-mesh-text">
            {t('detail.threeDView', '3D view')}
          </h1>
          <p className="text-sm text-mesh-muted mt-1">
            {t('detail.threeDViewHint', 'Interactive model hosted securely for this listing.')}
          </p>
        </div>
        <Link to={id ? `/vehicles/${id}` : '/vehicles'}>
          <Button variant="outline" size="sm">
            <ArrowLeft size={16} className="me-1 rtl:me-0 rtl:ms-1" />
            {t('detail.backToVehicle', 'Back to vehicle')}
          </Button>
        </Link>
      </div>
      <div className="overflow-hidden rounded-2xl border border-white/10 bg-black/20 shadow-[0_0_0_1px_rgba(255,255,255,0.04)]">
        <LocalModelViewer src={modelUrl} />
      </div>
    </div>
  );
}
