import React, { useState } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { AuthPageLayout } from '../components/AuthPageLayout';
import { InputField } from '../components/InputField';
import { notifyPromise } from '../../../lib/toast';

export const ForgotPasswordRoute: React.FC = () => {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const existingToken = localStorage.getItem('accessToken');
  if (existingToken) {
    return <Navigate to="/dashboard" replace />;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    const forgotPasswordTask = (async () => {
      const response = await fetch('http://localhost:3000/auth/forgot-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();
      if (!response.ok) {
        const msg = Array.isArray(data.message)
          ? data.message.join(', ')
          : data.message || 'Could not send reset link';
        throw new Error(msg);
      }

      return data;
    })();

    try {
      await notifyPromise(forgotPasswordTask, {
        pending: 'Sending reset link…',
        success: 'If this email exists, a reset link has been sent.',
        error: {
          render({ data }) {
            return data instanceof Error ? data.message : 'Could not send reset link';
          },
        },
      });
    } catch {
      /* Error surfaced via toast */
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthPageLayout heroTagline="Recover access securely. Request a reset link and update your password in minutes.">
      <div className="rounded-[var(--radius-mesh)] border border-mesh-border bg-mesh-card p-8 sm:p-10 shadow-[var(--shadow-mesh-card)]">
        <div className="mb-8">
          <h2 className="text-2xl font-semibold text-mesh-text tracking-tight">Forgot password</h2>
          <p className="mt-2 text-sm text-mesh-muted leading-relaxed">
            Enter your account email. We will send you a reset link if it exists.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="w-full">
          <InputField
            label="Email"
            id="forgot-email"
            type="email"
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            autoComplete="email"
          />

          <button
            type="submit"
            disabled={isLoading}
            className={[
              'w-full mt-2 py-3.5 px-4 rounded-[var(--radius-mesh-sm)] font-medium text-[#111111]',
              'transition-colors duration-200',
              isLoading
                ? 'bg-mesh-muted/40 text-mesh-bg cursor-not-allowed'
                : 'bg-mesh-gold hover:bg-mesh-gold-hover',
            ].join(' ')}
          >
            {isLoading ? 'Please wait…' : 'Send reset link'}
          </button>
        </form>

        <div className="mt-10 pt-8 border-t border-mesh-border text-center">
          <p className="text-sm text-mesh-muted">
            Remembered your password?{' '}
            <Link
              to="/login"
              className="font-medium text-mesh-gold hover:text-mesh-gold-hover transition-colors"
            >
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </AuthPageLayout>
  );
};

