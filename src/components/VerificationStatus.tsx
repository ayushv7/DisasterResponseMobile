import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { useTheme } from '@/theme';
import { spacing } from '@/theme/spacing';
import { typography } from '@/theme/typography';
import { InterventionRecord, VerificationStep } from '@/types/operations';

const LABELS: Record<VerificationStep['status'], string> = {
  PENDING: 'Pending',
  VERIFIED: 'Verified',
  REJECTED: 'Sent back',
};

/** Both verification steps, as returned by the backend: NGO, then authority. */
export function VerificationStatus({ item }: { item: InterventionRecord }) {
  const { colors } = useTheme();
  if (!item.ngoVerification && !item.authorityVerification) return null;

  const dot = (step?: VerificationStep) =>
    step?.status === 'VERIFIED'
      ? colors.statusResolved
      : step?.status === 'REJECTED'
        ? colors.statusActive
        : colors.statusWatch;

  const row = (label: string, step?: VerificationStep) => (
    <View style={styles.row}>
      <View style={[styles.dot, { backgroundColor: dot(step) }]} />
      <Text style={[styles.text, { color: colors.textSecondary }]}>
        {label}: {LABELS[step?.status ?? 'PENDING']}
        {step?.by ? ` · ${step.by}` : ''}
      </Text>
    </View>
  );

  return (
    <View style={styles.wrap} accessibilityLabel="Verification status">
      {row('1. NGO check', item.ngoVerification)}
      {row('2. Authority final', item.authorityVerification)}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: 2, paddingVertical: spacing.xxs },
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  dot: { width: 8, height: 8, borderRadius: 4 },
  text: { ...typography.caption, fontSize: 12 },
});
