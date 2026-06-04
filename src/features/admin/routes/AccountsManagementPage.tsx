import { useEffect, useState } from 'react';
import { Search, ShieldOff, ShieldCheck } from 'lucide-react';
import { toast } from 'react-toastify';
import { Card } from '../../../components/ui/Card';
import { Spinner } from '../../../components/ui/Spinner';
import { Badge } from '../../../components/ui/Badge';
import {
  getAdminAccounts,
  deactivateAccount,
  activateAccount,
  type AccountListItem,
  type Paginated,
} from '../api';

export function AccountsManagementPage() {
  const [data, setData] = useState<Paginated<AccountListItem> | null>(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [roleFilter, setRoleFilter] = useState('');
  const [activeFilter, setActiveFilter] = useState('');
  const [search, setSearch] = useState('');
  const [modal, setModal] = useState<{ id: string; email: string; action: 'deactivate' | 'activate' } | null>(null);
  const [reason, setReason] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  const fetchData = () => {
    setLoading(true);
    getAdminAccounts(page, 10, roleFilter || undefined, activeFilter || undefined, search || undefined)
      .then((res: Paginated<AccountListItem>) => { setData(res); setLoading(false); })
      .catch(() => setLoading(false));
  };

  useEffect(() => { fetchData(); }, [page, roleFilter, activeFilter, search]);

  const handleAction = async () => {
    if (!modal) return;
    setActionLoading(true);
    try {
      if (modal.action === 'deactivate') {
        await deactivateAccount(modal.id, reason || undefined);
        toast.success('Account deactivated');
      } else {
        await activateAccount(modal.id);
        toast.success('Account activated');
      }
      setModal(null);
      setReason('');
      fetchData();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Action failed';
      toast.error(message);
    } finally {
      setActionLoading(false);
    }
  };

  const getDisplayName = (account: AccountListItem) => {
    if (account.user) return `${account.user.firstName} ${account.user.lastName}`;
    if (account.vendor) return account.vendor.businessName;
    if (account.admin) return `${account.admin.firstName} ${account.admin.lastName}`;
    return account.email;
  };

  return (
    <div className="space-y-6 pb-8">
      <h1 className="text-2xl font-bold text-mesh-text">Accounts Management</h1>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <div className="relative">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-mesh-muted" />
          <input
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            placeholder="Search by email..."
            className="pl-9 pr-3 py-2 text-sm bg-mesh-surface/40 border border-mesh-border/30 rounded-mesh-sm text-mesh-text placeholder:text-mesh-muted/60 focus:outline-none focus:border-mesh-gold/50 w-64"
          />
        </div>
        <select
          value={roleFilter}
          onChange={(e) => { setRoleFilter(e.target.value); setPage(1); }}
          className="px-3 py-2 text-sm bg-mesh-surface/40 border border-mesh-border/30 rounded-mesh-sm text-mesh-text focus:outline-none focus:border-mesh-gold/50"
        >
          <option value="">All Roles</option>
          <option value="USER">User</option>
          <option value="VENDOR">Vendor</option>
          <option value="ADMIN">Admin</option>
        </select>
        <select
          value={activeFilter}
          onChange={(e) => { setActiveFilter(e.target.value); setPage(1); }}
          className="px-3 py-2 text-sm bg-mesh-surface/40 border border-mesh-border/30 rounded-mesh-sm text-mesh-text focus:outline-none focus:border-mesh-gold/50"
        >
          <option value="">All Status</option>
          <option value="true">Active</option>
          <option value="false">Inactive</option>
        </select>
      </div>

      {loading ? (
        <div className="flex justify-center py-12"><Spinner size={28} /></div>
      ) : !data || data.data.length === 0 ? (
        <Card padding><p className="text-mesh-muted text-sm text-center py-6">No accounts found.</p></Card>
      ) : (
        <Card padding>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead><tr className="text-mesh-muted text-xs border-b border-mesh-border">
                <th className="text-left pb-2">Name</th>
                <th className="text-left pb-2">Email</th>
                <th className="text-left pb-2">Role</th>
                <th className="text-center pb-2">Status</th>
                <th className="text-right pb-2">Reports</th>
                <th className="text-right pb-2">Since</th>
                <th className="text-right pb-2">Action</th>
              </tr></thead>
              <tbody>
                {data.data.map((acc) => (
                  <tr key={acc.id} className="border-b border-mesh-border/30">
                    <td className="py-2.5 text-mesh-text font-medium">{getDisplayName(acc)}</td>
                    <td className="py-2.5 text-mesh-muted">{acc.email}</td>
                    <td className="py-2.5">
                      <Badge variant={acc.role === 'ADMIN' ? 'gold' : acc.role === 'VENDOR' ? 'info' : 'default'}>
                        {acc.role}
                      </Badge>
                    </td>
                    <td className="py-2.5 text-center">
                      <Badge variant={acc.isActive ? 'success' : 'danger'}>
                        {acc.isActive ? 'Active' : 'Inactive'}
                      </Badge>
                    </td>
                    <td className="py-2.5 text-right text-mesh-muted">{acc._count.reports}</td>
                    <td className="py-2.5 text-right text-mesh-muted text-xs">{new Date(acc.createdAt).toLocaleDateString()}</td>
                    <td className="py-2.5 text-right">
                      {acc.role !== 'ADMIN' && (
                        acc.isActive ? (
                          <button
                            onClick={() => setModal({ id: acc.id, email: acc.email, action: 'deactivate' })}
                            className="flex items-center gap-1 px-2 py-1 text-xs font-medium bg-red-600/20 text-red-400 border border-red-600/30 rounded-mesh-sm hover:bg-red-600/30 transition-colors ml-auto"
                          >
                            <ShieldOff size={12} /> Deactivate
                          </button>
                        ) : (
                          <button
                            onClick={() => setModal({ id: acc.id, email: acc.email, action: 'activate' })}
                            className="flex items-center gap-1 px-2 py-1 text-xs font-medium bg-emerald-600/20 text-emerald-400 border border-emerald-600/30 rounded-mesh-sm hover:bg-emerald-600/30 transition-colors ml-auto"
                          >
                            <ShieldCheck size={12} /> Activate
                          </button>
                        )
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {data && data.meta.totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <button onClick={() => setPage(Math.max(1, page - 1))} disabled={page <= 1} className="px-3 py-1 text-sm bg-mesh-surface/40 border border-mesh-border/30 rounded-mesh-sm text-mesh-muted hover:text-mesh-text disabled:opacity-30 transition-colors">Prev</button>
          <span className="text-sm text-mesh-muted">{page} / {data.meta.totalPages}</span>
          <button onClick={() => setPage(Math.min(data.meta.totalPages, page + 1))} disabled={page >= data.meta.totalPages} className="px-3 py-1 text-sm bg-mesh-surface/40 border border-mesh-border/30 rounded-mesh-sm text-mesh-muted hover:text-mesh-text disabled:opacity-30 transition-colors">Next</button>
        </div>
      )}

      {/* Action Modal */}
      {modal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={() => setModal(null)}>
          <div className="bg-mesh-card border border-mesh-border rounded-mesh-sm p-6 w-full max-w-md mx-4 shadow-xl" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-semibold text-mesh-text mb-2">
              {modal.action === 'deactivate' ? 'Deactivate' : 'Activate'} Account
            </h3>
            <p className="text-sm text-mesh-muted mb-4">
              {modal.action === 'deactivate'
                ? `Are you sure you want to deactivate ${modal.email}? They will no longer be able to log in.`
                : `Reactivate ${modal.email}? They will regain access to the platform.`}
            </p>
            {modal.action === 'deactivate' && (
              <textarea
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                rows={2}
                className="w-full px-3 py-2 text-sm bg-mesh-surface/40 border border-mesh-border/30 rounded-mesh-sm text-mesh-text placeholder:text-mesh-muted/60 focus:outline-none focus:border-mesh-gold/50 mb-4"
                placeholder="Reason for deactivation (optional)"
              />
            )}
            <div className="flex justify-end gap-2">
              <button onClick={() => setModal(null)} className="px-4 py-2 text-sm text-mesh-muted hover:text-mesh-text transition-colors">Cancel</button>
              <button
                onClick={handleAction}
                disabled={actionLoading}
                className={`px-4 py-2 text-sm font-medium rounded-mesh-sm transition-colors disabled:opacity-40 ${
                  modal.action === 'deactivate'
                    ? 'bg-red-600 text-white hover:bg-red-700'
                    : 'bg-emerald-600 text-white hover:bg-emerald-700'
                }`}
              >
                {modal.action === 'deactivate' ? 'Deactivate' : 'Activate'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
