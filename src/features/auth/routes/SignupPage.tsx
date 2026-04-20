import { useState } from 'react';
import { Link, Navigate, useNavigate, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { UserPlus } from 'lucide-react';
import {
  signupUserSchema,
  signupVendorSchema,
  type SignupUserInput,
  type SignupVendorInput,
} from '../schemas/authSchemas';
import { authApi } from '../api/authApi';
import { useAuthStore, getAccountHomePath } from '../../../stores/authStore';
import { notifyError, notifySuccess } from '../../../lib/toast';
import { Input } from '../../../components/ui/Input';
import { Button } from '../../../components/ui/Button';
import { Card } from '../../../components/ui/Card';

export function SignupPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { isAuthenticated, role } = useAuthStore();
  const login = useAuthStore((s) => s.login);
  const [loading, setLoading] = useState(false);

  const isVendor = searchParams.get('type') === 'vendor';

  const userForm = useForm<SignupUserInput>({ resolver: zodResolver(signupUserSchema) });
  const vendorForm = useForm<SignupVendorInput>({ resolver: zodResolver(signupVendorSchema) });

  if (isAuthenticated) return <Navigate to={getAccountHomePath(role)} replace />;

  const switchTab = (vendor: boolean) => {
    setSearchParams(vendor ? { type: 'vendor' } : {});
  };

  const onSubmitUser = async (data: SignupUserInput) => {
    setLoading(true);
    try {
      const body = { ...data, phoneNumber: data.phoneNumber || undefined };
      const res = await authApi.signupUser(body);
      login({ accessToken: res.accessToken, refreshToken: res.refreshToken, user: res.user });
      notifySuccess(t('auth.signupSubtitle'));
      navigate(getAccountHomePath(res.user.role), { replace: true });
    } catch (err: unknown) {
      notifyError(err instanceof Error ? err.message : 'Signup failed');
    } finally {
      setLoading(false);
    }
  };

  const onSubmitVendor = async (data: SignupVendorInput) => {
    setLoading(true);
    try {
      const body = {
        ...data,
        phoneNumber: data.phoneNumber || undefined,
        businessAddress: data.businessAddress || undefined,
      };
      const res = await authApi.signupVendor(body);
      login({ accessToken: res.accessToken, refreshToken: res.refreshToken, user: res.user });
      notifySuccess(t('auth.signupSubtitle'));
      navigate(getAccountHomePath(res.user.role), { replace: true });
    } catch (err: unknown) {
      notifyError(err instanceof Error ? err.message : 'Signup failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <div className="text-center mb-6">
        <h1 className="text-2xl font-bold text-mesh-text">{t('auth.signup')}</h1>
        <p className="text-sm text-mesh-muted mt-1">{t('auth.signupSubtitle')}</p>
      </div>

      <div className="flex rounded-[var(--radius-mesh-sm)] border border-mesh-border mb-6 overflow-hidden">
        <button
          type="button"
          onClick={() => switchTab(false)}
          className={`flex-1 py-2.5 text-sm font-medium transition-colors cursor-pointer ${
            !isVendor ? 'bg-mesh-gold text-mesh-bg' : 'text-mesh-muted hover:text-mesh-text'
          }`}
        >
          {t('auth.signupAsUser')}
        </button>
        <button
          type="button"
          onClick={() => switchTab(true)}
          className={`flex-1 py-2.5 text-sm font-medium transition-colors cursor-pointer ${
            isVendor ? 'bg-mesh-gold text-mesh-bg' : 'text-mesh-muted hover:text-mesh-text'
          }`}
        >
          {t('auth.signupAsVendor')}
        </button>
      </div>

      {!isVendor ? (
        <form onSubmit={userForm.handleSubmit(onSubmitUser)} className="space-y-4">
          <Input label={t('auth.email')} type="email" placeholder="name@example.com" error={userForm.formState.errors.email?.message ? t(userForm.formState.errors.email.message) : undefined} {...userForm.register('email')} />
          <Input label={t('auth.password')} type="password" placeholder="••••••••" error={userForm.formState.errors.password?.message ? t(userForm.formState.errors.password.message) : undefined} {...userForm.register('password')} />
          <div className="grid grid-cols-2 gap-3">
            <Input label={t('auth.firstName')} error={userForm.formState.errors.firstName?.message ? t(userForm.formState.errors.firstName.message) : undefined} {...userForm.register('firstName')} />
            <Input label={t('auth.lastName')} error={userForm.formState.errors.lastName?.message ? t(userForm.formState.errors.lastName.message) : undefined} {...userForm.register('lastName')} />
          </div>
          <Input label={t('auth.phoneNumber')} placeholder={`(${t('common.optional')})`} error={userForm.formState.errors.phoneNumber?.message ? t(userForm.formState.errors.phoneNumber.message) : undefined} {...userForm.register('phoneNumber')} />
          <Button type="submit" fullWidth loading={loading}>
            <UserPlus size={16} />
            {t('auth.signupButton')}
          </Button>
        </form>
      ) : (
        <form onSubmit={vendorForm.handleSubmit(onSubmitVendor)} className="space-y-4">
          <Input label={t('auth.email')} type="email" placeholder="vendor@company.com" error={vendorForm.formState.errors.email?.message ? t(vendorForm.formState.errors.email.message) : undefined} {...vendorForm.register('email')} />
          <Input label={t('auth.password')} type="password" placeholder="••••••••" error={vendorForm.formState.errors.password?.message ? t(vendorForm.formState.errors.password.message) : undefined} {...vendorForm.register('password')} />
          <Input label={t('auth.businessName')} error={vendorForm.formState.errors.businessName?.message ? t(vendorForm.formState.errors.businessName.message) : undefined} {...vendorForm.register('businessName')} />
          <Input label={t('auth.contactPerson')} error={vendorForm.formState.errors.contactPersonName?.message ? t(vendorForm.formState.errors.contactPersonName.message) : undefined} {...vendorForm.register('contactPersonName')} />
          <Input label={t('auth.phoneNumber')} placeholder={`(${t('common.optional')})`} {...vendorForm.register('phoneNumber')} />
          <Input label={t('auth.businessAddress')} placeholder={`(${t('common.optional')})`} {...vendorForm.register('businessAddress')} />
          <Button type="submit" fullWidth loading={loading}>
            <UserPlus size={16} />
            {t('auth.signupButton')}
          </Button>
        </form>
      )}

      <p className="text-center text-sm text-mesh-muted mt-6">
        {t('auth.hasAccount')}{' '}
        <Link to="/login" className="text-mesh-gold hover:text-mesh-gold-hover font-medium">
          {t('auth.login')}
        </Link>
      </p>
    </Card>
  );
}
