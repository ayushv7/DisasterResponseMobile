import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { useTheme } from '@/theme';
import { spacing } from '@/theme/spacing';
import { typography } from '@/theme/typography';

export type Freshness = 'fresh' | 'ageing' | 'stale' | 'unknown';

const HOUR_MS = 60 * 60 * 1000;

/** green < 1h, amber < 24h, red older. `asOf` is the reference time (e.g. when data loaded). */
export function freshnessOf(reportedAt: string | undefined, asOf: string): Freshness {
  if (!reportedAt) return 'unknown';
  const age = new Date(asOf).getTime() - new Date(reportedAt).getTime();
  if (age < HOUR_MS) return 'fresh';
  if (age < 24 * HOUR_MS) return 'ageing';
  return 'stale';
}

function formatAge(reportedAt: string, asOf: string) {
  const mins = Math.max(0, Math.round((new Date(asOf).getTime() - new Date(reportedAt).getTime()) / 60000));
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

interface FreshnessDotProps {
  reportedAt?: string;
  asOf: string;
}

/** Colored dot + "Reported 25m ago". Shows "No report time" when unknown. */
export function FreshnessDot({ reportedAt, asOf }: FreshnessDotProps) {
  const { colors } = useTheme();
  const freshness = freshnessOf(reportedAt, asOf);
  const color = {
    fresh: colors.statusResolved,
    ageing: colors.statusWatch,
    stale: colors.statusActive,
    unknown: colors.textTertiary,
  }[freshness];
  const label = reportedAt ? `Reported ${formatAge(reportedAt, asOf)}` : 'No report time';

  return (
    <View style={styles.row} accessibilityLabel={`${label}, ${freshness}`}>
      <View style={[styles.dot, { backgroundColor: color }]} />
      <Text style={[styles.text, { color: colors.textSecondary }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs + 2,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  text: {
    ...typography.caption,
    fontSize: 12,
  },
});
