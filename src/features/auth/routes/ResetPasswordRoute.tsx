import React, { useState } from 'react';
import { Link, Navigate, useSearchParams } from 'react-router-dom';
import { AuthPageLayout } from '../components/AuthPageLayout';
import { InputField } from '../components/InputField';
import { notifyPromise, notifyWarning } from '../../../lib/toast';

export const ResetPasswordRoute: React.FC = () => {
  const [searchParams] = useSearchParams();
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const token = searchParams.get('token') ?? '';

  const existingToken = localStorage.getItem('accessToken');
  if (existingToken) {
    return <Navigate to="/dashboard" replace />;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!token) {
      notifyWarning('Reset token is missing. Use the link from your email.');
      return;
    }

    if (newPassword !== confirmPassword) {
      notifyWarning('Passwords do not match.');
      return;
    }

    setIsLoading(true);

    const resetTask = (async () => {
      const response = await fetch('http://localhost:3000/auth/reset-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ token, newPassword }),
      });

      const data = await response.json();
      if (!response.ok) {
        const msg = Array.isArray(data.message)
          ? data.message.join(', ')
          : data.message || 'Could not reset password';
        throw new Error(msg);
      }

      return data;
    })();

    try {
      await notifyPromise(resetTask, {
        pending: 'Resetting password…',
        success: 'Password updated. You can sign in now.',
        error: {
          render({ data }) {
            return data instanceof Error ? data.message : 'Could not reset password';
          },
        },
      });
      setNewPassword('');
      setConfirmPassword('');
    } catch {
      /* Error surfaced via toast */
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthPageLayout heroTagline="Set a new secure password and get back to your CarMesh account.">
      <div className="rounded-[var(--radius-mesh)] border border-mesh-border bg-mesh-card p-8 sm:p-10 shadow-[var(--shadow-mesh-card)]">
        <div className="mb-8">
          <h2 className="text-2xl font-semibold text-mesh-text tracking-tight">Reset password</h2>
          <p className="mt-2 text-sm text-mesh-muted leading-relaxed">
            Choose a new password for your account.
          </p>
        </div>

        {!token ? (
          <div className="rounded-[var(--radius-mesh-sm)] border border-mesh-border bg-mesh-surface p-4 text-sm text-mesh-muted">
            Invalid reset link. Please request a new one from the forgot password page.
          </div>
        ) : null}

        <form onSubmit={handleSubmit} className="w-full mt-4">
          <InputField
            label="New password"
            id="new-password"
            type="password"
            autoComplete="new-password"
            placeholder="At least 8 characters"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            required
            minLength={8}
          />

          <InputField
            label="Confirm new password"
            id="confirm-new-password"
            type="password"
            autoComplete="new-password"
            placeholder="••••••••"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
            minLength={8}
          />

          <button
            type="submit"
            disabled={isLoading || !token}
            className={[
              'w-full mt-2 py-3.5 px-4 rounded-[var(--radius-mesh-sm)] font-medium text-[#111111]',
              'transition-colors duration-200',
              isLoading || !token
                ? 'bg-mesh-muted/40 text-mesh-bg cursor-not-allowed'
                : 'bg-mesh-gold hover:bg-mesh-gold-hover',
            ].join(' ')}
          >
            {isLoading ? 'Please wait…' : 'Update password'}
          </button>
        </form>

        <div className="mt-10 pt-8 border-t border-mesh-border text-center">
          <p className="text-sm text-mesh-muted">
            Back to{' '}
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

