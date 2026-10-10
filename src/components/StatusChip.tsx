import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Feather } from '@expo/vector-icons';

import { useTheme } from '@/theme';
import { radii } from '@/theme/spacing';
import { typography } from '@/theme/typography';
import { EventStatus } from '@/types/disaster';

/** critical/warning (red/amber) are reserved for operational status. */
export type ChipTone = 'critical' | 'warning' | 'success' | 'info' | 'neutral';

type StatusChipProps =
  | { status: EventStatus; label?: never; tone?: never }
  | { status?: never; label: string; tone: ChipTone };

export function StatusChip(props: StatusChipProps) {
  const { colors } = useTheme();

  if (props.label !== undefined) {
    const tones: Record<ChipTone, { color: string; bg: string }> = {
      critical: { color: colors.statusActive, bg: colors.statusActiveBg },
      warning: { color: colors.statusWatch, bg: colors.statusWatchBg },
      success: { color: colors.statusResolved, bg: colors.statusResolvedBg },
      info: { color: colors.actionPrimary, bg: colors.brandTealBg },
      neutral: { color: colors.textSecondary, bg: colors.surfaceMuted },
    };
    const tone = tones[props.tone];
    return (
      <View style={[styles.chip, { backgroundColor: tone.bg }]} accessibilityLabel={`Status: ${props.label}`}>
        <View style={[styles.dot, { backgroundColor: tone.color }]} />
        <Text style={[styles.label, { color: tone.color }]}>{props.label}</Text>
      </View>
    );
  }

  const { status } = props;

  const config: Record<
    EventStatus,
    {
      label: string;
      color: string;
      bg: string;
      icon: keyof typeof Feather.glyphMap;
    }
  > = {
    ACTIVE: {
      label: 'Active',
      color: colors.statusActive,
      bg: colors.statusActiveBg,
      icon: 'alert-triangle',
    },
    CANDIDATE: {
      label: 'Watch',
      color: colors.statusWatch,
      bg: colors.statusWatchBg,
      icon: 'eye',
    },
    RESOLVED: {
      label: 'Resolved',
      color: colors.statusResolved,
      bg: colors.statusResolvedBg,
      icon: 'check-circle',
    },
    DISMISSED: {
      label: 'Dismissed',
      color: colors.info,
      bg: colors.infoBg,
      icon: 'slash',
    },
  };

  const item = config[status];

  return (
    <View style={[styles.chip, { backgroundColor: item.bg }]}>
      <Feather name={item.icon} size={12} color={item.color} style={styles.icon} />
      <Text style={[styles.label, { color: item.color }]}>{item.label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: radii.chip,
    alignSelf: 'flex-start',
  },
  icon: {
    marginRight: 4,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 5,
  },
  label: {
    ...typography.caption,
    fontSize: 12,
    lineHeight: 16,
    fontWeight: '600',
  },
});
