/**
 * ProfileScreen — Public user profile hub.
 *
 * This is a public-user screen only. There are no NGO role controls,
 * publishing actions, or verification toggles. Settings is accessed
 * as a sub-screen from here.
 */

import React from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { router } from 'expo-router';

import { BottomNavBar } from '@/components/BottomNavBar';
import { CitizenSignInPrompt } from '@/components/CitizenSignInPrompt';
import { IS_MOCK_API } from '@/services/api';
import { useSession } from '@/session/session-context';
import { useTheme } from '@/theme';
import { radii, spacing, touchTargets } from '@/theme/spacing';
import { typography } from '@/theme/typography';

export default function ProfileScreen() {
  const { colors } = useTheme();
  const { citizen, signOutCitizen } = useSession();

  const menuItems: {
    label: string;
    desc: string;
    icon: keyof typeof Feather.glyphMap;
    onPress: () => void;
  }[] = [
    {
      label: 'Appearance & Theme',
      desc: 'Light, dark, or system default',
      icon: 'moon',
      onPress: () => router.push('/settings'),
    },
    {
      label: 'Offer help',
      desc: 'Food, money, equipment or volunteering',
      icon: 'heart',
      onPress: () => router.push('/offer-help'),
    },
    {
      label: 'My Messages',
      desc: 'View sent private messages',
      icon: 'message-square',
      onPress: () => router.replace('/messages'),
    },
  ];

  return (
    <SafeAreaView
      edges={['top', 'left', 'right']}
      style={[styles.safeArea, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>
          Profile
        </Text>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* User card: visitor, or optional citizen account */}
        <View style={[styles.userCard, { backgroundColor: colors.surface }]}>
          <View style={[styles.avatarCircle, { backgroundColor: colors.surfaceMuted }]}>
            <Feather name="user" size={24} color={colors.textTertiary} />
          </View>
          <View style={styles.userInfo}>
            <Text style={[styles.userName, { color: colors.textPrimary }]}>
              {citizen ? citizen.contact : 'Visitor'}
            </Text>
            <Text style={[styles.userRole, { color: colors.textTertiary }]}>
              {citizen
                ? `Signed in${IS_MOCK_API ? ' (Simulated sign-in / sample account)' : ''}`
                : 'Civilian observer — no publishing permissions'}
            </Text>
          </View>
          {citizen && (
            <Pressable
              onPress={signOutCitizen}
              style={styles.signOutButton}
              accessibilityRole="button"
              accessibilityLabel="Sign out">
              <Text style={[styles.menuDesc, { color: colors.textSecondary }]}>Sign out</Text>
            </Pressable>
          )}
        </View>

        <CitizenSignInPrompt />

        {/* Menu items */}
        <View style={styles.section}>
          <Text style={[styles.sectionLabel, { color: colors.textTertiary }]}>
            PREFERENCES
          </Text>
          <View style={[styles.menuCard, { backgroundColor: colors.surface }]}>
            {menuItems.map((item, idx) => (
              <Pressable
                key={item.label}
                onPress={item.onPress}
                android_ripple={{ color: colors.surfaceMuted }}
                accessibilityRole="button"
                accessibilityLabel={item.label}
                style={[
                  styles.menuRow,
                  idx > 0 && styles.menuRowBorder,
                ]}>
                <View style={[styles.menuIconBox, { backgroundColor: colors.surfaceMuted }]}>
                  <Feather name={item.icon} size={16} color={colors.textSecondary} />
                </View>
                <View style={styles.menuContent}>
                  <Text style={[styles.menuLabel, { color: colors.textPrimary }]}>
                    {item.label}
                  </Text>
                  <Text style={[styles.menuDesc, { color: colors.textTertiary }]}>
                    {item.desc}
                  </Text>
                </View>
                <Feather name="chevron-right" size={16} color={colors.textTertiary} />
              </Pressable>
            ))}
          </View>
        </View>


        {/* Staff sign-in: small link; the public needs no account */}
        <Pressable
          onPress={() => router.push('/login')}
          style={styles.staffLink}
          accessibilityRole="link"
          accessibilityLabel="NGO or staff sign in">
          <Text style={[styles.staffLinkText, { color: colors.textSecondary }]}>
            NGO / staff sign in
          </Text>
        </Pressable>

        {/* About section */}
        <View style={styles.section}>
          <Text style={[styles.sectionLabel, { color: colors.textTertiary }]}>
            ABOUT
          </Text>
          <View style={[styles.menuCard, { backgroundColor: colors.surface }]}>
            <View style={styles.infoRow}>
              <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>
                Application
              </Text>
              <Text style={[styles.infoValue, { color: colors.textPrimary }]}>
                Disaster Response Orchestration Network
              </Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>
                Role
              </Text>
              <Text style={[styles.infoValue, { color: colors.textPrimary }]}>
                Public User (View & Report)
              </Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>
                Version
              </Text>
              <Text style={[styles.infoValue, typography.tabular, { color: colors.textPrimary }]}>
                1.0.0
              </Text>
            </View>
          </View>
        </View>
      </ScrollView>

      <BottomNavBar activeTab="profile" />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  signOutButton: {
    minHeight: touchTargets.min,
    justifyContent: 'center',
    paddingHorizontal: spacing.xs,
  },
  staffLink: {
    minHeight: touchTargets.min,
    alignItems: 'center',
    justifyContent: 'center',
  },
  staffLinkText: {
    ...typography.caption,
    fontSize: 13,
    textDecorationLine: 'underline',
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
  },
  scrollContent: {
    paddingTop: spacing.xs,
    paddingBottom: spacing.xxl,
  },
  userCard: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: radii.card,
    padding: spacing.cardPadding,
    marginHorizontal: spacing.screenPadding,
    marginBottom: spacing.md,
    gap: spacing.md,
  },
  avatarCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  userInfo: {
    flex: 1,
    gap: 2,
  },
  userName: {
    ...typography.cardTitle,
    fontSize: 16,
  },
  userRole: {
    ...typography.caption,
    fontSize: 12,
  },
  authNotice: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
    borderRadius: radii.sm,
    padding: spacing.md,
    marginHorizontal: spacing.screenPadding,
    marginBottom: spacing.lg,
  },
  authNoticeText: {
    ...typography.caption,
    fontSize: 12,
    lineHeight: 17,
    flex: 1,
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
  menuCard: {
    borderRadius: radii.card,
    marginHorizontal: spacing.screenPadding,
    overflow: 'hidden',
  },
  menuRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.cardPadding,
    gap: spacing.md,
    minHeight: touchTargets.min,
  },
  menuRowBorder: {
    // Visual separator via spacing only — no visible border
    paddingTop: spacing.md,
  },
  menuIconBox: {
    width: 34,
    height: 34,
    borderRadius: radii.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  menuContent: {
    flex: 1,
    gap: 1,
  },
  menuLabel: {
    ...typography.bodyMedium,
    fontSize: 15,
  },
  menuDesc: {
    ...typography.caption,
    fontSize: 12,
  },
  infoRow: {
    flexDirection: 'column',
    gap: 2,
    paddingHorizontal: spacing.cardPadding,
    paddingVertical: spacing.sm,
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
