import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Save } from 'lucide-react';
import { getVendorProfile, patchVendorProfile } from '../api/vendorProfileApi';
import type { VendorProfileResponse } from '../types';
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

export function VendorProfilePage() {
  const { t } = useTranslation();
  const [profile, setProfile] = useState<VendorProfileResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const form = useForm<VendorForm>({ resolver: zodResolver(vendorSchema) });

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
            <dt className="text-mesh-muted text-xs uppercase tracking-wider mb-1">{t('profile.verificationStatus')}</dt>
            <dd className="text-mesh-text">{profile.verificationStatus}</dd>
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
    </div>
  );
}
