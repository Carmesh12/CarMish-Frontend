import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  Activity,
  BarChart3,
  CalendarDays,
  Camera,
  Car,
  CircleDollarSign,
  KeyRound,
  LayoutDashboard,
  PlusCircle,
  Send,
  ShoppingCart,
  Sparkles,
  Star,
  TrendingDown,
  TrendingUp,
  UserCog,
} from 'lucide-react';
import {
  askVendorAnalytics,
  getVendorDashboard,
  getVendorDashboardInsights,
} from '../api/vendorProfileApi';
import type {
  VendorAiInsight,
  VendorDashboardRange,
  VendorDashboardResponse,
  VendorTrendPoint,
} from '../types';
import { resolveMediaUrl } from '../../../lib/api';
import { Card } from '../../../components/ui/Card';
import { Spinner } from '../../../components/ui/Spinner';
import { Badge } from '../../../components/ui/Badge';
import { Button } from '../../../components/ui/Button';
import { Input } from '../../../components/ui/Input';

type AnalyticsChatMessage = {
  id: string;
  sender: 'vendor' | 'ai';
  message: string;
  source?: 'ai' | 'fallback';
};

const ACTION_ICONS: Record<string, React.ReactNode> = {
  'edit-profile': <UserCog size={16} />,
  'change-password': <KeyRound size={16} />,
  'upload-logo': <Camera size={16} />,
  'add-vehicle': <PlusCircle size={16} />,
  'my-vehicles': <Car size={16} />,
  purchases: <ShoppingCart size={16} />,
  rentals: <CalendarDays size={16} />,
};

const VERIFICATION_VARIANT: Record<string, 'warning' | 'success' | 'danger' | 'default'> = {
  PENDING: 'warning',
  APPROVED: 'success',
  REJECTED: 'danger',
};

const RANGES: { value: VendorDashboardRange; label: string }[] = [
  { value: 'week', label: 'Week' },
  { value: 'month', label: 'Month' },
  { value: 'year', label: 'Year' },
  { value: 'all', label: 'All time' },
];

function formatCurrency(value: number) {
  return `$${Math.round(value).toLocaleString()}`;
}

function maxTrendValue(points: VendorTrendPoint[]) {
  return Math.max(1, ...points.map((point) => point.total));
}

function KpiCard({
  icon,
  label,
  value,
  hint,
}: {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  hint?: string;
}) {
  return (
    <Card className="relative overflow-hidden">
      <div className="absolute -top-10 -inset-e-10 h-24 w-24 rounded-full bg-mesh-gold/10 blur-2xl" />
      <div className="relative flex items-start justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-wider text-mesh-muted">{label}</p>
          <p className="text-2xl font-bold text-mesh-text mt-2">{value}</p>
          {hint && <p className="text-xs text-mesh-muted mt-1">{hint}</p>}
        </div>
        <div className="h-10 w-10 rounded-mesh-sm bg-mesh-gold/10 text-mesh-gold flex items-center justify-center">
          {icon}
        </div>
      </div>
    </Card>
  );
}

function RequestTrendChart({ points }: { points: VendorTrendPoint[] }) {
  const max = maxTrendValue(points);
  const visiblePoints = points.slice(-12);

  return (
    <div className="h-48 flex items-end gap-2">
      {visiblePoints.map((point) => {
        const purchaseHeight = `${Math.max((point.purchase / max) * 100, point.purchase ? 8 : 0)}%`;
        const rentalHeight = `${Math.max((point.rental / max) * 100, point.rental ? 8 : 0)}%`;
        return (
          <div key={point.label} className="flex-1 min-w-0 flex flex-col items-center gap-2">
            <div className="h-36 w-full flex items-end gap-1">
              <div className="flex-1 rounded-t-md bg-mesh-gold/80" style={{ height: purchaseHeight }} title={`${point.purchase} purchase requests`} />
              <div className="flex-1 rounded-t-md bg-mesh-accent/80" style={{ height: rentalHeight }} title={`${point.rental} rental requests`} />
            </div>
            <span className="text-[10px] text-mesh-muted truncate w-full text-center">{point.label}</span>
          </div>
        );
      })}
    </div>
  );
}

