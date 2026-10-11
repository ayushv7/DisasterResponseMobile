/**
 * Public alert for the visitor's own area: level, times, what to do, what not
 * to do, shelter, helplines and who issued it. No raw observations or counts.
 */
import React from 'react';
import { Linking, Pressable, StyleSheet, Text, View } from 'react-native';
import { Feather } from '@expo/vector-icons';

import { LocationBlock } from '@/components/LocationBlock';
import { ChipTone, StatusChip } from '@/components/StatusChip';
import { radii, spacing, textScale, touchTargets, typography, useTheme } from '@/theme';
import { AlertLevel, MyAlert } from '@/types/my-alert';

export const LEVELS: Record<AlertLevel, { label: string; tone: ChipTone }> = {
  ADVISORY: { label: 'Advisory', tone: 'info' },
  WARNING: { label: 'Warning', tone: 'warning' },
  EVACUATE: { label: 'Evacuate', tone: 'critical' },
};

const fmt = (iso: string) => new Date(iso).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' });

export function AreaAlertCard({ alert }: { alert: MyAlert }) {
  const { colors } = useTheme();
  // Amber/red only for Warning/Evacuate; Advisory uses the info colour
  const accent =
    alert.level === 'EVACUATE' ? colors.statusActive : alert.level === 'WARNING' ? colors.statusWatch : colors.info;

  return (
    <View style={[styles.card, { backgroundColor: colors.surface, borderLeftColor: accent }]}>
      <View style={styles.row}>
        <StatusChip label={LEVELS[alert.level].label} tone={LEVELS[alert.level].tone} />
        <Text style={[styles.caption, styles.flex, { color: colors.textSecondary }]} numberOfLines={1}>
          {alert.areaName}
        </Text>
      </View>
      <Text style={[styles.headline, { color: colors.textPrimary }]} accessibilityRole="header">
        {alert.headline}
      </Text>
      <Text style={[styles.caption, { color: colors.textTertiary }]}>
        Issued {fmt(alert.issuedAt)} · Updated {fmt(alert.updatedAt)}
        {alert.expiresAt ? ` · Expires ${fmt(alert.expiresAt)}` : ''}
      </Text>

      <Text style={[styles.section, { color: colors.textPrimary }]}>What to do now</Text>
      {alert.whatToDo.map((step, i) => (
        <View key={step} style={styles.listRow}>
          <Text style={[styles.body, styles.num, { color: colors.textSecondary }]}>{i + 1}.</Text>
          <Text style={[styles.body, styles.flex, { color: colors.textPrimary }]}>{step}</Text>
        </View>
      ))}

      {alert.doNot.length > 0 && (
        <>
          <Text style={[styles.section, { color: colors.textPrimary }]}>Do not</Text>
          {alert.doNot.map((item) => (
            <View key={item} style={styles.listRow}>
              <Feather name="x" size={16} color={colors.textSecondary} style={styles.icon} />
              <Text style={[styles.body, styles.flex, { color: colors.textPrimary }]}>{item}</Text>
            </View>
          ))}
        </>
      )}

      {alert.shelter && (
        <>
          <Text style={[styles.section, { color: colors.textPrimary }]}>Nearest shelter</Text>
          <LocationBlock place={`${alert.shelter.name}, ${alert.shelter.address}`} />
          {alert.shelter.routeNote && (
            <Text style={[styles.caption, { color: colors.textSecondary }]}>Route: {alert.shelter.routeNote}</Text>
          )}
        </>
      )}

      <Text style={[styles.section, { color: colors.textPrimary }]}>Helpline</Text>
      <View style={styles.helplines}>
        {alert.helplines.map((h) => (
          <Pressable
            key={h.number}
            onPress={() => Linking.openURL(`tel:${h.number}`)}
            style={[styles.helpline, { backgroundColor: colors.surfaceMuted }]}
            accessibilityRole="button"
            accessibilityLabel={`Call ${h.label}, ${h.number}`}>
            <Feather name="phone" size={16} color={colors.textPrimary} />
            <Text style={[styles.body, styles.bold, { color: colors.textPrimary }]}>
              {h.number}
            </Text>
            <Text style={[styles.caption, { color: colors.textSecondary }]}>{h.label}</Text>
          </Pressable>
        ))}
      </View>

      <Text style={[styles.caption, { color: colors.textTertiary }]}>
        Issued by {alert.issuedBy.authority}
        {alert.issuedBy.ngoName ? ` with ${alert.issuedBy.ngoName}` : ''}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: radii.card,
    borderLeftWidth: spacing.xs,
    padding: spacing.cardPadding,
    gap: spacing.sm,
  },
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  flex: { flex: 1 },
  headline: { ...typography.title, ...textScale.subtitle, fontWeight: '700' },
  section: { ...typography.bodyMedium, ...textScale.body, fontWeight: '700', marginTop: spacing.sm },
  listRow: { flexDirection: 'row', gap: spacing.sm },
  num: { minWidth: spacing.lg },
  icon: { marginTop: spacing.xxs },
  helplines: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  helpline: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    minHeight: touchTargets.min,
    paddingHorizontal: spacing.md,
    borderRadius: radii.button,
  },
  body: { ...typography.body, ...textScale.body },
  bold: { fontWeight: '700' },
  caption: { ...typography.caption, ...textScale.caption },
});
