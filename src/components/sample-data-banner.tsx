import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { Colors } from '@/constants/theme';
import { useColorScheme } from 'react-native';

interface SampleDataBannerProps {
  isFixtureData?: boolean;
}

/**
 * High-visibility, authoritative advisory banner.
 * Communicates that live automated ingestion is not active and records are simulation fixtures.
 * Restrained, high contrast, zero decorative fluff or emojis.
 */
export function SampleDataBanner({ isFixtureData = true }: SampleDataBannerProps) {
  const scheme = useColorScheme();
  const colors = Colors[scheme === 'dark' ? 'dark' : 'light'];

  if (!isFixtureData) return null;

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: colors.warningBg,
          borderColor: colors.warningBorder,
        },
      ]}
      accessibilityRole="alert">
      <View style={styles.headerRow}>
        <View style={[styles.indicatorBar, { backgroundColor: colors.warningText }]} />
        <Text style={[styles.title, { color: colors.warningText }]}>
          SAMPLE DATA — NOT LIVE FLOOD INFORMATION
        </Text>
      </View>
      <Text style={[styles.description, { color: colors.warningText }]}>
        Automated government and telemetry ingestion feeds are disconnected. Displayed entries are simulation fixtures for interface evaluation.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginHorizontal: 16,
    marginTop: 8,
    marginBottom: 8,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 6,
    borderWidth: 1,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  indicatorBar: {
    width: 3,
    height: 12,
    borderRadius: 1,
  },
  title: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.6,
  },
  description: {
    fontSize: 11,
    lineHeight: 16,
    fontWeight: '500',
  },
});
