/**
 * My field team — the NGO adds, disables and resets its field workers.
 *
 * The backend issues every worker ID and temporary password. The app shows
 * them once, right after createWorker / resetWorkerPassword, and never stores
 * them. Hiding this screen from other roles is convenience; the backend
 * enforces who may manage which team.
 */
import React, { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';

import { AuthField, PrimaryButton } from '@/components/AuthForm';
import { EmptyState } from '@/components/EmptyState';
import { ErrorState } from '@/components/ErrorState';
import { useGoBack } from '@/navigation/use-go-back';
import { api, IS_MOCK_API } from '@/services/api';
import { fetchNgoSession } from '@/services/ngo-api';
import { useTheme } from '@/theme';
import { radii, spacing, touchTargets } from '@/theme/spacing';
import { typography } from '@/theme/typography';
import { NgoMember, WorkerCredentials } from '@/types/accounts';

interface ShownCredentials extends WorkerCredentials {
  name: string;
  isReset: boolean;
  simulated: boolean;
}

export default function NgoTeamScreen() {
  const goBack = useGoBack();
  const { colors } = useTheme();

  const [members, setMembers] = useState<NgoMember[]>([]);
  const [ngoCode, setNgoCode] = useState<string | undefined>();
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [skills, setSkills] = useState('');
  const [creating, setCreating] = useState(false);
  /** Shown once; cleared when the NGO taps Done or leaves the screen. */
  const [credentials, setCredentials] = useState<ShownCredentials | null>(null);

  const load = useCallback(async () => {
    try {
      setErrorMsg(null);
      const [team, ngo] = await Promise.all([api.getFieldTeam(), fetchNgoSession()]);
      setMembers(team.data);
      setNgoCode(ngo?.ngoCode);
    } catch (err: any) {
      setErrorMsg(err?.message || 'Could not load your field team.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    load();
  }, [load]);

  const replaceMember = (member: NgoMember) =>
    setMembers((prev) => prev.map((m) => (m.id === member.id ? member : m)));

  const handleCreate = async () => {
    if (!name.trim() || !phone.trim()) {
      Alert.alert('Required fields', 'Enter the worker name and phone number.');
      return;
    }
    try {
      setCreating(true);
      const result = await api.createWorker({
        name: name.trim(),
        phone: phone.trim(),
        skills: skills.split(',').map((s) => s.trim()).filter(Boolean),
      });
      setMembers((prev) => [...prev, result.data.member]);
      setCredentials({
        ...result.data.credentials,
        name: result.data.member.name,
        isReset: false,
        simulated: result.source === 'sample',
      });
      setName('');
      setPhone('');
      setSkills('');
      setShowForm(false);
    } catch (err: any) {
      Alert.alert('Could not add worker', err?.message || 'Try again.');
    } finally {
      setCreating(false);
    }
  };

  const toggleDisabled = async (member: NgoMember) => {
    try {
      setBusyId(member.id);
      replaceMember((await api.disableWorker(member.id, member.status === 'ACTIVE')).data);
    } catch (err: any) {
      Alert.alert('Could not update worker', err?.message || 'Try again.');
    } finally {
      setBusyId(null);
    }
  };

  const resetPassword = (member: NgoMember) => {
    Alert.alert(
      `Reset password for ${member.name}?`,
      'Their current password stops working. They must set a new one at next sign-in.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reset',
          style: 'destructive',
          onPress: async () => {
            try {
              setBusyId(member.id);
              const result = await api.resetWorkerPassword(member.id);
              replaceMember({ ...member, mustChangePassword: true });
              setCredentials({
                ...result.data,
                name: member.name,
                isReset: true,
                simulated: result.source === 'sample',
              });
            } catch (err: any) {
              Alert.alert('Could not reset password', err?.message || 'Try again.');
            } finally {
              setBusyId(null);
            }
          },
        },
      ]
    );
  };

  return (
    <SafeAreaView
      edges={['top', 'left', 'right']}
      style={[styles.safeArea, { backgroundColor: colors.background }]}>
      <View style={styles.header}>
        <Pressable
          onPress={goBack}
          style={styles.iconButton}
          accessibilityRole="button"
          accessibilityLabel="Go back">
          <Feather name="arrow-left" size={22} color={colors.textPrimary} />
        </Pressable>
        <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>My field team</Text>
      </View>

      {loading ? (
        <ActivityIndicator style={styles.loader} color={colors.brandPrimary} />
      ) : errorMsg ? (
        <ErrorState message={errorMsg} onRetry={load} />
      ) : (
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          {IS_MOCK_API && (
            <Text style={[styles.caption, { color: colors.textTertiary }]}>
              Simulated sign-in / sample accounts. Worker IDs and passwords below are fixed sample
              values, not real credentials. The backend issues the real ones.
            </Text>
          )}

          {ngoCode && (
            <View style={[styles.card, { backgroundColor: colors.surface }]}>
              <Text style={[styles.caption, { color: colors.textSecondary }]}>NGO code</Text>
              <Text style={[styles.mono, { color: colors.textPrimary }]} selectable>
                {ngoCode}
              </Text>
              <Text style={[styles.caption, { color: colors.textTertiary }]}>
                Workers sign in with this code, their worker ID and password.
              </Text>
            </View>
          )}

          {credentials && (
            <View
              style={[styles.card, { backgroundColor: colors.surface }]}
              accessibilityLiveRegion="polite">
              <Text style={[styles.body, styles.bold, { color: colors.textPrimary }]}>
                {credentials.isReset ? 'Password reset' : 'Worker added'}: {credentials.name}
                {credentials.simulated ? ' (Simulated)' : ''}
              </Text>
              <Text style={[styles.caption, { color: colors.textSecondary }]}>Worker ID</Text>
              <Text style={[styles.mono, { color: colors.textPrimary }]} selectable>
                {credentials.workerId}
              </Text>
              <Text style={[styles.caption, { color: colors.textSecondary }]}>Temporary password</Text>
              <Text style={[styles.mono, { color: colors.textPrimary }]} selectable>
                {credentials.temporaryPassword}
              </Text>
              <Text style={[styles.caption, { color: colors.statusWatch }]}>
                Shown only once. Give it to the worker now; they must change it at first sign-in.
              </Text>
              <PrimaryButton label="Done" onPress={() => setCredentials(null)} />
            </View>
          )}

          {showForm ? (
            <View style={[styles.card, { backgroundColor: colors.surface }]}>
              <AuthField label="Name" value={name} onChangeText={setName} />
              <AuthField
                label="Phone"
                keyboardType="phone-pad"
                value={phone}
                onChangeText={setPhone}
              />
              <AuthField
                label="Skills (comma separated)"
                placeholder="Boat handling, First aid"
                value={skills}
                onChangeText={setSkills}
              />
              <PrimaryButton label="Create worker" onPress={handleCreate} busy={creating} />
              <Pressable
                onPress={() => setShowForm(false)}
                style={styles.textButton}
                accessibilityRole="button">
                <Text style={[styles.body, { color: colors.textSecondary }]}>Cancel</Text>
              </Pressable>
            </View>
          ) : (
            <PrimaryButton label="Add field worker" onPress={() => setShowForm(true)} />
          )}

          {members.length === 0 ? (
            <EmptyState
              title="No field workers yet"
              description="Add workers so coordinators can dispatch them."
            />
          ) : (
            members.map((member) => {
              const active = member.status === 'ACTIVE';
              const busy = busyId === member.id;
              return (
                <View key={member.id} style={[styles.card, { backgroundColor: colors.surface }]}>
                  <View style={styles.row}>
                    <View
                      style={[
                        styles.dot,
                        { backgroundColor: active ? colors.statusResolved : colors.textTertiary },
                      ]}
                    />
                    <Text style={[styles.body, styles.bold, styles.flex, { color: colors.textPrimary }]}>
                      {member.name}
                    </Text>
                    <Text style={[styles.caption, { color: colors.textSecondary }]}>
                      {active ? 'Active' : 'Disabled'}
                    </Text>
                  </View>
                  <Text style={[styles.caption, { color: colors.textSecondary }]}>
                    {member.workerId} · {member.phone}
                  </Text>
                  {member.skills.length > 0 && (
                    <Text style={[styles.caption, { color: colors.textSecondary }]}>
                      {member.skills.join(', ')}
                    </Text>
                  )}
                  {member.mustChangePassword && (
                    <Text style={[styles.caption, { color: colors.textTertiary }]}>
                      Has not set a password yet
                    </Text>
                  )}
                  <View style={styles.row}>
                    <Pressable
                      onPress={() => toggleDisabled(member)}
                      disabled={busy}
                      style={[styles.smallButton, { backgroundColor: colors.surfaceMuted }]}
                      accessibilityRole="button"
                      accessibilityLabel={`${active ? 'Disable' : 'Enable'} ${member.name}`}>
                      <Text style={[styles.caption, styles.bold, { color: colors.textPrimary }]}>
                        {active ? 'Disable' : 'Enable'}
                      </Text>
                    </Pressable>
                    <Pressable
                      onPress={() => resetPassword(member)}
                      disabled={busy}
                      style={[styles.smallButton, { backgroundColor: colors.surfaceMuted }]}
                      accessibilityRole="button"
                      accessibilityLabel={`Reset password for ${member.name}`}>
                      <Text style={[styles.caption, styles.bold, { color: colors.textPrimary }]}>
                        Reset password
                      </Text>
                    </Pressable>
                    {busy && <ActivityIndicator size="small" color={colors.textTertiary} />}
                  </View>
                </View>
              );
            })
          )}
        </ScrollView>
      )}
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
  iconButton: {
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
  loader: {
    marginTop: spacing.xl,
  },
  content: {
    paddingHorizontal: spacing.screenPadding,
    paddingTop: spacing.sm,
    paddingBottom: spacing.xxl,
    gap: spacing.md,
  },
  card: {
    borderRadius: radii.card,
    padding: spacing.cardPadding,
    gap: spacing.xs,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  body: {
    ...typography.body,
    fontSize: 14,
    lineHeight: 20,
  },
  bold: {
    fontWeight: '600',
  },
  caption: {
    ...typography.caption,
    fontSize: 12,
    lineHeight: 17,
  },
  mono: {
    fontFamily: 'monospace',
    fontSize: 16,
    letterSpacing: 0.5,
  },
  smallButton: {
    minHeight: touchTargets.min,
    paddingHorizontal: spacing.md,
    borderRadius: radii.button,
    justifyContent: 'center',
    marginTop: spacing.xs,
  },
  textButton: {
    minHeight: touchTargets.min,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
