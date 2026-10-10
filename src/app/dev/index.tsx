/**
 * DevHarnessScreen — Development-Only Environment Launcher
 *
 * ISOLATION NOTICE:
 * This screen is an internal development tool. It is NEVER exposed in public-user
 * navigation or user profiles. It allows engineers to test public and NGO views
 * and verify security gates while backend FastAPI OAuth/JWT authentication is in
 * development.
 */

import React, { useEffect, useState } from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { Redirect } from 'expo-router';

import { getMockFailureRate, setMockFailureRate } from '@/services/api/mock';
import { fetchNgoSession, setMockOrgStatus } from '@/services/ngo-api';
import { useSession } from '@/session/session-context';
import { useTheme } from '@/theme';
import { radii, spacing, touchTargets } from '@/theme/spacing';
import { typography } from '@/theme/typography';
import { NgoOrgStatus, NgoSession } from '@/types/ngo-workspace';
import { ROLE_LABELS, Role } from '@/types/roles';

const ROLE_LAUNCHERS: { role: Role; icon: keyof typeof Feather.glyphMap; tabs: string }[] = [
  { role: 'public', icon: 'user', tabs: 'Alerts · Message NGO · Profile' },
  { role: 'coordinator', icon: 'activity', tabs: 'Ops · Incidents · Tasks · Replan · More' },
  { role: 'field_worker', icon: 'tool', tabs: 'Tasks · Profile' },
  { role: 'ngo', icon: 'shield', tabs: 'Inbox · Publish · Evidence · Organization' },
  { role: 'admin', icon: 'key', tabs: 'NGO approval (NGO workspace for now)' },
];

/** Development builds only; production builds redirect away. */
export default function DevHarnessRoute() {
  if (!__DEV__) return <Redirect href="/" />;
  return <DevHarnessScreen />;
}

