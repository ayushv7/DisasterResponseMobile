/**
 * Live evidence for a resource: GPS read now (expo-location) and a photo taken
 * now (camera only, no gallery). Evidence supports a claim; it is not proof.
 * If either can't be captured, the contributor may add a note instead and the
 * submission is marked Unverified. Nothing is ever filled in for them.
 */
import React, { useState } from 'react';
import { ActivityIndicator, Linking, Platform, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import * as Location from 'expo-location';

import { EvidencePhotoPicker } from '@/components/EvidencePhotoPicker';
import { useTheme } from '@/theme';
import { radii, spacing, touchTargets } from '@/theme/spacing';
import { typography } from '@/theme/typography';
import { EvidenceDraft, GpsReading } from '@/types/contributors';

export function isEvidenceVerified(draft: EvidenceDraft) {
  return !!draft.gps && !!draft.photoUri;
}

export function LiveEvidence({
  value,
  onChange,
  disabled,
}: {
  value: EvidenceDraft;
  onChange: (next: EvidenceDraft) => void;
  disabled?: boolean;
}) {
  const { colors } = useTheme();
  const [locating, setLocating] = useState(false);
  const [gpsProblem, setGpsProblem] = useState<{ message: string; settings: boolean } | null>(null);
  const [cameraProblem, setCameraProblem] = useState<string | null>(null);
  const isWeb = Platform.OS === 'web';

  const readGps = async () => {
    try {
      setLocating(true);
      setGpsProblem(null);
      if (!(await Location.hasServicesEnabledAsync())) {
        setGpsProblem({ message: 'Location services are turned off on this device.', settings: false });
        return;
      }
      const perm = await Location.requestForegroundPermissionsAsync();
      if (!perm.granted) {
        setGpsProblem({
          message: perm.canAskAgain
            ? 'Location permission was not granted. It is used only to show your NGO where the resource is.'
            : 'Location access is off for this app. Turn it on in settings to attach GPS.',
          settings: !perm.canAskAgain,
        });
        return;
      }
      const pos = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High });
      const gps: GpsReading = {
        latitude: pos.coords.latitude,
        longitude: pos.coords.longitude,
        accuracyMeters: pos.coords.accuracy,
      };
      onChange({ ...value, gps, capturedAt: new Date(pos.timestamp).toISOString() });
    } catch {
      setGpsProblem({ message: 'Could not get a location fix. Try again outdoors.', settings: false });
    } finally {
      setLocating(false);
    }
  };

  const verified = isEvidenceVerified(value);
  const needsNote = !verified;

  return (
    <View style={styles.wrap}>
      {/* GPS */}
      <View style={[styles.card, { backgroundColor: colors.surface }]}>
        <View style={styles.row}>
          <Feather name="map-pin" size={16} color={value.gps ? colors.statusResolved : colors.textSecondary} />
          <Text style={[styles.body, styles.flex, { color: colors.textPrimary }]}>
            {value.gps
              ? `GPS captured${value.gps.accuracyMeters != null ? ` (±${Math.round(value.gps.accuracyMeters)} m)` : ''}`
              : 'Live GPS location'}
          </Text>
          <Pressable
            onPress={readGps}
            disabled={disabled || locating}
            style={[styles.smallButton, { backgroundColor: colors.surfaceMuted }]}
            accessibilityRole="button">
            {locating ? (
              <ActivityIndicator size="small" color={colors.textSecondary} />
            ) : (
              <Text style={[styles.caption, styles.bold, { color: colors.textPrimary }]}>
                {value.gps ? 'Retake' : 'Capture'}
              </Text>
            )}
          </Pressable>
        </View>
        {gpsProblem && (
          <Text style={[styles.caption, { color: colors.statusWatch }]}>
            {gpsProblem.message}
            {gpsProblem.settings ? ' ' : ''}
            {gpsProblem.settings && (
              <Text style={{ color: colors.brandPrimary }} onPress={() => Linking.openSettings()}>
                Open settings
              </Text>
            )}
          </Text>
        )}
        <Text style={[styles.caption, { color: colors.textTertiary }]}>
          Sent only to the backend and your NGO. Never shown publicly.
        </Text>
      </View>

      {/* Photo: live camera only */}
      <View style={[styles.card, { backgroundColor: colors.surface }]}>
        <Text style={[styles.body, { color: colors.textPrimary }]}>Photo taken now</Text>
        {isWeb ? (
          <Text style={[styles.caption, { color: colors.statusWatch }]}>
            Live camera capture is not available on web. Use the phone app, or submit as Unverified.
          </Text>
        ) : (
          <EvidencePhotoPicker
            cameraOnly
            maxPhotos={1}
            photoUris={value.photoUri ? [value.photoUri] : []}
            onChange={(uris) => {
              setCameraProblem(null);
              onChange({ ...value, photoUri: uris[0], capturedAt: new Date().toISOString() });
            }}
            onCameraUnavailable={setCameraProblem}
          />
        )}
        {cameraProblem && <Text style={[styles.caption, { color: colors.statusWatch }]}>{cameraProblem}</Text>}
      </View>

      {/* Fallback note */}
      {needsNote && (
        <View style={[styles.card, { backgroundColor: colors.surface }]}>
          <Text style={[styles.body, { color: colors.textPrimary }]}>
            Without live GPS and a photo this is <Text style={styles.bold}>Unverified</Text>.
          </Text>
          <TextInput
            value={value.note ?? ''}
            onChangeText={(note) => onChange({ ...value, note })}
            editable={!disabled}
            placeholder="Describe where the resource is and its state (optional)"
            placeholderTextColor={colors.textTertiary}
            multiline
            accessibilityLabel="Evidence note"
            style={[styles.input, { color: colors.textPrimary, backgroundColor: colors.surfaceMuted }]}
          />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: spacing.sm },
  card: { borderRadius: radii.card, padding: spacing.md, gap: spacing.xs },
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  flex: { flex: 1 },
  smallButton: {
    minHeight: touchTargets.min,
    minWidth: 88,
    paddingHorizontal: spacing.md,
    borderRadius: radii.button,
    alignItems: 'center',
    justifyContent: 'center',
  },
  input: {
    minHeight: 72,
    borderRadius: radii.sm,
    padding: spacing.sm,
    fontSize: 14,
    textAlignVertical: 'top',
  },
  body: { ...typography.body, fontSize: 14, lineHeight: 20 },
  bold: { fontWeight: '600' },
  caption: { ...typography.caption, fontSize: 12, lineHeight: 17 },
});
