import { useEffect, useRef, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { CheckCircle2, Loader2, XCircle } from 'lucide-react';
import { authApi } from '../api/authApi';
import { notifyError, notifySuccess } from '../../../lib/toast';
import { Button } from '../../../components/ui/Button';
import { Card } from '../../../components/ui/Card';

type VerifyStatus = 'loading' | 'success' | 'error';

export function VerifyEmailPage() {
  const { t } = useTranslation();
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const requestedRef = useRef(false);
  const [status, setStatus] = useState<VerifyStatus>(token ? 'loading' : 'error');
  const [message, setMessage] = useState(
    token ? t('auth.verifyingEmail') : t('auth.missingVerificationToken'),
  );

  useEffect(() => {
    if (!token || requestedRef.current) return;
    requestedRef.current = true;

    authApi
      .verifyEmail(token)
      .then((res) => {
        setStatus('success');
        setMessage(res.message);
        notifySuccess(res.message);
      })
      .catch((err: unknown) => {
        const errorMessage =
          err instanceof Error ? err.message : t('auth.verificationFailed');
        setStatus('error');
        setMessage(errorMessage);
        notifyError(errorMessage);
      });
  }, [t, token]);

  const isSuccess = status === 'success';
  const isLoading = status === 'loading';

  return (
    <Card>
      <div className="text-center space-y-5">
        <div
          className={`mx-auto h-14 w-14 rounded-full border flex items-center justify-center ${
            isSuccess
              ? 'border-green-400/40 bg-green-400/10 text-green-400'
              : isLoading
                ? 'border-mesh-gold/40 bg-mesh-gold/10 text-mesh-gold'
                : 'border-red-400/40 bg-red-400/10 text-red-400'
          }`}
        >
          {isSuccess ? (
            <CheckCircle2 size={28} />
          ) : isLoading ? (
            <Loader2 size={28} className="animate-spin" />
          ) : (
            <XCircle size={28} />
          )}
        </div>

        <div>
          <h1 className="text-2xl font-bold text-mesh-text">
            {isSuccess ? t('auth.emailVerifiedTitle') : t('auth.verifyEmailTitle')}
          </h1>
          <p className="text-sm text-mesh-muted mt-2">{message}</p>
        </div>

        <Link to="/login">
          <Button variant={isSuccess ? 'primary' : 'outline'}>
            {t('auth.login')}
          </Button>
        </Link>
      </div>
    </Card>
  );
}
