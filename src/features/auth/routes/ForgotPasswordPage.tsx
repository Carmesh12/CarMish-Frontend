import { useState } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Send, ArrowLeft } from 'lucide-react';
import { forgotPasswordSchema, type ForgotPasswordInput } from '../schemas/authSchemas';
import { authApi } from '../api/authApi';
import { useAuthStore, getAccountHomePath } from '../../../stores/authStore';
import { notifyError, notifySuccess } from '../../../lib/toast';
import { Input } from '../../../components/ui/Input';
import { Button } from '../../../components/ui/Button';
import { Card } from '../../../components/ui/Card';

export function ForgotPasswordPage() {
  const { t } = useTranslation();
  const { isAuthenticated, role } = useAuthStore();
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const { register, handleSubmit, formState: { errors } } = useForm<ForgotPasswordInput>({
    resolver: zodResolver(forgotPasswordSchema),
  });

  if (isAuthenticated) return <Navigate to={getAccountHomePath(role)} replace />;

  const onSubmit = async (data: ForgotPasswordInput) => {
    setLoading(true);
    try {
      await authApi.forgotPassword(data.email);
      setSent(true);
      notifySuccess(t('auth.forgotSuccess'));
    } catch (err: unknown) {
      notifyError(err instanceof Error ? err.message : 'Request failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <div className="text-center mb-6">
        <h1 className="text-2xl font-bold text-mesh-text">{t('auth.forgotPassword')}</h1>
        <p className="text-sm text-mesh-muted mt-1">{t('auth.forgotPasswordSubtitle')}</p>
      </div>

      {sent ? (
        <div className="text-center space-y-4">
          <p className="text-mesh-muted text-sm">{t('auth.forgotSuccess')}</p>
          <Link to="/login">
            <Button variant="outline">
              <ArrowLeft size={16} />
              {t('auth.login')}
            </Button>
          </Link>
        </div>
      ) : (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <Input
            label={t('auth.email')}
            type="email"
            placeholder="name@example.com"
            error={errors.email?.message ? t(errors.email.message) : undefined}
            {...register('email')}
          />
          <Button type="submit" fullWidth loading={loading}>
            <Send size={16} />
            {t('auth.sendResetLink')}
          </Button>
        </form>
      )}

      <p className="text-center text-sm text-mesh-muted mt-6">
        <Link to="/login" className="text-mesh-gold hover:text-mesh-gold-hover font-medium">
          {t('auth.login')}
        </Link>
      </p>
    </Card>
  );
}
