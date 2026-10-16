// Material 3 Expressive Theme Tokens & Tonal Palette Generator

export type ThemeMode = 'amoled' | 'dark' | 'light';

export interface SeedColor {
  name: string;
  hex: string;
}

export const PRESET_SEED_COLORS: SeedColor[] = [
  { name: 'Termux Emerald', hex: '#10B981' },
  { name: 'Neon Cyan', hex: '#06B6D4' },
  { name: 'Hyper Indigo', hex: '#6366F1' },
  { name: 'Electric Amber', hex: '#F59E0B' },
  { name: 'Hot Crimson', hex: '#F43F5E' },
  { name: 'Obsidian Violet', hex: '#8B5CF6' },
  { name: 'Pure Cyan', hex: '#38BDF8' },
];

export interface ThemeColors {
  background: string;
  onBackground: string;
  surface: string;
  surfaceDim: string;
  surfaceBright: string;
  surfaceContainerLowest: string;
  surfaceContainerLow: string;
  surfaceContainer: string;
  surfaceContainerHigh: string;
  surfaceContainerHighest: string;
  onSurface: string;
  onSurfaceVariant: string;
  outline: string;
  outlineVariant: string;
  primary: string;
  onPrimary: string;
  primaryContainer: string;
  onPrimaryContainer: string;
  secondary: string;
  onSecondary: string;
  secondaryContainer: string;
  onSecondaryContainer: string;
  tertiary: string;
  onTertiary: string;
  tertiaryContainer: string;
  onTertiaryContainer: string;
  error: string;
  onError: string;
  errorContainer: string;
  onErrorContainer: string;
}

// Convert hex to HSL
function hexToHsl(hex: string): [number, number, number] {
  let c = hex.replace('#', '');
  if (c.length === 3) c = c.split('').map((x) => x + x).join('');
  const num = parseInt(c, 16);
  const r = (num >> 16) / 255;
  const g = ((num >> 8) & 255) / 255;
  const b = (num & 255) / 255;

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h = 0;
  let s = 0;
  const l = (max + min) / 2;

  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r: h = (g - b) / d + (g < b ? 6 : 0); break;
      case g: h = (b - r) / d + 2; break;
      case b: h = (r - g) / d + 4; break;
    }
    h /= 6;
  }
  return [Math.round(h * 360), Math.round(s * 100), Math.round(l * 100)];
}

function hslToHex(h: number, s: number, l: number): string {
  s = Math.max(0, Math.min(100, s)) / 100;
  l = Math.max(0, Math.min(100, l)) / 100;
  const a = s * Math.min(l, 1 - l);
  const f = (n: number) => {
    const k = (n + h / 30) % 12;
    const color = l - a * Math.max(Math.min(k - 3, 9 - k, 1), -1);
    return Math.round(255 * color).toString(16).padStart(2, '0');
  };
  return `#${f(0)}${f(8)}${f(4)}`;
}

