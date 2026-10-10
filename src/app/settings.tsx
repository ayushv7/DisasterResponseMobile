import React from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';

import { BottomNavBar } from '@/components/BottomNavBar';
import { ThemeMode, useTheme } from '@/theme';
import { radii, spacing, touchTargets } from '@/theme/spacing';
import { typography } from '@/theme/typography';

export default function SettingsScreen() {
  const { colors, mode, setMode } = useTheme();

  const themeOptions: { key: ThemeMode; label: string; desc: string; icon: keyof typeof Feather.glyphMap }[] = [
    {
      key: 'system',
      label: 'System Default',
      desc: 'Matches your Android device display settings',
      icon: 'smartphone',
    },
    {
      key: 'light',
      label: 'Light',
      desc: 'High contrast for sunlight and outdoor field visibility',
      icon: 'sun',
    },
    {
      key: 'dark',
      label: 'Dark',
      desc: 'Low glare for nighttime emergency operations',
      icon: 'moon',
    },
  ];

  return (
    <SafeAreaView
      edges={['top', 'left', 'right']}
      style={[styles.safeArea, { backgroundColor: colors.background }]}>
      {/* 1. Header */}
      <View style={[styles.header, { backgroundColor: colors.background }]}>
        <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>Settings</Text>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* 2. Appearance Section */}
        <View style={styles.section}>
          <Text style={[styles.sectionLabel, { color: colors.textTertiary }]}>APPEARANCE</Text>

          <View style={[styles.card, { backgroundColor: colors.surface }]}>
            {themeOptions.map((opt, index) => {
              const isSelected = mode === opt.key;

              return (
                <Pressable
                  key={opt.key}
                  onPress={() => setMode(opt.key)}
                  accessibilityRole="radio"
                  accessibilityState={{ selected: isSelected }}
                  accessibilityLabel={`Set theme to ${opt.label}`}
                  android_ripple={{ color: colors.surfaceMuted }}
                  style={[
                    styles.optionRow,
                    index > 0 && { marginTop: spacing.sm },
                  ]}>
                  <View style={[styles.optionIconBox, { backgroundColor: colors.surfaceMuted }]}>
                    <Feather
                      name={opt.icon}
                      size={18}
                      color={isSelected ? colors.brandPrimary : colors.textSecondary}
                    />
                  </View>

                  <View style={styles.optionContent}>
                    <Text
                      style={[
                        styles.optionLabel,
                        {
                          color: colors.textPrimary,
                          fontWeight: isSelected ? '700' : '500',
                        },
                      ]}>
                      {opt.label}
                    </Text>
                    <Text style={[styles.optionDesc, { color: colors.textTertiary }]}>
                      {opt.desc}
                    </Text>
                  </View>

                  <View
                    style={[
                      styles.radioOuter,
                      { borderColor: isSelected ? colors.brandPrimary : colors.textTertiary },
                    ]}>
                    {isSelected && (
                      <View
                        style={[
                          styles.radioInner,
                          { backgroundColor: colors.brandPrimary },
                        ]}
                      />
                    )}
                  </View>
                </Pressable>
              );
            })}
          </View>
        </View>

        {/* 3. About Section */}
        <View style={styles.section}>
          <Text style={[styles.sectionLabel, { color: colors.textTertiary }]}>ABOUT</Text>

          <View style={[styles.card, { backgroundColor: colors.surface }]}>
            <View style={styles.infoRow}>
              <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>Application</Text>
              <Text style={[styles.infoValue, { color: colors.textPrimary }]}>
                Disaster Response Orchestration Network
              </Text>
            </View>

            <View style={styles.infoRow}>
              <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>Purpose</Text>
              <Text style={[styles.infoValue, { color: colors.textPrimary }]}>
                Flood Intelligence & Field Telemetry
              </Text>
            </View>

            <View style={styles.infoRow}>
              <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>Data Ingestion</Text>
              <Text style={[styles.infoValue, { color: colors.statusWatch }]}>
                Simulation Fixtures
              </Text>
            </View>

            <View style={styles.infoRow}>
              <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>Version</Text>
              <Text style={[styles.infoValue, typography.tabular, { color: colors.textPrimary }]}>
                1.0.0
              </Text>
            </View>
          </View>
        </View>
      </ScrollView>

      {/* 4. Bottom Navigation Bar */}
      <BottomNavBar activeTab="profile" />
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
  },
  scrollContent: {
    paddingTop: spacing.xs,
    paddingBottom: spacing.xxl,
  },
  section: {
    marginBottom: spacing.lg,
  },
  sectionLabel: {
    ...typography.overline,
    fontSize: 11,
    paddingHorizontal: spacing.screenPadding,
    marginBottom: spacing.xs,
  },
  card: {
    borderRadius: radii.card,
    padding: spacing.cardPadding,
    marginHorizontal: spacing.screenPadding,
    gap: spacing.md,
  },
  optionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    minHeight: touchTargets.min,
  },
  optionIconBox: {
    width: 38,
    height: 38,
    borderRadius: radii.button,
    alignItems: 'center',
    justifyContent: 'center',
  },
  optionContent: {
    flex: 1,
  },
  optionLabel: {
    ...typography.bodyMedium,
    fontSize: 15,
  },
  optionDesc: {
    ...typography.caption,
    fontSize: 12,
    marginTop: 2,
  },
  radioOuter: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  infoRow: {
    flexDirection: 'column',
    gap: 2,
  },
  infoLabel: {
    ...typography.caption,
    fontSize: 11,
    fontWeight: '600',
  },
  infoValue: {
    ...typography.body,
    fontSize: 14,
  },
});
