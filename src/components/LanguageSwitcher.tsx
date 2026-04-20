import { useTranslation } from 'react-i18next';
import { Globe } from 'lucide-react';

export function LanguageSwitcher({ compact }: { compact?: boolean }) {
  const { i18n } = useTranslation();
  const isAr = i18n.language === 'ar';

  const toggle = () => {
    const next = isAr ? 'en' : 'ar';
    i18n.changeLanguage(next);
    document.documentElement.dir = next === 'ar' ? 'rtl' : 'ltr';
    document.documentElement.lang = next;
  };

  if (compact) {
    return (
      <button
        onClick={toggle}
        className="flex items-center gap-1.5 text-mesh-muted hover:text-mesh-gold transition-all duration-200 text-sm cursor-pointer hover:drop-shadow-[0_0_6px_rgba(212,168,83,0.3)]"
      >
        <Globe size={16} />
        <span>{isAr ? 'EN' : 'عربي'}</span>
      </button>
    );
  }

  return (
    <button
      onClick={toggle}
      className="flex items-center gap-2 px-3 py-1.5 rounded-[var(--radius-mesh-sm)] border border-white/[0.08] bg-white/[0.03] backdrop-blur-sm text-mesh-muted hover:text-mesh-gold hover:border-mesh-gold/40 hover:shadow-[0_0_12px_rgba(212,168,83,0.12)] transition-all duration-250 text-sm cursor-pointer"
    >
      <Globe size={16} />
      <span>{isAr ? 'English' : 'العربية'}</span>
    </button>
  );
}
