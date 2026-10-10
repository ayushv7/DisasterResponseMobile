import React from 'react';
import { StyleSheet, Text } from 'react-native';

import { IS_MOCK_API } from '@/services/api';
import { useSession } from '@/session/session-context';
import { useTheme } from '@/theme';
import { spacing } from '@/theme/spacing';
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

const styles = StyleSheet.create({
  text: {
    ...typography.caption,
    fontSize: 12,
    lineHeight: 17,
    paddingHorizontal: spacing.screenPadding,
    paddingVertical: spacing.xs,
  },
});
