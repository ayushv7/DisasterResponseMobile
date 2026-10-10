/**
 * Opt-in location for a message. Nothing is read until the sender taps
 * "Attach my location". Approximate (the default) is rounded on the device to
 * about 1 km; exact is only sent if the sender switches to it.
 */
import React, { useState } from 'react';
import { ActivityIndicator, Alert, Linking, Pressable, StyleSheet, Text, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import * as Location from 'expo-location';

import { useTheme } from '@/theme';
import { radii, spacing, touchTargets } from '@/theme/spacing';
import { typography } from '@/theme/typography';
import { SharedLocation } from '@/types/messaging';

/** 2 decimal places ≈ 1.1 km at the equator. */
const APPROX_DECIMALS = 2;
const APPROX_RADIUS_M = 1100;

interface Fix {
  latitude: number;
  longitude: number;
  accuracy: number | null;
  timestamp: number;
}

function toShared(fix: Fix, precision: SharedLocation['precision']): SharedLocation {
  const round = (n: number) => Number(n.toFixed(APPROX_DECIMALS));
  const exact = precision === 'exact';
  return {
    latitude: exact ? fix.latitude : round(fix.latitude),
    longitude: exact ? fix.longitude : round(fix.longitude),
    accuracyMeters: exact ? fix.accuracy : Math.max(APPROX_RADIUS_M, fix.accuracy ?? 0),
    precision,
    capturedAt: new Date(fix.timestamp).toISOString(),
  };
}

export function LocationAttach({
  value,
  onChange,
  disabled,
}: {
  value: SharedLocation | null;
  onChange: (location: SharedLocation | null) => void;
  disabled?: boolean;
}) {
  const { colors } = useTheme();
  const [fix, setFix] = useState<Fix | null>(null);
  const [locating, setLocating] = useState(false);

  const attach = async () => {
    try {
      setLocating(true);
      const perm = await Location.requestForegroundPermissionsAsync();
      if (!perm.granted) {
        Alert.alert(
          'Location not shared',
          'Location permission was not granted. You can still send the message, or describe the place in words.',
          perm.canAskAgain
            ? [{ text: 'OK' }]
            : [
                { text: 'OK', style: 'cancel' },
                { text: 'Open settings', onPress: () => Linking.openSettings() },
              ]
        );
        return;
      }
      const pos = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High });
      const next: Fix = {
        latitude: pos.coords.latitude,
        longitude: pos.coords.longitude,
        accuracy: pos.coords.accuracy,
        timestamp: pos.timestamp,
      };
      setFix(next);
      onChange(toShared(next, 'approximate'));
    } catch {
      Alert.alert(
        'Could not get your location',
        'Check that location is turned on, then try again. You can also describe the place in words.'
      );
    } finally {
      setLocating(false);
    }
  };

  if (!value || !fix) {
    return (
      <Pressable
        onPress={attach}
        disabled={disabled || locating}
        style={[styles.attachButton, { backgroundColor: colors.surface }]}
        accessibilityRole="button"
        accessibilityLabel="Attach my location">
        {locating ? (
          <ActivityIndicator size="small" color={colors.textSecondary} />
        ) : (
          <Feather name="map-pin" size={16} color={colors.textSecondary} />
        )}
        <Text style={[styles.body, { color: colors.textPrimary }]}>
          {locating ? 'Getting your location…' : 'Attach my location'}
        </Text>
      </Pressable>
    );
  }

  const options: { key: SharedLocation['precision']; label: string }[] = [
    { key: 'approximate', label: 'Approximate (~1 km)' },
    { key: 'exact', label: 'Exact' },
  ];

  return (
    <View style={[styles.card, { backgroundColor: colors.surface }]}>
      <View style={styles.row}>
        <Feather name="map-pin" size={16} color={colors.actionPrimary} />
        <Text style={[styles.body, styles.flex, { color: colors.textPrimary }]}>
          {value.latitude}, {value.longitude}
        </Text>
        <Pressable
          onPress={() => {
            setFix(null);
            onChange(null);
          }}
          disabled={disabled}
          hitSlop={8}
          style={styles.remove}
          accessibilityRole="button"
          accessibilityLabel="Remove location">
          <Feather name="x" size={18} color={colors.textTertiary} />
        </Pressable>
      </View>
      <View style={styles.row}>
        {options.map((opt) => {
          const active = value.precision === opt.key;
          return (
            <Pressable
              key={opt.key}
              onPress={() => onChange(toShared(fix, opt.key))}
              disabled={disabled}
              style={[
                styles.chip,
                { backgroundColor: active ? colors.actionPrimary : colors.surfaceMuted },
              ]}
              accessibilityRole="radio"
              accessibilityState={{ selected: active }}>
              <Text
                style={[
                  styles.caption,
                  styles.bold,
                  { color: active ? colors.onActionPrimary : colors.textPrimary },
                ]}>
                {opt.label}
              </Text>
            </Pressable>
          );
        })}
      </View>
      <Text style={[styles.caption, { color: colors.textSecondary }]}>
        {value.accuracyMeters != null ? `Within about ${Math.round(value.accuracyMeters)} m. ` : ''}
        Only the selected NGO sees this. Choose Exact if responders need to find you.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  attachButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    minHeight: touchTargets.min,
    paddingHorizontal: spacing.md,
    borderRadius: radii.card,
  },
  card: {
    borderRadius: radii.card,
    padding: spacing.md,
    gap: spacing.sm,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  remove: {
    minWidth: touchTargets.min,
    minHeight: touchTargets.min,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chip: {
    minHeight: touchTargets.min,
    paddingHorizontal: spacing.md,
    borderRadius: radii.button,
    justifyContent: 'center',
  },
  body: {
    ...typography.body,
    fontSize: 14,
    lineHeight: 20,
  },
  bold: {
    fontWeight: '600',
  },
  caption: {
    ...typography.caption,
    fontSize: 12,
    lineHeight: 17,
  },
});
