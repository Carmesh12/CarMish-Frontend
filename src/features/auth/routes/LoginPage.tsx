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
    <div className="min-h-screen bg-mesh-bg">
      <div className="min-h-screen grid grid-cols-1 lg:grid-cols-2">
        {/* Left: video */}
        <div className="relative overflow-hidden min-h-[260px] lg:min-h-screen">
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
          <div className="absolute inset-0 bg-black/55" />
          <div className="absolute inset-0 bg-gradient-to-br from-mesh-gold/15 via-transparent to-mesh-accent/10" />

          <div className="absolute top-0 left-0 rtl:left-auto rtl:right-0 z-10 p-7 sm:p-12">
            <div className="max-w-2xl">
              <h2 className="text-5xl sm:text-6xl lg:text-7xl font-bold text-gradient-mixed drop-shadow-[0_14px_40px_rgba(0,0,0,0.6)]">
                {t('auth.loginTitle3d', 'Experience CarMesh in 3D')}
              </h2>
              <p className="text-lg sm:text-xl lg:text-2xl text-white/85 mt-4 leading-relaxed drop-shadow-[0_14px_40px_rgba(0,0,0,0.6)]">
                {t(
                  'auth.loginSubtitle3d',
                  'A modern marketplace for buying and renting vehicles, enhanced with 3D modeling.',
                )}
              </p>
            </div>
          </div>
        </div>

        {/* Right: login */}
        <div className="relative flex items-center justify-center px-4 py-10 lg:px-10">
          <div className="w-full max-w-xl">
            <Card className="relative p-10 sm:p-12">
              <div className="text-center mb-8">
                <h1 className="text-4xl font-bold text-gradient-gold">{t('auth.login')}</h1>
                <p className="text-lg text-mesh-muted mt-2.5">{t('auth.loginSubtitle')}</p>
              </div>

              <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
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
                  <Link
                    to="/forgot-password"
                    className="text-sm text-mesh-gold hover:text-mesh-gold-hover transition-colors"
                  >
                    {t('auth.forgotPasswordLink')}
                  </Link>
                </div>

                <Button type="submit" fullWidth loading={loading}>
                  <LogIn size={16} />
                  {t('auth.loginButton')}
                </Button>
              </form>

              <p className="text-center text-base text-mesh-muted mt-8">
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
