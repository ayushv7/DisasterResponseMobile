/**
 * Contributor sign-in with the contributor ID and sign-in code the backend
 * issued when the NGO approved the application.
 */
import React, { useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';

import { AuthField, PrimaryButton, SimulatedSignInNotice } from '@/components/AuthForm';
import { SAMPLE_CONTRIBUTOR_CODE } from '@/fixtures/sample-contributors';
import { useGoBack } from '@/navigation/use-go-back';
import { api, ApiError, IS_MOCK_API } from '@/services/api';
import { useSession } from '@/session/session-context';
import { useTheme } from '@/theme';
import { radii, spacing, touchTargets } from '@/theme/spacing';
import { typography } from '@/theme/typography';

const ERROR_TITLES: Record<string, string> = {
  INVALID_CREDENTIALS: 'Not recognised',
  CODE_EXPIRED: 'Code expired',
  REVOKED: 'Access revoked',
  UNAUTHORIZED: 'Not allowed',
};

export default function ContributorLoginScreen() {
  const goBack = useGoBack();
  const { colors } = useTheme();
  const { signInAs } = useSession();
  const [contributorId, setContributorId] = useState('');
  const [signInCode, setSignInCode] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<{ title: string; message: string } | null>(null);

  const handleSignIn = async () => {
    if (submitting) return;
    if (!contributorId.trim() || !signInCode.trim()) {
      setError({ title: 'Required', message: 'Enter your contributor ID and sign-in code.' });
      return;
    }
    try {
      setSubmitting(true);
      setError(null);
      const c = (await api.contributorLogin({ contributorId, signInCode })).data;
      await signInAs('contributor', {
        user: { name: c.name, ngoName: c.ngoName, workerId: c.contributorId },
        isDemo: IS_MOCK_API,
      });
    } catch (err) {
      const code = err instanceof ApiError ? err.code : '';
      setError({
        title: ERROR_TITLES[code] ?? 'Sign-in failed',
        message: err instanceof Error ? err.message : 'Could not sign in.',
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <SafeAreaView edges={['top', 'left', 'right']} style={[styles.safeArea, { backgroundColor: colors.background }]}>
      <View style={styles.header}>
        <Pressable onPress={goBack} style={styles.backButton} accessibilityRole="button" accessibilityLabel="Go back">
          <Feather name="arrow-left" size={22} color={colors.textPrimary} />
        </Pressable>
        <Text numberOfLines={1} style={[styles.headerTitle, { color: colors.textPrimary }]}>Contributor sign-in</Text>
      </View>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.flex}>
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          <SimulatedSignInNotice
            hint={`Valid: SAMPLE-C-0001 / ${SAMPLE_CONTRIBUTOR_CODE}. Expired: SAMPLE-C-0002. Revoked: SAMPLE-C-0003.`}
          />
          <View style={[styles.card, { backgroundColor: colors.surface }]}>
            <Text style={[styles.caption, { color: colors.textSecondary }]}>
              Your NGO gives you these after approving your contributor application.
            </Text>
            <AuthField
              label="Contributor ID"
              autoCapitalize="characters"
              autoCorrect={false}
              value={contributorId}
              onChangeText={setContributorId}
            />
            <AuthField
              label="Sign-in code"
              autoCapitalize="characters"
              autoCorrect={false}
              secureTextEntry
              value={signInCode}
              onChangeText={setSignInCode}
            />
            {error && (
              <View style={[styles.error, { backgroundColor: colors.statusActiveBg }]} accessibilityLiveRegion="polite">
                <Text style={[styles.body, styles.bold, { color: colors.statusActive }]}>{error.title}</Text>
                <Text style={[styles.caption, { color: colors.textPrimary }]}>{error.message}</Text>
              </View>
            )}
            <PrimaryButton label="Sign in" onPress={handleSignIn} busy={submitting} />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  flex: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.screenPadding,
    paddingTop: spacing.sm,
    paddingBottom: spacing.xs,
    gap: spacing.sm,
  },
  backButton: { width: touchTargets.min, height: touchTargets.min, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { ...typography.title, fontSize: 20, lineHeight: 24 },
  content: { paddingHorizontal: spacing.screenPadding, paddingTop: spacing.md, paddingBottom: spacing.xxl, gap: spacing.md },
  card: { borderRadius: radii.card, padding: spacing.cardPadding, gap: spacing.md },
  error: { borderRadius: radii.sm, padding: spacing.sm, gap: 2 },
  body: { ...typography.body, fontSize: 14, lineHeight: 20 },
  bold: { fontWeight: '600' },
  caption: { ...typography.caption, fontSize: 12, lineHeight: 17 },
});
