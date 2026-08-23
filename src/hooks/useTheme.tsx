import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';

type Theme = 'light' | 'dark';
type VisualStyle = 'industrial' | 'minimalist';

interface ThemeContextType {
  theme: Theme;
  visualStyle: VisualStyle;
  toggleTheme: () => void;
  toggleVisualStyle: () => void;
}


const ThemeContext = createContext<ThemeContextType>({ theme: 'light', toggleTheme: () => {} });

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState<Theme>(() => {
    const stored = localStorage.getItem('decode-theme');
    if (stored === 'dark' || stored === 'light') return stored;
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  });

  const [visualStyle, setVisualStyle] = useState<VisualStyle>(() => {
    const stored = localStorage.getItem('decode-visual-style');
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
    
    localStorage.setItem('decode-theme', theme);
    localStorage.setItem('decode-visual-style', visualStyle);
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
