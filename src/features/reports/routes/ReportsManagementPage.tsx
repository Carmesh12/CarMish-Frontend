import { useEffect, useState, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { FileText, Search, CheckCircle, XCircle, Eye } from 'lucide-react';
import { reportsApi } from '../api/reportsApi';
import type { Report, ReportListResponse } from '../types';
import { notifySuccess, notifyError } from '../../../lib/toast';
import { Card } from '../../../components/ui/Card';
import { Spinner } from '../../../components/ui/Spinner';
import { Badge } from '../../../components/ui/Badge';
import { Button } from '../../../components/ui/Button';
import { EmptyState } from '../../../components/ui/EmptyState';
import { Pagination } from '../../../components/ui/Pagination';

const STATUS_VARIANT: Record<string, 'warning' | 'success' | 'info' | 'default'> = {
  PENDING: 'warning',
  REVIEWED: 'info',
  RESOLVED: 'success',
  DISMISSED: 'default',
};

const LIMIT = 10;

export function ReportsManagementPage() {
  const { t } = useTranslation();
  const [reports, setReports] = useState<Report[]>([]);
  const [meta, setMeta] = useState<ReportListResponse['meta'] | null>(null);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionId, setActionId] = useState<string | null>(null);

  const fetchReports = useCallback((p: number) => {
    setLoading(true);
    reportsApi.getAdminReports(p, LIMIT)
      .then((res) => {
        setReports(res.data);
        setMeta(res.meta);
      })
      .catch((e: unknown) => setError(e instanceof Error ? e.message : 'Failed to load'))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { fetchReports(page); }, [page, fetchReports]);

  const handleStatus = async (id: string, status: 'REVIEWED' | 'RESOLVED' | 'DISMISSED') => {
    setActionId(id);
    try {
      const updated = await reportsApi.updateStatus(id, status);
      setReports((prev) => prev.map((r) => (r.id === id ? updated : r)));
      notifySuccess(t(`reports.${status.toLowerCase()}`));
    } catch (err: unknown) {
      notifyError(err instanceof Error ? err.message : 'Action failed');
    } finally {
      setActionId(null);
    }
  };

  if (loading && reports.length === 0) return <Spinner label={t('common.loading')} />;
  if (error) return <Card><p className="text-sm text-red-400" role="alert">{error}</p></Card>;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <FileText size={22} className="text-mesh-gold" />
        <h1 className="text-2xl font-bold text-mesh-text">{t('reports.management')}</h1>
        {meta && <Badge variant="gold">{meta.total}</Badge>}
      </div>

      {reports.length === 0 ? (
        <EmptyState
          icon={<Search size={48} />}
          title={t('reports.noReports')}
        />
      ) : (
        <>
          <Card padding={false}>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-mesh-border text-mesh-muted text-xs uppercase tracking-wider">
                    <th className="text-start p-4">{t('purchase.vehicle')}</th>
                    <th className="text-start p-4">{t('reports.reporter')}</th>
                    <th className="text-start p-4">{t('reports.reason')}</th>
                    <th className="text-start p-4 hidden sm:table-cell">{t('common.description')}</th>
                    <th className="text-start p-4">{t('common.status')}</th>
                    <th className="text-start p-4">{t('common.date')}</th>
                    <th className="text-start p-4">{t('common.actions')}</th>
                  </tr>
                </thead>
                <tbody>
                  {reports.map((report) => (
                    <tr key={report.id} className="border-b border-mesh-border/50 hover:bg-mesh-surface/50 transition-colors">
                      <td className="p-4 text-mesh-text font-medium">
                        {report.vehicle?.title ?? report.vehicleId.slice(0, 8) + '…'}
                      </td>
                      <td className="p-4 text-mesh-muted">
                        {report.reporterAccount?.email ?? report.reporterAccountId.slice(0, 8) + '…'}
                      </td>
                      <td className="p-4 text-mesh-text">{report.reason}</td>
                      <td className="p-4 text-mesh-muted truncate max-w-[200px] hidden sm:table-cell">
                        {report.description || '—'}
                      </td>
                      <td className="p-4">
                        <Badge variant={STATUS_VARIANT[report.status] ?? 'default'}>
                          {t(`reports.${report.status.toLowerCase()}`)}
                        </Badge>
                      </td>
                      <td className="p-4 text-mesh-muted">{new Date(report.createdAt).toLocaleDateString()}</td>
                      <td className="p-4">
                        {report.status === 'PENDING' ? (
                          <div className="flex gap-1.5">
                            <Button
                              variant="ghost"
                              size="sm"
                              loading={actionId === report.id}
                              onClick={() => handleStatus(report.id, 'REVIEWED')}
                              title={t('reports.markReviewed')}
                            >
                              <Eye size={14} className="text-blue-400" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              loading={actionId === report.id}
                              onClick={() => handleStatus(report.id, 'RESOLVED')}
                              title={t('reports.markResolved')}
                            >
                              <CheckCircle size={14} className="text-emerald-400" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              loading={actionId === report.id}
                              onClick={() => handleStatus(report.id, 'DISMISSED')}
                              title={t('reports.dismiss')}
                            >
                              <XCircle size={14} className="text-red-400" />
                            </Button>
                          </div>
                        ) : report.status === 'REVIEWED' ? (
                          <div className="flex gap-1.5">
                            <Button
                              variant="ghost"
                              size="sm"
                              loading={actionId === report.id}
                              onClick={() => handleStatus(report.id, 'RESOLVED')}
                              title={t('reports.markResolved')}
                            >
                              <CheckCircle size={14} className="text-emerald-400" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              loading={actionId === report.id}
                              onClick={() => handleStatus(report.id, 'DISMISSED')}
                              title={t('reports.dismiss')}
                            >
                              <XCircle size={14} className="text-red-400" />
                            </Button>
                          </div>
                        ) : (
                          <span className="text-mesh-muted text-xs">—</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>

          {meta && meta.totalPages > 1 && (
            <Pagination page={page} totalPages={meta.totalPages} onPageChange={setPage} />
          )}
        </>
      )}
    </div>
  );
}
