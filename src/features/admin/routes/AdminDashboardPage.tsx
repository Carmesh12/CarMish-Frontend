import { useEffect, useState } from 'react';
import { Send, Sparkles, TrendingUp, Users, Car, DollarSign, AlertTriangle, ClipboardList } from 'lucide-react';
import { Card } from '../../../components/ui/Card';
import { Spinner } from '../../../components/ui/Spinner';
import { Badge } from '../../../components/ui/Badge';
import {
  getAdminDashboard,
  getAdminDashboardInsights,
  askAdminAnalytics,
  type AdminDashboardRange,
  type AdminDashboardResponse,
  type AdminInsightsResponse,
  type AdminAiInsight,
} from '../api';

type ChatMessage = { role: 'user' | 'ai'; text: string };

function FormattedChatMessage({ text }: { text: string }) {
  const paragraphs = text.split(/\n{2,}/);
  return (
    <div className="space-y-2 text-sm leading-relaxed">
      {paragraphs.map((para, i) => {
        const lines = para.split('\n');
        const isList = lines.every((l) => /^[-*•]\s|^\d+[.)]\s/.test(l.trim()) || l.trim() === '');
        if (isList) {
          return (
            <ul key={i} className="space-y-1 list-none">
              {lines.filter((l) => l.trim()).map((l, j) => (
                <li key={j} className="flex gap-2">
                  <span className="text-mesh-gold shrink-0">•</span>
                  <span>{l.replace(/^[-*•]\s*|^\d+[.)]\s*/, '')}</span>
                </li>
              ))}
            </ul>
          );
        }
        return <p key={i}>{para}</p>;
      })}
    </div>
  );
}

const ranges: { value: AdminDashboardRange; label: string }[] = [
  { value: 'week', label: 'This Week' },
  { value: 'month', label: 'This Month' },
  { value: 'year', label: 'This Year' },
  { value: 'all', label: 'All Time' },
];

