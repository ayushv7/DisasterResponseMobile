import React, { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Feather } from '@expo/vector-icons';

import { useTheme } from '@/theme';
import { radii, spacing } from '@/theme/spacing';
import { typography } from '@/theme/typography';

/**
 * "in 2 hours" / "3 hours ago" for a service-supplied ISO timestamp. Display
 * only: it never decides whether a resource is fresh or stale.
 */
export function relativeTime(iso: string, now = Date.now()): string {
  const diffMin = Math.round((new Date(iso).getTime() - now) / 60000);
  const abs = Math.abs(diffMin);
  const text =
    abs < 60
      ? `${abs} min`
      : abs < 48 * 60
        ? `${Math.round(abs / 60)} hour${Math.round(abs / 60) === 1 ? '' : 's'}`
        : `${Math.round(abs / 1440)} days`;
  return diffMin >= 0 ? `in ${text}` : `${text} ago`;
}

/** Banner for the earliest check-in due time returned by the service. */
export function CheckInDueBanner({ dueAt, count }: { dueAt: string; count: number }) {
  const { colors } = useTheme();
  // Time of first render; the list is re-read from the service on focus/refresh
  const [now] = useState(Date.now);
  const passed = new Date(dueAt).getTime() < now;
  return (
    <View
      style={[styles.banner, { backgroundColor: passed ? colors.statusActiveBg : colors.statusWatchBg }]}
      accessibilityLiveRegion="polite">
      <Feather name="clock" size={14} color={passed ? colors.statusActive : colors.statusWatch} />
      <Text style={[styles.text, { color: colors.textPrimary }]}>
        {passed ? `Check-in was due ${relativeTime(dueAt, now)}` : `Check-in due ${relativeTime(dueAt, now)}`}
        {count > 1 ? ` · ${count} resources` : ''}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    padding: spacing.sm,
    borderRadius: radii.sm,
  },
  text: { ...typography.caption, fontSize: 13, flex: 1 },
});
