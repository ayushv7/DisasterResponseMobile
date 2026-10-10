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
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { Redirect, router } from 'expo-router';

import { SAMPLE_OTP_CODE } from '@/fixtures/sample-accounts';
import { api } from '@/services/api';
import { getMockFailureRate, setMockFailureRate } from '@/services/api/mock';
import { resetStore } from '@/services/mock/store';
import { fetchNgoSession, setMockOrgStatus } from '@/services/ngo-api';
import { useSession } from '@/session/session-context';
import { useTheme } from '@/theme';
import { radii, spacing, touchTargets } from '@/theme/spacing';
import { typography } from '@/theme/typography';
import { NgoOrgStatus, NgoSession } from '@/types/ngo-workspace';
import { Role } from '@/types/roles';

/** `role: 'citizen'` = public role plus the sample citizen account. */
type LauncherRole = Role | 'citizen';

const ROLE_LAUNCHERS: {
  role: LauncherRole;
  label: string;
  icon: keyof typeof Feather.glyphMap;
  tabs: string;
}[] = [
  { role: 'public', label: 'Visitor', icon: 'user', tabs: 'Alerts · Message NGO · Profile (no sign-in)' },
  { role: 'citizen', label: 'Citizen', icon: 'user-check', tabs: 'Visitor + offer help, volunteer, contribute, alert areas' },
  { role: 'ngo', label: 'NGO', icon: 'shield', tabs: 'Ops · Inbox · Publish · Evidence · Organization' },
  { role: 'field_worker', label: 'Field worker', icon: 'tool', tabs: 'Tasks · Profile' },
  { role: 'contributor', label: 'Contributor', icon: 'package', tabs: 'My resources · Account' },
  { role: 'admin', label: 'Authority (admin)', icon: 'key', tabs: 'NGOs · Add NGO · Takedown · More' },
  { role: 'coordinator', label: 'Authority (coordinator)', icon: 'activity', tabs: 'Same authority console as admin' },
];

/** Development builds only; production builds redirect away. */
export default function DevHarnessRoute() {
  if (!__DEV__) return <Redirect href="/" />;
  return <DevHarnessScreen />;
}

function DevHarnessScreen() {
  const { colors } = useTheme();
  const { role, citizen, signInAs, signOut, setCitizen, signOutCitizen, setWelcomeSeen } = useSession();
  const [busy, setBusy] = useState(false);

  /** Switches role. Sign-in/out reset navigation to the role's home (replace, no back to old role). */
  const launch = async (target: LauncherRole) => {
    if (busy) return;
    setBusy(true);
    try {
      if (target === 'public' || target === 'citizen') {
        await signOut();
        signOutCitizen();
        if (target === 'citizen') {
          // Sample citizen through the normal OTP calls (mock accepts the sample code)
          const challenge = await api.requestOtp('+91 00000 00000');
          setCitizen((await api.verifyOtp(challenge.data.challengeId, SAMPLE_OTP_CODE)).data);
          router.replace('/profile');
        }
      } else {
        signOutCitizen();
        await signInAs(target);
      }
    } catch (err) {
      Alert.alert('Could not switch', err instanceof Error ? err.message : 'Try again.');
    } finally {
      setBusy(false);
    }
  };

  const isCurrent = (target: LauncherRole) =>
    target === 'citizen'
      ? role === 'public' && !!citizen
      : target === role && !(role === 'public' && citizen);

  const confirmReset = () =>
    Alert.alert(
      'Reset sample data?',
      'Restores every sample record (plans, tasks, resources, applications, messages), signs you out and shows the start screen again.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reset',
          style: 'destructive',
          onPress: async () => {
            resetStore();
            signOutCitizen();
            setWelcomeSeen(false); // show the first-run start screen again
            await signOut();
          },
        },
      ]
    );
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
        <Text numberOfLines={1} style={[styles.headerTitle, { color: colors.statusActive }]}>
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
              onPress={() => launch(launcher.role)}
              disabled={busy}
              style={[styles.launchCard, { backgroundColor: colors.surface }]}
              android_ripple={{ color: colors.surfaceMuted }}
              accessibilityRole="button"
              accessibilityLabel={`Open as ${launcher.label}`}>
              <View style={[styles.iconBox, { backgroundColor: colors.surfaceMuted }]}>
                <Feather name={launcher.icon} size={20} color={colors.textPrimary} />
              </View>
              <View style={styles.launchInfo}>
                <Text style={[styles.launchTitle, { color: colors.textPrimary }]}>
                  {launcher.label}
                  {isCurrent(launcher.role) ? ' (current)' : ''}
                </Text>
                <Text style={[styles.launchDesc, { color: colors.textTertiary }]}>
                  {launcher.tabs}
                </Text>
              </View>
              <Feather name="arrow-right" size={18} color={colors.textTertiary} />
            </Pressable>
          ))}
        </View>

        {/* RESET */}
        <View style={styles.section}>
          <Text style={[styles.sectionLabel, { color: colors.textTertiary }]}>SAMPLE DATA</Text>
          <Pressable
            onPress={confirmReset}
            style={[styles.launchCard, { backgroundColor: colors.surface }]}
            android_ripple={{ color: colors.surfaceMuted }}
            accessibilityRole="button"
            accessibilityLabel="Reset sample data">
            <View style={[styles.iconBox, { backgroundColor: colors.surfaceMuted }]}>
              <Feather name="rotate-ccw" size={20} color={colors.textPrimary} />
            </View>
            <View style={styles.launchInfo}>
              <Text style={[styles.launchTitle, { color: colors.textPrimary }]}>Reset sample data</Text>
              <Text style={[styles.launchDesc, { color: colors.textTertiary }]}>
                Restore the seeded mock store and sign out
              </Text>
            </View>
          </Pressable>
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
    flexShrink: 1,
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
