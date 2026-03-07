import React, { createContext, useContext, useEffect, useState } from 'react';

const ThemeContext = createContext();

export const ThemeProvider = ({ children }) => {
  const [theme, setTheme] = useState('dark');

  useEffect(() => {
    const stored = localStorage.getItem('theme');
    // FIX: default to 'dark' when no stored preference exists (e.g. first load,
    // incognito, or cache cleared). Previously fell back to system preference
    // which could show light mode unexpectedly on a dark-first app.
    const next = stored === 'light' || stored === 'dark' ? stored : 'dark';
    setTheme(next);
  }, []);

  useEffect(() => {
    const root = window.document.documentElement;
    root.classList.remove('light', 'dark');
    root.classList.add(theme);
    localStorage.setItem('theme', theme);
  }, [theme]);

  const toggleTheme = () => setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'));

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => useContext(ThemeContext);
