import React, { createContext, useContext, useEffect, useState } from 'react';
import { generateTonalColors, PRESET_SEED_COLORS, ThemeColors, ThemeMode } from './tokens';
import { setHapticsEnabled as setGlobalHaptics } from '../haptics/haptics';

interface ThemeContextType {
  themeMode: ThemeMode;
  setThemeMode: (mode: ThemeMode) => void;
  seedColor: string;
  setSeedColor: (color: string) => void;
  fontSize: number;
  setFontSize: (size: number) => void;
  showExtraKeys: boolean;
  setShowExtraKeys: (show: boolean) => void;
  hapticsOn: boolean;
  setHapticsOn: (on: boolean) => void;
  cursorStyle: 'block' | 'underline' | 'bar';
  setCursorStyle: (style: 'block' | 'underline' | 'bar') => void;
  colors: ThemeColors;
}

const ThemeContext = createContext<ThemeContextType | null>(null);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [themeMode, setThemeModeState] = useState<ThemeMode>(() => {
    return (localStorage.getItem('termux_theme_mode') as ThemeMode) || 'amoled';
  });

  const [seedColor, setSeedColorState] = useState<string>(() => {
    return localStorage.getItem('termux_seed_color') || '#10B981';
  });

  const [fontSize, setFontSizeState] = useState<number>(() => {
    const saved = localStorage.getItem('termux_font_size');
    return saved ? parseInt(saved, 10) : 14;
  });

  const [showExtraKeys, setShowExtraKeysState] = useState<boolean>(() => {
    const saved = localStorage.getItem('termux_extra_keys');
    return saved !== null ? saved === 'true' : true;
  });

  const [hapticsOn, setHapticsOnState] = useState<boolean>(() => {
    const saved = localStorage.getItem('termux_haptics');
    return saved !== null ? saved === 'true' : true;
  });

  const [cursorStyle, setCursorStyleState] = useState<'block' | 'underline' | 'bar'>(() => {
    return (localStorage.getItem('termux_cursor_style') as 'block' | 'underline' | 'bar') || 'block';
  });

  const colors = generateTonalColors(seedColor, themeMode);

  // Apply colors to CSS custom properties
  useEffect(() => {
    const root = document.documentElement;
    root.style.setProperty('--md-sys-color-background', colors.background);
    root.style.setProperty('--md-sys-color-on-background', colors.onBackground);
    root.style.setProperty('--md-sys-color-surface', colors.surface);
    root.style.setProperty('--md-sys-color-surface-dim', colors.surfaceDim);
    root.style.setProperty('--md-sys-color-surface-bright', colors.surfaceBright);
    root.style.setProperty('--md-sys-color-surface-container-lowest', colors.surfaceContainerLowest);
    root.style.setProperty('--md-sys-color-surface-container-low', colors.surfaceContainerLow);
    root.style.setProperty('--md-sys-color-surface-container', colors.surfaceContainer);
    root.style.setProperty('--md-sys-color-surface-container-high', colors.surfaceContainerHigh);
    root.style.setProperty('--md-sys-color-surface-container-highest', colors.surfaceContainerHighest);
    root.style.setProperty('--md-sys-color-on-surface', colors.onSurface);
    root.style.setProperty('--md-sys-color-on-surface-variant', colors.onSurfaceVariant);
    root.style.setProperty('--md-sys-color-outline', colors.outline);
    root.style.setProperty('--md-sys-color-outline-variant', colors.outlineVariant);
    root.style.setProperty('--md-sys-color-primary', colors.primary);
    root.style.setProperty('--md-sys-color-on-primary', colors.onPrimary);
    root.style.setProperty('--md-sys-color-primary-container', colors.primaryContainer);
    root.style.setProperty('--md-sys-color-on-primary-container', colors.onPrimaryContainer);
    root.style.setProperty('--md-sys-color-secondary', colors.secondary);
    root.style.setProperty('--md-sys-color-on-secondary', colors.onSecondary);
    root.style.setProperty('--md-sys-color-secondary-container', colors.secondaryContainer);
    root.style.setProperty('--md-sys-color-on-secondary-container', colors.onSecondaryContainer);
    root.style.setProperty('--md-sys-color-tertiary', colors.tertiary);
    root.style.setProperty('--md-sys-color-on-tertiary', colors.onTertiary);
    root.style.setProperty('--md-sys-color-tertiary-container', colors.tertiaryContainer);
    root.style.setProperty('--md-sys-color-on-tertiary-container', colors.onTertiaryContainer);
    root.style.setProperty('--md-sys-color-error', colors.error);
    root.style.setProperty('--md-sys-color-on-error', colors.onError);
    root.style.setProperty('--md-sys-color-error-container', colors.errorContainer);
    root.style.setProperty('--md-sys-color-on-error-container', colors.onErrorContainer);

    // Meta theme-color for browser address bar
    const metaThemeColor = document.querySelector('meta[name="theme-color"]');
    if (metaThemeColor) {
      metaThemeColor.setAttribute('content', colors.background);
    }
  }, [colors]);

  const setThemeMode = (mode: ThemeMode) => {
    setThemeModeState(mode);
    localStorage.setItem('termux_theme_mode', mode);
  };

  const setSeedColor = (color: string) => {
    setSeedColorState(color);
    localStorage.setItem('termux_seed_color', color);
  };

  const setFontSize = (size: number) => {
    setFontSizeState(size);
    localStorage.setItem('termux_font_size', size.toString());
  };

  const setShowExtraKeys = (show: boolean) => {
    setShowExtraKeysState(show);
    localStorage.setItem('termux_extra_keys', show.toString());
  };

  const setHapticsOn = (on: boolean) => {
    setHapticsOnState(on);
    setGlobalHaptics(on);
    localStorage.setItem('termux_haptics', on.toString());
  };

  const setCursorStyle = (style: 'block' | 'underline' | 'bar') => {
    setCursorStyleState(style);
    localStorage.setItem('termux_cursor_style', style);
  };

  return (
    <ThemeContext.Provider
      value={{
        themeMode,
        setThemeMode,
        seedColor,
        setSeedColor,
        fontSize,
        setFontSize,
        showExtraKeys,
        setShowExtraKeys,
        hapticsOn,
        setHapticsOn,
        cursorStyle,
        setCursorStyle,
        colors,
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within ThemeProvider');
  }
  return context;
}
