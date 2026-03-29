import type { NavigateFunction } from 'react-router-dom';
import { getApiBase } from './api';
import { notifyDismiss, notifyLoading, notifySuccess, notifyWarning } from './toast';

export function performLogout(navigate: NavigateFunction): void {
  const toastId = notifyLoading('Signing you out…');
  const refreshToken = localStorage.getItem('refreshToken');

  void (async () => {
    try {
      if (refreshToken) {
        const res = await fetch(`${getApiBase()}/auth/logout`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ refreshToken }),
        });
        if (!res.ok) {
          throw new Error('Server could not revoke session');
        }
      }
      notifyDismiss(toastId);
      notifySuccess('You have been signed out.');
    } catch {
      notifyDismiss(toastId);
      notifyWarning(
        'You are signed out on this device. The server may not have been reached.',
      );
    } finally {
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      navigate('/login', { replace: true });
    }
  })();
}
