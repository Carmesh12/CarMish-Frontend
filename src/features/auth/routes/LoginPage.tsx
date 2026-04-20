import { useState } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { LogIn } from 'lucide-react';
import { loginSchema, type LoginInput } from '../schemas/authSchemas';
import { authApi } from '../api/authApi';
import { useAuthStore, getAccountHomePath } from '../../../stores/authStore';
import { notifyError, notifySuccess } from '../../../lib/toast';
import { Input } from '../../../components/ui/Input';
import { Button } from '../../../components/ui/Button';
import { Card } from '../../../components/ui/Card';

export function LoginPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { isAuthenticated, role } = useAuthStore();
  const login = useAuthStore((s) => s.login);
  const [loading, setLoading] = useState(false);
  const videoWebm = '/assets/login/carmesh-login-3d.webm';
  const videoMp4 = '/assets/login/carmesh-login-3d.mp4';
  const poster = '/assets/login/carmesh-login-3d-poster.webp';

  const { register, handleSubmit, formState: { errors } } = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
  });

  if (isAuthenticated) return <Navigate to={getAccountHomePath(role)} replace />;

  const onSubmit = async (data: LoginInput) => {
    setLoading(true);
    try {
      const res = await authApi.login(data);
      login({ accessToken: res.accessToken, refreshToken: res.refreshToken, user: res.user });
      notifySuccess(t('auth.loginSubtitle'));
      navigate(getAccountHomePath(res.user.role), { replace: true });
    } catch (err: unknown) {
      notifyError(err instanceof Error ? err.message : 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative h-full">
      <div className="absolute -inset-10 blur-3xl opacity-25 bg-gradient-to-br from-mesh-gold/30 via-mesh-accent/20 to-violet-500/10 rounded-full pointer-events-none" />

      <div className="relative grid grid-cols-1 lg:grid-cols-[1fr_420px] gap-6 lg:gap-10 items-stretch min-h-[calc(100vh-140px)]">
        {/* 3D Video Hero */}
        <div className="relative overflow-hidden rounded-[var(--radius-mesh)] border border-white/[0.10] bg-black/20 backdrop-blur-xl shadow-[0_24px_60px_rgba(0,0,0,0.55)] h-[260px] lg:h-full">
          <video
            className="absolute inset-0 w-full h-full object-cover"
            autoPlay
            loop
            muted
            playsInline
            preload="metadata"
            poster={poster}
          >
            <source src={videoWebm} type="video/webm" />
            <source src={videoMp4} type="video/mp4" />
          </video>
          <div className="absolute inset-0 pointer-events-none bg-gradient-to-tr from-black/55 via-black/10 to-black/35" />
          <div className="absolute inset-x-0 bottom-0 p-5 sm:p-6">
            <h2 className="text-xl sm:text-2xl font-bold text-gradient-mixed">
              {t('auth.loginTitle3d', 'Experience CarMesh in 3D')}
            </h2>
            <p className="text-sm text-mesh-muted mt-1.5 max-w-md">
              {t('auth.loginSubtitle3d', 'A modern marketplace for buying and renting vehicles, enhanced with 3D modeling.')}
            </p>
          </div>
        </div>

        {/* Login Card */}
        <div className="relative flex items-center lg:justify-end">
          <div className="w-full">
            <Card className="relative">
              <div className="text-center mb-6">
                <h1 className="text-2xl font-bold text-gradient-gold">{t('auth.login')}</h1>
                <p className="text-sm text-mesh-muted mt-1.5">{t('auth.loginSubtitle')}</p>
              </div>

              <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                <Input
                  label={t('auth.email')}
                  type="email"
                  placeholder="name@example.com"
                  error={errors.email?.message ? t(errors.email.message) : undefined}
                  {...register('email')}
                />
                <Input
                  label={t('auth.password')}
                  type="password"
                  placeholder="••••••••"
                  error={errors.password?.message ? t(errors.password.message) : undefined}
                  {...register('password')}
                />

                <div className="flex justify-end">
                  <Link to="/forgot-password" className="text-xs text-mesh-gold hover:text-mesh-gold-hover transition-colors">
                    {t('auth.forgotPasswordLink')}
                  </Link>
                </div>

                <Button type="submit" fullWidth loading={loading}>
                  <LogIn size={16} />
                  {t('auth.loginButton')}
                </Button>
              </form>

              <p className="text-center text-sm text-mesh-muted mt-6">
                {t('auth.noAccount')}{' '}
                <Link to="/signup" className="text-mesh-gold hover:text-mesh-gold-hover font-medium transition-colors">
                  {t('auth.signup')}
                </Link>
              </p>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
