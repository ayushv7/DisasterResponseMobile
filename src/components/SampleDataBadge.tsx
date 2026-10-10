import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { DataSource, IS_MOCK_API } from '@/services/api';
import { useTheme } from '@/theme';
import { radii, spacing } from '@/theme/spacing';
import { typography } from '@/theme/typography';

interface SampleDataBadgeProps {
  /** Source of the data shown next to the badge. Hidden only for live data. */
  source?: DataSource;
}

/** Small "SAMPLE DATA" tag for cards/screens driven by fixtures. */
export function SampleDataBadge({ source }: SampleDataBadgeProps) {
  const { colors } = useTheme();
  const isSample = source ? source === 'sample' : IS_MOCK_API;
  if (!isSample) return null;

  return (
    <View
      style={[styles.badge, { backgroundColor: colors.surfaceMuted }]}
      accessibilityLabel="Sample data, not live">
      <Text style={[styles.text, { color: colors.textSecondary }]}>SAMPLE DATA</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    alignSelf: 'flex-start',
    paddingHorizontal: spacing.xs + 2,
    paddingVertical: 1,
    borderRadius: radii.xs,
  },
  text: {
    ...typography.caption,
    fontSize: 10,
    lineHeight: 14,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
});
