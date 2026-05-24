import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Camera, Lock, Save } from 'lucide-react';
import {
  getVendorProfile,
  patchVendorLogo,
  patchVendorPassword,
  patchVendorProfile,
} from '../api/vendorProfileApi';
import type { VendorProfileResponse } from '../types';
import { resolveMediaUrl } from '../../../lib/api';
import { notifySuccess, notifyError } from '../../../lib/toast';
import { Card } from '../../../components/ui/Card';
import { Input } from '../../../components/ui/Input';
import { Textarea } from '../../../components/ui/Textarea';
import { Button } from '../../../components/ui/Button';
import { Spinner } from '../../../components/ui/Spinner';
import { Badge } from '../../../components/ui/Badge';

const vendorSchema = z.object({
  businessName: z.string().min(1),
  contactPersonName: z.string().min(1),
  phoneNumber: z.string().optional(),
  businessAddress: z.string().optional(),
});
type VendorForm = z.infer<typeof vendorSchema>;

const passwordSchema = z.object({
  currentPassword: z.string().min(1),
  newPassword: z.string().min(8),
  confirmNewPassword: z.string().min(8),
}).refine((d) => d.newPassword === d.confirmNewPassword, {
  path: ['confirmNewPassword'],
  message: 'auth.passwordsNoMatch',
});
type PasswordForm = z.infer<typeof passwordSchema>;

