import { ToastContainer } from 'react-toastify';
import { useTranslation } from 'react-i18next';

export function AppToastContainer() {
  const { i18n } = useTranslation();
  const isArabic = i18n.resolvedLanguage?.startsWith('ar') ?? i18n.language.startsWith('ar');

  return (
    <ToastContainer
      position={isArabic ? 'top-left' : 'top-right'}
      autoClose={4200}
      hideProgressBar={false}
      newestOnTop
      closeOnClick
      rtl={isArabic}
      pauseOnFocusLoss
      draggable
      pauseOnHover
      limit={4}
      icon={false}
      toastClassName="mesh-toast"
    />
  );
}
