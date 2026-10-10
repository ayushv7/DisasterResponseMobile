/**
 * Small building blocks shared by the sign-in and account screens.
 */
import React from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  TextInputProps,
  View,
} from 'react-native';
import { Feather } from '@expo/vector-icons';

import { IS_MOCK_API } from '@/services/api';
import { useTheme } from '@/theme';
import { radii, spacing, touchTargets } from '@/theme/spacing';
import { typography } from '@/theme/typography';

export function AuthField({ label, ...input }: { label: string } & TextInputProps) {
  const { colors } = useTheme();
  return (
    <View style={styles.fieldGroup}>
      <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>{label}</Text>
      <TextInput
        placeholderTextColor={colors.textTertiary}
        accessibilityLabel={label}
        {...input}
        style={[styles.input, { color: colors.textPrimary, backgroundColor: colors.surfaceMuted }]}
      />
    </View>
  );
}

export function PrimaryButton({
  label,
  onPress,
  busy,
  disabled,
}: {
  label: string;
  onPress: () => void;
  busy?: boolean;
  disabled?: boolean;
}) {
  const { colors } = useTheme();
  const inactive = busy || disabled;
  return (
    <Pressable
      onPress={onPress}
      disabled={inactive}
      accessibilityRole="button"
      accessibilityState={{ disabled: !!inactive, busy: !!busy }}
      style={[styles.button, { backgroundColor: colors.brandPrimary, opacity: inactive ? 0.6 : 1 }]}>
      {busy ? (
        <ActivityIndicator size="small" color={colors.onPrimary} />
      ) : (
        <Text style={[styles.buttonText, { color: colors.onPrimary }]}>{label}</Text>
      )}
    </Pressable>
  );
}

/** Mock mode only: makes clear nothing was authenticated by a server. */
export function SimulatedSignInNotice({ hint }: { hint?: string }) {
  const { colors } = useTheme();
  if (!IS_MOCK_API) return null;
  return (
    <View style={[styles.notice, { backgroundColor: colors.infoBg }]}>
      <Feather name="info" size={14} color={colors.info} />
      <Text style={[styles.noticeText, { color: colors.textPrimary }]}>
        Simulated sign-in / sample accounts. Nothing is sent to a server.
        {hint ? ` ${hint}` : ''}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  fieldGroup: {
    gap: 6,
  },
  fieldLabel: {
    ...typography.caption,
    fontSize: 12,
    fontWeight: '600',
  },
  input: {
    borderRadius: radii.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm + 4,
    fontSize: 14,
    minHeight: touchTargets.min,
  },
  button: {
    height: touchTargets.min,
    borderRadius: radii.button,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: spacing.xs,
  },
  buttonText: {
    ...typography.bodyMedium,
    fontWeight: '700',
    fontSize: 15,
  },
  notice: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.xs,
    padding: spacing.sm,
    borderRadius: radii.sm,
  },
  noticeText: {
    ...typography.caption,
    fontSize: 12,
    lineHeight: 17,
    flex: 1,
  },
});
