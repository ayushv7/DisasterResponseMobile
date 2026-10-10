import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { IS_MOCK_API } from '@/services/api';
import { useTheme } from '@/theme';
import { spacing } from '@/theme/spacing';
import { typography } from '@/theme/typography';

/**
 * The single global notice that the app is running on sample data.
 * Rendered once in the root layout; disappears when httpApi is active.
 * It owns the top safe-area inset, so screens below it don't pad twice.
 */
export function BackendBanner() {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  if (!IS_MOCK_API) return null;

  return (
    <View
      style={[styles.bar, { backgroundColor: colors.bannerBg, paddingTop: insets.top + spacing.xs }]}
      accessibilityRole="summary"
      accessibilityLabel="Backend not connected. Showing sample data. Actions are simulated.">
      <Text style={[styles.text, { color: colors.bannerText }]} numberOfLines={1}>
        Backend not connected – sample data, actions simulated
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    paddingHorizontal: spacing.screenPadding,
    paddingBottom: spacing.xs,
  },
  text: {
    ...typography.caption,
    fontSize: 12,
    lineHeight: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
});
