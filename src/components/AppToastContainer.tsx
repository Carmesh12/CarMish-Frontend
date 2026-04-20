import { ToastContainer } from 'react-toastify';
import { useTranslation } from 'react-i18next';

export function AppToastContainer() {
  const { i18n } = useTranslation();
  return (
    <ToastContainer
      position={i18n.language === 'ar' ? 'top-left' : 'top-right'}
      autoClose={4200}
      hideProgressBar={false}
      newestOnTop
      closeOnClick
      rtl={i18n.language === 'ar'}
      pauseOnFocusLoss
      draggable
      pauseOnHover
      limit={4}
      icon={false}
      toastClassName="mesh-toast"
    />
  );
}
