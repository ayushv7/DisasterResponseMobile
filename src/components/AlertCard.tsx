import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { router } from 'expo-router';

import { useTheme } from '@/theme';
import { radii, spacing } from '@/theme/spacing';
import { typography } from '@/theme/typography';
import { FloodEvent } from '@/types/disaster';

interface AlertCardProps {
  event: FloodEvent;
}

export function AlertCard({ event }: AlertCardProps) {
  const { colors } = useTheme();

  // Severity Dot & Status mapping
  const getSeverity = () => {
    if (event.severityLevel === 'CRITICAL' || event.severityLevel === 'HIGH' || event.status === 'ACTIVE') {
      return { color: colors.statusActive, label: 'Active' };
    }
    if (event.severityLevel === 'MODERATE' || event.status === 'CANDIDATE') {
      return { color: colors.statusWatch, label: 'Watch' };
    }
    if (event.severityLevel === 'LOW' || event.status === 'RESOLVED') {
      return { color: colors.statusResolved, label: 'Resolved' };
    }
    return { color: colors.brandPrimary, label: 'Dismissed' };
  };

  const severity = getSeverity();

  // Relative timestamp
  const getRelativeTime = (isoString: string) => {
    try {
      const now = new Date('2026-10-10T01:00:00Z').getTime();
      const eventTime = new Date(isoString).getTime();
      const diffMins = Math.max(1, Math.floor((now - eventTime) / (1000 * 60)));
      if (diffMins < 60) return `${diffMins}m ago`;
      const diffHours = Math.floor(diffMins / 60);
      if (diffHours < 24) return `${diffHours}h ago`;
      const diffDays = Math.floor(diffHours / 24);
      return `${diffDays}d ago`;
    } catch {
      return 'Recent';
    }
  };

  const handleCardPress = () => {
    router.push({
      pathname: '/event/[id]',
      params: { id: event.id },
    });
  };

  const obsCount = event.observations.length;
  const verifiedNgoCount = event.contributions.filter((c) => c.isVerifiedNgo).length;

  return (
    <Pressable
      onPress={handleCardPress}
      accessibilityRole="button"
      accessibilityLabel={`Alert: ${event.title}. Status: ${severity.label}. Location: ${event.location}. Tap to view full telemetry.`}
      android_ripple={{ color: colors.surfaceMuted }}
      style={({ pressed }) => [
        styles.card,
        {
          backgroundColor: colors.surface,
          opacity: pressed ? 0.94 : 1,
        },
      ]}>
      {/* 1. Header: Dot + Status on left, relative time on right */}
      <View style={styles.topRow}>
        <View style={styles.statusRow}>
          <View style={[styles.dot, { backgroundColor: severity.color }]} />
          <Text style={[styles.statusText, { color: severity.color }]}>
            {severity.label}
          </Text>
        </View>
        <Text style={[styles.timeText, { color: colors.textTertiary }]}>
          {getRelativeTime(event.latestSourceTime)}
        </Text>
      </View>

      {/* 2. Event Title */}
      <Text style={[styles.title, { color: colors.textPrimary }]} numberOfLines={2}>
        {event.title}
      </Text>

      {/* 3. Location */}
      <View style={styles.metaRow}>
        <Feather name="map-pin" size={13} color={colors.textTertiary} style={styles.metaIcon} />
        <Text style={[styles.locationText, { color: colors.textSecondary }]} numberOfLines={1}>
          {event.location}
        </Text>
      </View>

      {/* 4. Summary Preview */}
      <Text style={[styles.summary, { color: colors.textSecondary }]} numberOfLines={2}>
        {event.summary}
      </Text>

      {/* 5. Quiet Metadata Footer */}
      <View style={styles.footerRow}>
        <Text style={[styles.footerText, { color: colors.textTertiary }]}>
          {obsCount} {obsCount === 1 ? 'source observation' : 'source observations'}
        </Text>
        {verifiedNgoCount > 0 && (
          <>
            <Text style={[styles.bulletDot, { color: colors.textTertiary }]}>·</Text>
            <Feather name="check" size={13} color={colors.statusResolved} style={styles.checkIcon} />
            <Text style={[styles.footerText, { color: colors.textSecondary }]}>
              {verifiedNgoCount} NGO verified
            </Text>
          </>
        )}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: radii.card,
    padding: spacing.cardPadding,
    marginHorizontal: spacing.screenPadding,
    marginBottom: spacing.cardGap,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  dot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
  },
  statusText: {
    ...typography.caption,
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  timeText: {
    ...typography.caption,
    ...typography.tabular,
    fontSize: 12,
  },
  title: {
    ...typography.cardTitle,
    fontSize: 16,
    lineHeight: 22,
    marginBottom: spacing.xs,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  metaIcon: {
    marginRight: 5,
  },
  locationText: {
    ...typography.caption,
    fontSize: 13,
    fontWeight: '500',
    flexShrink: 1,
  },
  summary: {
    ...typography.body,
    fontSize: 13,
    lineHeight: 19,
    marginBottom: spacing.xs,
  },
  footerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: spacing.xs,
  },
  footerText: {
    ...typography.caption,
    fontSize: 11,
  },
  bulletDot: {
    marginHorizontal: 6,
    fontSize: 11,
  },
  checkIcon: {
    marginRight: 3,
  },
});
