import React, { useEffect, useState } from 'react';
import { InputField } from '../../auth/components/InputField';
import { getVendorProfile, patchVendorProfile } from '../api/vendorProfileApi';
import type { VendorProfileResponse } from '../types';
import { VendorAccountLayout } from '../components/VendorAccountLayout';
import { notifyPromise } from '../../../lib/toast';

function isApiError(e: unknown): e is Error & { status?: number } {
  return e instanceof Error && 'status' in e;
}

export function VendorProfileRoute() {
  const [profile, setProfile] = useState<VendorProfileResponse | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const [businessName, setBusinessName] = useState('');
  const [contactPersonName, setContactPersonName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [businessAddress, setBusinessAddress] = useState('');
  const [logoUrl, setLogoUrl] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const p = await getVendorProfile();
        if (cancelled) return;
        applyToForm(p);
        setLoadError(null);
      } catch (e: unknown) {
        if (cancelled) return;
        if (isApiError(e) && e.status === 403) {
          setLoadError('Vendor profile is only available for vendor accounts.');
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

  const applyToForm = (p: VendorProfileResponse) => {
    setProfile(p);
    setBusinessName(p.businessName);
    setContactPersonName(p.contactPersonName);
    setPhoneNumber(p.phoneNumber ?? '');
    setBusinessAddress(p.businessAddress ?? '');
    setLogoUrl(p.logoUrl ?? '');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile) return;
    setSaving(true);
    const task = patchVendorProfile({
      businessName: businessName.trim(),
      contactPersonName: contactPersonName.trim(),
      phoneNumber: phoneNumber.trim(),
      businessAddress: businessAddress.trim(),
      logoUrl: logoUrl.trim(),
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
    <VendorAccountLayout title="Profile" subtitle="Business profile">
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
                  Verification
                </dt>
                <dd className="text-mesh-text">{profile.verificationStatus}</dd>
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
              Edit business details
            </h2>
            <InputField
              label="Business name"
              id="businessName"
              value={businessName}
              onChange={(ev) => setBusinessName(ev.target.value)}
              required
              autoComplete="organization"
            />
            <InputField
              label="Contact person"
              id="contactPersonName"
              value={contactPersonName}
              onChange={(ev) => setContactPersonName(ev.target.value)}
              required
              autoComplete="name"
            />
            <InputField
              label="Phone"
              id="phoneNumber"
              type="tel"
              value={phoneNumber}
              onChange={(ev) => setPhoneNumber(ev.target.value)}
              placeholder="Optional"
              autoComplete="tel"
            />
            <div className="flex flex-col mb-4">
              <label
                htmlFor="businessAddress"
                className="mb-2 text-xs font-medium uppercase tracking-wider text-mesh-muted"
              >
                Business address
              </label>
              <textarea
                id="businessAddress"
                value={businessAddress}
                onChange={(ev) => setBusinessAddress(ev.target.value)}
                placeholder="Optional"
                rows={3}
                className="w-full px-4 py-3 rounded-[var(--radius-mesh-sm)] border border-mesh-border bg-mesh-surface text-mesh-text placeholder:text-mesh-muted/60 transition-[border-color,box-shadow] duration-200 focus:outline-none focus:border-mesh-gold/70 focus:ring-1 focus:ring-mesh-gold/35 resize-y min-h-[5rem]"
              />
            </div>
            <InputField
              label="Logo URL"
              id="logoUrl"
              type="url"
              value={logoUrl}
              onChange={(ev) => setLogoUrl(ev.target.value)}
              placeholder="https://…"
            />
            <p className="text-xs text-mesh-muted -mt-2 mb-4">
              Optional. Use a full URL (https://). Leave empty to clear.
            </p>
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
    </VendorAccountLayout>
  );
}
