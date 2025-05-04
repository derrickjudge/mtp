'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';

interface ThemeContextType {
  primaryColor: string;
  secondaryColor: string;
  siteName: string;
  siteDescription: string;
  logoUrl: string;
  refreshTheme: () => Promise<void>;
}

const defaultTheme: ThemeContextType = {
  primaryColor: '#000000',
  secondaryColor: '#ffffff',
  siteName: 'MTP Collective',
  siteDescription: 'Photography portfolio website',
  logoUrl: '',
  refreshTheme: async () => {}
};

const ThemeContext = createContext<ThemeContextType>(defaultTheme);

export const useTheme = () => useContext(ThemeContext);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<ThemeContextType>(defaultTheme);
  
  const fetchTheme = async () => {
    try {
      const response = await fetch('/api/settings');
      if (response.ok) {
        const data = await response.json();
        setTheme({
          ...theme,
          primaryColor: data.primaryColor || defaultTheme.primaryColor,
          secondaryColor: data.secondaryColor || defaultTheme.secondaryColor,
          siteName: data.siteName || defaultTheme.siteName,
          siteDescription: data.siteDescription || defaultTheme.siteDescription,
          logoUrl: data.logoUrl || defaultTheme.logoUrl,
        });
      }
    } catch (error) {
      console.warn('Could not load theme settings:', error);
    }
  };

  // Apply theme CSS variables to document root
  useEffect(() => {
    const root = document.documentElement;
    root.style.setProperty('--primary-color', theme.primaryColor);
    root.style.setProperty('--secondary-color', theme.secondaryColor);
  }, [theme.primaryColor, theme.secondaryColor]);

  // Fetch theme on initial load
  useEffect(() => {
    fetchTheme();
  }, []);

  const value = {
    ...theme,
    refreshTheme: fetchTheme
  };

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
}

export default ThemeProvider;
