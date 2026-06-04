import { useEffect, useState } from 'react';
import { ChevronDown, ChevronUp, AlertTriangle, MessageSquare, EyeOff, CheckCircle, XCircle } from 'lucide-react';
import { toast } from 'react-toastify';
import { Card } from '../../../components/ui/Card';
import { Spinner } from '../../../components/ui/Spinner';
import { Badge } from '../../../components/ui/Badge';
import {
  getGroupedReports,
  resolveAllReports,
  dismissAllReports,
  hideVehicleListing,
  discussWithVendor,
  type ReportGrouped,
} from '../api';

export function ReportsManagementPage() {
  const [data, setData] = useState<ReportGrouped[]>([]);
  const [meta, setMeta] = useState<{ totalVehicles: number; totalReports: number }>({ totalVehicles: 0, totalReports: 0 });
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const [discussModal, setDiscussModal] = useState<{ vehicleId: string; vehicleTitle: string } | null>(null);
  const [discussSubject, setDiscussSubject] = useState('');
  const [discussBody, setDiscussBody] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  const fetchData = () => {
    setLoading(true);
    getGroupedReports(statusFilter || undefined).then((res: { data: ReportGrouped[]; meta: { totalVehicles: number; totalReports: number } }) => {
      setData(res.data);
      setMeta(res.meta);
      setLoading(false);
    }).catch(() => setLoading(false));
  };

  useEffect(() => { fetchData(); }, [statusFilter]);

  const toggle = (vehicleId: string) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(vehicleId)) next.delete(vehicleId); else next.add(vehicleId);
      return next;
    });
  };

  const handleResolveAll = async (vehicleId: string) => {
    setActionLoading(true);
    try {
      await resolveAllReports(vehicleId);
      toast.success('All reports resolved');
      fetchData();
    } catch { toast.error('Failed to resolve reports'); }
    finally { setActionLoading(false); }
  };

  const handleDismissAll = async (vehicleId: string) => {
    setActionLoading(true);
    try {
      await dismissAllReports(vehicleId);
      toast.success('All reports dismissed');
      fetchData();
    } catch { toast.error('Failed to dismiss reports'); }
    finally { setActionLoading(false); }
  };

  const handleHide = async (vehicleId: string) => {
    setActionLoading(true);
    try {
      await hideVehicleListing(vehicleId);
      toast.success('Vehicle listing hidden');
      fetchData();
    } catch { toast.error('Failed to hide listing'); }
    finally { setActionLoading(false); }
  };

  const handleDiscuss = async () => {
    if (!discussModal || !discussSubject.trim() || !discussBody.trim()) return;
    setActionLoading(true);
    try {
      await discussWithVendor(discussModal.vehicleId, discussSubject.trim(), discussBody.trim());
      toast.success('Discussion thread created');
      setDiscussModal(null);
      setDiscussSubject('');
      setDiscussBody('');
    } catch { toast.error('Failed to create discussion'); }
    finally { setActionLoading(false); }
  };

  const severityVariant = (s: string) => s === 'high' ? 'danger' : s === 'medium' ? 'warning' : 'success';

  return (
    <div className="space-y-6 pb-8">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-mesh-text">Reports Management</h1>
          <p className="text-sm text-mesh-muted mt-1">
            {meta.totalVehicles} vehicles reported · {meta.totalReports} total reports
          </p>
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-3 py-2 text-sm bg-mesh-surface/40 border border-mesh-border/30 rounded-mesh-sm text-mesh-text focus:outline-none focus:border-mesh-gold/50"
        >
          <option value="">All Statuses</option>
          <option value="PENDING">Pending</option>
          <option value="REVIEWED">Reviewed</option>
          <option value="RESOLVED">Resolved</option>
          <option value="DISMISSED">Dismissed</option>
        </select>
      </div>

      {loading ? (
        <div className="flex justify-center py-12"><Spinner size={28} /></div>
      ) : data.length === 0 ? (
        <Card padding><p className="text-mesh-muted text-sm text-center py-6">No reports found.</p></Card>
      ) : (
        <div className="space-y-3">
          {data.map((group) => (
            <Card key={group.vehicleId} padding>
              <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3">
                <div className="flex items-start gap-3 cursor-pointer flex-1" onClick={() => toggle(group.vehicleId)}>
                  <div className="pt-0.5">
                    {expanded.has(group.vehicleId) ? <ChevronUp size={18} className="text-mesh-muted" /> : <ChevronDown size={18} className="text-mesh-muted" />}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="text-sm font-semibold text-mesh-text">{group.vehicleTitle}</h3>
                      <span className="text-xs text-mesh-muted">{group.vehicleBrand} {group.vehicleModel}</span>
                      <Badge variant={severityVariant(group.severity)} className="text-[10px]">
                        {group.severity.toUpperCase()} · {group.reportCount} reports
                      </Badge>
                      {group.pendingCount > 0 && (
                        <Badge variant="warning" className="text-[10px]">{group.pendingCount} pending</Badge>
                      )}
                    </div>
                    <p className="text-xs text-mesh-muted mt-0.5">
                      Vendor: {group.vendorName} · Latest: {new Date(group.latestReportDate).toLocaleDateString()}
                      {group.listingStatus === 'HIDDEN' && <span className="text-red-400 ml-2">[HIDDEN]</span>}
                    </p>
                  </div>
                </div>

                <div className="flex gap-1.5 shrink-0 flex-wrap">
                  <button onClick={() => handleResolveAll(group.vehicleId)} disabled={actionLoading} className="flex items-center gap-1 px-2 py-1 text-xs font-medium bg-emerald-600/20 text-emerald-400 border border-emerald-600/30 rounded-mesh-sm hover:bg-emerald-600/30 transition-colors disabled:opacity-40">
                    <CheckCircle size={12} /> Resolve All
                  </button>
                  <button onClick={() => handleDismissAll(group.vehicleId)} disabled={actionLoading} className="flex items-center gap-1 px-2 py-1 text-xs font-medium bg-gray-600/20 text-gray-400 border border-gray-600/30 rounded-mesh-sm hover:bg-gray-600/30 transition-colors disabled:opacity-40">
                    <XCircle size={12} /> Dismiss All
                  </button>
                  <button onClick={() => { setDiscussModal({ vehicleId: group.vehicleId, vehicleTitle: group.vehicleTitle }); setDiscussSubject(`Reports on: ${group.vehicleTitle}`); }} disabled={actionLoading} className="flex items-center gap-1 px-2 py-1 text-xs font-medium bg-blue-600/20 text-blue-400 border border-blue-600/30 rounded-mesh-sm hover:bg-blue-600/30 transition-colors disabled:opacity-40">
                    <MessageSquare size={12} /> Contact Vendor
                  </button>
                  {group.listingStatus !== 'HIDDEN' && (
                    <button onClick={() => handleHide(group.vehicleId)} disabled={actionLoading} className="flex items-center gap-1 px-2 py-1 text-xs font-medium bg-red-600/20 text-red-400 border border-red-600/30 rounded-mesh-sm hover:bg-red-600/30 transition-colors disabled:opacity-40">
                      <EyeOff size={12} /> Hide Listing
                    </button>
                  )}
                </div>
              </div>

              {expanded.has(group.vehicleId) && (
                <div className="mt-4 border-t border-mesh-border/20 pt-3 space-y-2">
                  {group.reports.map((report) => (
                    <div key={report.id} className="flex items-start gap-3 p-2 rounded-mesh-sm bg-mesh-surface/20">
                      <AlertTriangle size={14} className="text-amber-400 mt-0.5 shrink-0" />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-xs font-medium text-mesh-text">{report.reason}</span>
                          <Badge variant={report.status === 'PENDING' ? 'warning' : report.status === 'RESOLVED' ? 'success' : report.status === 'DISMISSED' ? 'default' : 'info'} className="text-[10px]">
                            {report.status}
                          </Badge>
                        </div>
                        {report.description && <p className="text-xs text-mesh-muted mt-0.5">{report.description}</p>}
                        <p className="text-[11px] text-mesh-muted/60 mt-0.5">
                          By: {report.reporterAccount.email} · {new Date(report.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          ))}
        </div>
      )}

      {/* Discuss Modal */}
      {discussModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={() => setDiscussModal(null)}>
          <div className="bg-mesh-card border border-mesh-border rounded-mesh-sm p-6 w-full max-w-md mx-4 shadow-xl" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-semibold text-mesh-text mb-4">Contact Vendor about: {discussModal.vehicleTitle}</h3>
            <input
              value={discussSubject}
              onChange={(e) => setDiscussSubject(e.target.value)}
              className="w-full px-3 py-2 text-sm bg-mesh-surface/40 border border-mesh-border/30 rounded-mesh-sm text-mesh-text placeholder:text-mesh-muted/60 focus:outline-none focus:border-mesh-gold/50 mb-3"
              placeholder="Subject"
            />
            <textarea
              value={discussBody}
              onChange={(e) => setDiscussBody(e.target.value)}
              rows={4}
              className="w-full px-3 py-2 text-sm bg-mesh-surface/40 border border-mesh-border/30 rounded-mesh-sm text-mesh-text placeholder:text-mesh-muted/60 focus:outline-none focus:border-mesh-gold/50 mb-4"
              placeholder="Describe the issue..."
            />
            <div className="flex justify-end gap-2">
              <button onClick={() => setDiscussModal(null)} className="px-4 py-2 text-sm text-mesh-muted hover:text-mesh-text transition-colors">Cancel</button>
              <button onClick={handleDiscuss} disabled={actionLoading || !discussSubject.trim() || !discussBody.trim()} className="px-4 py-2 text-sm font-medium bg-mesh-gold text-black rounded-mesh-sm hover:bg-mesh-gold/80 disabled:opacity-40 transition-colors">
                Send
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
