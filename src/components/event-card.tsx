import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';

import { Colors } from '@/constants/theme';
import { FloodEvent } from '@/types/disaster';
import { FreshnessBadge, StatusBadge } from './status-badge';
import { useColorScheme } from 'react-native';

interface EventCardProps {
  event: FloodEvent;
}

export function EventCard({ event }: EventCardProps) {
  const scheme = useColorScheme();
  const colors = Colors[scheme === 'dark' ? 'dark' : 'light'];

  const formatTimestamp = (isoString: string) => {
    try {
      const date = new Date(isoString);
      return (
        date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false }) +
        ' UTC · ' +
        date.toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })
      );
    } catch {
      return isoString;
    }
  };

  const handlePress = () => {
    router.push({
      pathname: '/event/[id]',
      params: { id: event.id },
    });
  };

  return (
    <Pressable
      onPress={handlePress}
      accessibilityRole="button"
      accessibilityLabel={`Flood Event: ${event.title}, Status: ${event.status}`}
      style={({ pressed }) => [
        styles.card,
        {
          backgroundColor: colors.cardBackground,
          borderColor: colors.border,
          opacity: pressed ? 0.92 : 1,
        },
      ]}>
      {/* 1. Header: Status & Freshness */}
      <View style={styles.topRow}>
        <StatusBadge status={event.status} />
        <FreshnessBadge freshness={event.freshness} />
      </View>

      {/* 2. Event Title */}
      <Text style={[styles.title, { color: colors.text }]} numberOfLines={2}>
        {event.title}
      </Text>

      {/* 3. Location */}
      <View style={styles.locationContainer}>
        <Text style={[styles.locationLabel, { color: colors.textMuted }]}>LOCATION</Text>
        <Text style={[styles.locationText, { color: colors.textSecondary }]} numberOfLines={1}>
          {event.location}
        </Text>
      </View>

      {/* 4. Event Summary */}
      <Text style={[styles.summary, { color: colors.textSecondary }]} numberOfLines={3}>
        {event.summary}
      </Text>

      {/* 5. Intelligence Metadata Partition */}
      <View style={[styles.metaBlock, { backgroundColor: colors.backgroundElement, borderColor: colors.border }]}>
        <View style={styles.metaRow}>
          <Text style={[styles.metaKey, { color: colors.textMuted }]}>Evidence Observations</Text>
          <Text style={[styles.metaVal, { color: colors.text }]}>
            {event.observations.length} {event.observations.length === 1 ? 'source report' : 'source reports'}
          </Text>
        </View>

        <View style={styles.divider} />

        <View style={styles.timeSection}>
          <View style={styles.timeItem}>
            <Text style={[styles.timeLabel, { color: colors.textMuted }]}>Source Publication Time</Text>
            <Text style={[styles.timeValue, { color: colors.text }]} numberOfLines={1}>
              {formatTimestamp(event.latestSourceTime)}
            </Text>
          </View>
          <View style={styles.timeItem}>
            <Text style={[styles.timeLabel, { color: colors.textMuted }]}>System Retrieval Time</Text>
            <Text style={[styles.timeValue, { color: colors.text }]} numberOfLines={1}>
              {formatTimestamp(event.systemRetrievedTime)}
            </Text>
          </View>
        </View>
      </View>

      {/* 6. Attributed NGO Note (if present) */}
      {event.contributions.length > 0 && (
        <View style={[styles.ngoAttribution, { borderColor: colors.tealBorder, backgroundColor: colors.tealSurface }]}>
          <Text style={[styles.ngoText, { color: colors.tealDark }]}>
            {event.contributions.length} verified NGO field update attached
          </Text>
        </View>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 8,
    borderWidth: 1,
    padding: 14,
    marginHorizontal: 16,
    marginBottom: 12,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  title: {
    fontSize: 15,
    fontWeight: '700',
    lineHeight: 21,
    marginBottom: 6,
  },
  locationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 8,
  },
  locationLabel: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  locationText: {
    fontSize: 12,
    fontWeight: '600',
    flexShrink: 1,
  },
  summary: {
    fontSize: 13,
    lineHeight: 18,
    marginBottom: 10,
  },
  metaBlock: {
    padding: 10,
    borderRadius: 6,
    borderWidth: 1,
    gap: 6,
  },
  metaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  metaKey: {
    fontSize: 11,
    fontWeight: '500',
  },
  metaVal: {
    fontSize: 11,
    fontWeight: '700',
  },
  divider: {
    height: 1,
    backgroundColor: 'rgba(0,0,0,0.06)',
    marginVertical: 2,
  },
  timeSection: {
    gap: 4,
  },
  timeItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  timeLabel: {
    fontSize: 10,
    fontWeight: '500',
  },
  timeValue: {
    fontSize: 10,
    fontWeight: '600',
  },
  ngoAttribution: {
    marginTop: 8,
    paddingVertical: 5,
    paddingHorizontal: 8,
    borderRadius: 4,
    borderWidth: 1,
    alignSelf: 'flex-start',
  },
  ngoText: {
    fontSize: 11,
    fontWeight: '600',
  },
});
