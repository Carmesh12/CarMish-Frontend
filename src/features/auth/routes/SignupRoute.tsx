import React, { useState } from 'react';
import { Link, Navigate, useNavigate, useSearchParams } from 'react-router-dom';
import { InputField } from '../components/InputField';
import { AuthPageLayout } from '../components/AuthPageLayout';
import { notifyPromise, notifyWarning } from '../../../lib/toast';

type AccountType = 'user' | 'vendor';

export const SignupRoute: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [accountType, setAccountType] = useState<AccountType>(() =>
    searchParams.get('type') === 'vendor' ? 'vendor' : 'user',
  );

  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [businessName, setBusinessName] = useState('');
  const [contactPersonName, setContactPersonName] = useState('');
  const [businessAddress, setBusinessAddress] = useState('');
  const [email, setEmail] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const existingToken = localStorage.getItem('accessToken');
  if (existingToken) {
    return <Navigate to="/dashboard" replace />;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (password !== confirmPassword) {
      notifyWarning('Passwords do not match. Please check and try again.');
      return;
    }

    setIsLoading(true);

    let url: string;
    let body: Record<string, string>;

    if (accountType === 'user') {
      url = 'http://localhost:3000/auth/signup';
      body = {
        email,
        password,
        firstName,
        lastName,
      };
      if (phoneNumber.trim()) {
        body.phoneNumber = phoneNumber.trim();
      }
    } else {
      url = 'http://localhost:3000/auth/signup/vendor';
      body = {
        email,
        password,
        businessName,
        contactPersonName,
      };
      if (phoneNumber.trim()) {
        body.phoneNumber = phoneNumber.trim();
      }
      if (businessAddress.trim()) {
        body.businessAddress = businessAddress.trim();
      }
    }

    const signupTask = (async () => {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      });

      const data = await response.json();

      if (!response.ok) {
        const msg = Array.isArray(data.message)
          ? data.message.join(', ')
          : data.message || 'Could not create account';
        throw new Error(msg);
      }

      localStorage.setItem('accessToken', data.accessToken);
      localStorage.setItem('refreshToken', data.refreshToken);
      return data;
    })();

    try {
      await notifyPromise(signupTask, {
        pending: 'Creating your account…',
        success: 'Account created. Welcome to CarMesh.',
        error: {
          render({ data }) {
            return data instanceof Error ? data.message : 'Registration failed';
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
    <AuthPageLayout heroTagline="Create a customer or vendor profile. One platform for discovery, trust, and automotive commerce.">
      <div className="rounded-[var(--radius-mesh)] border border-mesh-border bg-mesh-card p-8 sm:p-10 shadow-[var(--shadow-mesh-card)]">
        <div className="mb-6">
          <h2 className="text-2xl font-semibold text-mesh-text tracking-tight">Create account</h2>
          <p className="mt-2 text-sm text-mesh-muted leading-relaxed">
            Choose how you will use CarMesh.
          </p>
        </div>

        <div className="mb-6 rounded-[var(--radius-mesh-sm)] border border-mesh-border p-1 bg-mesh-surface flex">
          <button
            type="button"
            onClick={() => setAccountType('user')}
            className={[
              'flex-1 py-2.5 px-3 text-sm font-medium rounded-md transition-colors duration-200',
              accountType === 'user'
                ? 'bg-mesh-card text-mesh-text border border-mesh-border shadow-[var(--shadow-mesh-soft)]'
                : 'text-mesh-muted hover:text-mesh-text',
            ].join(' ')}
          >
            Customer
          </button>
          <button
            type="button"
            onClick={() => setAccountType('vendor')}
            className={[
              'flex-1 py-2.5 px-3 text-sm font-medium rounded-md transition-colors duration-200',
              accountType === 'vendor'
                ? 'bg-mesh-card text-mesh-text border border-mesh-border shadow-[var(--shadow-mesh-soft)]'
                : 'text-mesh-muted hover:text-mesh-text',
            ].join(' ')}
          >
            Vendor
          </button>
        </div>

        <p className="text-xs text-mesh-muted mb-6 leading-relaxed">
          {accountType === 'user'
            ? 'Shop vehicles and parts. Full access to the marketplace as a buyer.'
            : 'List as a seller. New vendor accounts are reviewed before approval.'}
        </p>

        <form onSubmit={handleSubmit} className="w-full">
          {accountType === 'user' ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4">
              <InputField
                label="First name"
                id="firstName"
                type="text"
                autoComplete="given-name"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                required
              />
              <InputField
                label="Last name"
                id="lastName"
                type="text"
                autoComplete="family-name"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                required
              />
            </div>
          ) : (
            <>
              <InputField
                label="Business name"
                id="businessName"
                type="text"
                autoComplete="organization"
                value={businessName}
                onChange={(e) => setBusinessName(e.target.value)}
                required
              />
              <InputField
                label="Contact person"
                id="contactPersonName"
                type="text"
                autoComplete="name"
                value={contactPersonName}
                onChange={(e) => setContactPersonName(e.target.value)}
                required
              />
              <InputField
                label="Business address (optional)"
                id="businessAddress"
                type="text"
                autoComplete="street-address"
                value={businessAddress}
                onChange={(e) => setBusinessAddress(e.target.value)}
              />
            </>
          )}

          <InputField
            label="Email"
            id="signup-email"
            type="email"
            autoComplete="email"
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />

          <InputField
            label="Phone (optional)"
            id="phoneNumber"
            type="tel"
            autoComplete="tel"
            placeholder="+962…"
            value={phoneNumber}
            onChange={(e) => setPhoneNumber(e.target.value)}
          />

          <InputField
            label="Password"
            id="signup-password"
            type="password"
            autoComplete="new-password"
            placeholder="At least 8 characters"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={8}
          />

          <InputField
            label="Confirm password"
            id="confirmPassword"
            type="password"
            autoComplete="new-password"
            placeholder="••••••••"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
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
            {isLoading ? 'Please wait…' : 'Create account'}
          </button>
        </form>

        <div className="mt-10 pt-8 border-t border-mesh-border text-center">
          <p className="text-sm text-mesh-muted">
            Already registered?{' '}
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
