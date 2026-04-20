import { useState } from 'react';
import { Link, Navigate, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { KeyRound, ArrowLeft } from 'lucide-react';
import { resetPasswordSchema, type ResetPasswordInput } from '../schemas/authSchemas';
import { authApi } from '../api/authApi';
import { useAuthStore, getAccountHomePath } from '../../../stores/authStore';
import { notifyError, notifySuccess } from '../../../lib/toast';
import { Input } from '../../../components/ui/Input';
import { Button } from '../../../components/ui/Button';
import { Card } from '../../../components/ui/Card';

export function ResetPasswordPage() {
  const { t } = useTranslation();
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const { isAuthenticated, role } = useAuthStore();
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  const { register, handleSubmit, formState: { errors } } = useForm<ResetPasswordInput>({
    resolver: zodResolver(resetPasswordSchema),
  });

  if (isAuthenticated) return <Navigate to={getAccountHomePath(role)} replace />;

  if (!token) {
    return (
      <Card>
        <div className="text-center space-y-4">
          <p className="text-mesh-muted">{t('auth.resetPasswordSubtitle')}</p>
          <Link to="/forgot-password">
            <Button variant="outline">
              <ArrowLeft size={16} />
              {t('auth.forgotPassword')}
            </Button>
          </Link>
        </div>
      </Card>
    );
  }

  const onSubmit = async (data: ResetPasswordInput) => {
    setLoading(true);
    try {
      await authApi.resetPassword(token, data.newPassword);
      setDone(true);
      notifySuccess(t('auth.resetSuccess'));
    } catch (err: unknown) {
      notifyError(err instanceof Error ? err.message : 'Reset failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <div className="text-center mb-6">
        <h1 className="text-2xl font-bold text-mesh-text">{t('auth.resetPassword')}</h1>
        <p className="text-sm text-mesh-muted mt-1">{t('auth.resetPasswordSubtitle')}</p>
      </div>

      {done ? (
        <div className="text-center space-y-4">
          <p className="text-mesh-muted text-sm">{t('auth.resetSuccess')}</p>
          <Link to="/login">
            <Button variant="primary">
              {t('auth.loginButton')}
            </Button>
          </Link>
        </div>
      ) : (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <Input
            label={t('auth.newPassword')}
            type="password"
            placeholder="••••••••"
            error={errors.newPassword?.message ? t(errors.newPassword.message) : undefined}
            {...register('newPassword')}
          />
          <Input
            label={t('auth.confirmPassword')}
            type="password"
            placeholder="••••••••"
            error={errors.confirmPassword?.message ? t(errors.confirmPassword.message) : undefined}
            {...register('confirmPassword')}
          />
          <Button type="submit" fullWidth loading={loading}>
            <KeyRound size={16} />
            {t('auth.resetButton')}
          </Button>
        </form>
      )}
    </Card>
  );
}
