import { ToastContainer } from 'react-toastify';

export function AppToastContainer() {
  return (
    <ToastContainer
      position="top-right"
      autoClose={4200}
      hideProgressBar={false}
      newestOnTop
      closeOnClick
      rtl={false}
      pauseOnFocusLoss
      draggable
      pauseOnHover
      limit={4}
      icon={false}
      toastClassName="mesh-toast"
    />
  );
}
