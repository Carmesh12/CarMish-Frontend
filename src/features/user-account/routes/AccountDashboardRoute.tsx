import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { resolveMediaUrl } from '../../../lib/api';
import { getUserDashboard } from '../api/userProfileApi';
import type { UserDashboardResponse } from '../types';
import { AccountLayout } from '../components/AccountLayout';

function isApiError(e: unknown): e is Error & { status?: number } {
  return e instanceof Error && 'status' in e;
}

export function AccountDashboardRoute() {
  const [data, setData] = useState<UserDashboardResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const d = await getUserDashboard();
        if (!cancelled) {
          setData(d);
          setError(null);
        }
      } catch (e: unknown) {
        if (cancelled) return;
        if (isApiError(e) && e.status === 403) {
          setError(
            'This overview is only available for customer accounts. Vendors and admins use a different workspace.',
          );
        } else if (isApiError(e) && e.status === 401) {
          setError('Your session expired. Please sign in again.');
        } else {
          setError(e instanceof Error ? e.message : 'Could not load account overview.');
        }
        setData(null);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <AccountLayout title="Account overview" subtitle="Your account">
      {loading ? (
        <div className="rounded-[var(--radius-mesh)] border border-mesh-border bg-mesh-card p-10 text-center text-mesh-muted text-sm">
          Loading…
        </div>
      ) : error ? (
        <div
          className="rounded-[var(--radius-mesh)] border border-mesh-border bg-mesh-card p-8 text-sm text-mesh-muted leading-relaxed"
          role="alert"
        >
          {error}
        </div>
      ) : data ? (
        <div className="space-y-6">
          <div className="rounded-[var(--radius-mesh)] border border-mesh-border bg-mesh-card p-6 sm:p-8 shadow-[var(--shadow-mesh-soft)]">
            <div className="flex flex-col sm:flex-row sm:items-center gap-6">
              <div className="shrink-0">
                {(() => {
                  const avatarUrl = resolveMediaUrl(
                    data.greeting.profileImageUrl,
                  );
                  return avatarUrl ? (
                    <img
                      src={avatarUrl}
                      alt=""
                      className="w-20 h-20 rounded-full object-cover border border-mesh-border"
                    />
                  ) : (
                    <div
                      className="w-20 h-20 rounded-full bg-mesh-surface border border-mesh-border flex items-center justify-center text-mesh-muted text-xs uppercase tracking-wider"
                      aria-hidden
                    >
                      No photo
                    </div>
                  );
                })()}
              </div>
              <div className="min-w-0">
                <p className="text-mesh-muted text-sm">Signed in as</p>
                <p className="text-xl font-semibold text-mesh-text truncate">
                  {data.greeting.fullName}
                </p>
                <p className="text-sm text-mesh-muted truncate">{data.greeting.email}</p>
              </div>
            </div>
          </div>

          <div className="rounded-[var(--radius-mesh)] border border-mesh-border bg-mesh-card p-6 sm:p-8 shadow-[var(--shadow-mesh-soft)]">
            <h2 className="text-sm font-medium uppercase tracking-wider text-mesh-muted mb-4">
              Account summary
            </h2>
            <dl className="grid gap-3 text-sm sm:grid-cols-2">
              <div>
                <dt className="text-mesh-muted">Role</dt>
                <dd className="text-mesh-text font-medium">{data.accountSummary.role}</dd>
              </div>
              <div>
                <dt className="text-mesh-muted">Status</dt>
                <dd className="text-mesh-text font-medium">
                  {data.accountSummary.isActive ? 'Active' : 'Inactive'}
                </dd>
              </div>
              <div className="sm:col-span-2">
                <dt className="text-mesh-muted">Member since</dt>
                <dd className="text-mesh-text font-medium">
                  {new Date(data.accountSummary.memberSince).toLocaleDateString(undefined, {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  })}
                </dd>
              </div>
            </dl>
          </div>

          <div className="rounded-[var(--radius-mesh)] border border-mesh-border bg-mesh-card p-6 sm:p-8 shadow-[var(--shadow-mesh-soft)]">
            <h2 className="text-sm font-medium uppercase tracking-wider text-mesh-muted mb-4">
              Profile completion
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
            <p className="text-xs text-mesh-muted mb-2">
              Completed: {data.profileCompletion.completedFields.join(', ') || '—'}
            </p>
            <p className="text-xs text-mesh-muted">
              Missing: {data.profileCompletion.missingFields.join(', ') || '—'}
            </p>
          </div>

          <div className="rounded-[var(--radius-mesh)] border border-mesh-border bg-mesh-card p-6 sm:p-8 shadow-[var(--shadow-mesh-soft)]">
            <h2 className="text-sm font-medium uppercase tracking-wider text-mesh-muted mb-4">
              Quick actions
            </h2>
            <ul className="flex flex-col sm:flex-row flex-wrap gap-3">
              {data.quickActions.map((a) => {
                const to =
                  a.path === '/user/profile'
                    ? '/account/profile'
                    : a.path === '/user/profile/password'
                      ? '/account/profile#change-password'
                      : a.path;
                return (
                  <li key={a.id}>
                    <Link
                      to={to}
                      className="inline-flex items-center justify-center py-2.5 px-4 rounded-[var(--radius-mesh-sm)] text-sm font-medium bg-mesh-surface border border-mesh-border text-mesh-text hover:border-mesh-gold/50 hover:text-mesh-gold transition-colors"
                    >
                      {a.label}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        </div>
      ) : null}
    </AccountLayout>
  );
}
