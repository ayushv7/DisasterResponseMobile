/**
 * Optional citizen sign-in with a one-time code sent to a phone or email.
 *
 * Never required: visitors can read alerts and message an NGO without it.
 * The backend sends and checks the code and issues the token.
 */
import React, { useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';

import { AuthField, PrimaryButton, SimulatedSignInNotice } from '@/components/AuthForm';
import { SAMPLE_OTP_CODE } from '@/fixtures/sample-accounts';
import { useGoBack } from '@/navigation/use-go-back';
import { api } from '@/services/api';
import { useSession } from '@/session/session-context';
import { useTheme } from '@/theme';
import { radii, spacing, touchTargets } from '@/theme/spacing';
import { typography } from '@/theme/typography';
import { OtpChallenge } from '@/types/accounts';

export default function CitizenLoginScreen() {
  const goBack = useGoBack();
  const { colors } = useTheme();
  const { setCitizen } = useSession();

  const [contact, setContact] = useState('');
  const [code, setCode] = useState('');
  const [challenge, setChallenge] = useState<OtpChallenge | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const handleRequest = async () => {
    if (!contact.trim()) {
      Alert.alert('Required', 'Enter your phone number or email.');
      return;
    }
    try {
      setSubmitting(true);
      setChallenge((await api.requestOtp(contact)).data);
    } catch (err: any) {
      Alert.alert('Could not send code', err?.message || 'Try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleVerify = async () => {
    if (!challenge || !code.trim()) return;
    try {
      setSubmitting(true);
      setCitizen((await api.verifyOtp(challenge.challengeId, code)).data);
      goBack();
    } catch (err: any) {
      Alert.alert('Could not verify code', err?.message || 'Try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <SafeAreaView
      edges={['top', 'left', 'right']}
      style={[styles.safeArea, { backgroundColor: colors.background }]}>
      <View style={styles.header}>
        <Pressable
          onPress={goBack}
          style={styles.backButton}
          accessibilityRole="button"
          accessibilityLabel="Go back">
          <Feather name="arrow-left" size={22} color={colors.textPrimary} />
        </Pressable>
        <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>Sign in</Text>
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.flex}>
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          <SimulatedSignInNotice
            hint={`No code is sent. Use any phone or email, then the code ${SAMPLE_OTP_CODE}.`}
          />

          <View style={[styles.card, { backgroundColor: colors.surface }]}>
            <Text style={[styles.caption, { color: colors.textSecondary }]}>
              Optional. Sign in to offer help and choose alert areas. You can read alerts and
              message an NGO without an account.
            </Text>

            {challenge ? (
              <>
                <Text style={[styles.body, { color: colors.textPrimary }]}>
                  Enter the code sent to {challenge.sentTo}.
                </Text>
                <AuthField
                  label="One-time code"
                  keyboardType="number-pad"
                  autoComplete="one-time-code"
                  textContentType="oneTimeCode"
                  value={code}
                  onChangeText={setCode}
                />
                <PrimaryButton
                  label="Verify"
                  onPress={handleVerify}
                  busy={submitting}
                  disabled={!code.trim()}
                />
                <Pressable
                  onPress={() => {
                    setChallenge(null);
                    setCode('');
                  }}
                  style={styles.textButton}
                  accessibilityRole="button">
                  <Text style={[styles.body, { color: colors.textSecondary }]}>
                    Use a different phone or email
                  </Text>
                </Pressable>
              </>
            ) : (
              <>
                <AuthField
                  label="Phone or email"
                  autoCapitalize="none"
                  autoCorrect={false}
                  keyboardType="email-address"
                  value={contact}
                  onChangeText={setContact}
                />
                <PrimaryButton label="Send code" onPress={handleRequest} busy={submitting} />
              </>
            )}
          </View>
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
  content: {
    paddingHorizontal: spacing.screenPadding,
    paddingTop: spacing.md,
    paddingBottom: spacing.xxl,
    gap: spacing.md,
  },
  card: {
    borderRadius: radii.card,
    padding: spacing.cardPadding,
    gap: spacing.md,
  },
  body: {
    ...typography.body,
    fontSize: 14,
    lineHeight: 20,
  },
  caption: {
    ...typography.caption,
    fontSize: 12,
    lineHeight: 17,
  },
  textButton: {
    minHeight: touchTargets.min,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
