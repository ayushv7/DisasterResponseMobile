/**
 * Disaster Response Orchestration Network — Spacing & Layout Tokens
 *
 * Grounded on an 8pt grid with minimum 48dp interactive touch targets.
 */

export const spacing = {
  xxs: 2,
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
  screenPadding: 16,
  cardPadding: 16,
  cardGap: 12,
} as const;

export const radii = {
  xs: 4,
  sm: 8,
  button: 12,
  card: 16,
  chip: 999, // fully rounded chips
} as const;

export const touchTargets = {
  min: 48,
} as const;