export function AdminDashboardPage() {
  const [range, setRange] = useState<AdminDashboardRange>('month');
  const [dashboard, setDashboard] = useState<AdminDashboardResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [insights, setInsights] = useState<AdminAiInsight[]>([]);
  const [insightsLoading, setInsightsLoading] = useState(true);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [chatInput, setChatInput] = useState('');
  const [chatLoading, setChatLoading] = useState(false);
  const [chatSuggestions, setChatSuggestions] = useState<string[]>([]);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    getAdminDashboard(range).then((res: AdminDashboardResponse) => {
      if (!cancelled) { setDashboard(res); setLoading(false); }
    }).catch(() => { if (!cancelled) setLoading(false); });

    setInsightsLoading(true);
    getAdminDashboardInsights(range).then((res: AdminInsightsResponse) => {
      if (!cancelled) { setInsights(res.insights); setInsightsLoading(false); }
    }).catch(() => { if (!cancelled) setInsightsLoading(false); });

    return () => { cancelled = true; };
  }, [range]);

  const sendQuestion = async (msg: string) => {
    if (!msg.trim() || chatLoading) return;
    const question = msg.trim();
    setChatInput('');
    setChatMessages((prev) => [...prev, { role: 'user', text: question }]);
    setChatLoading(true);
    try {
      const res = await askAdminAnalytics({ message: question, range });
      setChatMessages((prev) => [...prev, { role: 'ai', text: res.answer }]);
      if (res.suggestions?.length) setChatSuggestions(res.suggestions);
    } catch {
      setChatMessages((prev) => [...prev, { role: 'ai', text: 'Sorry, something went wrong. Please try again.' }]);
    } finally {
      setChatLoading(false);
    }
  };

  if (loading) {
    return <div className="flex items-center justify-center h-64"><Spinner size={32} /></div>;
  }

  if (!dashboard) {
    return <div className="text-center text-mesh-muted p-8">Failed to load dashboard.</div>;
  }

  const { analytics, greeting } = dashboard;
  const { kpis, growth, vendors, reports, topVendors, topReportedVehicles } = analytics;

  const kpiCards = [
    { label: 'Total Users', value: kpis.totalUsers, icon: <Users size={20} />, color: 'text-blue-400' },
    { label: 'Total Vendors', value: kpis.totalVendors, icon: <Users size={20} />, color: 'text-emerald-400' },
    { label: 'Active Listings', value: kpis.activeListings, icon: <Car size={20} />, color: 'text-mesh-gold' },
    { label: 'Revenue', value: `$${kpis.totalRevenue.toLocaleString()}`, icon: <DollarSign size={20} />, color: 'text-green-400' },
    { label: 'Pending Vendors', value: kpis.pendingVendors, icon: <ClipboardList size={20} />, color: 'text-amber-400' },
    { label: 'Open Reports', value: kpis.openReports, icon: <AlertTriangle size={20} />, color: 'text-red-400' },
  ];

  return (
    <div className="space-y-6 pb-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-mesh-text">Welcome back, {greeting.fullName}</h1>
          <p className="text-mesh-muted text-sm mt-1">Platform administration overview</p>
        </div>
        <div className="flex gap-1 bg-mesh-surface/40 rounded-mesh-sm p-1">
          {ranges.map((r) => (
            <button
              key={r.value}
              onClick={() => setRange(r.value)}
              className={`px-3 py-1.5 text-xs font-medium rounded-mesh-sm transition-colors ${
                range === r.value ? 'bg-mesh-gold text-black' : 'text-mesh-muted hover:text-mesh-text'
              }`}
            >
              {r.label}
            </button>
          ))}
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        {kpiCards.map((kpi) => (
          <Card key={kpi.label} padding className="text-center">
            <div className={`flex items-center justify-center mb-2 ${kpi.color}`}>{kpi.icon}</div>
            <div className="text-lg font-bold text-mesh-text">{kpi.value}</div>
            <div className="text-xs text-mesh-muted">{kpi.label}</div>
          </Card>
        ))}
      </div>

      {/* Growth & Status */}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
        <Card padding>
          <h3 className="text-sm font-semibold text-mesh-text mb-3 flex items-center gap-2">
            <TrendingUp size={16} className="text-mesh-gold" /> Growth ({range})
          </h3>
          <div className="space-y-3">
            <GrowthBar label="New Users" value={growth.newUsersInRange} max={Math.max(growth.newUsersInRange, growth.newVendorsInRange, growth.newVehiclesInRange, 1)} color="bg-blue-400" />
            <GrowthBar label="New Vendors" value={growth.newVendorsInRange} max={Math.max(growth.newUsersInRange, growth.newVendorsInRange, growth.newVehiclesInRange, 1)} color="bg-emerald-400" />
            <GrowthBar label="New Vehicles" value={growth.newVehiclesInRange} max={Math.max(growth.newUsersInRange, growth.newVendorsInRange, growth.newVehiclesInRange, 1)} color="bg-mesh-gold" />
          </div>
        </Card>

        <Card padding>
          <h3 className="text-sm font-semibold text-mesh-text mb-3">Vendor Status</h3>
          <div className="space-y-3">
            <StatusBar label="Approved" value={vendors.approved} total={vendors.approved + vendors.pending + vendors.rejected} color="bg-emerald-400" />
            <StatusBar label="Pending" value={vendors.pending} total={vendors.approved + vendors.pending + vendors.rejected} color="bg-amber-400" />
            <StatusBar label="Rejected" value={vendors.rejected} total={vendors.approved + vendors.pending + vendors.rejected} color="bg-red-400" />
          </div>
        </Card>

        <Card padding>
          <h3 className="text-sm font-semibold text-mesh-text mb-3">Reports Overview</h3>
          <div className="space-y-3">
            <StatusBar label="Pending" value={reports.pending} total={reports.pending + reports.reviewed + reports.resolved + reports.dismissed} color="bg-amber-400" />
            <StatusBar label="Reviewed" value={reports.reviewed} total={reports.pending + reports.reviewed + reports.resolved + reports.dismissed} color="bg-blue-400" />
            <StatusBar label="Resolved" value={reports.resolved} total={reports.pending + reports.reviewed + reports.resolved + reports.dismissed} color="bg-emerald-400" />
            <StatusBar label="Dismissed" value={reports.dismissed} total={reports.pending + reports.reviewed + reports.resolved + reports.dismissed} color="bg-gray-400" />
          </div>
        </Card>
      </div>

      {/* Top Tables */}
      <div className="grid lg:grid-cols-2 gap-4">
        <Card padding>
          <h3 className="text-sm font-semibold text-mesh-text mb-3">Top Vendors</h3>
          {topVendors.length === 0 ? (
            <p className="text-mesh-muted text-sm">No vendor data yet.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead><tr className="text-mesh-muted text-xs border-b border-mesh-border">
                  <th className="text-left pb-2">Business</th>
                  <th className="text-right pb-2">Vehicles</th>
                  <th className="text-right pb-2">Requests</th>
                </tr></thead>
                <tbody>
                  {topVendors.map((v) => (
                    <tr key={v.id} className="border-b border-mesh-border/30">
                      <td className="py-2 text-mesh-text">{v.businessName}</td>
                      <td className="py-2 text-right text-mesh-muted">{v.vehicles}</td>
                      <td className="py-2 text-right text-mesh-muted">{v.purchaseRequests + v.rentalRequests}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>

        <Card padding>
          <h3 className="text-sm font-semibold text-mesh-text mb-3">Top Reported Vehicles</h3>
          {topReportedVehicles.length === 0 ? (
            <p className="text-mesh-muted text-sm">No reports yet.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead><tr className="text-mesh-muted text-xs border-b border-mesh-border">
                  <th className="text-left pb-2">Vehicle</th>
                  <th className="text-left pb-2">Vendor</th>
                  <th className="text-right pb-2">Reports</th>
                </tr></thead>
                <tbody>
                  {topReportedVehicles.map((v) => (
                    <tr key={v.vehicleId} className="border-b border-mesh-border/30">
                      <td className="py-2 text-mesh-text">{v.title}</td>
                      <td className="py-2 text-mesh-muted">{v.vendorName}</td>
                      <td className="py-2 text-right">
                        <Badge variant={v.reportCount >= 6 ? 'danger' : v.reportCount >= 3 ? 'warning' : 'default'}>
                          {v.reportCount}
                        </Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      </div>

      {/* AI Section */}
      <div className="grid lg:grid-cols-2 gap-4">
        {/* AI Insights */}
        <Card padding>
          <div className="flex items-center gap-2 mb-4">
            <Sparkles size={18} className="text-mesh-gold" />
            <h3 className="text-sm font-semibold text-mesh-text">Actionable Insights</h3>
            {!insightsLoading && insights.length > 0 && (
              <Badge variant={insights[0]?.source === 'ai' ? 'gold' : 'info'} className="text-[10px]">
                {insights[0]?.source === 'ai' ? 'AI powered' : 'Fallback'}
              </Badge>
            )}
          </div>
          {insightsLoading ? (
            <div className="flex items-center gap-2 text-mesh-muted text-sm py-8 justify-center">
              <Spinner size={16} /> Generating insights...
            </div>
          ) : (
            <div className="space-y-3">
              {insights.map((insight, i) => (
                <div key={i} className="p-3 rounded-mesh-sm bg-mesh-surface/30 border border-mesh-border/30">
                  <div className="flex items-center gap-2 mb-1">
                    <Badge variant={insight.type === 'success' ? 'success' : insight.type === 'warning' ? 'warning' : 'info'} className="text-[10px]">
                      {insight.type}
                    </Badge>
                    <span className="text-xs font-medium text-mesh-text">{insight.title}</span>
                  </div>
                  <p className="text-xs text-mesh-muted">{insight.message}</p>
                  {insight.action && (
                    <p className="text-xs text-mesh-gold mt-1">→ {insight.action}</p>
                  )}
                </div>
              ))}
            </div>
          )}
        </Card>

        {/* AI Chatbot */}
        <Card padding>
          <div className="flex items-center gap-2 mb-4">
            <Sparkles size={18} className="text-mesh-gold" />
            <h3 className="text-sm font-semibold text-mesh-text">Analytics AI Assistant</h3>
          </div>
          <div className="flex flex-col h-[340px]">
            <div className="flex-1 overflow-y-auto space-y-3 mb-3 pr-1">
              {chatMessages.length === 0 && (
                <p className="text-mesh-muted text-xs text-center pt-8">Ask me about your platform analytics.</p>
              )}
              {chatMessages.map((msg, i) => (
                <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[85%] px-3 py-2 rounded-mesh-sm ${
                    msg.role === 'user'
                      ? 'bg-mesh-gold/20 text-mesh-text'
                      : 'bg-mesh-surface/50 text-mesh-text'
                  }`}>
                    {msg.role === 'ai' ? <FormattedChatMessage text={msg.text} /> : <p className="text-sm">{msg.text}</p>}
                  </div>
                </div>
              ))}
              {chatLoading && (
                <div className="flex justify-start">
                  <div className="px-3 py-2 rounded-mesh-sm bg-mesh-surface/50">
                    <Spinner size={14} />
                  </div>
                </div>
              )}
            </div>

            {chatSuggestions.length > 0 && chatMessages.length === 0 && (
              <div className="flex flex-wrap gap-1.5 mb-2">
                {chatSuggestions.map((s, i) => (
                  <button key={i} onClick={() => sendQuestion(s)} className="text-[11px] px-2 py-1 rounded-mesh-sm bg-mesh-surface/50 text-mesh-muted hover:text-mesh-text hover:bg-mesh-surface/80 transition-colors border border-mesh-border/20">
                    {s}
                  </button>
                ))}
              </div>
            )}

            <form onSubmit={(e) => { e.preventDefault(); sendQuestion(chatInput); }} className="flex gap-2">
              <div className="flex-1">
                <input
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  placeholder="Ask about platform analytics..."
                  className="w-full px-3 py-2 text-sm bg-mesh-surface/40 border border-mesh-border/30 rounded-mesh-sm text-mesh-text placeholder:text-mesh-muted/60 focus:outline-none focus:border-mesh-gold/50"
                  disabled={chatLoading}
                />
              </div>
              <button type="submit" disabled={chatLoading || !chatInput.trim()} className="p-2 rounded-mesh-sm bg-mesh-gold text-black hover:bg-mesh-gold/80 disabled:opacity-40 transition-colors">
                <Send size={16} />
              </button>
            </form>
          </div>
        </Card>
      </div>
    </div>
  );
}

function GrowthBar({ label, value, max, color }: { label: string; value: number; max: number; color: string }) {
  const pct = max > 0 ? (value / max) * 100 : 0;
  return (
    <div>
      <div className="flex justify-between text-xs mb-1">
        <span className="text-mesh-muted">{label}</span>
        <span className="text-mesh-text font-medium">{value}</span>
      </div>
      <div className="h-2 bg-mesh-surface/50 rounded-full overflow-hidden">
        <div className={`h-full rounded-full ${color}`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

function StatusBar({ label, value, total, color }: { label: string; value: number; total: number; color: string }) {
  const pct = total > 0 ? (value / total) * 100 : 0;
  return (
    <div>
      <div className="flex justify-between text-xs mb-1">
        <span className="text-mesh-muted">{label}</span>
        <span className="text-mesh-text font-medium">{value}</span>
      </div>
      <div className="h-2 bg-mesh-surface/50 rounded-full overflow-hidden">
        <div className={`h-full rounded-full ${color}`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}