function DevHarnessScreen() {
  const { colors } = useTheme();
  const { role, signInAs, signOut } = useSession();
  const [failureRate, setFailureRate] = useState(getMockFailureRate());
  const [session, setSession] = useState<NgoSession | null>(null);

  useEffect(() => {
    fetchNgoSession().then(setSession);
  }, []);

  const handleOrgStatusChange = (status: NgoOrgStatus) => {
    const updated = setMockOrgStatus(status);
    setSession(updated);
  };

  return (
    <SafeAreaView
      edges={['top', 'left', 'right']}
      style={[styles.safeArea, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={[styles.headerTitle, { color: colors.statusActive }]}>
          DEVELOPER HARNESS
        </Text>
        <Text style={[styles.headerSubtitle, { color: colors.textTertiary }]}>
          Internal UI sandbox — not part of production user flows
        </Text>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Warning card */}
        <View style={[styles.warningCard, { backgroundColor: colors.surface }]}>
          <Feather name="alert-triangle" size={16} color={colors.statusWatch} />
          <Text style={[styles.warningText, { color: colors.textSecondary }]}>
            This harness exists strictly for interface verification prior to
            FastAPI authentication integration. Testing via this harness does NOT
            constitute real authentication.
          </Text>
        </View>

        {/* WORKSPACE LAUNCHERS */}
        <View style={styles.section}>
          <Text style={[styles.sectionLabel, { color: colors.textTertiary }]}>
            TARGET WORKSPACES
          </Text>

          {ROLE_LAUNCHERS.map((launcher) => (
            <Pressable
              key={launcher.role}
              onPress={() =>
                launcher.role === 'public' ? signOut() : signInAs(launcher.role)
              }
              style={[styles.launchCard, { backgroundColor: colors.surface }]}
              android_ripple={{ color: colors.surfaceMuted }}
              accessibilityRole="button"
              accessibilityLabel={`Open as ${ROLE_LABELS[launcher.role]}`}>
              <View style={[styles.iconBox, { backgroundColor: colors.surfaceMuted }]}>
                <Feather name={launcher.icon} size={20} color={colors.textPrimary} />
              </View>
              <View style={styles.launchInfo}>
                <Text style={[styles.launchTitle, { color: colors.textPrimary }]}>
                  {ROLE_LABELS[launcher.role]}
                  {role === launcher.role ? ' (current)' : ''}
                </Text>
                <Text style={[styles.launchDesc, { color: colors.textTertiary }]}>
                  {launcher.tabs}
                </Text>
              </View>
              <Feather name="arrow-right" size={18} color={colors.textTertiary} />
            </Pressable>
          ))}
        </View>

        {/* SIMULATED FAILURE RATE */}
        <View style={styles.section}>
          <Text style={[styles.sectionLabel, { color: colors.textTertiary }]}>
            SIMULATED NETWORK FAILURE RATE (MOCK API)
          </Text>
          <View style={styles.toggleRow}>
            {[0, 0.05, 0.3].map((rate) => {
              const selected = failureRate === rate;
              return (
                <Pressable
                  key={rate}
                  onPress={() => {
                    setMockFailureRate(rate);
                    setFailureRate(rate);
                  }}
                  style={[
                    styles.launchCard,
                    styles.rateOption,
                    { backgroundColor: selected ? colors.chipActiveBg : colors.surface },
                  ]}
                  accessibilityRole="button"
                  accessibilityState={{ selected }}>
                  <Text
                    style={[
                      styles.launchTitle,
                      { color: selected ? colors.chipActiveText : colors.textPrimary },
                    ]}>
                    {Math.round(rate * 100)}%
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>

        {/* SECURITY GATE TESTING */}
        <View style={styles.section}>
          <Text style={[styles.sectionLabel, { color: colors.textTertiary }]}>
            SIMULATE SERVER ORG VERIFICATION STATE
          </Text>
          <View style={[styles.card, { backgroundColor: colors.surface }]}>
            <Text style={[styles.cardDesc, { color: colors.textSecondary }]}>
              Toggle mock server accreditation status to verify that unverified
              or suspended organizations cannot publish or review reports.
            </Text>

            <View style={styles.toggleRow}>
              {(
                [
                  'VERIFIED',
                  'PENDING_VERIFICATION',
                  'SUSPENDED',
                  'REJECTED',
                ] as NgoOrgStatus[]
              ).map((status) => {
                const isActive = session?.verificationStatus === status;
                return (
                  <Pressable
                    key={status}
                    onPress={() => handleOrgStatusChange(status)}
                    style={[
                      styles.toggleChip,
                      {
                        backgroundColor: isActive
                          ? colors.surfaceMuted
                          : colors.background,
                      },
                    ]}>
                    <Text
                      style={[
                        styles.toggleChipText,
                        {
                          color: isActive
                            ? colors.textPrimary
                            : colors.textTertiary,
                          fontWeight: isActive ? '700' : '400',
                        },
                      ]}>
                      {status}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </View>
        </View>
      </ScrollView>
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
    gap: 2,
  },
  headerTitle: {
    ...typography.overline,
    fontSize: 14,
    fontWeight: '800',
    letterSpacing: 1,
  },
  headerSubtitle: {
    ...typography.caption,
    fontSize: 12,
  },
  scrollContent: {
    paddingHorizontal: spacing.screenPadding,
    paddingTop: spacing.xs,
    paddingBottom: spacing.xxl,
    gap: spacing.lg,
  },
  warningCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
    padding: spacing.md,
    borderRadius: radii.card,
  },
  warningText: {
    ...typography.caption,
    fontSize: 12,
    lineHeight: 16,
    flex: 1,
  },
  section: {
    gap: spacing.xs,
  },
  sectionLabel: {
    ...typography.overline,
    fontSize: 11,
  },
  launchCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    padding: spacing.cardPadding,
    borderRadius: radii.card,
    minHeight: touchTargets.min,
    marginBottom: spacing.xs,
  },
  iconBox: {
    width: 40,
    height: 40,
    borderRadius: radii.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  launchInfo: {
    flex: 1,
    gap: 2,
  },
  launchTitle: {
    ...typography.bodyMedium,
    fontSize: 15,
    fontWeight: '600',
  },
  launchDesc: {
    ...typography.caption,
    fontSize: 12,
  },
  card: {
    padding: spacing.cardPadding,
    borderRadius: radii.card,
    gap: spacing.md,
  },
  cardDesc: {
    ...typography.caption,
    fontSize: 12,
    lineHeight: 16,
  },
  rateOption: {
    flex: 1,
    justifyContent: 'center',
  },
  toggleRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
  },
  toggleChip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radii.chip,
  },
  toggleChipText: {
    ...typography.caption,
    fontSize: 11,
  },
});