export function VendorProfilePage() {
  const { t } = useTranslation();
  const [profile, setProfile] = useState<VendorProfileResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [logoUploading, setLogoUploading] = useState(false);
  const logoRef = useRef<HTMLInputElement>(null);

  const form = useForm<VendorForm>({ resolver: zodResolver(vendorSchema) });
  const passwordForm = useForm<PasswordForm>({ resolver: zodResolver(passwordSchema) });

  useEffect(() => {
    let cancelled = false;
    getVendorProfile()
      .then((p) => {
        if (cancelled) return;
        setProfile(p);
        form.reset({
          businessName: p.businessName,
          contactPersonName: p.contactPersonName,
          phoneNumber: p.phoneNumber ?? '',
          businessAddress: p.businessAddress ?? '',
        });
      })
      .catch((e: unknown) => {
        if (!cancelled) setError(e instanceof Error ? e.message : 'Failed to load profile');
      })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const onSubmit = async (data: VendorForm) => {
    try {
      const updated = await patchVendorProfile(data);
      setProfile(updated);
      form.reset({
        businessName: updated.businessName,
        contactPersonName: updated.contactPersonName,
        phoneNumber: updated.phoneNumber ?? '',
        businessAddress: updated.businessAddress ?? '',
      });
      notifySuccess(t('profile.updateSuccess'));
    } catch (err: unknown) {
      notifyError(err instanceof Error ? err.message : 'Update failed');
    }
  };

  const handleLogoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file || !profile) return;

    setLogoUploading(true);
    try {
      const res = await patchVendorLogo(file);
      setProfile({ ...profile, logoUrl: res.logoUrl });
      notifySuccess(t('profile.imageSuccess'));
    } catch (err: unknown) {
      notifyError(err instanceof Error ? err.message : 'Upload failed');
    } finally {
      setLogoUploading(false);
    }
  };

  const onPasswordSubmit = async (data: PasswordForm) => {
    try {
      await patchVendorPassword(data);
      passwordForm.reset();
      notifySuccess(t('profile.passwordSuccess'));
    } catch (err: unknown) {
      notifyError(err instanceof Error ? err.message : 'Password change failed');
    }
  };

  if (loading) return <Spinner label={t('common.loading')} />;
  if (error) return <Card><p className="text-sm text-red-400" role="alert">{error}</p></Card>;
  if (!profile) return null;

  const logoUrl = resolveMediaUrl(profile.logoUrl);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-mesh-text">{t('profile.title')}</h1>

      {/* Account Info */}
      <Card>
        <h2 className="text-sm font-medium uppercase tracking-wider text-mesh-muted mb-4">
          {t('profile.accountInfo')}
        </h2>
        <dl className="grid gap-4 text-sm sm:grid-cols-2">
          <div>
            <dt className="text-mesh-muted text-xs uppercase tracking-wider mb-1">{t('auth.email')}</dt>
            <dd className="text-mesh-text">{profile.email}</dd>
          </div>
          <div>
            <dt className="text-mesh-muted text-xs uppercase tracking-wider mb-1">{t('common.status')}</dt>
            <dd>
              <Badge variant={profile.isActive ? 'success' : 'danger'}>
                {profile.isActive ? 'Active' : 'Inactive'}
              </Badge>
            </dd>
          </div>
          <div>
            <dt className="text-mesh-muted text-xs uppercase tracking-wider mb-1">{t('profile.verificationStatus')}</dt>
            <dd className="text-mesh-text">{profile.verificationStatus}</dd>
          </div>
          <div>
            <dt className="text-mesh-muted text-xs uppercase tracking-wider mb-1">{t('profile.memberSince')}</dt>
            <dd className="text-mesh-text">{new Date(profile.accountCreatedAt).toLocaleDateString()}</dd>
          </div>
        </dl>
      </Card>

      {/* Business Logo */}
      <Card id="business-logo">
        <h2 className="text-sm font-medium uppercase tracking-wider text-mesh-muted mb-4">
          {t('profile.businessLogo', 'Business Logo')}
        </h2>
        <div className="flex flex-col sm:flex-row sm:items-center gap-6">
          <div className="relative shrink-0">
            {logoUrl ? (
              <img
                src={logoUrl}
                alt=""
                className="w-24 h-24 rounded-[var(--radius-mesh-sm)] object-cover border border-mesh-border bg-mesh-surface"
              />
            ) : (
              <div className="w-24 h-24 rounded-[var(--radius-mesh-sm)] bg-mesh-surface border border-mesh-border flex items-center justify-center text-mesh-muted text-3xl font-bold">
                {profile.businessName.charAt(0)}
              </div>
            )}
          </div>
          <div className="flex flex-col gap-3">
            <input
              ref={logoRef}
              type="file"
              accept="image/*"
              className="sr-only"
              onChange={handleLogoChange}
            />
            <Button
              variant="secondary"
              size="sm"
              loading={logoUploading}
              onClick={() => logoRef.current?.click()}
            >
              <Camera size={16} />
              {t('profile.uploadLogo', 'Upload logo')}
            </Button>
            <p className="text-xs text-mesh-muted">JPEG, PNG, WebP, GIF. Max 5 MB.</p>
          </div>
        </div>
      </Card>

      {/* Edit Form */}
      <Card>
        <h2 className="text-sm font-medium uppercase tracking-wider text-mesh-muted mb-4">
          {t('profile.businessInfo')}
        </h2>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <Input
              label={t('auth.businessName')}
              error={form.formState.errors.businessName?.message}
              {...form.register('businessName')}
            />
            <Input
              label={t('auth.contactPerson')}
              error={form.formState.errors.contactPersonName?.message}
              {...form.register('contactPersonName')}
            />
          </div>
          <Input
            label={t('auth.phoneNumber')}
            type="tel"
            placeholder={t('common.optional')}
            error={form.formState.errors.phoneNumber?.message}
            {...form.register('phoneNumber')}
          />
          <Textarea
            label={t('auth.businessAddress')}
            placeholder={t('common.optional')}
            error={form.formState.errors.businessAddress?.message}
            {...form.register('businessAddress')}
          />
          <Button type="submit" loading={form.formState.isSubmitting}>
            <Save size={16} />
            {t('common.save')}
          </Button>
        </form>
      </Card>

      {/* Change Password */}
      <Card>
        <h2 className="text-sm font-medium uppercase tracking-wider text-mesh-muted mb-4" id="change-password">
          {t('profile.changePassword')}
        </h2>
        <form onSubmit={passwordForm.handleSubmit(onPasswordSubmit)} className="space-y-4">
          <Input
            label={t('auth.currentPassword')}
            type="password"
            autoComplete="current-password"
            error={passwordForm.formState.errors.currentPassword?.message}
            {...passwordForm.register('currentPassword')}
          />
          <div className="grid gap-4 sm:grid-cols-2">
            <Input
              label={t('auth.newPassword')}
              type="password"
              autoComplete="new-password"
              error={passwordForm.formState.errors.newPassword?.message}
              {...passwordForm.register('newPassword')}
            />
            <Input
              label={t('auth.confirmPassword')}
              type="password"
              autoComplete="new-password"
              error={passwordForm.formState.errors.confirmNewPassword?.message ? t(passwordForm.formState.errors.confirmNewPassword.message) : undefined}
              {...passwordForm.register('confirmNewPassword')}
            />
          </div>
          <Button type="submit" loading={passwordForm.formState.isSubmitting}>
            <Lock size={16} />
            {t('profile.changePassword')}
          </Button>
        </form>
      </Card>
    </div>
  );
}
