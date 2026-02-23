import { createContext, useContext, useEffect, useState } from 'react';
import { VALID_THEMES, DEFAULT_THEME, THEMES } from '../themes/themes';

const ThemeContext = createContext(null);

const STORAGE_KEY = 'app_style';

/** Resolve theme priority: URL param > localStorage > default */
function resolveInitialTheme() {
  const params   = new URLSearchParams(window.location.search);
  const urlStyle = params.get('style');
  if (urlStyle && VALID_THEMES.includes(urlStyle)) return urlStyle;

  const stored = localStorage.getItem(STORAGE_KEY);
  if (stored && VALID_THEMES.includes(stored)) return stored;

  return DEFAULT_THEME;
}

export function ThemeProvider({ children }) {
  const [theme, setTheme] = useState(resolveInitialTheme);

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    localStorage.setItem(STORAGE_KEY, theme);
  }, [theme]);

  return (
    <ThemeContext.Provider value={{ theme, setTheme, themeConfig: THEMES[theme] }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}
