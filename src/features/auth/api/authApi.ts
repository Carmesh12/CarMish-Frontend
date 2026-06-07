import { getApiBase } from '../../../lib/api';

export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  user: {
    id: string;
    email: string;
    role: 'USER' | 'VENDOR' | 'ADMIN';
    emailVerified: boolean;
    profile: Record<string, unknown> | null;
  };
}

export interface AuthMessageResponse {
  message: string;
}

async function post<T>(path: string, body: Record<string, unknown>): Promise<T> {
  const res = await fetch(`${getApiBase()}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const raw = data?.message;
    throw new Error(
      Array.isArray(raw) ? raw.join(', ') : typeof raw === 'string' ? raw : res.statusText,
    );
  }
  return data as T;
}

export const authApi = {
  login: (body: { email: string; password: string }) =>
    post<AuthResponse>('/auth/login', body),

  signupUser: (body: {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    phoneNumber: string;
    city: string;
    address?: string;
  }) =>
    post<AuthMessageResponse>('/auth/signup', body),

  signupVendor: (body: { email: string; password: string; businessName: string; contactPersonName: string; phoneNumber?: string; businessAddress?: string }) =>
    post<AuthMessageResponse>('/auth/signup/vendor', body),

  verifyEmail: (token: string) =>
    post<AuthMessageResponse>('/auth/verify-email', { token }),

  resendVerification: (email: string) =>
    post<AuthMessageResponse>('/auth/resend-verification', { email }),

  forgotPassword: (email: string) =>
    post<{ message: string }>('/auth/forgot-password', { email }),

  resetPassword: (token: string, newPassword: string) =>
    post<{ message: string }>('/auth/reset-password', { token, newPassword }),
};
