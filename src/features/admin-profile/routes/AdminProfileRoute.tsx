import React, { useEffect, useState } from 'react';
import { InputField } from '../../auth/components/InputField';
import { getAdminProfile, patchAdminProfile } from '../api/adminProfileApi';
import type { AdminProfileResponse } from '../types';
import { AdminAccountLayout } from '../components/AdminAccountLayout';
import { notifyPromise } from '../../../lib/toast';

function isApiError(e: unknown): e is Error & { status?: number } {
  return e instanceof Error && 'status' in e;
}

export function AdminProfileRoute() {
  const [profile, setProfile] = useState<AdminProfileResponse | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const p = await getAdminProfile();
        if (cancelled) return;
        applyToForm(p);
        setLoadError(null);
      } catch (e: unknown) {
        if (cancelled) return;
        if (isApiError(e) && e.status === 403) {
          setLoadError('Admin profile is only available for admin accounts.');
        } else {
          setLoadError(
            e instanceof Error ? e.message : 'Could not load profile.',
          );
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const applyToForm = (p: AdminProfileResponse) => {
    setProfile(p);
    setFirstName(p.firstName);
    setLastName(p.lastName);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile) return;
    setSaving(true);
    const task = patchAdminProfile({
      firstName: firstName.trim(),
      lastName: lastName.trim(),
    });
    void notifyPromise(task, {
      pending: 'Saving profile…',
      success: 'Profile updated.',
      error: {
        render({ data }) {
          return data instanceof Error ? data.message : 'Update failed';
        },
      },
    })
      .then((updated) => applyToForm(updated))
      .catch(() => {})
      .finally(() => setSaving(false));
  };

  return (
    <AdminAccountLayout title="Profile" subtitle="Admin profile">
      {loading ? (
        <div className="rounded-[var(--radius-mesh)] border border-mesh-border bg-mesh-card p-10 text-center text-mesh-muted text-sm">
          Loading…
        </div>
      ) : loadError ? (
        <div
          className="rounded-[var(--radius-mesh)] border border-mesh-border bg-mesh-card p-8 text-sm text-mesh-muted"
          role="alert"
        >
          {loadError}
        </div>
      ) : profile ? (
        <div className="space-y-8">
          <div className="rounded-[var(--radius-mesh)] border border-mesh-border bg-mesh-card p-6 sm:p-8 shadow-[var(--shadow-mesh-soft)]">
            <h2 className="text-lg font-semibold text-mesh-text mb-6">Account</h2>
            <dl className="grid gap-4 text-sm sm:grid-cols-2">
              <div>
                <dt className="text-mesh-muted text-xs uppercase tracking-wider mb-1">
                  Email
                </dt>
                <dd className="text-mesh-text">{profile.email}</dd>
              </div>
              <div>
                <dt className="text-mesh-muted text-xs uppercase tracking-wider mb-1">
                  Role
                </dt>
                <dd className="text-mesh-text">{profile.role}</dd>
              </div>
              <div>
                <dt className="text-mesh-muted text-xs uppercase tracking-wider mb-1">
                  Status
                </dt>
                <dd className="text-mesh-text">
                  {profile.isActive ? 'Active' : 'Inactive'}
                </dd>
              </div>
              <div>
                <dt className="text-mesh-muted text-xs uppercase tracking-wider mb-1">
                  Account since
                </dt>
                <dd className="text-mesh-text">
                  {new Date(profile.accountCreatedAt).toLocaleDateString()}
                </dd>
              </div>
              <div>
                <dt className="text-mesh-muted text-xs uppercase tracking-wider mb-1">
                  Profile since
                </dt>
                <dd className="text-mesh-text">
                  {new Date(profile.profileCreatedAt).toLocaleDateString()}
                </dd>
              </div>
            </dl>
          </div>

          <form
            onSubmit={handleSubmit}
            className="rounded-[var(--radius-mesh)] border border-mesh-border bg-mesh-card p-6 sm:p-8 shadow-[var(--shadow-mesh-soft)]"
          >
            <h2 className="text-lg font-semibold text-mesh-text mb-6">
              Edit profile
            </h2>
            <InputField
              label="First name"
              id="adminFirstName"
              value={firstName}
              onChange={(ev) => setFirstName(ev.target.value)}
              required
              autoComplete="given-name"
            />
            <InputField
              label="Last name"
              id="adminLastName"
              value={lastName}
              onChange={(ev) => setLastName(ev.target.value)}
              required
              autoComplete="family-name"
            />
            <button
              type="submit"
              disabled={saving}
              className={[
                'py-3 px-6 rounded-[var(--radius-mesh-sm)] font-medium text-[#111111]',
                saving
                  ? 'bg-mesh-muted/40 cursor-not-allowed'
                  : 'bg-mesh-gold hover:bg-mesh-gold-hover transition-colors',
              ].join(' ')}
            >
              {saving ? 'Saving…' : 'Save profile'}
            </button>
          </form>
        </div>
      ) : null}
    </AdminAccountLayout>
  );
}
