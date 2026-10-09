import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Feather } from '@expo/vector-icons';

import { useTheme } from '@/theme';
import { radii, spacing, touchTargets } from '@/theme/spacing';
import { typography } from '@/theme/typography';

interface ErrorStateProps {
  message?: string;
  onRetry: () => void;
}

export function ErrorState({
  message = 'Unable to refresh telemetry feeds. Check network connectivity or retry.',
  onRetry,
}: ErrorStateProps) {
  const { colors } = useTheme();

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: colors.surface,
        },
      ]}>
      <View style={[styles.iconCircle, { backgroundColor: colors.statusActiveBg }]}>
        <Feather name="alert-triangle" size={26} color={colors.statusActive} />
      </View>
      <Text style={[styles.title, { color: colors.textPrimary }]}>Connection Interrupted</Text>
      <Text style={[styles.message, { color: colors.textSecondary }]}>{message}</Text>
      <Pressable
        onPress={onRetry}
        style={({ pressed }) => [
          styles.retryButton,
          {
            backgroundColor: colors.brandPrimary,
            opacity: pressed ? 0.85 : 1,
          },
        ]}
        accessibilityRole="button"
        accessibilityLabel="Retry loading flood alerts">
        <Text style={[styles.retryText, { color: colors.onPrimary }]}>Retry Connection</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: radii.card,
    padding: spacing.xxl,
    marginHorizontal: spacing.screenPadding,
    marginTop: spacing.md,
    alignItems: 'center',
  },
  iconCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },
  title: {
    ...typography.cardTitle,
    textAlign: 'center',
    marginBottom: spacing.xs,
  },
  message: {
    ...typography.body,
    fontSize: 14,
    lineHeight: 20,
    textAlign: 'center',
    maxWidth: 290,
  },
  retryButton: {
    height: touchTargets.min,
    paddingHorizontal: spacing.xl,
    borderRadius: radii.button,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: spacing.lg,
  },
  retryText: {
    ...typography.bodyMedium,
    fontWeight: '600',
  },
});
