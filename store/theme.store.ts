'use client';
import { create } from 'zustand';

export type ThemeMode = 'dark' | 'light';

interface ThemeState {
  theme: ThemeMode;
  setTheme: (theme: ThemeMode) => void;
  toggleTheme: () => void;
  initTheme: () => void;
}

function applyThemeToDOM(theme: ThemeMode) {
  if (typeof document === 'undefined') return;
  const root = document.documentElement;
  root.setAttribute('data-theme', theme);
  if (theme === 'dark') {
    root.classList.add('dark');
    root.classList.remove('light');
  } else {
    root.classList.add('light');
    root.classList.remove('dark');
  }
}

export const useThemeStore = create<ThemeState>((set, get) => ({
  theme: 'dark',
  setTheme: (theme) => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('nebcode_theme', theme);
    }
    applyThemeToDOM(theme);
    set({ theme });
  },
  toggleTheme: () => {
    const next: ThemeMode = get().theme === 'dark' ? 'light' : 'dark';
    get().setTheme(next);
  },
  initTheme: () => {
    if (typeof window === 'undefined') return;
    const saved = localStorage.getItem('nebcode_theme') as ThemeMode | null;
    const initial: ThemeMode = saved === 'light' || saved === 'dark' ? saved : 'dark';
    applyThemeToDOM(initial);
    set({ theme: initial });
  },
}));
