import { Platform, TextStyle } from 'react-native';

/**
 * Standard Typography Scale for Disaster Response Orchestration Network
 *
 * Weight discipline:
 * - Regular: '400'
 * - Medium: '500'
 * - SemiBold: '600'
 */

export const fontFamilies = {
  regular: Platform.select({
    ios: 'Inter_400Regular',
    android: 'Inter_400Regular',
    default: 'system-ui',
  }),
  medium: Platform.select({
    ios: 'Inter_500Medium',
    android: 'Inter_500Medium',
    default: 'system-ui',
  }),
  semibold: Platform.select({
    ios: 'Inter_600SemiBold',
    android: 'Inter_600SemiBold',
    default: 'system-ui',
  }),
};

export const typography: Record<string, TextStyle> = {
  display: {
    fontFamily: fontFamilies.semibold,
    fontSize: 28,
    lineHeight: 34,
    fontWeight: '600',
    letterSpacing: -0.5,
  },
  title: {
    fontFamily: fontFamilies.semibold,
    fontSize: 20,
    lineHeight: 26,
    fontWeight: '600',
    letterSpacing: -0.3,
  },
  cardTitle: {
    fontFamily: fontFamilies.semibold,
    fontSize: 18,
    lineHeight: 24,
    fontWeight: '600',
    letterSpacing: -0.2,
  },
  body: {
    fontFamily: fontFamilies.regular,
    fontSize: 16,
    lineHeight: 24,
    fontWeight: '400',
  },
  bodyMedium: {
    fontFamily: fontFamilies.medium,
    fontSize: 16,
    lineHeight: 24,
    fontWeight: '500',
  },
  caption: {
    fontFamily: fontFamilies.medium,
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '500',
  },
  overline: {
    fontFamily: fontFamilies.semibold,
    fontSize: 12,
    lineHeight: 16,
    fontWeight: '600',
    letterSpacing: 0.6,
    textTransform: 'uppercase',
  },
  tabular: {
    fontVariant: ['tabular-nums'],
  },
};
