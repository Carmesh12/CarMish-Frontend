import React, { useEffect, useRef, useState } from 'react';
import { InputField } from '../../auth/components/InputField';
import {
  getUserProfile,
  patchUserPassword,
  patchUserProfile,
  patchUserProfileImage,
} from '../api/userProfileApi';
import type { UserProfileResponse } from '../types';
import { AccountLayout } from '../components/AccountLayout';
import { resolveMediaUrl } from '../../../lib/api';
import { notifyPromise } from '../../../lib/toast';

function isApiError(e: unknown): e is Error & { status?: number } {
  return e instanceof Error && 'status' in e;
}

export function AccountProfileRoute() {
  const [profile, setProfile] = useState<UserProfileResponse | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [profileSaving, setProfileSaving] = useState(false);
  const [photoUploading, setPhotoUploading] = useState(false);
  const photoInputRef = useRef<HTMLInputElement>(null);

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [passwordSaving, setPasswordSaving] = useState(false);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const p = await getUserProfile();
        if (cancelled) return;
        setProfile(p);
        setFirstName(p.firstName);
        setLastName(p.lastName);
        setPhoneNumber(p.phoneNumber ?? '');
        setLoadError(null);
      } catch (e: unknown) {
        if (cancelled) return;
        if (isApiError(e) && e.status === 403) {
          setLoadError(
            'Profile settings are only available for customer accounts.',
          );
        } else {
          setLoadError(e instanceof Error ? e.message : 'Could not load profile.');
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const applyProfileToForm = (p: UserProfileResponse) => {
    setProfile(p);
    setFirstName(p.firstName);
    setLastName(p.lastName);
    setPhoneNumber(p.phoneNumber ?? '');
  };

  const handlePhotoSelected = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file || !profile) return;
    setPhotoUploading(true);
    const task = patchUserProfileImage(file);
    void notifyPromise(task, {
      pending: 'Uploading photo…',
      success: 'Profile photo updated.',
      error: {
        render({ data }) {
          return data instanceof Error ? data.message : 'Upload failed';
        },
      },
    })
      .then((res) => {
        applyProfileToForm({
          ...profile,
          profileImageUrl: res.profileImageUrl,
          profileUpdatedAt: new Date().toISOString(),
        });
      })
      .catch(() => {})
      .finally(() => setPhotoUploading(false));
  };

  const handleProfileSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile) return;
    setProfileSaving(true);
    const task = patchUserProfile({
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      phoneNumber: phoneNumber.trim(),
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
      .then((updated) => applyProfileToForm(updated))
      .catch(() => {})
      .finally(() => setProfileSaving(false));
  };

  const handlePasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordSaving(true);
    const task = patchUserPassword({
      currentPassword,
      newPassword,
      confirmNewPassword,
    });
    void notifyPromise(task, {
      pending: 'Updating password…',
      success: 'Password updated.',
      error: {
        render({ data }) {
          return data instanceof Error ? data.message : 'Could not update password';
        },
      },
    })
      .then(() => {
        setCurrentPassword('');
        setNewPassword('');
        setConfirmNewPassword('');
      })
      .catch(() => {})
      .finally(() => setPasswordSaving(false));
  };

  return (
    <AccountLayout title="Profile" subtitle="Profile & security">
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
                <dd className="text-mesh-text">{profile.isActive ? 'Active' : 'Inactive'}</dd>
              </div>
            </dl>
          </div>

          <div className="rounded-[var(--radius-mesh)] border border-mesh-border bg-mesh-card p-6 sm:p-8 shadow-[var(--shadow-mesh-soft)]">
            <h2 className="text-lg font-semibold text-mesh-text mb-6">Profile photo</h2>
            <div className="flex flex-col sm:flex-row sm:items-center gap-6">
              {(() => {
                const src = resolveMediaUrl(profile.profileImageUrl);
                return src ? (
                  <img
                    src={src}
                    alt=""
                    className="w-24 h-24 rounded-full object-cover border border-mesh-border shrink-0"
                  />
                ) : (
                  <div
                    className="w-24 h-24 rounded-full bg-mesh-surface border border-mesh-border flex items-center justify-center text-mesh-muted text-xs text-center px-2 shrink-0"
                    aria-hidden
                  >
                    No photo
                  </div>
                );
              })()}
              <div className="flex flex-col gap-3 min-w-0">
                <input
                  ref={photoInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp,image/gif"
                  className="sr-only"
                  aria-label="Choose profile image"
                  onChange={handlePhotoSelected}
                />
                <button
                  type="button"
                  disabled={photoUploading}
                  onClick={() => photoInputRef.current?.click()}
                  className={[
                    'self-start py-2.5 px-4 rounded-[var(--radius-mesh-sm)] text-sm font-medium',
                    photoUploading
                      ? 'bg-mesh-muted/40 text-mesh-bg cursor-not-allowed'
                      : 'bg-mesh-surface border border-mesh-border text-mesh-text hover:border-mesh-gold/50 transition-colors',
                  ].join(' ')}
                >
                  {photoUploading ? 'Please wait…' : 'Choose image'}
                </button>
                <p className="text-xs text-mesh-muted max-w-md">
                  JPEG, PNG, WebP, or GIF. Maximum file size 5 MB.
                </p>
              </div>
            </div>
          </div>

          <form
            onSubmit={handleProfileSubmit}
            className="rounded-[var(--radius-mesh)] border border-mesh-border bg-mesh-card p-6 sm:p-8 shadow-[var(--shadow-mesh-soft)]"
          >
            <h2 className="text-lg font-semibold text-mesh-text mb-6">Edit profile</h2>
            <InputField
              label="First name"
              id="firstName"
              value={firstName}
              onChange={(ev) => setFirstName(ev.target.value)}
              required
              autoComplete="given-name"
            />
            <InputField
              label="Last name"
              id="lastName"
              value={lastName}
              onChange={(ev) => setLastName(ev.target.value)}
              required
              autoComplete="family-name"
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
            <button
              type="submit"
              disabled={profileSaving}
              className={[
                'py-3 px-6 rounded-[var(--radius-mesh-sm)] font-medium text-[#111111]',
                profileSaving
                  ? 'bg-mesh-muted/40 cursor-not-allowed'
                  : 'bg-mesh-gold hover:bg-mesh-gold-hover transition-colors',
              ].join(' ')}
            >
              {profileSaving ? 'Saving…' : 'Save profile'}
            </button>
          </form>

          <form
            id="change-password"
            onSubmit={handlePasswordSubmit}
            className="rounded-[var(--radius-mesh)] border border-mesh-border bg-mesh-card p-6 sm:p-8 shadow-[var(--shadow-mesh-soft)] scroll-mt-24"
          >
            <h2 className="text-lg font-semibold text-mesh-text mb-6">Change password</h2>
            <InputField
              label="Current password"
              id="currentPassword"
              type="password"
              value={currentPassword}
              onChange={(ev) => setCurrentPassword(ev.target.value)}
              required
              autoComplete="current-password"
            />
            <InputField
              label="New password"
              id="newPassword"
              type="password"
              value={newPassword}
              onChange={(ev) => setNewPassword(ev.target.value)}
              required
              minLength={8}
              autoComplete="new-password"
            />
            <InputField
              label="Confirm new password"
              id="confirmNewPassword"
              type="password"
              value={confirmNewPassword}
              onChange={(ev) => setConfirmNewPassword(ev.target.value)}
              required
              minLength={8}
              autoComplete="new-password"
            />
            <button
              type="submit"
              disabled={passwordSaving}
              className={[
                'py-3 px-6 rounded-[var(--radius-mesh-sm)] font-medium text-[#111111]',
                passwordSaving
                  ? 'bg-mesh-muted/40 cursor-not-allowed'
                  : 'bg-mesh-gold hover:bg-mesh-gold-hover transition-colors',
              ].join(' ')}
            >
              {passwordSaving ? 'Updating…' : 'Update password'}
            </button>
          </form>
        </div>
      ) : null}
    </AccountLayout>
  );
}
