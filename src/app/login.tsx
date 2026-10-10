/**
 * LoginScreen — Staff sign-in (NGO, coordinator, admin): email + password.
 * Field workers sign in separately with an NGO code (/worker-login).
 *
 * DEVELOPMENT ACCESS:
 * When backend authentication is pending, an explicitly labelled
 * Demo role access is only in the __DEV__ role switcher (/dev).
 */

import React, { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { router } from 'expo-router';

import { SimulatedSignInNotice } from '@/components/AuthForm';
import { api, IS_MOCK_API } from '@/services/api';
import { useSession } from '@/session/session-context';
import { useGoBack } from '@/navigation/use-go-back';
import { useTheme } from '@/theme';
import { radii, spacing, touchTargets } from '@/theme/spacing';
import { typography } from '@/theme/typography';

export default function LoginScreen() {
  const goBack = useGoBack();
  const { colors } = useTheme();
  const { signInAs } = useSession();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSignIn = async () => {
    if (!email.trim() || !password.trim()) {
      Alert.alert('Required Fields', 'Please enter your organization email and password.');
      return;
    }

    try {
      setSubmitting(true);
      const { role, user } = (await api.staffLogin(email.trim(), password)).data;
      await signInAs(role, { user, isDemo: IS_MOCK_API });
    } catch (err: any) {
      Alert.alert(
        'Authentication Unavailable',
        err?.message || 'Backend authentication service is not yet connected.'
      );
    } finally {
      setSubmitting(false);
    }
  };


  return (
    <SafeAreaView
      edges={['top', 'left', 'right']}
      style={[styles.safeArea, { backgroundColor: colors.background }]}>
      {/* Top Header */}
      <View style={styles.header}>
        <Pressable
          onPress={goBack}
          style={styles.backButton}
          accessibilityRole="button"
          accessibilityLabel="Go back">
          <Feather name="arrow-left" size={22} color={colors.textPrimary} />
        </Pressable>
        <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>
          Sign In
        </Text>
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.flex}>
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled">
          {/* Brand / Intro */}
          <View style={styles.introBlock}>
            <View
              style={[
                styles.iconBadge,
                { backgroundColor: colors.surfaceMuted },
              ]}>
              <Feather name="shield" size={28} color={colors.brandPrimary} />
            </View>
            <Text style={[styles.title, { color: colors.textPrimary }]}>
              Responder Access
            </Text>
            <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
              For NGO staff, coordinators and admins.
            </Text>
          </View>

          <SimulatedSignInNotice
            hint="Use ngo@sample.org, coordinator@sample.org or admin@sample.org with any password."
          />

          {/* Form Card */}
          <View style={[styles.card, { backgroundColor: colors.surface }]}>
            {/* Email Field */}
            <View style={styles.fieldGroup}>
              <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>
                Organization Email
              </Text>
              <TextInput
                style={[
                  styles.input,
                  {
                    color: colors.textPrimary,
                    backgroundColor: colors.surfaceMuted,
                  },
                ]}
                placeholder="officer@organization.org"
                placeholderTextColor={colors.textTertiary}
                autoCapitalize="none"
                keyboardType="email-address"
                autoComplete="email"
                value={email}
                onChangeText={setEmail}
              />
            </View>

            {/* Password Field */}
            <View style={styles.fieldGroup}>
              <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>
                Password
              </Text>
              <TextInput
                style={[
                  styles.input,
                  {
                    color: colors.textPrimary,
                    backgroundColor: colors.surfaceMuted,
                  },
                ]}
                placeholder="••••••••••••"
                placeholderTextColor={colors.textTertiary}
                secureTextEntry
                value={password}
                onChangeText={setPassword}
              />
            </View>

            {/* Sign In Button */}
            <Pressable
              onPress={handleSignIn}
              disabled={submitting}
              style={[
                styles.submitButton,
                {
                  backgroundColor: colors.brandPrimary,
                  opacity: submitting ? 0.7 : 1,
                },
              ]}>
              {submitting ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <Text style={styles.submitButtonText}>Sign In</Text>
              )}
            </Pressable>

            {/* Real Auth Contract Notice */}
            {!IS_MOCK_API && (
              <View style={styles.contractNotice}>
                <Feather name="info" size={13} color={colors.textTertiary} />
                <Text style={[styles.contractText, { color: colors.textTertiary }]}>
                  FastAPI OAuth 2.0 / JWT backend authentication is in development.
                  Live verification requires server integration.
                </Text>
              </View>
            )}
          </View>

          <Pressable
            onPress={() => router.push('/worker-login')}
            style={styles.devLink}
            accessibilityRole="link">
            <Text style={[styles.workerLink, { color: colors.brandPrimary }]}>
              Field worker sign-in
            </Text>
          </Pressable>

          {/* DEV-ONLY: role switching lives in the developer switcher */}
          {__DEV__ && (
            <Pressable
              onPress={() => router.push('/dev')}
              style={styles.devLink}
              accessibilityRole="link"
              accessibilityLabel="Open developer role switcher">
              <Text style={[styles.devDesc, { color: colors.textTertiary }]}>
                Development build: open role switcher
              </Text>
            </Pressable>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  flex: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.screenPadding,
    paddingTop: spacing.sm,
    paddingBottom: spacing.xs,
    gap: spacing.sm,
  },
  backButton: {
    width: touchTargets.min,
    height: touchTargets.min,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    ...typography.title,
    fontSize: 20,
    lineHeight: 24,
  },
  scrollContent: {
    paddingHorizontal: spacing.screenPadding,
    paddingTop: spacing.md,
    paddingBottom: spacing.xxl,
    gap: spacing.lg,
  },
  introBlock: {
    alignItems: 'center',
    gap: spacing.xs,
    paddingVertical: spacing.sm,
  },
  iconBadge: {
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.xs,
  },
  title: {
    ...typography.title,
    fontSize: 22,
    textAlign: 'center',
  },
  subtitle: {
    ...typography.body,
    fontSize: 13,
    lineHeight: 18,
    textAlign: 'center',
    maxWidth: 290,
  },
  card: {
    borderRadius: radii.card,
    padding: spacing.cardPadding,
    gap: spacing.md,
  },
  fieldGroup: {
    gap: 6,
  },
  fieldLabel: {
    ...typography.caption,
    fontSize: 12,
    fontWeight: '600',
  },
  input: {
    borderRadius: radii.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm + 4,
    fontSize: 14,
    minHeight: touchTargets.min,
  },
  submitButton: {
    height: touchTargets.min,
    borderRadius: radii.button,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: spacing.xs,
  },
  submitButtonText: {
    ...typography.bodyMedium,
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 15,
  },
  contractNotice: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.xs,
    paddingTop: spacing.xs,
  },
  contractText: {
    ...typography.caption,
    fontSize: 11,
    lineHeight: 15,
    flex: 1,
  },
  devLink: {
    minHeight: touchTargets.min,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: spacing.lg,
  },
  workerLink: {
    ...typography.bodyMedium,
    fontWeight: '600',
    fontSize: 14,
  },
  devSection: {
    gap: spacing.xs,
  },
  devSectionLabel: {
    ...typography.overline,
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  devDesc: {
    ...typography.caption,
    fontSize: 12,
    lineHeight: 17,
  },
  demoButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    height: touchTargets.min,
    borderRadius: radii.button,
  },
  demoButtonText: {
    ...typography.bodyMedium,
    fontWeight: '700',
    fontSize: 14,
  },
});
