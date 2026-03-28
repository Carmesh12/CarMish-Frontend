import {
  toast,
  type ToastPromiseParams,
  type ToastOptions,
} from 'react-toastify';

export function notifySuccess(message: string, options?: ToastOptions) {
  return toast.success(message, options);
}

export function notifyError(message: string, options?: ToastOptions) {
  return toast.error(message, options);
}

export function notifyWarning(message: string, options?: ToastOptions) {
  return toast.warning(message, options);
}

export function notifyInfo(message: string, options?: ToastOptions) {
  return toast.info(message, options);
}

export function notifyLoading(message: string, options?: ToastOptions) {
  return toast.loading(message, options);
}

export function notifyDismiss(toastId: string | number) {
  toast.dismiss(toastId);
}

export function notifyPromise<T>(
  promise: Promise<T> | (() => Promise<T>),
  messages: ToastPromiseParams<T>,
  options?: ToastOptions<T>,
) {
  return toast.promise(promise, messages, options);
}
