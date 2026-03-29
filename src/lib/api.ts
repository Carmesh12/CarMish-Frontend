const API_BASE =
  typeof import.meta.env.VITE_API_URL === 'string' && import.meta.env.VITE_API_URL
    ? import.meta.env.VITE_API_URL
    : 'http://localhost:3000';

export function getApiBase(): string {
  return API_BASE.replace(/\/$/, '');
}

/** Build absolute URL for API-hosted files (e.g. `/uploads/...`) or pass through http(s) URLs. */
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
  const res = await fetch(`${getApiBase()}${path}`, { ...init, headers });
  const data: unknown = await res.json().catch(() => ({}));
  if (!res.ok) {
    const raw =
      data &&
      typeof data === 'object' &&
      'message' in data &&
      (data as { message: unknown }).message;
    const message = Array.isArray(raw)
      ? raw.join(', ')
      : typeof raw === 'string'
        ? raw
        : res.statusText;
    const err = new Error(message) as Error & ApiErrorBody;
    err.status = res.status;
    err.message = message;
    throw err;
  }
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
  const res = await fetch(`${getApiBase()}${path}`, {
    ...init,
    method: init.method ?? 'POST',
    headers,
    body: formData,
  });
  const data: unknown = await res.json().catch(() => ({}));
  if (!res.ok) {
    const raw =
      data &&
      typeof data === 'object' &&
      'message' in data &&
      (data as { message: unknown }).message;
    const message = Array.isArray(raw)
      ? raw.join(', ')
      : typeof raw === 'string'
        ? raw
        : res.statusText;
    const err = new Error(message) as Error & ApiErrorBody;
    err.status = res.status;
    err.message = message;
    throw err;
  }
  return data as T;
}
