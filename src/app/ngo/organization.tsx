/**
 * NgoOrganizationScreen — Organization Verification & Credentials
 *
 * Displays independently audited verification credentials for the authenticated
 * NGO organization.
 *
 * STRICT GOVERNANCE RULE:
 * Organization verification status is issued and maintained strictly by
 * governmental and network administrators. Organizations cannot verify themselves.
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
import { router } from 'expo-router';

import { NgoBottomNavBar } from '@/components/NgoBottomNavBar';
import { SkeletonCard } from '@/components/SkeletonCard';
import { fetchNgoSession } from '@/services/ngo-api';
import { useConfirmExitAtRoot } from '@/hooks/use-confirm-exit-at-root';
import { useSession } from '@/session/session-context';
import { useTheme } from '@/theme';
import { radii, spacing, touchTargets } from '@/theme/spacing';
import { typography } from '@/theme/typography';
import { NgoSession } from '@/types/ngo-workspace';

export default function NgoOrganizationScreen() {
  const { colors } = useTheme();
  useConfirmExitAtRoot();
  const { signOut } = useSession();

  const [session, setSession] = useState<NgoSession | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const sess = await fetchNgoSession();
        setSession(sess);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const isVerified = session?.verificationStatus === 'VERIFIED';

  return (
    <SafeAreaView
      edges={['top', 'left', 'right']}
      style={[styles.safeArea, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={styles.header}>
        <Text numberOfLines={1} style={[styles.headerTitle, { color: colors.textPrimary }]}>
          Organization Profile
        </Text>
      </View>

      {loading ? (
        <View style={styles.skeletonWrap}>
          <SkeletonCard />
          <SkeletonCard />
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.scrollContent}>
          {/* Organization Verification Card */}
          <View style={[styles.card, { backgroundColor: colors.surface }]}>
            <View style={styles.orgHeader}>
              <View
                style={[
                  styles.iconBox,
                  {
                    backgroundColor: isVerified
                      ? colors.statusResolvedBg
                      : colors.statusActiveBg,
                  },
                ]}>
                <Feather
                  name="shield"
                  size={24}
                  color={
                    isVerified ? colors.statusResolved : colors.statusActive
                  }
                />
              </View>
              <View style={styles.orgTitleWrap}>
                <Text
                  style={[styles.orgName, { color: colors.textPrimary }]}>
                  {session?.ngoName}
                </Text>
                <View style={styles.badgeRow}>
                  <View
                    style={[
                      styles.statusDot,
                      {
                        backgroundColor: isVerified
                          ? colors.statusResolved
                          : colors.statusActive,
                      },
                    ]}
                  />
                  <Text
                    style={[
                      styles.statusText,
                      {
                        color: isVerified
                          ? colors.statusResolved
                          : colors.statusActive,
                      },
                    ]}>
                    STATUS: {session?.verificationStatus}
                  </Text>
                </View>
              </View>
            </View>

            {/* Official notice on verification governance */}
            <View
              style={[
                styles.noticeBox,
                { backgroundColor: colors.surfaceMuted },
              ]}>
              <Feather name="info" size={13} color={colors.textSecondary} />
              <Text
                style={[
                  styles.noticeText,
                  { color: colors.textSecondary },
                ]}>
                Organization verification is independently audited by network
                administrators. Organizations cannot self-verify. Unverified or
                suspended accounts cannot publish contributions.
              </Text>
            </View>
          </View>

          {/* Authorized Officer Details */}
          <View style={styles.section}>
            <Text
              style={[styles.sectionLabel, { color: colors.textTertiary }]}>
              AUTHORIZED PERSONNEL
            </Text>
            <View style={[styles.card, { backgroundColor: colors.surface }]}>
              <View style={styles.infoRow}>
                <Text
                  style={[styles.infoLabel, { color: colors.textSecondary }]}>
                  Officer in Charge
                </Text>
                <Text
                  style={[styles.infoValue, { color: colors.textPrimary }]}>
                  {session?.authorizedOfficerName || 'Not recorded'}
                </Text>
              </View>
              <View style={styles.infoRow}>
                <Text
                  style={[styles.infoLabel, { color: colors.textSecondary }]}>
                  Organization Ref ID
                </Text>
                <Text
                  style={[
                    styles.infoValue,
                    typography.tabular,
                    { color: colors.textPrimary },
                  ]}>
                  {session?.ngoId}
                </Text>
              </View>
            </View>
          </View>

          {/* Operational Focus Areas */}
          {session?.focusAreas && session.focusAreas.length > 0 && (
            <View style={styles.section}>
              <Text
                style={[styles.sectionLabel, { color: colors.textTertiary }]}>
                REGISTERED RELIEF CAPABILITIES
              </Text>
              <View
                style={[styles.card, { backgroundColor: colors.surface }]}>
                <View style={styles.chipWrap}>
                  {session.focusAreas.map((area, idx) => (
                    <View
                      key={idx}
                      style={[
                        styles.chip,
                        { backgroundColor: colors.surfaceMuted },
                      ]}>
                      <Text
                        style={[
                          styles.chipText,
                          { color: colors.textSecondary },
                        ]}>
                        {area}
                      </Text>
                    </View>
                  ))}
                </View>
              </View>
            </View>
          )}

          {/* Authentication Dependency Disclosure */}
          <View style={styles.section}>
            <Text
              style={[styles.sectionLabel, { color: colors.textTertiary }]}>
              GATEWAY CONTRACT
            </Text>
            <View
              style={[styles.card, { backgroundColor: colors.surface }]}>
              <View style={styles.infoRow}>
                <Text
                  style={[styles.infoLabel, { color: colors.textSecondary }]}>
                  Authentication Backend
                </Text>
                <Text
                  style={[styles.infoValue, { color: colors.statusWatch }]}>
                  FastAPI OAuth 2.0 / JWT (Pending)
                </Text>
              </View>
              <View style={styles.infoRow}>
                <Text
                  style={[styles.infoLabel, { color: colors.textSecondary }]}>
                  Publishing Privilege
                </Text>
                <Text
                  style={[
                    styles.infoValue,
                    {
                      color: isVerified
                        ? colors.statusResolved
                        : colors.statusActive,
                    },
                  ]}>
                  {isVerified ? 'Granted (Verified Org)' : 'Denied'}
                </Text>
              </View>
            </View>
          </View>

          {/* Field team management */}
          <Pressable
            onPress={() => router.push('/ngo/team')}
            style={[styles.card, styles.teamRow, { backgroundColor: colors.surface }]}
            android_ripple={{ color: colors.surfaceMuted }}
            accessibilityRole="button">
            <Feather name="users" size={18} color={colors.textSecondary} />
            <Text style={[styles.teamLabel, { color: colors.textPrimary }]}>My field team</Text>
            <Feather name="chevron-right" size={18} color={colors.textTertiary} />
          </Pressable>

          <Pressable
            onPress={() => router.push('/notifications')}
            style={[styles.card, styles.teamRow, { backgroundColor: colors.surface }]}
            android_ripple={{ color: colors.surfaceMuted }}
            accessibilityRole="button">
            <Feather name="bell" size={18} color={colors.textSecondary} />
            <Text style={[styles.teamLabel, { color: colors.textPrimary }]}>Notifications (Simulated)</Text>
            <Feather name="chevron-right" size={18} color={colors.textTertiary} />
          </Pressable>

          <Pressable
            onPress={() => router.push('/ngo/contributors')}
            style={[styles.card, styles.teamRow, { backgroundColor: colors.surface }]}
            android_ripple={{ color: colors.surfaceMuted }}
            accessibilityRole="button">
            <Feather name="package" size={18} color={colors.textSecondary} />
            <Text style={[styles.teamLabel, { color: colors.textPrimary }]}>Contributor applications</Text>
            <Feather name="chevron-right" size={18} color={colors.textTertiary} />
          </Pressable>

          {/* Session Management / Sign Out */}
          <View style={styles.section}>
            <Pressable
              onPress={() =>
                Alert.alert(
                  'Switch to public view?',
                  'You will be signed out and returned to public alerts.',
                  [
                    { text: 'Cancel', style: 'cancel' },
                    { text: 'Sign out', style: 'destructive', onPress: () => signOut() },
                  ]
                )
              }
              accessibilityRole="button"
              accessibilityLabel="Sign out and switch to public view"
              style={[
                styles.signOutButton,
                { backgroundColor: colors.surface },
              ]}
              android_ripple={{ color: colors.surfaceMuted }}>
              <Feather name="log-out" size={18} color={colors.statusActive} />
              <Text
                style={[
                  styles.signOutText,
                  { color: colors.statusActive },
                ]}>
                Switch to public view
              </Text>
            </Pressable>
          </View>
        </ScrollView>
      )}

      {/* Dedicated NGO Bottom Navigation */}
      <NgoBottomNavBar activeTab="organization" />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  teamRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    minHeight: touchTargets.min,
  },
  teamLabel: {
    ...typography.bodyMedium,
    fontSize: 14,
    flex: 1,
  },
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
  skeletonWrap: {
    paddingHorizontal: spacing.screenPadding,
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
  scrollContent: {
    paddingHorizontal: spacing.screenPadding,
    paddingTop: spacing.xs,
    paddingBottom: spacing.xxl,
    gap: spacing.md,
  },
  card: {
    borderRadius: radii.card,
    padding: spacing.cardPadding,
    gap: spacing.md,
  },
  orgHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  iconBox: {
    width: 48,
    height: 48,
    borderRadius: radii.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  orgTitleWrap: {
    flex: 1,
    gap: 3,
  },
  orgName: {
    ...typography.cardTitle,
    fontSize: 16,
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  statusText: {
    ...typography.caption,
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  noticeBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.xs,
    padding: spacing.md,
    borderRadius: radii.sm,
  },
  noticeText: {
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
  infoRow: {
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
  chipWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
  },
  chip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: radii.chip,
  },
  chipText: {
    ...typography.caption,
    fontSize: 12,
  },
  signOutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.md,
    borderRadius: radii.button,
    marginTop: spacing.sm,
  },
  signOutText: {
    ...typography.bodyMedium,
    fontWeight: '700',
    fontSize: 14,
  },
});
