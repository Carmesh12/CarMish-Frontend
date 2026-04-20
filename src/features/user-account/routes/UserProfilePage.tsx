import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Camera, Lock, Save } from 'lucide-react';
import {
  getUserProfile,
  patchUserProfile,
  patchUserProfileImage,
  patchUserPassword,
} from '../api/userProfileApi';
import type { UserProfileResponse } from '../types';
import { resolveMediaUrl } from '../../../lib/api';
import { notifySuccess, notifyError } from '../../../lib/toast';
import { Card } from '../../../components/ui/Card';
import { Input } from '../../../components/ui/Input';
import { Button } from '../../../components/ui/Button';
import { Spinner } from '../../../components/ui/Spinner';
import { Badge } from '../../../components/ui/Badge';

const profileSchema = z.object({
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  phoneNumber: z.string().optional(),
});
type ProfileForm = z.infer<typeof profileSchema>;

const passwordSchema = z.object({
  currentPassword: z.string().min(1),
  newPassword: z.string().min(8),
  confirmNewPassword: z.string().min(8),
}).refine((d) => d.newPassword === d.confirmNewPassword, {
  path: ['confirmNewPassword'],
  message: 'auth.passwordsNoMatch',
});
type PasswordForm = z.infer<typeof passwordSchema>;

export function UserProfilePage() {
  const { t } = useTranslation();
  const [profile, setProfile] = useState<UserProfileResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [photoUploading, setPhotoUploading] = useState(false);
  const photoRef = useRef<HTMLInputElement>(null);

  const profileForm = useForm<ProfileForm>({ resolver: zodResolver(profileSchema) });
  const passwordForm = useForm<PasswordForm>({ resolver: zodResolver(passwordSchema) });

  useEffect(() => {
    let cancelled = false;
    getUserProfile()
      .then((p) => {
        if (cancelled) return;
        setProfile(p);
        profileForm.reset({
          firstName: p.firstName,
          lastName: p.lastName,
          phoneNumber: p.phoneNumber ?? '',
        });
      })
      .catch((e: unknown) => {
        if (!cancelled) setError(e instanceof Error ? e.message : 'Failed to load profile');
      })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const handlePhotoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file || !profile) return;
    setPhotoUploading(true);
    try {
      const res = await patchUserProfileImage(file);
      setProfile({ ...profile, profileImageUrl: res.profileImageUrl });
      notifySuccess(t('profile.imageSuccess'));
    } catch (err: unknown) {
      notifyError(err instanceof Error ? err.message : 'Upload failed');
    } finally {
      setPhotoUploading(false);
    }
  };

  const onProfileSubmit = async (data: ProfileForm) => {
    try {
      const updated = await patchUserProfile(data);
      setProfile(updated);
      profileForm.reset({
        firstName: updated.firstName,
        lastName: updated.lastName,
        phoneNumber: updated.phoneNumber ?? '',
      });
      notifySuccess(t('profile.updateSuccess'));
    } catch (err: unknown) {
      notifyError(err instanceof Error ? err.message : 'Update failed');
    }
  };

  const onPasswordSubmit = async (data: PasswordForm) => {
    try {
      await patchUserPassword(data);
      passwordForm.reset();
      notifySuccess(t('profile.passwordSuccess'));
    } catch (err: unknown) {
      notifyError(err instanceof Error ? err.message : 'Password change failed');
    }
  };

  if (loading) return <Spinner label={t('common.loading')} />;
  if (error) return <Card><p className="text-sm text-red-400" role="alert">{error}</p></Card>;
  if (!profile) return null;

  const avatarUrl = resolveMediaUrl(profile.profileImageUrl);

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
            <dt className="text-mesh-muted text-xs uppercase tracking-wider mb-1">{t('profile.memberSince')}</dt>
            <dd className="text-mesh-text">{new Date(profile.accountCreatedAt).toLocaleDateString()}</dd>
          </div>
        </dl>
      </Card>

      {/* Profile Image */}
      <Card>
        <h2 className="text-sm font-medium uppercase tracking-wider text-mesh-muted mb-4">
          {t('profile.profileImage')}
        </h2>
        <div className="flex flex-col sm:flex-row sm:items-center gap-6">
          <div className="relative shrink-0">
            {avatarUrl ? (
              <img src={avatarUrl} alt="" className="w-24 h-24 rounded-full object-cover border border-mesh-border" />
            ) : (
              <div className="w-24 h-24 rounded-full bg-mesh-surface border border-mesh-border flex items-center justify-center text-mesh-muted text-2xl font-bold">
                {profile.firstName.charAt(0)}
              </div>
            )}
          </div>
          <div className="flex flex-col gap-3">
            <input ref={photoRef} type="file" accept="image/*" className="sr-only" onChange={handlePhotoChange} />
            <Button variant="secondary" size="sm" loading={photoUploading} onClick={() => photoRef.current?.click()}>
              <Camera size={16} />
              {t('profile.uploadImage')}
            </Button>
            <p className="text-xs text-mesh-muted">JPEG, PNG, WebP, GIF. Max 5 MB.</p>
          </div>
        </div>
      </Card>

      {/* Edit Profile */}
      <Card>
        <h2 className="text-sm font-medium uppercase tracking-wider text-mesh-muted mb-4">
          {t('profile.editProfile')}
        </h2>
        <form onSubmit={profileForm.handleSubmit(onProfileSubmit)} className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <Input
              label={t('auth.firstName')}
              error={profileForm.formState.errors.firstName?.message}
              {...profileForm.register('firstName')}
            />
            <Input
              label={t('auth.lastName')}
              error={profileForm.formState.errors.lastName?.message}
              {...profileForm.register('lastName')}
            />
          </div>
          <Input
            label={t('auth.phoneNumber')}
            type="tel"
            placeholder={t('common.optional')}
            error={profileForm.formState.errors.phoneNumber?.message}
            {...profileForm.register('phoneNumber')}
          />
          <Button type="submit" loading={profileForm.formState.isSubmitting}>
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
