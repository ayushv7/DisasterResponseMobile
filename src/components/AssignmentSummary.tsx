import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { useTheme } from '@/theme';
import { radii, spacing } from '@/theme/spacing';
import { typography } from '@/theme/typography';

/** Where to go, what to do, by when, for which NGO — as returned by the service. */
export function AssignmentSummary({
  where,
  what,
  deadline,
  ngoName,
  whatLines,
}: {
  where: string;
  what: string;
  /** Truncate "What" to this many lines (full text shown elsewhere). */
  whatLines?: number;
  deadline?: string;
  ngoName?: string;
}) {
  const { colors } = useTheme();
  const row = (label: string, value: string, lines?: number) => (
    <View style={styles.row}>
      <Text style={[styles.label, { color: colors.textTertiary }]}>{label}</Text>
      <Text style={[styles.value, { color: colors.textPrimary }]} numberOfLines={lines}>
        {value}
      </Text>
    </View>
  );
  return (
    <View style={[styles.box, { backgroundColor: colors.surfaceMuted }]} accessibilityLabel="Your assignment">
      {row('Where', where)}
      {row('What', what, whatLines)}
      {row(
        'By',
        deadline
          ? new Date(deadline).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })
          : 'No deadline set'
      )}
      {ngoName && row('NGO', ngoName)}
    </View>
  );
}

const styles = StyleSheet.create({
  box: { borderRadius: radii.sm, padding: spacing.sm, gap: 2 },
  row: { flexDirection: 'row', gap: spacing.sm },
  label: { ...typography.caption, fontSize: 12, width: 48, fontWeight: '600' },
  value: { ...typography.caption, fontSize: 12, lineHeight: 17, flex: 1 },
});
