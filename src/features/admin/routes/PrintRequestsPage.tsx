import { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Box, CheckCircle, Download, Printer, XCircle } from 'lucide-react';
import { Card } from '../../../components/ui/Card';
import { Badge } from '../../../components/ui/Badge';
import { Button } from '../../../components/ui/Button';
import { Spinner } from '../../../components/ui/Spinner';
import { Textarea } from '../../../components/ui/Textarea';
import { LocalModelViewer } from '../../3dgeneration';
import {
  getAdminPrintRequests,
  updatePrintRequestStatus,
} from '../api';
import type { ThreeDPrintRequest } from '../../vehicle-3d/api/vehicle3dApi';
import { notifyError, notifySuccess } from '../../../lib/toast';

function requesterName(request: ThreeDPrintRequest, fallback: string) {
  const requester = request.requester;
  if (!requester) return fallback;
  if (requester.vendor) return requester.vendor.businessName;
  if (requester.user) {
    return `${requester.user.firstName} ${requester.user.lastName}`.trim();
  }
  return requester.email;
}

function statusVariant(status: ThreeDPrintRequest['status']) {
  if (status === 'APPROVED') return 'success';
  if (status === 'REJECTED') return 'danger';
  if (status === 'CANCELLED') return 'default';
  return 'warning';
}

export function PrintRequestsPage() {
  const { t } = useTranslation();
  const [requests, setRequests] = useState<ThreeDPrintRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState('');
  const [responses, setResponses] = useState<Record<string, string>>({});
  const [actionId, setActionId] = useState<string | null>(null);

  const fetchRequests = useCallback(() => {
    setLoading(true);
    getAdminPrintRequests(1, 50, status || undefined)
      .then((res) => setRequests(res.data))
      .catch(() => notifyError(t('printRequests.loadError')))
      .finally(() => setLoading(false));
  }, [status, t]);

  useEffect(() => {
    fetchRequests();
  }, [fetchRequests]);

  async function updateStatus(
    request: ThreeDPrintRequest,
    nextStatus: 'APPROVED' | 'REJECTED',
  ) {
    setActionId(request.id);
    try {
      const updated = await updatePrintRequestStatus(
        request.id,
        nextStatus,
        responses[request.id]?.trim() || undefined,
      );
      setRequests((prev) =>
        prev.map((item) => (item.id === request.id ? updated : item)),
      );
      notifySuccess(t('printRequests.updateSuccess', { status: nextStatus.toLowerCase() }));
    } catch (err: unknown) {
      notifyError(err instanceof Error ? err.message : t('printRequests.updateError'));
    } finally {
      setActionId(null);
    }
  }

  return (
    <div className="space-y-6 pb-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-mesh-text flex items-center gap-2">
            <Printer size={24} className="text-mesh-gold" />
            {t('printRequests.adminTitle')}
          </h1>
          <p className="mt-1 text-sm text-mesh-muted">
            {t('printRequests.adminSubtitle')}
          </p>
        </div>
        <select
          value={status}
          onChange={(event) => setStatus(event.target.value)}
          className="px-3 py-2 text-sm bg-mesh-surface/40 border border-mesh-border/30 rounded-mesh-sm text-mesh-text focus:outline-none focus:border-mesh-gold/50"
        >
          <option value="">{t('printRequests.allStatuses')}</option>
          <option value="PENDING">{t('printRequests.pending')}</option>
          <option value="APPROVED">{t('printRequests.approved')}</option>
          <option value="REJECTED">{t('printRequests.rejected')}</option>
          <option value="CANCELLED">{t('printRequests.cancelled')}</option>
        </select>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <Spinner size={28} />
        </div>
      ) : requests.length === 0 ? (
        <Card>
          <p className="py-6 text-center text-sm text-mesh-muted">
            {t('printRequests.empty')}
          </p>
        </Card>
      ) : (
        <div className="space-y-4">
          {requests.map((request) => {
            const modelTitle =
              request.vehicleModel?.vehicle?.title ??
              request.personalModel?.title ??
              request.title ??
              '3D model';
            const name = requesterName(request, t('printRequests.unknownRequester'));
            return (
              <Card key={request.id}>
                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                  <div className="space-y-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge variant={statusVariant(request.status)}>
                        {request.status}
                      </Badge>
                      <Badge variant="info">{request.modelType}</Badge>
                      <span className="text-xs text-mesh-muted">
                        {new Date(request.requestedAt).toLocaleString()}
                      </span>
                    </div>
                    <h2 className="text-lg font-semibold text-mesh-text flex items-center gap-2">
                      <Box size={18} className="text-mesh-gold" />
                      {modelTitle}
                    </h2>
                    <p className="text-sm text-mesh-muted">
                      {t('printRequests.requestedBy', {
                        name,
                        role: request.requester?.role ?? t('messages.requester'),
                      })}
                    </p>
                    {request.requester?.email && (
                      <p className="text-xs text-mesh-muted">
                        {t('printRequests.email')}: {request.requester.email}
                      </p>
                    )}
                    {request.message && (
                      <p className="rounded-md border border-white/[0.06] bg-white/[0.03] p-3 text-sm text-mesh-text">
                        {request.message}
                      </p>
                    )}
                    {request.adminResponse && (
                      <p className="text-sm text-mesh-muted">
                        {t('printRequests.lastAdminResponse')}: {request.adminResponse}
                      </p>
                    )}
                  </div>

                  <div className="w-full space-y-3 lg:max-w-md">
                    <div className="overflow-hidden rounded-xl border border-white/10 bg-black/20">
                      <LocalModelViewer src={request.modelUrlSnapshot} />
                    </div>
                    <a
                      href={request.modelUrlSnapshot}
                      download={`${modelTitle.replace(/[^a-z0-9_-]+/gi, '_')}.glb`}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center justify-center gap-1.5 rounded-[var(--radius-mesh-sm)] border border-white/[0.08] bg-white/[0.05] px-3 py-1.5 text-sm text-mesh-text transition-colors hover:bg-white/[0.08]"
                    >
                      <Download size={16} />
                      {t('printRequests.downloadModel')}
                    </a>
                    <Textarea
                      label={t('printRequests.messageToRequester')}
                      placeholder={t('printRequests.messageToRequesterPlaceholder')}
                      value={responses[request.id] ?? ''}
                      onChange={(event) =>
                        setResponses((prev) => ({
                          ...prev,
                          [request.id]: event.target.value,
                        }))
                      }
                    />
                    <div className="flex flex-wrap gap-2">
                      <Button
                        size="sm"
                        loading={actionId === request.id}
                        disabled={request.status === 'APPROVED'}
                        onClick={() => updateStatus(request, 'APPROVED')}
                      >
                        <CheckCircle size={16} />
                        {t('printRequests.approve')}
                      </Button>
                      <Button
                        size="sm"
                        variant="danger"
                        loading={actionId === request.id}
                        disabled={request.status === 'REJECTED'}
                        onClick={() => updateStatus(request, 'REJECTED')}
                      >
                        <XCircle size={16} />
                        {t('printRequests.reject')}
                      </Button>
                    </div>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
