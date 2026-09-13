import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';

type Theme = 'light' | 'dark';
type VisualStyle = 'industrial' | 'minimalist';

interface ThemeContextType {
  theme: Theme;
  visualStyle: VisualStyle;
  toggleTheme: () => void;
  toggleVisualStyle: () => void;
}


const ThemeContext = createContext<ThemeContextType>({ 
  theme: 'light', 
  visualStyle: 'industrial',
  toggleTheme: () => {}, 
  toggleVisualStyle: () => {} 
}); 

function readPreference(key: string): string | null {
  try {
    return typeof window !== 'undefined' && window.localStorage
      ? window.localStorage.getItem(key)
      : null;
  } catch {
    return null;
  }
}

function writePreference(key: string, value: string) {
  try {
    window.localStorage?.setItem(key, value);
  } catch {
    // Storage can be disabled by privacy settings. The in-memory theme still works.
  }
}


export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState<Theme>(() => {
    const stored = readPreference('decode-theme');
    if (stored === 'dark' || stored === 'light') return stored;
    return typeof window !== 'undefined' && window.matchMedia?.('(prefers-color-scheme: dark)').matches
      ? 'dark'
      : 'light';
  });

  const [visualStyle, setVisualStyle] = useState<VisualStyle>(() => {
    const stored = readPreference('decode-visual-style');
    if (stored === 'industrial' || stored === 'minimalist') return stored;
    return 'industrial';
  });

  useEffect(() => {
    const root = document.documentElement;
    root.classList.remove('light', 'dark', 'style-industrial', 'style-minimalist');
    root.classList.add(theme);
    root.classList.add(`style-${visualStyle}`);
    
    root.setAttribute('data-theme', theme);
    root.setAttribute('data-style', visualStyle);
    
    writePreference('decode-theme', theme);
    writePreference('decode-visual-style', visualStyle);
  }, [theme, visualStyle]);

  const toggleTheme = () => setTheme(prev => prev === 'light' ? 'dark' : 'light');
  const toggleVisualStyle = () => setVisualStyle(prev => prev === 'industrial' ? 'minimalist' : 'industrial');

  return (
    <ThemeContext.Provider value={{ theme, visualStyle, toggleTheme, toggleVisualStyle }}>
      {children}
    </ThemeContext.Provider>
  );
}


export const useTheme = () => useContext(ThemeContext);
