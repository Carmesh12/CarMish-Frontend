import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import './i18n';
import './index.css';
import App from './App';
import { AppToastContainer } from './components/AppToastContainer';
import { useAuthStore } from './stores/authStore';

useAuthStore.getState().hydrate();

const lang = localStorage.getItem('i18nextLng') || 'en';
document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr';
document.documentElement.lang = lang;

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <App />
      <AppToastContainer />
    </BrowserRouter>
  </StrictMode>,
);
