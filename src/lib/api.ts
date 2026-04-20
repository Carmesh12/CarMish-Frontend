const API_BASE =
  typeof import.meta.env.VITE_API_URL === 'string' && import.meta.env.VITE_API_URL
    ? import.meta.env.VITE_API_URL
    : 'http://localhost:3000';

export function getApiBase(): string {
  return API_BASE.replace(/\/$/, '');
}

export function resolveMediaUrl(
  stored: string | null | undefined,
): string | null {
  if (stored == null || String(stored).trim() === '') return null;
  const s = String(stored).trim();
  if (s.startsWith('http://') || s.startsWith('https://')) return s;
  if (s.startsWith('/')) return `${getApiBase()}${s}`;
  return `${getApiBase()}/${s}`;
}

export type ApiErrorBody = {
  status: number;
  message: string;
};

let isRefreshing = false;
let refreshPromise: Promise<boolean> | null = null;

async function tryRefreshToken(): Promise<boolean> {
  const rt = localStorage.getItem('refreshToken');
  if (!rt) return false;

  try {
    const res = await fetch(`${getApiBase()}/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken: rt }),
    });
    if (!res.ok) return false;
    const data = (await res.json()) as { accessToken: string; refreshToken: string };
    localStorage.setItem('accessToken', data.accessToken);
    localStorage.setItem('refreshToken', data.refreshToken);
    return true;
  } catch {
    return false;
  }
}

async function refreshOnce(): Promise<boolean> {
  if (isRefreshing) return refreshPromise!;
  isRefreshing = true;
  refreshPromise = tryRefreshToken().finally(() => {
    isRefreshing = false;
    refreshPromise = null;
  });
  return refreshPromise;
}

function buildError(data: unknown, statusText: string, status: number): Error & ApiErrorBody {
  const raw =
    data &&
    typeof data === 'object' &&
    'message' in data &&
    (data as { message: unknown }).message;
  const message = Array.isArray(raw)
    ? raw.join(', ')
    : typeof raw === 'string'
      ? raw
      : statusText;
  const err = new Error(message) as Error & ApiErrorBody;
  err.status = status;
  err.message = message;
  return err;
}

async function doFetch(url: string, init: RequestInit): Promise<Response> {
  const res = await fetch(url, init);

  if (res.status === 401 && localStorage.getItem('refreshToken')) {
    const refreshed = await refreshOnce();
    if (refreshed) {
      const headers = new Headers(init.headers);
      const newToken = localStorage.getItem('accessToken');
      if (newToken) headers.set('Authorization', `Bearer ${newToken}`);
      return fetch(url, { ...init, headers });
    }
  }

  return res;
}

export async function authJson<T>(
  path: string,
  init: RequestInit = {},
): Promise<T> {
  const token = localStorage.getItem('accessToken');
  const headers = new Headers(init.headers);
  const method = (init.method ?? 'GET').toUpperCase();
  if (
    ['POST', 'PUT', 'PATCH'].includes(method) &&
    init.body != null &&
    typeof init.body === 'string'
  ) {
    headers.set('Content-Type', 'application/json');
  }
  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  const res = await doFetch(`${getApiBase()}${path}`, { ...init, headers });
  const data: unknown = await res.json().catch(() => ({}));
  if (!res.ok) throw buildError(data, res.statusText, res.status);
  return data as T;
}

export async function authFormData<T>(
  path: string,
  formData: FormData,
  init: Omit<RequestInit, 'body' | 'headers'> = {},
): Promise<T> {
  const token = localStorage.getItem('accessToken');
  const headers = new Headers();
  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  const res = await doFetch(`${getApiBase()}${path}`, {
    ...init,
    method: init.method ?? 'POST',
    headers,
    body: formData,
  });
  const data: unknown = await res.json().catch(() => ({}));
  if (!res.ok) throw buildError(data, res.statusText, res.status);
  return data as T;
}