function HorizontalBar({
  label,
  value,
  max,
}: {
  label: string;
  value: number;
  max: number;
}) {
  const width = max > 0 ? `${Math.max((value / max) * 100, value ? 8 : 0)}%` : '0%';
  return (
    <div className="space-y-1">
      <div className="flex justify-between gap-3 text-xs">
        <span className="text-mesh-text truncate">{label}</span>
        <span className="text-mesh-muted tabular-nums">{value}</span>
      </div>
      <div className="h-2 rounded-full bg-mesh-surface border border-mesh-border overflow-hidden">
        <div className="h-full rounded-full bg-linear-to-r from-mesh-gold to-mesh-accent" style={{ width }} />
      </div>
    </div>
  );
}

function FormattedChatMessage({ text }: { text: string }) {
  const blocks = text
    .split(/\n{2,}/)
    .map((block) => block.trim())
    .filter(Boolean);

  if (blocks.length === 0) return null;

  return (
    <div className="space-y-2 leading-relaxed">
      {blocks.map((block, blockIndex) => {
        const lines = block
          .split(/\r?\n/)
          .map((line) => line.trim())
          .filter(Boolean);
        const isList =
          lines.length > 1 &&
          lines.every((line) => /^([-*•]\s+|\d+[.)]\s+)/.test(line));

        if (isList) {
          return (
            <ul key={`${block}-${blockIndex}`} className="list-disc space-y-1 ps-4">
              {lines.map((line) => (
                <li key={line}>
                  {line.replace(/^([-*•]\s+|\d+[.)]\s+)/, '')}
                </li>
              ))}
            </ul>
          );
        }

        return (
          <p key={`${block}-${blockIndex}`} className="whitespace-pre-line">
            {block.replace(/^#{1,6}\s+/, '')}
          </p>
        );
      })}
    </div>
  );
}

