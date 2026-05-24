import { create } from 'zustand';

export type ThemeMode = 'dark' | 'light';

const THEME_STORAGE_KEY = 'carmeshTheme';
const DEFAULT_THEME: ThemeMode = 'dark';

function isThemeMode(value: string | null): value is ThemeMode {
  return value === 'dark' || value === 'light';
}

function applyTheme(theme: ThemeMode) {
  document.documentElement.dataset.theme = theme;
  document.documentElement.style.colorScheme = theme;
}

interface ThemeState {
  theme: ThemeMode;
  setTheme: (theme: ThemeMode) => void;
  toggleTheme: () => void;
  hydrate: () => void;
}

export const useThemeStore = create<ThemeState>((set, get) => ({
  theme: DEFAULT_THEME,

  setTheme: (theme) => {
    localStorage.setItem(THEME_STORAGE_KEY, theme);
    applyTheme(theme);
    set({ theme });
  },

  toggleTheme: () => {
    const next = get().theme === 'dark' ? 'light' : 'dark';
    get().setTheme(next);
  },

  hydrate: () => {
    const stored = localStorage.getItem(THEME_STORAGE_KEY);
    const theme = isThemeMode(stored) ? stored : DEFAULT_THEME;
    applyTheme(theme);
    set({ theme });
  },
}));
