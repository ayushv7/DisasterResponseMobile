import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { router } from 'expo-router';

import { IS_MOCK_API } from '@/services/api';
import { useSession } from '@/session/session-context';
import { useTheme } from '@/theme';
import { radii, spacing, touchTargets } from '@/theme/spacing';
import { typography } from '@/theme/typography';

/**
 * NGO users only: says these incidents and plans were selected for the NGO by
 * the backend (detection, priority, allocation and nearby-NGO choice).
 */
export function NgoScopeNote() {
  const { colors } = useTheme();
  const { role, session } = useSession();
  if (role !== 'ngo') return null;
  return (
    <Text style={[styles.text, { color: colors.textSecondary }]}>
      Incidents near {session?.user?.ngoName ?? 'your NGO'}. Detection, priority and plans come from
      the backend{IS_MOCK_API ? ' (Simulated sample plans)' : ''}. You can accept or adjust them.
    </Text>
  );
}

/** NGO only: entry to the contributor resource plan (replan / manual allocation). */
export function ResourcePlanLink() {
  const { colors } = useTheme();
  const { role } = useSession();
  if (role !== 'ngo') return null;
  return (
    <View style={styles.linkWrap}>
      <Pressable
        onPress={() => router.push('/ops/plan')}
        style={[styles.link, { backgroundColor: colors.surface }]}
        android_ripple={{ color: colors.surfaceMuted }}
        accessibilityRole="button">
        <Feather name="layers" size={16} color={colors.textSecondary} />
        <Text style={[styles.linkText, { color: colors.textPrimary }]}>Resource plan</Text>
        <Feather name="chevron-right" size={16} color={colors.textTertiary} />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  linkWrap: { paddingHorizontal: spacing.screenPadding, paddingBottom: spacing.xs },
  link: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    minHeight: touchTargets.min,
    paddingHorizontal: spacing.md,
    borderRadius: radii.card,
  },
  linkText: { ...typography.bodyMedium, fontSize: 14, flex: 1 },
  text: {
    ...typography.caption,
    fontSize: 12,
    lineHeight: 17,
    paddingHorizontal: spacing.screenPadding,
    paddingVertical: spacing.xs,
  },
});
