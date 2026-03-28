import React, { useState } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { InputField } from '../components/InputField';
import { AuthPageLayout } from '../components/AuthPageLayout';
import { notifyPromise } from '../../../lib/toast';

export const LoginRoute: React.FC = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const existingToken = localStorage.getItem('accessToken');
  if (existingToken) {
    return <Navigate to="/dashboard" replace />;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    const loginTask = (async () => {
      const response = await fetch('http://localhost:3000/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        const msg = Array.isArray(data.message)
          ? data.message.join(', ')
          : data.message || 'Invalid email or password';
        throw new Error(msg);
      }

      localStorage.setItem('accessToken', data.accessToken);
      localStorage.setItem('refreshToken', data.refreshToken);
      return data;
    })();

    try {
      await notifyPromise(loginTask, {
        pending: 'Signing you in…',
        success: 'Signed in successfully.',
        error: {
          render({ data }) {
            return data instanceof Error ? data.message : 'Sign in failed';
          },
        },
      });
      navigate('/dashboard', { replace: true });
    } catch {
      /* Error surfaced via toast */
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthPageLayout heroTagline="Access your garage, orders, and curated automotive inventory in one refined place.">
      <div className="rounded-[var(--radius-mesh)] border border-mesh-border bg-mesh-card p-8 sm:p-10 shadow-[var(--shadow-mesh-card)]">
        <div className="mb-8">
          <h2 className="text-2xl font-semibold text-mesh-text tracking-tight">Sign in</h2>
          <p className="mt-2 text-sm text-mesh-muted leading-relaxed">
            Enter your credentials to continue.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="w-full">
          <InputField
            label="Email"
            id="email"
            type="email"
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            autoComplete="email"
          />

          <InputField
            label="Password"
            id="password"
            type="password"
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            autoComplete="current-password"
          />

          <div className="flex justify-end mb-6">
            <span className="text-sm text-mesh-muted cursor-not-allowed" title="Coming soon">
              Forgot password?
            </span>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className={[
              'w-full py-3.5 px-4 rounded-[var(--radius-mesh-sm)] font-medium text-[#111111]',
              'transition-colors duration-200',
              isLoading
                ? 'bg-mesh-muted/40 text-mesh-bg cursor-not-allowed'
                : 'bg-mesh-gold hover:bg-mesh-gold-hover',
            ].join(' ')}
          >
            {isLoading ? 'Please wait…' : 'Sign in'}
          </button>
        </form>

        <div className="mt-10 pt-8 border-t border-mesh-border text-center space-y-3">
          <p className="text-sm text-mesh-muted">New to CarMesh?</p>
          <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-2 text-sm">
            <Link
              to="/signup"
              className="font-medium text-mesh-gold hover:text-mesh-gold-hover transition-colors"
            >
              Customer signup
            </Link>
            <span className="text-mesh-border select-none" aria-hidden>
              ·
            </span>
            <Link
              to="/signup?type=vendor"
              className="font-medium text-mesh-gold hover:text-mesh-gold-hover transition-colors"
            >
              Vendor signup
            </Link>
          </div>
        </div>
      </div>
    </AuthPageLayout>
  );
};
