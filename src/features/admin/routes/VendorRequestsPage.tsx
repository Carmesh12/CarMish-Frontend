import { useEffect, useState } from 'react';
import { CheckCircle, XCircle, MessageSquare, Search } from 'lucide-react';
import { toast } from 'react-toastify';
import { Card } from '../../../components/ui/Card';
import { Spinner } from '../../../components/ui/Spinner';
import { Badge } from '../../../components/ui/Badge';
import {
  getAdminPendingVendors,
  getAdminAllVendors,
  approveVendor,
  rejectVendor,
  messageVendor,
  type PendingVendor,
  type VendorListItem,
  type Paginated,
} from '../api';

export function VendorRequestsPage() {
  const [tab, setTab] = useState<'pending' | 'all'>('pending');
  const [pendingData, setPendingData] = useState<Paginated<PendingVendor> | null>(null);
  const [allData, setAllData] = useState<Paginated<VendorListItem> | null>(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  const [rejectModal, setRejectModal] = useState<{ vendorId: string; name: string } | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [msgModal, setMsgModal] = useState<{ vendorId: string; name: string } | null>(null);
  const [msgSubject, setMsgSubject] = useState('');
  const [msgBody, setMsgBody] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    setLoading(true);
    setPage(1);
  }, [tab]);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    if (tab === 'pending') {
      getAdminPendingVendors(page, 10).then((res: Paginated<PendingVendor>) => {
        if (!cancelled) { setPendingData(res); setLoading(false); }
      }).catch(() => { if (!cancelled) setLoading(false); });
    } else {
      getAdminAllVendors(page, 10, statusFilter || undefined, search || undefined).then((res: Paginated<VendorListItem>) => {
        if (!cancelled) { setAllData(res); setLoading(false); }
      }).catch(() => { if (!cancelled) setLoading(false); });
    }
    return () => { cancelled = true; };
  }, [tab, page, statusFilter, search]);

  const handleApprove = async (vendorId: string) => {
    setActionLoading(true);
    try {
      await approveVendor(vendorId);
      toast.success('Vendor approved');
      setPendingData((prev) => prev ? { ...prev, data: prev.data.filter((v) => v.id !== vendorId) } : prev);
    } catch { toast.error('Failed to approve vendor'); }
    finally { setActionLoading(false); }
  };

  const handleReject = async () => {
    if (!rejectModal) return;
    setActionLoading(true);
    try {
      await rejectVendor(rejectModal.vendorId, rejectReason || undefined);
      toast.success('Vendor rejected');
      setPendingData((prev) => prev ? { ...prev, data: prev.data.filter((v) => v.id !== rejectModal.vendorId) } : prev);
      setRejectModal(null);
      setRejectReason('');
    } catch { toast.error('Failed to reject vendor'); }
    finally { setActionLoading(false); }
  };

  const handleMessage = async () => {
    if (!msgModal || !msgSubject.trim() || !msgBody.trim()) return;
    setActionLoading(true);
    try {
      await messageVendor(msgModal.vendorId, msgSubject.trim(), msgBody.trim());
      toast.success('Message sent');
      setMsgModal(null);
      setMsgSubject('');
      setMsgBody('');
    } catch { toast.error('Failed to send message'); }
    finally { setActionLoading(false); }
  };

  return (
    <div className="space-y-6 pb-8">
      <h1 className="text-2xl font-bold text-mesh-text">Vendor Requests</h1>

      {/* Tabs */}
      <div className="flex gap-1 bg-mesh-surface/40 rounded-mesh-sm p-1 w-fit">
        <button onClick={() => setTab('pending')} className={`px-4 py-1.5 text-sm font-medium rounded-mesh-sm transition-colors ${tab === 'pending' ? 'bg-mesh-gold text-black' : 'text-mesh-muted hover:text-mesh-text'}`}>
          Pending
        </button>
        <button onClick={() => setTab('all')} className={`px-4 py-1.5 text-sm font-medium rounded-mesh-sm transition-colors ${tab === 'all' ? 'bg-mesh-gold text-black' : 'text-mesh-muted hover:text-mesh-text'}`}>
          All Vendors
        </button>
      </div>

      {tab === 'all' && (
        <div className="flex flex-wrap gap-3">
          <div className="relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-mesh-muted" />
            <input
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              placeholder="Search vendors..."
              className="pl-9 pr-3 py-2 text-sm bg-mesh-surface/40 border border-mesh-border/30 rounded-mesh-sm text-mesh-text placeholder:text-mesh-muted/60 focus:outline-none focus:border-mesh-gold/50 w-64"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
            className="px-3 py-2 text-sm bg-mesh-surface/40 border border-mesh-border/30 rounded-mesh-sm text-mesh-text focus:outline-none focus:border-mesh-gold/50"
          >
            <option value="">All Statuses</option>
            <option value="PENDING">Pending</option>
            <option value="APPROVED">Approved</option>
            <option value="REJECTED">Rejected</option>
          </select>
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-12"><Spinner size={28} /></div>
      ) : tab === 'pending' ? (
        <div className="space-y-4">
          {(!pendingData || pendingData.data.length === 0) ? (
            <Card padding><p className="text-mesh-muted text-sm text-center py-4">No pending vendor applications.</p></Card>
          ) : (
            pendingData.data.map((vendor) => (
              <Card key={vendor.id} padding>
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                  <div className="space-y-1">
                    <h3 className="text-base font-semibold text-mesh-text">{vendor.businessName}</h3>
                    <p className="text-sm text-mesh-muted">Contact: {vendor.contactPersonName}</p>
                    <p className="text-sm text-mesh-muted">{vendor.account.email}</p>
                    {vendor.phoneNumber && <p className="text-xs text-mesh-muted">Phone: {vendor.phoneNumber}</p>}
                    {vendor.businessAddress && <p className="text-xs text-mesh-muted">Address: {vendor.businessAddress}</p>}
                    <p className="text-xs text-mesh-muted">Registered: {new Date(vendor.createdAt).toLocaleDateString()}</p>
                  </div>
                  <div className="flex gap-2 shrink-0">
                    <button
                      onClick={() => handleApprove(vendor.id)}
                      disabled={actionLoading}
                      className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium bg-emerald-600/20 text-emerald-400 border border-emerald-600/30 rounded-mesh-sm hover:bg-emerald-600/30 transition-colors disabled:opacity-40"
                    >
                      <CheckCircle size={14} /> Approve
                    </button>
                    <button
                      onClick={() => setRejectModal({ vendorId: vendor.id, name: vendor.businessName })}
                      disabled={actionLoading}
                      className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium bg-red-600/20 text-red-400 border border-red-600/30 rounded-mesh-sm hover:bg-red-600/30 transition-colors disabled:opacity-40"
                    >
                      <XCircle size={14} /> Reject
                    </button>
                    <button
                      onClick={() => setMsgModal({ vendorId: vendor.id, name: vendor.businessName })}
                      disabled={actionLoading}
                      className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium bg-blue-600/20 text-blue-400 border border-blue-600/30 rounded-mesh-sm hover:bg-blue-600/30 transition-colors disabled:opacity-40"
                    >
                      <MessageSquare size={14} /> Message
                    </button>
                  </div>
                </div>
              </Card>
            ))
          )}
          {pendingData && pendingData.meta.totalPages > 1 && (
            <PaginationControls page={page} totalPages={pendingData.meta.totalPages} onPageChange={setPage} />
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {(!allData || allData.data.length === 0) ? (
            <Card padding><p className="text-mesh-muted text-sm text-center py-4">No vendors found.</p></Card>
          ) : (
            <Card padding>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead><tr className="text-mesh-muted text-xs border-b border-mesh-border">
                    <th className="text-left pb-2">Business</th>
                    <th className="text-left pb-2">Contact</th>
                    <th className="text-left pb-2">Status</th>
                    <th className="text-right pb-2">Vehicles</th>
                    <th className="text-right pb-2">Registered</th>
                  </tr></thead>
                  <tbody>
                    {allData.data.map((v) => (
                      <tr key={v.id} className="border-b border-mesh-border/30">
                        <td className="py-2 text-mesh-text">{v.businessName}</td>
                        <td className="py-2 text-mesh-muted">{v.account.email}</td>
                        <td className="py-2">
                          <Badge variant={v.verificationStatus === 'APPROVED' ? 'success' : v.verificationStatus === 'REJECTED' ? 'danger' : 'warning'}>
                            {v.verificationStatus}
                          </Badge>
                        </td>
                        <td className="py-2 text-right text-mesh-muted">{v._count.vehicles}</td>
                        <td className="py-2 text-right text-mesh-muted text-xs">{new Date(v.createdAt).toLocaleDateString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          )}
          {allData && allData.meta.totalPages > 1 && (
            <PaginationControls page={page} totalPages={allData.meta.totalPages} onPageChange={setPage} />
          )}
        </div>
      )}

      {/* Reject Modal */}
      {rejectModal && (
        <ModalOverlay onClose={() => setRejectModal(null)}>
          <h3 className="text-lg font-semibold text-mesh-text mb-2">Reject {rejectModal.name}</h3>
          <p className="text-sm text-mesh-muted mb-4">Optionally provide a reason for rejection:</p>
          <textarea
            value={rejectReason}
            onChange={(e) => setRejectReason(e.target.value)}
            rows={3}
            className="w-full px-3 py-2 text-sm bg-mesh-surface/40 border border-mesh-border/30 rounded-mesh-sm text-mesh-text placeholder:text-mesh-muted/60 focus:outline-none focus:border-mesh-gold/50 mb-4"
            placeholder="Reason (optional)"
          />
          <div className="flex justify-end gap-2">
            <button onClick={() => setRejectModal(null)} className="px-4 py-2 text-sm text-mesh-muted hover:text-mesh-text transition-colors">Cancel</button>
            <button onClick={handleReject} disabled={actionLoading} className="px-4 py-2 text-sm font-medium bg-red-600 text-white rounded-mesh-sm hover:bg-red-700 disabled:opacity-40 transition-colors">
              Reject
            </button>
          </div>
        </ModalOverlay>
      )}

      {/* Message Modal */}
      {msgModal && (
        <ModalOverlay onClose={() => setMsgModal(null)}>
          <h3 className="text-lg font-semibold text-mesh-text mb-4">Message {msgModal.name}</h3>
          <input
            value={msgSubject}
            onChange={(e) => setMsgSubject(e.target.value)}
            className="w-full px-3 py-2 text-sm bg-mesh-surface/40 border border-mesh-border/30 rounded-mesh-sm text-mesh-text placeholder:text-mesh-muted/60 focus:outline-none focus:border-mesh-gold/50 mb-3"
            placeholder="Subject"
          />
          <textarea
            value={msgBody}
            onChange={(e) => setMsgBody(e.target.value)}
            rows={4}
            className="w-full px-3 py-2 text-sm bg-mesh-surface/40 border border-mesh-border/30 rounded-mesh-sm text-mesh-text placeholder:text-mesh-muted/60 focus:outline-none focus:border-mesh-gold/50 mb-4"
            placeholder="Your message..."
          />
          <div className="flex justify-end gap-2">
            <button onClick={() => setMsgModal(null)} className="px-4 py-2 text-sm text-mesh-muted hover:text-mesh-text transition-colors">Cancel</button>
            <button onClick={handleMessage} disabled={actionLoading || !msgSubject.trim() || !msgBody.trim()} className="px-4 py-2 text-sm font-medium bg-mesh-gold text-black rounded-mesh-sm hover:bg-mesh-gold/80 disabled:opacity-40 transition-colors">
              Send Message
            </button>
          </div>
        </ModalOverlay>
      )}
    </div>
  );
}

function ModalOverlay({ children, onClose }: { children: React.ReactNode; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={onClose}>
      <div className="bg-mesh-card border border-mesh-border rounded-mesh-sm p-6 w-full max-w-md mx-4 shadow-xl" onClick={(e) => e.stopPropagation()}>
        {children}
      </div>
    </div>
  );
}

function PaginationControls({ page, totalPages, onPageChange }: { page: number; totalPages: number; onPageChange: (p: number) => void }) {
  return (
    <div className="flex items-center justify-center gap-2 pt-2">
      <button onClick={() => onPageChange(Math.max(1, page - 1))} disabled={page <= 1} className="px-3 py-1 text-sm bg-mesh-surface/40 border border-mesh-border/30 rounded-mesh-sm text-mesh-muted hover:text-mesh-text disabled:opacity-30 transition-colors">Prev</button>
      <span className="text-sm text-mesh-muted">{page} / {totalPages}</span>
      <button onClick={() => onPageChange(Math.min(totalPages, page + 1))} disabled={page >= totalPages} className="px-3 py-1 text-sm bg-mesh-surface/40 border border-mesh-border/30 rounded-mesh-sm text-mesh-muted hover:text-mesh-text disabled:opacity-30 transition-colors">Next</button>
    </div>
  );
}
