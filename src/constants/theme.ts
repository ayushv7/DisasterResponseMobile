/**
 * Below are the colors that are used in the app. The colors are defined in the light and dark mode.
 * There are many other ways to style your app. For example, [Nativewind](https://www.nativewind.dev/), [Tamagui](https://tamagui.dev/), [unistyles](https://reactnativeunistyles.vercel.app), etc.
 */

import '@/global.css';

import { Platform } from 'react-native';

export const Colors = {
  light: {
    text: '#0F172A', // Dark Navy primary
    textSecondary: '#475569', // Slate secondary
    textMuted: '#64748B', // Muted text
    background: '#F8FAFC', // Slate 50 light neutral background
    cardBackground: '#FFFFFF', // Pure white cards
    backgroundElement: '#F1F5F9', // Subtle slate 100
    backgroundSelected: '#E2E8F0', // Slate 200
    border: '#E2E8F0', // Slate 200 border
    borderSubtle: '#CBD5E1', // Slate 300
    teal: '#0D9488', // Teal primary accent
    tealDark: '#0F766E', // Teal dark
    tealSurface: '#F0FDFA', // Teal very light tint
    tealBorder: '#99F6E4', // Teal border
    // Event status colors
    candidate: '#D97706',
    candidateBg: '#FEF3C7',
    candidateBorder: '#FDE68A',
    active: '#DC2626',
    activeBg: '#FEE2E2',
    activeBorder: '#FECACA',
    resolved: '#059669',
    resolvedBg: '#ECFDF5',
    resolvedBorder: '#A7F3D0',
    dismissed: '#64748B',
    dismissedBg: '#F1F5F9',
    dismissedBorder: '#CBD5E1',
    // Freshness indicator colors
    fresh: '#059669',
    ageing: '#D97706',
    stale: '#E11D48',
    unavailable: '#64748B',
    // Sample warning banner colors
    warningBg: '#FFFBEB',
    warningBorder: '#FCD34D',
    warningText: '#92400E',
  },
  dark: {
    text: '#F8FAFC',
    textSecondary: '#94A3B8',
    textMuted: '#64748B',
    background: '#0B1120',
    cardBackground: '#131D31',
    backgroundElement: '#1E293B',
    backgroundSelected: '#334155',
    border: '#1E293B',
    borderSubtle: '#334155',
    teal: '#14B8A6',
    tealDark: '#0D9488',
    tealSurface: '#042F2E',
    tealBorder: '#115E59',
    candidate: '#F59E0B',
    candidateBg: '#451A03',
    candidateBorder: '#78350F',
    active: '#EF4444',
    activeBg: '#450A0A',
    activeBorder: '#7F1D1D',
    resolved: '#10B981',
    resolvedBg: '#022C22',
    resolvedBorder: '#064E3B',
    dismissed: '#94A3B8',
    dismissedBg: '#1E293B',
    dismissedBorder: '#334155',
    fresh: '#10B981',
    ageing: '#F59E0B',
    stale: '#F43F5E',
    unavailable: '#94A3B8',
    warningBg: '#451A03',
    warningBorder: '#92400E',
    warningText: '#FDE68A',
  },
} as const;

export type ThemeColor = keyof typeof Colors.light & keyof typeof Colors.dark;

export const Fonts = Platform.select({
  ios: {
    /** iOS `UIFontDescriptorSystemDesignDefault` */
    sans: 'system-ui',
    /** iOS `UIFontDescriptorSystemDesignSerif` */
    serif: 'ui-serif',
    /** iOS `UIFontDescriptorSystemDesignRounded` */
    rounded: 'ui-rounded',
    /** iOS `UIFontDescriptorSystemDesignMonospaced` */
    mono: 'ui-monospace',
  },
  default: {
    sans: 'normal',
    serif: 'serif',
    rounded: 'normal',
    mono: 'monospace',
  },
  web: {
    sans: 'var(--font-display)',
    serif: 'var(--font-serif)',
    rounded: 'var(--font-rounded)',
    mono: 'var(--font-mono)',
  },
});

export const Spacing = {
  half: 2,
  one: 4,
  two: 8,
  three: 16,
  four: 24,
  five: 32,
  six: 64,
} as const;

export const BottomTabInset = Platform.select({ ios: 50, android: 80 }) ?? 0;
export const MaxContentWidth = 800;
