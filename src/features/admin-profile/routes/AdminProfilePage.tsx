import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Save } from 'lucide-react';
import { getAdminProfile, patchAdminProfile } from '../api/adminProfileApi';
import type { AdminProfileResponse } from '../types';
import { notifySuccess, notifyError } from '../../../lib/toast';
import { Card } from '../../../components/ui/Card';
import { Input } from '../../../components/ui/Input';
import { Button } from '../../../components/ui/Button';
import { Spinner } from '../../../components/ui/Spinner';
import { Badge } from '../../../components/ui/Badge';

const adminSchema = z.object({
  firstName: z.string().min(1),
  lastName: z.string().min(1),
});
type AdminForm = z.infer<typeof adminSchema>;

export function AdminProfilePage() {
  const { t } = useTranslation();
  const [profile, setProfile] = useState<AdminProfileResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const form = useForm<AdminForm>({ resolver: zodResolver(adminSchema) });

  useEffect(() => {
    let cancelled = false;
    getAdminProfile()
      .then((p) => {
        if (cancelled) return;
        setProfile(p);
        form.reset({ firstName: p.firstName, lastName: p.lastName });
      })
      .catch((e: unknown) => {
        if (!cancelled) setError(e instanceof Error ? e.message : 'Failed to load profile');
      })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const onSubmit = async (data: AdminForm) => {
    try {
      const updated = await patchAdminProfile(data);
      setProfile(updated);
      form.reset({ firstName: updated.firstName, lastName: updated.lastName });
      notifySuccess(t('profile.updateSuccess'));
    } catch (err: unknown) {
      notifyError(err instanceof Error ? err.message : 'Update failed');
    }
  };

  if (loading) return <Spinner label={t('common.loading')} />;
  if (error) return <Card><p className="text-sm text-red-400" role="alert">{error}</p></Card>;
  if (!profile) return null;

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

      {/* Edit Form */}
      <Card>
        <h2 className="text-sm font-medium uppercase tracking-wider text-mesh-muted mb-4">
          {t('profile.editProfile')}
        </h2>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <Input
              label={t('auth.firstName')}
              error={form.formState.errors.firstName?.message}
              {...form.register('firstName')}
            />
            <Input
              label={t('auth.lastName')}
              error={form.formState.errors.lastName?.message}
              {...form.register('lastName')}
            />
          </div>
          <Button type="submit" loading={form.formState.isSubmitting}>
            <Save size={16} />
            {t('common.save')}
          </Button>
        </form>
      </Card>
    </div>
  );
}
