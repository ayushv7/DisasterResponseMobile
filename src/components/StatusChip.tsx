import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Feather } from '@expo/vector-icons';

import { useTheme } from '@/theme';
import { radii, spacing } from '@/theme/spacing';
import { typography } from '@/theme/typography';
import { EventStatus } from '@/types/disaster';

interface StatusChipProps {
  status: EventStatus;
}

export function StatusChip({ status }: StatusChipProps) {
  const { colors } = useTheme();

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
  label: {
    ...typography.caption,
    fontSize: 12,
    lineHeight: 16,
    fontWeight: '600',
  },
});
