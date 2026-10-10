import React from 'react';
import { Alert, Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';

import { useTheme } from '@/theme';
import { radii, spacing, touchTargets } from '@/theme/spacing';
import { typography } from '@/theme/typography';

const MAX_PHOTOS = 4;

interface EvidencePhotoPickerProps {
  photoUris: string[];
  onChange: (uris: string[]) => void;
}

/**
 * Take or pick completion photos. If permission is denied the user is told
 * they can still submit a text note, so evidence never blocks on photos.
 */
export function EvidencePhotoPicker({ photoUris, onChange }: EvidencePhotoPickerProps) {
  const { colors } = useTheme();
  const remaining = MAX_PHOTOS - photoUris.length;

  const add = (result: ImagePicker.ImagePickerResult) => {
    if (result.canceled) return;
    onChange([...photoUris, ...result.assets.map((a) => a.uri)].slice(0, MAX_PHOTOS));
  };

  const permissionDenied = () =>
    Alert.alert(
      'Permission not granted',
      'You can still submit a text note as evidence, or allow access in system settings.'
    );

  const takePhoto = async () => {
    const perm = await ImagePicker.requestCameraPermissionsAsync();
    if (!perm.granted) return permissionDenied();
    add(await ImagePicker.launchCameraAsync({ mediaTypes: ['images'], quality: 0.6 }));
  };

  const pickPhoto = async () => {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) return permissionDenied();
    add(
      await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        quality: 0.6,
        allowsMultipleSelection: true,
        selectionLimit: remaining,
      })
    );
  };

  return (
    <View style={styles.wrap}>
      {photoUris.length > 0 && (
        <View style={styles.thumbs}>
          {photoUris.map((uri) => (
            <View key={uri}>
              <Image source={{ uri }} style={[styles.thumb, { backgroundColor: colors.surfaceMuted }]} />
              <Pressable
                onPress={() => onChange(photoUris.filter((u) => u !== uri))}
                style={[styles.remove, { backgroundColor: colors.background }]}
                hitSlop={spacing.sm}
                accessibilityRole="button"
                accessibilityLabel="Remove photo">
                <Feather name="x" size={14} color={colors.textPrimary} />
              </Pressable>
            </View>
          ))}
        </View>
      )}
      {remaining > 0 && (
        <View style={styles.buttons}>
          <Pressable
            onPress={takePhoto}
            style={[styles.button, { backgroundColor: colors.surfaceMuted }]}
            accessibilityRole="button">
            <Feather name="camera" size={16} color={colors.textPrimary} />
            <Text style={[styles.buttonText, { color: colors.textPrimary }]}>Take photo</Text>
          </Pressable>
          <Pressable
            onPress={pickPhoto}
            style={[styles.button, { backgroundColor: colors.surfaceMuted }]}
            accessibilityRole="button">
            <Feather name="image" size={16} color={colors.textPrimary} />
            <Text style={[styles.buttonText, { color: colors.textPrimary }]}>Choose</Text>
          </Pressable>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: spacing.sm },
  thumbs: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  thumb: {
    width: 64,
    height: 64,
    borderRadius: radii.sm,
  },
  remove: {
    position: 'absolute',
    top: 2,
    right: 2,
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttons: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  button: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs + 2,
    minHeight: touchTargets.min,
    borderRadius: radii.button,
  },
  buttonText: {
    ...typography.bodyMedium,
    fontSize: 15,
  },
});
