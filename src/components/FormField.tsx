import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { useTheme } from '@/theme';
import { radii, spacing } from '@/theme/spacing';
import { typography } from '@/theme/typography';

interface FormFieldProps {
  label: string;
  required?: boolean;
  hint?: string;
  errorText?: string;
  children: React.ReactNode;
}

/**
 * Reusable labelled form field wrapper.
 * Renders a label above the field, an optional hint below,
 * and a validation error in red when errorText is provided.
 */
export function FormField({ label, required, hint, errorText, children }: FormFieldProps) {
  const { colors } = useTheme();

  return (
    <View style={styles.container}>
      {/* Label row */}
      <View style={styles.labelRow}>
        <Text style={[styles.label, { color: colors.textSecondary }]}>
          {label}
        </Text>
        {required && (
          <Text style={[styles.requiredMark, { color: colors.statusActive }]}>
            {' '}*
          </Text>
        )}
      </View>

      {/* Field slot */}
      {children}

      {/* Hint or error — mutually exclusive; error takes priority */}
      {errorText ? (
        <Text style={[styles.errorText, { color: colors.statusActive }]}>
          {errorText}
        </Text>
      ) : hint ? (
        <Text style={[styles.hintText, { color: colors.textTertiary }]}>
          {hint}
        </Text>
      ) : null}
    </View>
  );
}

// ─── Reusable Section Divider ─────────────────────────────────────────────────

interface SectionTitleProps {
  label: string;
}

export function SectionTitle({ label }: SectionTitleProps) {
  const { colors } = useTheme();
  return (
    <Text style={[styles.sectionTitle, { color: colors.textTertiary }]}>
      {label}
    </Text>
  );
}

// ─── Reusable Privacy Notice Banner ──────────────────────────────────────────

export function PrivacyNoticeBanner() {
  const { colors } = useTheme();
  return (
    <View style={[styles.privacyBanner, { backgroundColor: colors.surfaceMuted }]}>
      <View style={[styles.privacyAccentBar, { backgroundColor: colors.brandPrimary }]} />
      <Text style={[styles.privacyText, { color: colors.textSecondary }]}>
        Your message, and any photos or location you attach, go privately to the selected NGO only. Nothing appears publicly unless the NGO reviews it and publishes a separate update.
      </Text>
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    marginBottom: spacing.lg,
  },
  labelRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginBottom: spacing.xs,
  },
  label: {
    ...typography.caption,
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  requiredMark: {
    ...typography.caption,
    fontSize: 13,
    fontWeight: '700',
  },
  errorText: {
    ...typography.caption,
    fontSize: 12,
    marginTop: spacing.xs,
  },
  hintText: {
    ...typography.caption,
    fontSize: 12,
    marginTop: spacing.xs,
  },
  sectionTitle: {
    ...typography.overline,
    fontSize: 11,
    marginBottom: spacing.sm,
    paddingHorizontal: spacing.screenPadding,
  },
  privacyBanner: {
    flexDirection: 'row',
    borderRadius: radii.sm,
    overflow: 'hidden',
    marginBottom: spacing.xl,
  },
  privacyAccentBar: {
    width: 3,
  },
  privacyText: {
    ...typography.caption,
    fontSize: 13,
    lineHeight: 19,
    flex: 1,
    padding: spacing.md,
  },
});
