import React from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { router } from 'expo-router';

import { OpsBottomNavBar } from '@/components/OpsBottomNavBar';
import { useConfirmExitAtRoot } from '@/hooks/use-confirm-exit-at-root';
import { useSession } from '@/session/session-context';
import { useTheme } from '@/theme';
import { radii, spacing, touchTargets } from '@/theme/spacing';
import { typography } from '@/theme/typography';
import { ROLE_LABELS } from '@/types/roles';

/** Coordinator "More" tab / field worker "Profile" tab. */
export default function OpsMoreScreen() {
  const { colors } = useTheme();
  const { role, session, signOut } = useSession();
  useConfirmExitAtRoot();

  const confirmSwitchToPublic = () => {
    Alert.alert(
      'Switch to public view?',
      'You will be signed out and returned to public alerts.',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Sign out', style: 'destructive', onPress: () => signOut() },
      ]
    );
  };

  const rows: { icon: keyof typeof Feather.glyphMap; label: string; onPress: () => void }[] = [
    ...(role !== 'field_worker'
      ? [
          {
            icon: 'check-circle' as const,
            label: 'Approve NGOs',
            onPress: () => router.push('/ops/approve-ngos'),
          },
        ]
      : []),
    { icon: 'sliders', label: 'Settings', onPress: () => router.push('/settings') },
    ...(__DEV__
      ? [{ icon: 'code' as const, label: 'Developer role switcher', onPress: () => router.push('/dev') }]
      : []),
  ];

  return (
    <SafeAreaView edges={['top', 'left', 'right']} style={[styles.safeArea, { backgroundColor: colors.background }]}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={[styles.title, { color: colors.textPrimary }]}>
          {role === 'field_worker' ? 'Profile' : 'More'}
        </Text>

        <View style={[styles.card, { backgroundColor: colors.surface }]}>
          <Text style={[styles.body, { color: colors.textPrimary }]}>{ROLE_LABELS[role]}</Text>
          {session?.user && (
            <Text style={[styles.caption, { color: colors.textSecondary }]}>
              {session.user.name}
              {session.user.ngoName ? ` · ${session.user.ngoName}` : ''}
              {session.user.workerId ? ` · ${session.user.workerId}` : ''}
            </Text>
          )}
          {session?.isDemo && (
            <Text style={[styles.caption, { color: colors.textTertiary }]}>
              Simulated sign-in / sample account. Not authenticated by the backend.
            </Text>
          )}
        </View>

        <View style={[styles.card, styles.list, { backgroundColor: colors.surface }]}>
          {rows.map((row) => (
            <Pressable
              key={row.label}
              onPress={row.onPress}
              style={styles.row}
              android_ripple={{ color: colors.surfaceMuted }}
              accessibilityRole="button">
              <Feather name={row.icon} size={18} color={colors.textSecondary} />
              <Text style={[styles.body, styles.rowLabel, { color: colors.textPrimary }]}>{row.label}</Text>
              <Feather name="chevron-right" size={18} color={colors.textTertiary} />
            </Pressable>
          ))}
        </View>

        <Pressable
          onPress={confirmSwitchToPublic}
          style={[styles.card, styles.row, { backgroundColor: colors.surface }]}
          android_ripple={{ color: colors.surfaceMuted }}
          accessibilityRole="button"
          accessibilityLabel="Sign out and switch to public view">
          <Feather name="log-out" size={18} color={colors.statusActive} />
          <Text style={[styles.body, styles.rowLabel, { color: colors.statusActive }]}>
            Switch to public view
          </Text>
        </Pressable>
      </ScrollView>
      <OpsBottomNavBar activeTab="more" />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  content: {
    padding: spacing.screenPadding,
    gap: spacing.md,
  },
  title: {
    ...typography.title,
    marginBottom: spacing.xs,
  },
  card: {
    borderRadius: radii.card,
    padding: spacing.cardPadding,
    gap: spacing.xs,
  },
  list: {
    paddingVertical: spacing.xs,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: touchTargets.min,
    gap: spacing.md,
  },
  rowLabel: { flex: 1 },
  body: { ...typography.body },
  caption: { ...typography.caption },
});
