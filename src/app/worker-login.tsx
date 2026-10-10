/**
 * Field worker sign-in: NGO code + worker ID + password, all issued by the
 * backend when the NGO adds the worker. Workers cannot self-register.
 * First sign-in with a temporary password asks for a new one.
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
import { useGoBack } from '@/navigation/use-go-back';
import { api, IS_MOCK_API } from '@/services/api';
import { SAMPLE_NGO_CODE } from '@/fixtures/sample-accounts';
import { useSession } from '@/session/session-context';
import { useTheme } from '@/theme';
import { radii, spacing, touchTargets } from '@/theme/spacing';
import { typography } from '@/theme/typography';
import { NgoMember } from '@/types/accounts';

const MIN_PASSWORD_LENGTH = 8;

export default function WorkerLoginScreen() {
  const goBack = useGoBack();
  const { colors } = useTheme();
  const { signInAs } = useSession();

  const [ngoCode, setNgoCode] = useState('');
  const [workerId, setWorkerId] = useState('');
  const [password, setPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  /** Set after sign-in when the backend requires a password change. */
  const [pendingMember, setPendingMember] = useState<NgoMember | null>(null);

  const finish = async (member: NgoMember) => {
    await signInAs('field_worker', {
      user: { name: member.name, ngoName: member.ngoName, workerId: member.workerId },
      isDemo: IS_MOCK_API,
    });
  };

  const handleSignIn = async () => {
    if (!ngoCode.trim() || !workerId.trim() || !password) {
      Alert.alert('Required fields', 'Enter your NGO code, worker ID and password.');
      return;
    }
    try {
      setSubmitting(true);
      const { member } = (await api.workerLogin({ ngoCode, workerId, password })).data;
      if (member.mustChangePassword) setPendingMember(member);
      else await finish(member);
    } catch (err: any) {
      Alert.alert('Sign-in failed', err?.message || 'Could not sign in.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleChangePassword = async () => {
    if (newPassword.length < MIN_PASSWORD_LENGTH) {
      Alert.alert('Password too short', `Use at least ${MIN_PASSWORD_LENGTH} characters.`);
      return;
    }
    if (newPassword !== confirmPassword) {
      Alert.alert('Passwords differ', 'Both entries must match.');
      return;
    }
    try {
      setSubmitting(true);
      await finish((await api.changeWorkerPassword(newPassword)).data);
    } catch (err: any) {
      Alert.alert('Could not change password', err?.message || 'Try again.');
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
        <Text numberOfLines={1} style={[styles.headerTitle, { color: colors.textPrimary }]}>Field worker sign-in</Text>
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.flex}>
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          <SimulatedSignInNotice
            hint={`NGO code ${SAMPLE_NGO_CODE}, worker ID SAMPLE-W-0001, any password.`}
          />

          {pendingMember ? (
            <View style={[styles.card, { backgroundColor: colors.surface }]}>
              <Text style={[styles.body, { color: colors.textPrimary }]}>
                Welcome, {pendingMember.name} ({pendingMember.ngoName}). Set a new password to
                replace the temporary one.
              </Text>
              <AuthField
                label="New password"
                secureTextEntry
                value={newPassword}
                onChangeText={setNewPassword}
              />
              <AuthField
                label="Confirm new password"
                secureTextEntry
                value={confirmPassword}
                onChangeText={setConfirmPassword}
              />
              <PrimaryButton
                label="Save and continue"
                onPress={handleChangePassword}
                busy={submitting}
              />
            </View>
          ) : (
            <View style={[styles.card, { backgroundColor: colors.surface }]}>
              <Text style={[styles.caption, { color: colors.textSecondary }]}>
                Your NGO gives you these details. Field workers cannot register themselves.
              </Text>
              <AuthField
                label="NGO code"
                autoCapitalize="characters"
                autoCorrect={false}
                value={ngoCode}
                onChangeText={setNgoCode}
              />
              <AuthField
                label="Worker ID"
                autoCapitalize="characters"
                autoCorrect={false}
                value={workerId}
                onChangeText={setWorkerId}
              />
              <AuthField label="Password" secureTextEntry value={password} onChangeText={setPassword} />
              <PrimaryButton label="Sign in" onPress={handleSignIn} busy={submitting} />
            </View>
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
    flexShrink: 1,
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
});
