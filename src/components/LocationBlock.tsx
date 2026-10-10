/**
 * Readable location with a button that opens the device's maps app.
 *
 * - With `coords` (device GPS from evidence): "Open in Maps" at that point.
 *   Only pass coords on screens the viewer is allowed to see them on (the
 *   contributor themself, or the owning NGO). Never on public screens.
 * - With only a place name: "Search in Maps" for that name. No coordinates
 *   are invented.
 */
import React from 'react';
import { Alert, Linking, Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { Feather } from '@expo/vector-icons';

import { useStrings } from '@/i18n/language-context';
import { radii, spacing, textScale, touchTargets, typography, useTheme } from '@/theme';
import { GpsReading } from '@/types/contributors';

function mapsUrls(label: string, coords?: GpsReading): string[] {
  const q = encodeURIComponent(label);
  if (coords) {
    const ll = `${coords.latitude},${coords.longitude}`;
    const web = `https://www.google.com/maps/search/?api=1&query=${ll}`;
    if (Platform.OS === 'ios') return [`maps:0,0?q=${q}&ll=${ll}`, web];
    if (Platform.OS === 'android') return [`geo:${ll}?q=${ll}(${q})`, web];
    return [web];
  }
  const web = `https://www.google.com/maps/search/?api=1&query=${q}`;
  if (Platform.OS === 'ios') return [`maps:0,0?q=${q}`, web];
  if (Platform.OS === 'android') return [`geo:0,0?q=${q}`, web];
  return [web];
}

export async function openInMaps(label: string, coords?: GpsReading) {
  for (const url of mapsUrls(label, coords)) {
    try {
      await Linking.openURL(url);
      return;
    } catch {
      // try the next URL (e.g. web fallback when no maps app handles geo:)
    }
  }
  Alert.alert('Could not open maps', 'No maps app is available on this device.');
}

export function LocationBlock({
  place,
  coords,
  capturedAt,
  compact,
}: {
  /** Human-readable place name. */
  place: string;
  coords?: GpsReading;
  /** When the coordinates were captured (evidence). */
  capturedAt?: string;
  /** Inline row without the surface background. */
  compact?: boolean;
}) {
  const { colors } = useTheme();
  const { t } = useStrings();
  return (
    <View style={[styles.wrap, !compact && { backgroundColor: colors.surfaceMuted }, !compact && styles.padded]}>
      <Feather name="map-pin" size={16} color={colors.textSecondary} />
      <View style={styles.flex}>
        <Text style={[styles.body, { color: colors.textPrimary }]} numberOfLines={2}>
          {place}
        </Text>
        {coords && (
          <Text style={[styles.caption, { color: colors.textTertiary }]}>
            {coords.latitude.toFixed(4)}, {coords.longitude.toFixed(4)}
            {coords.accuracyMeters != null ? ` · ±${Math.round(coords.accuracyMeters)} m` : ''}
            {capturedAt ? ` · ${new Date(capturedAt).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}` : ''}
          </Text>
        )}
      </View>
      <Pressable
        onPress={() => openInMaps(place, coords)}
        style={styles.button}
        accessibilityRole="link"
        accessibilityLabel={`${coords ? 'Open' : 'Search'} ${place} in Maps`}>
        <Text style={[styles.caption, styles.bold, { color: colors.brandPrimary }]}>
          {coords ? t('maps.open') : t('maps.search')}
        </Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  padded: { borderRadius: radii.sm, paddingLeft: spacing.md },
  flex: { flex: 1 },
  button: {
    minHeight: touchTargets.min,
    paddingHorizontal: spacing.md,
    justifyContent: 'center',
  },
  body: { ...typography.body, ...textScale.body },
  bold: { fontWeight: '600' },
  caption: { ...typography.caption, ...textScale.caption },
});
