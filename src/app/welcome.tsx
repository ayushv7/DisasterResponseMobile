/**
 * First-run start screen (public only). Visitors can browse alerts or message
 * an NGO without an account; staff, field workers, contributors and the
 * authority pick their sign-in. Shown once; Browse/Message replace it so Back
 * does not return here.
 */
import React from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { Href, Redirect, router } from 'expo-router';

import { homeRouteFor, useSession } from '@/session/session-context';
import { radii, spacing, textScale, touchTargets, typography, useTheme } from '@/theme';

const SIGN_INS: { label: string; desc: string; icon: keyof typeof Feather.glyphMap; href: Href }[] = [
  { label: 'NGO', desc: 'Organization staff', icon: 'shield', href: '/login' },
  { label: 'Field worker', desc: 'NGO code and worker ID', icon: 'tool', href: '/worker-login' },
  { label: 'Contributor', desc: 'Contributor ID and code', icon: 'package', href: '/contributor-login' },
  { label: 'Authority', desc: 'Coordinator or admin', icon: 'key', href: '/login' },
];

export default function WelcomeScreen() {
  const { colors } = useTheme();
  const { role, setWelcomeSeen } = useSession();

  const browse = () => {
    setWelcomeSeen(true);
    router.replace('/alerts');
  };

  const messageNgo = () => {
    setWelcomeSeen(true);
    router.replace('/alerts');
    router.push('/message/compose');
  };

  const signIn = (href: Href) => {
    setWelcomeSeen(true);
    router.push(href);
  };

  // Signed-in roles never land here, not even via a link
  if (role !== 'public') return <Redirect href={homeRouteFor(role)} />;

  return (
    <SafeAreaView edges={['top', 'left', 'right', 'bottom']} style={[styles.safeArea, { backgroundColor: colors.background }]}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.hero}>
          <View style={[styles.logo, { backgroundColor: colors.surfaceMuted }]}>
            <Feather name="droplet" size={28} color={colors.brandPrimary} />
          </View>
          <Text style={[styles.title, { color: colors.textPrimary }]}>Flood response</Text>
          <Text style={[styles.body, styles.center, { color: colors.textSecondary }]}>
            Read flood alerts and reach verified NGOs. No account needed.
          </Text>
        </View>

        <Pressable
          onPress={browse}
          style={({ pressed }) => [
            styles.primary,
            { backgroundColor: pressed ? colors.actionPrimaryPressed : colors.actionPrimary },
          ]}
          accessibilityRole="button">
          <Feather name="bell" size={18} color={colors.onActionPrimary} />
          <Text style={[styles.buttonText, { color: colors.onActionPrimary }]}>Browse alerts</Text>
        </Pressable>
        <Pressable
          onPress={messageNgo}
          style={[styles.primary, { backgroundColor: colors.surfaceMuted }]}
          accessibilityRole="button">
          <Feather name="send" size={18} color={colors.textPrimary} />
          <Text style={[styles.buttonText, { color: colors.textPrimary }]}>Message an NGO</Text>
        </Pressable>

        <Text style={[styles.overline, { color: colors.textTertiary }]}>SIGN IN</Text>
        <View style={[styles.list, { backgroundColor: colors.surface }]}>
          {SIGN_INS.map((item) => (
            <Pressable
              key={item.label}
              onPress={() => signIn(item.href)}
              style={styles.row}
              android_ripple={{ color: colors.surfaceMuted }}
              accessibilityRole="button"
              accessibilityLabel={`${item.label} sign in`}>
              <Feather name={item.icon} size={18} color={colors.textSecondary} />
              <View style={styles.flex}>
                <Text style={[styles.body, styles.bold, { color: colors.textPrimary }]}>{item.label}</Text>
                <Text style={[styles.caption, { color: colors.textTertiary }]}>{item.desc}</Text>
              </View>
              <Feather name="chevron-right" size={18} color={colors.textTertiary} />
            </Pressable>
          ))}
        </View>
        <Text style={[styles.caption, styles.center, { color: colors.textTertiary }]}>
          Citizens can optionally sign in later from Profile to offer help or volunteer.
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  flex: { flex: 1 },
  content: { padding: spacing.screenPadding, gap: spacing.md, paddingBottom: spacing.xxxl },
  hero: { alignItems: 'center', gap: spacing.sm, paddingVertical: spacing.xxl },
  logo: {
    width: touchTargets.min + spacing.lg,
    height: touchTargets.min + spacing.lg,
    borderRadius: radii.chip,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: { ...typography.title, ...textScale.title },
  primary: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    minHeight: touchTargets.min,
    borderRadius: radii.button,
  },
  buttonText: { ...typography.bodyMedium, ...textScale.subtitle, fontWeight: '700' },
  overline: { ...typography.overline, ...textScale.caption, fontWeight: '700', marginTop: spacing.lg },
  list: { borderRadius: radii.card, overflow: 'hidden' },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    minHeight: touchTargets.min,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
  },
  body: { ...typography.body, ...textScale.body },
  bold: { fontWeight: '600' },
  caption: { ...typography.caption, ...textScale.caption },
  center: { textAlign: 'center' },
});
