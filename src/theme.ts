import { create } from 'zustand';

export type ThemeId = 'light' | 'dark' | 'midnight' | 'warm' | 'contrast';
/** What the user picked: a concrete theme, or "follow the OS light/dark setting". */
export type ThemePreference = ThemeId | 'system';

export interface ThemeOption {
  id: ThemePreference;
  label: string;
  description: string;
  /** Mini preview colors (CSS backgrounds): page, card, accent. Independent of the active theme. */
  preview: { bg: string; card: string; accent: string };
}

export const THEME_OPTIONS: ThemeOption[] = [
  {
    id: 'system',
    label: 'Systemowy',
    description: 'Jasny lub ciemny, zgodnie z ustawieniami urządzenia',
    preview: { bg: 'linear-gradient(135deg, #f1f2f4 50%, #161a1d 50%)', card: '#ffffff', accent: '#579dff' },
  },
  {
    id: 'light',
    label: 'Jasny',
    description: 'Domyślny, klasyczny wygląd',
    preview: { bg: '#f1f2f4', card: '#ffffff', accent: '#0c66e4' },
  },
  {
    id: 'dark',
    label: 'Ciemny',
    description: 'Mniej światła, wygodny wieczorem',
    preview: { bg: '#161a1d', card: '#22272b', accent: '#579dff' },
  },
  {
    id: 'midnight',
    label: 'Nocny granat',
    description: 'Ciemny granat z turkusowym akcentem',
    preview: { bg: '#0a111d', card: '#15233a', accent: '#3ddbd9' },
  },
  {
    id: 'warm',
    label: 'Sepia',
    description: 'Ciepłe, papierowe tony – łagodne dla oczu',
    preview: { bg: '#eee5d4', card: '#fffdf9', accent: '#a14a12' },
  },
  {
    id: 'contrast',
    label: 'Wysoki kontrast',
    description: 'Wyraźne krawędzie i maksymalna czytelność',
    preview: { bg: '#ebebeb', card: '#ffffff', accent: '#000000' },
  },
];

// Also read by the inline script in index.html, which applies the theme before the first paint.
const STORAGE_KEY = 'jira-clone-theme';
const darkQuery = window.matchMedia('(prefers-color-scheme: dark)');

const isPreference = (value: unknown): value is ThemePreference => THEME_OPTIONS.some((o) => o.id === value);

function readPreference(): ThemePreference {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return isPreference(stored) ? stored : 'system';
  } catch {
    return 'system';
  }
}

const resolve = (preference: ThemePreference): ThemeId =>
  preference === 'system' ? (darkQuery.matches ? 'dark' : 'light') : preference;

const apply = (preference: ThemePreference) => {
  document.documentElement.dataset.theme = resolve(preference);
};

interface ThemeState {
  preference: ThemePreference;
  setPreference: (preference: ThemePreference) => void;
}

/** Color theme. Persisted separately from project data, so import/clear never touch it. */
export const useTheme = create<ThemeState>()((set) => ({
  preference: readPreference(),
  setPreference: (preference) => {
    try {
      localStorage.setItem(STORAGE_KEY, preference);
    } catch {
      // Storage unavailable (e.g. private mode) – the theme still applies for this session.
    }
    set({ preference });
  },
}));

apply(useTheme.getState().preference);
useTheme.subscribe((s) => apply(s.preference));
darkQuery.addEventListener('change', () => apply(useTheme.getState().preference));
