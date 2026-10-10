/**
 * MapScreen — Placeholder
 *
 * Map integration is not yet implemented. This tab exists in the navigation
 * to establish the information architecture. Replace with a real map
 * (e.g. react-native-maps or Mapbox) once the backend provides
 * geo-coordinate data for flood events.
 */

import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { router } from 'expo-router';

import { BottomNavBar } from '@/components/BottomNavBar';
import { useTheme } from '@/theme';
import { radii, spacing, touchTargets } from '@/theme/spacing';
import { typography } from '@/theme/typography';

export default function MapScreen() {
  const { colors } = useTheme();

  return (
    <SafeAreaView
      edges={['top', 'left', 'right']}
      style={[styles.safeArea, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={styles.header}>
        <Text numberOfLines={1} style={[styles.headerTitle, { color: colors.textPrimary }]}>
          Map
        </Text>
      </View>

      {/* Placeholder content */}
      <View style={styles.centerContent}>
        <View style={[styles.iconCircle, { backgroundColor: colors.surfaceMuted }]}>
          <Feather name="map" size={32} color={colors.textTertiary} />
        </View>

        <Text style={[styles.title, { color: colors.textPrimary }]}>
          Flood Event Map
        </Text>
        <Text style={[styles.description, { color: colors.textSecondary }]}>
          An interactive map of active and historical flood events will be
          available here once geo-coordinate data is provided by the backend.
        </Text>

        <View style={[styles.noticeBox, { backgroundColor: colors.surfaceMuted }]}>
          <Feather name="info" size={14} color={colors.textTertiary} />
          <Text style={[styles.noticeText, { color: colors.textTertiary }]}>
            This feature requires backend geo-data integration and a mapping
            library (e.g. react-native-maps). It is not yet connected.
          </Text>
        </View>

        <Pressable
          onPress={() => router.replace('/alerts')}
          style={({ pressed }) => [
            styles.actionBtn,
            {
              backgroundColor: colors.surfaceMuted,
              opacity: pressed ? 0.8 : 1,
            },
          ]}
          accessibilityRole="button"
          accessibilityLabel="Return to flood alerts feed">
          <Text style={[styles.actionText, { color: colors.brandPrimary }]}>
            Browse Alerts Instead
          </Text>
        </Pressable>
      </View>

      <BottomNavBar activeTab="map" />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  header: {
    paddingHorizontal: spacing.screenPadding,
    paddingTop: spacing.md,
    paddingBottom: spacing.sm,
  },
  headerTitle: {
    ...typography.title,
    fontSize: 22,
    lineHeight: 28,
    flexShrink: 1,
  },
  centerContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing.xxxl,
  },
  iconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.lg,
  },
  title: {
    ...typography.cardTitle,
    textAlign: 'center',
    marginBottom: spacing.sm,
  },
  description: {
    ...typography.body,
    fontSize: 14,
    lineHeight: 21,
    textAlign: 'center',
    maxWidth: 300,
    marginBottom: spacing.lg,
  },
  noticeBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
    borderRadius: radii.sm,
    padding: spacing.md,
    marginBottom: spacing.xl,
  },
  noticeText: {
    ...typography.caption,
    fontSize: 12,
    lineHeight: 17,
    flex: 1,
  },
  actionBtn: {
    height: touchTargets.min,
    paddingHorizontal: spacing.lg,
    borderRadius: radii.button,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionText: {
    ...typography.bodyMedium,
    fontWeight: '600',
  },
});
