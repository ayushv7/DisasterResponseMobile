import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { Colors } from '@/constants/theme';
import { EventStatus, FreshnessState } from '@/types/disaster';
import { useColorScheme } from 'react-native';

interface StatusBadgeProps {
  status: EventStatus;
}

export function StatusBadge({ status }: StatusBadgeProps) {
  const scheme = useColorScheme();
  const colors = Colors[scheme === 'dark' ? 'dark' : 'light'];

  const config = {
    CANDIDATE: {
      label: 'CANDIDATE',
      bg: colors.candidateBg,
      border: colors.candidateBorder,
      text: colors.candidate,
    },
    ACTIVE: {
      label: 'ACTIVE',
      bg: colors.activeBg,
      border: colors.activeBorder,
      text: colors.active,
    },
    RESOLVED: {
      label: 'RESOLVED',
      bg: colors.resolvedBg,
      border: colors.resolvedBorder,
      text: colors.resolved,
    },
    DISMISSED: {
      label: 'DISMISSED',
      bg: colors.dismissedBg,
      border: colors.dismissedBorder,
      text: colors.dismissed,
    },
  }[status];

  return (
    <View
      style={[
        styles.badge,
        {
          backgroundColor: config.bg,
          borderColor: config.border,
        },
      ]}>
      <Text style={[styles.badgeText, { color: config.text }]}>{config.label}</Text>
    </View>
  );
}

interface FreshnessBadgeProps {
  freshness: FreshnessState;
}

export function FreshnessBadge({ freshness }: FreshnessBadgeProps) {
  const scheme = useColorScheme();
  const colors = Colors[scheme === 'dark' ? 'dark' : 'light'];

  const config = {
    FRESH: {
      label: 'Fresh',
      color: colors.fresh,
    },
    AGEING: {
      label: 'Ageing',
      color: colors.ageing,
    },
    STALE: {
      label: 'Stale',
      color: colors.stale,
    },
    SOURCE_UNAVAILABLE: {
      label: 'Source unavailable',
      color: colors.unavailable,
    },
  }[freshness];

  return (
    <View style={styles.freshnessRow}>
      <View style={[styles.freshnessIndicator, { backgroundColor: config.color }]} />
      <Text style={[styles.freshnessText, { color: config.color }]}>{config.label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 4,
    borderWidth: 1,
    alignSelf: 'flex-start',
  },
  badgeText: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  freshnessRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  freshnessIndicator: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  freshnessText: {
    fontSize: 11,
    fontWeight: '600',
  },
});
