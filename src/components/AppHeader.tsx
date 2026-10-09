import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { useTheme } from '@/theme';
import { spacing } from '@/theme/spacing';
import { typography } from '@/theme/typography';

interface AppHeaderProps {
  timeText: string;
}

export function AppHeader({ timeText }: AppHeaderProps) {
  const { colors } = useTheme();

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Text style={[styles.title, { color: colors.textPrimary }]} numberOfLines={1}>
        Flood Alerts
      </Text>
      <Text style={[styles.time, typography.tabular, { color: colors.textTertiary }]} numberOfLines={1}>
        {timeText}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: spacing.screenPadding,
    paddingTop: spacing.md,
    paddingBottom: spacing.xs,
  },
  title: {
    ...typography.title,
    fontSize: 22,
    lineHeight: 28,
  },
  time: {
    ...typography.caption,
    fontSize: 12,
    lineHeight: 16,
    marginTop: 2,
  },
});
