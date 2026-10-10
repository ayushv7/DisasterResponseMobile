import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Feather } from '@expo/vector-icons';

import { useTheme } from '@/theme';
import { radii, spacing, touchTargets } from '@/theme/spacing';
import { typography } from '@/theme/typography';

interface EmptyStateProps {
  title?: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
}

export function EmptyState({
  title = 'No active alerts in this view',
  description = 'No flood warnings match your current status filter or search keywords.',
  actionLabel,
  onAction,
}: EmptyStateProps) {
  const { colors } = useTheme();

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: colors.surface,
        },
      ]}>
      <View style={[styles.iconCircle, { backgroundColor: colors.surfaceMuted }]}>
        <Feather name="shield" size={28} color={colors.textTertiary} />
      </View>
      <Text style={[styles.title, { color: colors.textPrimary }]}>{title}</Text>
      <Text style={[styles.description, { color: colors.textSecondary }]}>{description}</Text>
      {actionLabel && onAction && (
        <Pressable
          onPress={onAction}
          style={({ pressed }) => [
            styles.actionButton,
            {
              backgroundColor: colors.surfaceMuted,
              opacity: pressed ? 0.8 : 1,
            },
          ]}
          accessibilityRole="button"
          accessibilityLabel={actionLabel}>
          <Text style={[styles.actionText, { color: colors.brandPrimary }]}>
            {actionLabel}
          </Text>
        </Pressable>
      )}
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
  description: {
    ...typography.body,
    fontSize: 14,
    lineHeight: 20,
    textAlign: 'center',
    maxWidth: 280,
  },
  actionButton: {
    minHeight: touchTargets.min,
    paddingHorizontal: spacing.lg,
    borderRadius: radii.button,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: spacing.lg,
  },
  actionText: {
    ...typography.bodyMedium,
    fontWeight: '600',
  },
});