export function generateTonalColors(seedHex: string, mode: ThemeMode): ThemeColors {
  const [h, s] = hexToHsl(seedHex);
  const secH = (h + 30) % 360;
  const terH = (h + 60) % 360;

  if (mode === 'amoled') {
    return {
      background: '#000000',
      onBackground: '#E2E8F0',
      surface: '#000000',
      surfaceDim: '#000000',
      surfaceBright: '#181E29',
      surfaceContainerLowest: '#000000',
      surfaceContainerLow: '#080C14',
      surfaceContainer: '#0F1420',
      surfaceContainerHigh: '#161D2E',
      surfaceContainerHighest: '#1F283C',
      onSurface: '#F1F5F9',
      onSurfaceVariant: '#94A3B8',
      outline: '#475569',
      outlineVariant: '#1E293B',
      primary: hslToHex(h, Math.min(95, s + 10), 65),
      onPrimary: hslToHex(h, 90, 10),
      primaryContainer: hslToHex(h, 85, 22),
      onPrimaryContainer: hslToHex(h, 90, 88),
      secondary: hslToHex(secH, 75, 65),
      onSecondary: hslToHex(secH, 90, 10),
      secondaryContainer: hslToHex(secH, 70, 22),
      onSecondaryContainer: hslToHex(secH, 80, 88),
      tertiary: hslToHex(terH, 80, 70),
      onTertiary: hslToHex(terH, 90, 12),
      tertiaryContainer: hslToHex(terH, 70, 24),
      onTertiaryContainer: hslToHex(terH, 85, 90),
      error: '#F87171',
      onError: '#450A0A',
      errorContainer: '#7F1D1D',
      onErrorContainer: '#FECACA',
    };
  }

  if (mode === 'dark') {
    return {
      background: '#0B0F17',
      onBackground: '#E2E8F0',
      surface: '#0B0F17',
      surfaceDim: '#080B11',
      surfaceBright: '#232A39',
      surfaceContainerLowest: '#06090F',
      surfaceContainerLow: '#101522',
      surfaceContainer: '#161C2C',
      surfaceContainerHigh: '#1E253A',
      surfaceContainerHighest: '#273048',
      onSurface: '#F1F5F9',
      onSurfaceVariant: '#94A3B8',
      outline: '#475569',
      outlineVariant: '#334155',
      primary: hslToHex(h, Math.min(90, s + 5), 65),
      onPrimary: hslToHex(h, 90, 10),
      primaryContainer: hslToHex(h, 80, 25),
      onPrimaryContainer: hslToHex(h, 90, 90),
      secondary: hslToHex(secH, 70, 65),
      onSecondary: hslToHex(secH, 90, 10),
      secondaryContainer: hslToHex(secH, 65, 25),
      onSecondaryContainer: hslToHex(secH, 80, 90),
      tertiary: hslToHex(terH, 75, 70),
      onTertiary: hslToHex(terH, 90, 12),
      tertiaryContainer: hslToHex(terH, 65, 26),
      onTertiaryContainer: hslToHex(terH, 85, 92),
      error: '#F87171',
      onError: '#450A0A',
      errorContainer: '#7F1D1D',
      onErrorContainer: '#FECACA',
    };
  }

  // Light mode
  return {
    background: '#F8FAFC',
    onBackground: '#0F172A',
    surface: '#FFFFFF',
    surfaceDim: '#EDEFEF',
    surfaceBright: '#FFFFFF',
    surfaceContainerLowest: '#FFFFFF',
    surfaceContainerLow: '#F1F5F9',
    surfaceContainer: '#E2E8F0',
    surfaceContainerHigh: '#CBD5E1',
    surfaceContainerHighest: '#94A3B8',
    onSurface: '#0F172A',
    onSurfaceVariant: '#475569',
    outline: '#64748B',
    outlineVariant: '#CBD5E1',
    primary: hslToHex(h, s, 40),
    onPrimary: '#FFFFFF',
    primaryContainer: hslToHex(h, Math.max(30, s - 10), 90),
    onPrimaryContainer: hslToHex(h, 90, 15),
    secondary: hslToHex(secH, 60, 40),
    onSecondary: '#FFFFFF',
    secondaryContainer: hslToHex(secH, 50, 90),
    onSecondaryContainer: hslToHex(secH, 80, 15),
    tertiary: hslToHex(terH, 65, 42),
    onTertiary: '#FFFFFF',
    tertiaryContainer: hslToHex(terH, 55, 90),
    onTertiaryContainer: hslToHex(terH, 85, 15),
    error: '#DC2626',
    onError: '#FFFFFF',
    errorContainer: '#FEE2E2',
    onErrorContainer: '#7F1D1D',
  };
}

// Spring motion specifications (Motion library for React)
export const springPresets = {
  spatial: {
    type: 'spring' as const,
    stiffness: 300,
    damping: 26,
    mass: 0.9,
  },
  effects: {
    type: 'spring' as const,
    stiffness: 420,
    damping: 22,
    mass: 0.7,
  },
  bouncy: {
    type: 'spring' as const,
    stiffness: 450,
    damping: 18,
    mass: 0.8,
  },
  sheet: {
    type: 'spring' as const,
    damping: 28,
    stiffness: 260,
    mass: 1.0,
  },
};
