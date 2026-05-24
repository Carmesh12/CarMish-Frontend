import { Moon, Sun } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useThemeStore } from '../stores/themeStore';

export function ThemeToggle({ compact = false }: { compact?: boolean }) {
  const { t } = useTranslation();
  const theme = useThemeStore((s) => s.theme);
  const toggleTheme = useThemeStore((s) => s.toggleTheme);
  const isDark = theme === 'dark';
  const label = isDark ? t('nav.lightMode') : t('nav.darkMode');
  const Icon = isDark ? Sun : Moon;

  return (
    <button
      type="button"
      onClick={toggleTheme}
      title={label}
      aria-label={label}
      className={
        compact
          ? 'flex items-center gap-1.5 text-mesh-muted hover:text-mesh-gold transition-all duration-200 text-sm cursor-pointer hover:drop-shadow-[0_0_6px_rgba(212,168,83,0.3)]'
          : 'flex items-center gap-2 px-3 py-1.5 rounded-mesh-sm border border-white/8 bg-white/3 backdrop-blur-sm text-mesh-muted hover:text-mesh-gold hover:border-mesh-gold/40 hover:shadow-[0_0_12px_rgba(212,168,83,0.12)] transition-all duration-250 text-sm cursor-pointer'
      }
    >
      <Icon size={16} />
      <span>{compact ? label : label}</span>
    </button>
  );
}