export function VendorDashboardPage() {
  const { t } = useTranslation();
  const [data, setData] = useState<VendorDashboardResponse | null>(null);
  const [range, setRange] = useState<VendorDashboardRange>('month');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [aiInsights, setAiInsights] = useState<VendorAiInsight[] | null>(null);
  const [aiInsightsLoading, setAiInsightsLoading] = useState(false);
  const [aiInsightsError, setAiInsightsError] = useState<string | null>(null);
  const [chatInput, setChatInput] = useState('');
  const [chatLoading, setChatLoading] = useState(false);
  const [chatError, setChatError] = useState<string | null>(null);
  const [chatSuggestions, setChatSuggestions] = useState<string[]>([
    'How can I improve my underperforming vehicles?',
    'Which vehicles should I focus on this week?',
    'How can I increase purchase request approvals?',
  ]);
  const [chatMessages, setChatMessages] = useState<AnalyticsChatMessage[]>([
    {
      id: 'welcome',
      sender: 'ai',
      message:
        'Ask me about your dashboard analysis, vehicle performance, requests, pricing signals, or listing improvements.',
      source: 'ai',
    },
  ]);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    setAiInsights(null);
    setAiInsightsError(null);
    getVendorDashboard(range)
      .then((d) => {
        if (cancelled) return;
        setData(d);
        setLoading(false);
        setAiInsightsLoading(true);
        getVendorDashboardInsights(range)
          .then((response) => {
            if (!cancelled) setAiInsights(response.insights);
          })
          .catch((e: unknown) => {
            if (!cancelled) {
              setAiInsightsError(e instanceof Error ? e.message : 'Failed to load AI insights');
            }
          })
          .finally(() => {
            if (!cancelled) setAiInsightsLoading(false);
          });
      })
      .catch((e: unknown) => {
        if (!cancelled) setError(e instanceof Error ? e.message : 'Failed to load dashboard');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => { cancelled = true; };
  }, [range]);

  const sendAnalyticsQuestion = async (message: string) => {
    const trimmed = message.trim();
    if (!trimmed || chatLoading) return;

    const vendorMessage: AnalyticsChatMessage = {
      id: `vendor-${Date.now()}`,
      sender: 'vendor',
      message: trimmed,
    };
    setChatMessages((messages) => [...messages, vendorMessage]);
    setChatInput('');
    setChatError(null);
    setChatLoading(true);

    try {
      const response = await askVendorAnalytics({ message: trimmed, range });
      setChatMessages((messages) => [
        ...messages,
        {
          id: `ai-${Date.now()}`,
          sender: 'ai',
          message: response.answer,
          source: response.source,
        },
      ]);
      if (response.suggestions.length > 0) {
        setChatSuggestions(response.suggestions);
      }
    } catch (e: unknown) {
      setChatError(e instanceof Error ? e.message : 'Failed to ask analytics assistant');
    } finally {
      setChatLoading(false);
    }
  };

  if (loading) return <Spinner label={t('common.loading')} />;
  if (error) return <Card><p className="text-sm text-red-400" role="alert">{error}</p></Card>;
  if (!data) return null;

  const logoUrl = resolveMediaUrl(data.greeting.logoUrl);
  const analytics = data.analytics;
  const insights = aiInsights ?? analytics.insights;
  const insightsAreAiPowered = insights.some((insight) => insight.source === 'ai');
  const maxTopVehicleRequests = Math.max(1, ...analytics.topVehicles.map((vehicle) => vehicle.requests));

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <LayoutDashboard size={22} className="text-mesh-gold" />
          <div>
            <h1 className="text-2xl font-bold text-mesh-text">{t('dashboard.vendorDashboard')}</h1>
            <p className="text-sm text-mesh-muted">Track requests, revenue, inventory, and customer interest.</p>
          </div>
        </div>
        <div className="flex rounded-mesh-sm border border-mesh-border overflow-hidden bg-mesh-surface/70">
          {RANGES.map((item) => (
            <button
              key={item.value}
              type="button"
              onClick={() => setRange(item.value)}
              className={`px-3 py-2 text-sm transition-colors cursor-pointer ${
                range === item.value
                  ? 'bg-mesh-gold text-mesh-bg font-semibold'
                  : 'text-mesh-muted hover:text-mesh-text hover:bg-white/5'
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>

      {/* Greeting */}
      <Card className="overflow-hidden">
        <div className="flex flex-col sm:flex-row sm:items-center gap-6">
          <div className="shrink-0">
            {logoUrl ? (
              <img src={logoUrl} alt="" className="w-20 h-20 rounded-mesh-sm object-cover border border-mesh-border bg-mesh-surface" />
            ) : (
              <div className="w-20 h-20 rounded-mesh-sm bg-mesh-surface border border-mesh-border flex items-center justify-center text-mesh-muted text-2xl font-bold">
                {data.greeting.businessName.charAt(0)}
              </div>
            )}
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm text-mesh-muted">{t('dashboard.welcome')}</p>
            <p className="text-xl font-semibold text-mesh-text truncate">{data.greeting.businessName}</p>
            <p className="text-sm text-mesh-muted truncate">{data.greeting.contactPersonName}</p>
            <p className="text-xs text-mesh-muted truncate mt-1">{data.greeting.email}</p>
          </div>
          <div className="sm:ms-auto flex flex-col gap-2 items-start sm:items-end">
            <Badge variant={VERIFICATION_VARIANT[data.accountSummary.verificationStatus] ?? 'default'}>
              {t('profile.verificationStatus')}: {data.accountSummary.verificationStatus}
            </Badge>
            <Badge variant={data.accountSummary.isActive ? 'success' : 'danger'}>
              {data.accountSummary.isActive ? 'Active' : 'Inactive'}
            </Badge>
          </div>
        </div>
      </Card>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard icon={<CircleDollarSign size={18} />} label="Estimated revenue" value={formatCurrency(analytics.kpis.estimatedRevenue)} hint={`${formatCurrency(analytics.kpis.purchaseRevenue)} sales / ${formatCurrency(analytics.kpis.rentalRevenue)} rentals`} />
        <KpiCard icon={<Car size={18} />} label="Active listings" value={analytics.kpis.activeListings} hint={`${analytics.inventory.total} total vehicles`} />
        <KpiCard icon={<Activity size={18} />} label="Pending requests" value={analytics.kpis.pendingRequests} hint={`${analytics.requests.total} requests in range`} />
        <KpiCard icon={<Star size={18} />} label="Avg. rating" value={analytics.kpis.averageRating || '—'} hint={`${analytics.kpis.favorites} favorites / ${analytics.kpis.reports} reports`} />
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.4fr_0.9fr]">
        <Card>
          <div className="flex items-center justify-between gap-3 mb-4">
            <div>
              <h2 className="text-sm font-medium uppercase tracking-wider text-mesh-muted">Request trend</h2>
              <p className="text-xs text-mesh-muted mt-1">Gold = purchases, blue = rentals</p>
            </div>
            <BarChart3 size={20} className="text-mesh-gold" />
          </div>
          <RequestTrendChart points={analytics.trends} />
        </Card>

        <Card>
          <h2 className="text-sm font-medium uppercase tracking-wider text-mesh-muted mb-4">Inventory health</h2>
          <div className="space-y-4">
            <HorizontalBar label="Published" value={analytics.inventory.published} max={analytics.inventory.total || 1} />
            <HorizontalBar label="Draft" value={analytics.inventory.draft} max={analytics.inventory.total || 1} />
            <HorizontalBar label="Available" value={analytics.inventory.available} max={analytics.inventory.total || 1} />
            <HorizontalBar label="Sold" value={analytics.inventory.sold} max={analytics.inventory.total || 1} />
            <HorizontalBar label="Rented" value={analytics.inventory.rented} max={analytics.inventory.total || 1} />
          </div>
        </Card>
      </div>

      <div className="grid gap-6 xl:grid-cols-3">
        <Card>
          <h2 className="text-sm font-medium uppercase tracking-wider text-mesh-muted mb-4">Purchase requests</h2>
          <div className="grid grid-cols-2 gap-3 text-sm">
            <Badge variant="warning">Pending {analytics.requests.purchase.pending}</Badge>
            <Badge variant="success">Approved {analytics.requests.purchase.approved}</Badge>
            <Badge variant="danger">Rejected {analytics.requests.purchase.rejected}</Badge>
            <Badge variant="default">Total {analytics.requests.purchase.total}</Badge>
          </div>
        </Card>
        <Card>
          <h2 className="text-sm font-medium uppercase tracking-wider text-mesh-muted mb-4">Rental requests</h2>
          <div className="grid grid-cols-2 gap-3 text-sm">
            <Badge variant="warning">Pending {analytics.requests.rental.pending}</Badge>
            <Badge variant="success">Approved {analytics.requests.rental.approved}</Badge>
            <Badge variant="danger">Rejected {analytics.requests.rental.rejected}</Badge>
            <Badge variant="default">Total {analytics.requests.rental.total}</Badge>
          </div>
        </Card>
        <Card>
          <h2 className="text-sm font-medium uppercase tracking-wider text-mesh-muted mb-4">Conversion</h2>
          <div className="space-y-4">
            <HorizontalBar label="Approval rate" value={analytics.kpis.approvalRate} max={100} />
            <HorizontalBar label="Rejection rate" value={analytics.kpis.rejectionRate} max={100} />
          </div>
        </Card>
      </div>

      {/* Profile Completion */}
      <Card>
        <h2 className="text-sm font-medium uppercase tracking-wider text-mesh-muted mb-4">
          {t('dashboard.profileCompletion')}
        </h2>
        <div className="flex items-center gap-4 mb-4">
          <div className="flex-1 h-2 rounded-full bg-mesh-surface overflow-hidden border border-mesh-border">
            <div
              className="h-full bg-mesh-gold transition-[width] duration-500"
              style={{ width: `${data.profileCompletion.percentage}%` }}
            />
          </div>
          <span className="text-mesh-text font-semibold tabular-nums">
            {data.profileCompletion.percentage}%
          </span>
        </div>
        {data.profileCompletion.missingFields.length > 0 && (
          <p className="text-xs text-mesh-muted">
            Missing: {data.profileCompletion.missingFields.join(', ')}
          </p>
        )}
      </Card>

      <div className="grid gap-6 xl:grid-cols-2">
        <Card>
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp size={18} className="text-mesh-gold" />
            <h2 className="text-sm font-medium uppercase tracking-wider text-mesh-muted">Top vehicles</h2>
          </div>
          <div className="space-y-4">
            {analytics.topVehicles.length === 0 ? (
              <p className="text-sm text-mesh-muted">No vehicle activity yet.</p>
            ) : (
              analytics.topVehicles.map((vehicle) => (
                <div key={vehicle.id} className="space-y-2">
                  <div className="flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <Link to={`/vehicles/${vehicle.id}`} className="text-sm font-semibold text-mesh-text hover:text-mesh-gold transition-colors truncate block">
                        {vehicle.title}
                      </Link>
                      <p className="text-xs text-mesh-muted truncate">{vehicle.subtitle}</p>
                    </div>
                    <span className="text-xs text-mesh-muted shrink-0">{formatCurrency(vehicle.estimatedRevenue ?? 0)}</span>
                  </div>
                  <HorizontalBar label={`${vehicle.requests} requests`} value={vehicle.requests} max={maxTopVehicleRequests} />
                </div>
              ))
            )}
          </div>
        </Card>

        <Card>
          <div className="flex items-center gap-2 mb-4">
            <TrendingDown size={18} className="text-mesh-gold" />
            <h2 className="text-sm font-medium uppercase tracking-wider text-mesh-muted">Needs attention</h2>
          </div>
          <div className="space-y-3">
            {analytics.underperformingVehicles.length === 0 ? (
              <p className="text-sm text-mesh-muted">No underperforming published vehicles in this range.</p>
            ) : (
              analytics.underperformingVehicles.map((vehicle) => (
                <Link
                  key={vehicle.id}
                  to={`/vehicles/${vehicle.id}`}
                  className="block rounded-mesh-sm border border-mesh-border bg-mesh-surface/50 p-3 hover:border-mesh-gold/40 transition-colors"
                >
                  <p className="text-sm font-semibold text-mesh-text">{vehicle.title}</p>
                  <p className="text-xs text-mesh-muted">{vehicle.subtitle} · no requests or favorites</p>
                </Link>
              ))
            )}
          </div>
        </Card>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1fr_1fr]">
        <Card>
          <div className="flex items-center justify-between gap-3 mb-4">
            <div className="flex items-center gap-2">
              <Sparkles size={18} className="text-mesh-gold" />
              <h2 className="text-sm font-medium uppercase tracking-wider text-mesh-muted">Actionable insights</h2>
            </div>
            <Badge variant={insightsAreAiPowered ? 'success' : 'info'}>
              {aiInsightsLoading ? 'Generating AI' : insightsAreAiPowered ? 'AI powered' : 'Fallback'}
            </Badge>
          </div>
          {aiInsightsLoading && (
            <p className="mb-3 text-xs text-mesh-muted">
              Loading AI recommendations. Your dashboard analytics are ready while Gemini prepares deeper insights.
            </p>
          )}
          {aiInsightsError && (
            <p className="mb-3 text-xs text-amber-400" role="alert">
              AI insights could not load, showing dashboard-based fallback insights.
            </p>
          )}
          <div className="grid gap-3">
            {insights.length === 0 ? (
              <p className="text-sm text-mesh-muted">Everything looks healthy for this range.</p>
            ) : (
              insights.map((insight) => (
                <div key={`${insight.title}-${insight.message}`} className="rounded-mesh-sm border border-mesh-border bg-mesh-surface/50 p-3">
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge variant={insight.type === 'success' ? 'success' : insight.type === 'warning' ? 'warning' : 'info'}>
                      {insight.type}
                    </Badge>
                    <p className="text-sm font-semibold text-mesh-text">{insight.title}</p>
                  </div>
                  <p className="text-sm text-mesh-text mt-2">{insight.message}</p>
                  {insight.action && (
                    <p className="text-xs text-mesh-muted mt-2">
                      Next step: {insight.action}
                    </p>
                  )}
                </div>
              ))
            )}
          </div>
        </Card>

        <Card className="flex min-h-[440px] flex-col">
          <div className="mb-4">
            <div className="flex items-center gap-2">
              <Sparkles size={18} className="text-mesh-gold" />
              <h2 className="text-sm font-medium uppercase tracking-wider text-mesh-muted">Analytics AI assistant</h2>
            </div>
            <p className="text-xs text-mesh-muted mt-1">
              Ask about this dashboard range only. The assistant uses your analytics and avoids unrelated questions.
            </p>
          </div>

          <div className="flex-1 space-y-3 overflow-y-auto rounded-mesh-sm border border-mesh-border bg-mesh-surface/40 p-3">
            {chatMessages.map((message) => (
              <div
                key={message.id}
                className={`flex ${message.sender === 'vendor' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[85%] rounded-mesh-sm px-3 py-2 text-sm ${
                    message.sender === 'vendor'
                      ? 'bg-mesh-gold text-mesh-bg'
                      : 'border border-mesh-border bg-mesh-card text-mesh-text'
                  }`}
                >
                  <FormattedChatMessage text={message.message} />
                  {message.source === 'fallback' && (
                    <p className="mt-1 text-[10px] uppercase tracking-wider text-mesh-muted">fallback answer</p>
                  )}
                </div>
              </div>
            ))}
            {chatLoading && (
              <p className="text-xs text-mesh-muted">Thinking through your dashboard data...</p>
            )}
          </div>

          <div className="mt-3 flex flex-wrap gap-2">
            {chatSuggestions.slice(0, 3).map((suggestion) => (
              <button
                key={suggestion}
                type="button"
                onClick={() => sendAnalyticsQuestion(suggestion)}
                disabled={chatLoading}
                className="rounded-full border border-mesh-border px-3 py-1 text-xs text-mesh-muted transition-colors hover:border-mesh-gold/50 hover:text-mesh-text disabled:cursor-not-allowed disabled:opacity-60"
              >
                {suggestion}
              </button>
            ))}
          </div>

          {chatError && <p className="mt-2 text-xs text-red-400" role="alert">{chatError}</p>}

          <form
            className="mt-3 flex gap-2"
            onSubmit={(event) => {
              event.preventDefault();
              sendAnalyticsQuestion(chatInput);
            }}
          >
            <div className="flex-1">
              <Input
                value={chatInput}
                onChange={(event) => setChatInput(event.target.value)}
                placeholder="Ask how to improve visibility, requests, or a specific vehicle..."
                disabled={chatLoading}
                className="h-11"
              />
            </div>
            <Button type="submit" disabled={chatLoading || !chatInput.trim()}>
              <Send size={16} />
              Ask
            </Button>
          </form>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <h2 className="text-sm font-medium uppercase tracking-wider text-mesh-muted mb-4">
          {t('dashboard.quickActions')}
        </h2>
        <div className="flex flex-wrap gap-3">
          {data.quickActions.map((action) => (
            <Link key={action.id} to={action.path}>
              <Button variant="secondary" size="sm">
                {ACTION_ICONS[action.id] ?? <LayoutDashboard size={16} />}
                {action.label}
              </Button>
            </Link>
          ))}
        </div>
      </Card>
    </div>
  );
}
