import React from 'react';
import { Pressable, StyleSheet, Text } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { router } from 'expo-router';

import { useSession } from '@/session/session-context';
import { useTheme } from '@/theme';
import { radii, spacing, touchTargets } from '@/theme/spacing';
import { typography } from '@/theme/typography';

/** Small, optional prompt; never blocks reading alerts or messaging an NGO. */
export function CitizenSignInPrompt() {
  const { colors } = useTheme();
  const { citizen } = useSession();
  if (citizen) return null;

  return (
    <Pressable
      onPress={() => router.push('/citizen-login')}
      style={[styles.row, { backgroundColor: colors.surface }]}
      android_ripple={{ color: colors.surfaceMuted }}
      accessibilityRole="link">
      <Feather name="log-in" size={16} color={colors.brandPrimary} />
      <Text style={[styles.text, { color: colors.textPrimary }]}>
        Sign in to offer help or get alerts
      </Text>
      <Feather name="chevron-right" size={16} color={colors.textTertiary} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    minHeight: touchTargets.min,
    paddingHorizontal: spacing.md,
    borderRadius: radii.card,
  },
  text: {
    ...typography.bodyMedium,
    fontSize: 14,
    flex: 1,
  },
});
