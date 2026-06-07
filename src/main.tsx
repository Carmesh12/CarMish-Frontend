import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import './i18n';
import './index.css';
import App from './App';
import { AppToastContainer } from './components/AppToastContainer';
import { useAuthStore } from './stores/authStore';
import { useThemeStore } from './stores/themeStore';

window.onerror = (...args) => {
  console.error('GLOBAL_ERROR', args);
};

window.addEventListener('unhandledrejection', (event) => {
  console.error('UNHANDLED_REJECTION', event.reason);
});

console.log('APP_STARTED');

useAuthStore.getState().hydrate();
useThemeStore.getState().hydrate();

const lang = localStorage.getItem('i18nextLng') || 'en';
const isArabic = lang.toLowerCase().startsWith('ar');
document.documentElement.dir = isArabic ? 'rtl' : 'ltr';
document.documentElement.lang = isArabic ? 'ar' : 'en';
document.documentElement.classList.toggle('lang-ar', isArabic);

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <App />
      <AppToastContainer />
    </BrowserRouter>
  </StrictMode>,
);
