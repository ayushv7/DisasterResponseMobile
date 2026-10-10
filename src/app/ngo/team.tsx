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
import { PickerSheet } from '@/components/PickerSheet';
import { useGoBack } from '@/navigation/use-go-back';
import { api, IS_MOCK_API } from '@/services/api';
import { fetchNgoSession } from '@/services/ngo-api';
import { useTheme } from '@/theme';
import { radii, spacing, touchTargets } from '@/theme/spacing';
import { typography } from '@/theme/typography';
import { NgoMember, WorkerCredentials } from '@/types/accounts';
import { InterventionRecord } from '@/types/operations';
import { VOLUNTEER_STATUS_LABELS, VolunteerApplication, VolunteerDecision } from '@/types/volunteers';

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

  // Volunteer applications: eligibility comes from the backend; the NGO decides
  const [applications, setApplications] = useState<VolunteerApplication[]>([]);
  const [appsSimulated, setAppsSimulated] = useState(false);
  const [reasonFor, setReasonFor] = useState<{ id: string; decision: VolunteerDecision } | null>(null);
  const [decisionReason, setDecisionReason] = useState('');

  const load = useCallback(async () => {
    try {
      setErrorMsg(null);
      const [team, ngo, apps] = await Promise.all([
        api.getFieldTeam(),
        fetchNgoSession(),
        api.listVolunteerApplications(),
      ]);
      setMembers(team.data);
      setApplications(apps.data);
      setAppsSimulated(apps.source === 'sample');
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

  // Volunteer applications: eligibility comes from the backend; the NGO decides

  const decide = async (app: VolunteerApplication, decision: VolunteerDecision, reason?: string) => {
    if (decision !== 'APPROVE' && !reason?.trim()) {
      setReasonFor({ id: app.id, decision });
      setDecisionReason('');
      return;
    }
    try {
      setBusyId(app.id);
      const result = await api.decideVolunteerApplication(app.id, decision, reason?.trim());
      setApplications((prev) => prev.map((a) => (a.id === app.id ? result.data : a)));
      setReasonFor(null);
      // Approving or revoking changes the team list
      setMembers((await api.getFieldTeam()).data);
    } catch (err: any) {
      Alert.alert('Could not save decision', err?.message || 'Try again.');
    } finally {
      setBusyId(null);
    }
  };

  // Assign-task sheet: open tasks from the (backend-scoped) work orders
  const [assignFor, setAssignFor] = useState<NgoMember | null>(null);
  const [openTasks, setOpenTasks] = useState<InterventionRecord[] | null>(null);
  const [assigningTaskId, setAssigningTaskId] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);

  const openAssign = async (member: NgoMember) => {
    setAssignFor(member);
    setOpenTasks(null);
    try {
      const all = (await api.getWorkOrders()).data;
      setOpenTasks(
        all.filter(
          (t) => !t.assignedWorkerId && t.status !== 'VERIFIED_RESOLVED' && t.status !== 'FAILED'
        )
      );
    } catch (err: any) {
      setAssignFor(null);
      Alert.alert('Could not load tasks', err?.message || 'Try again.');
    }
  };

  const assignTask = async (taskId: string) => {
    if (!assignFor) return;
    try {
      setAssigningTaskId(taskId);
      const result = await api.assignTask(taskId, assignFor.id);
      setFeedback(
        `${result.source === 'sample' ? 'Simulated: ' : ''}${result.data.id} assigned to ${assignFor.name}.`
      );
      setAssignFor(null);
    } catch (err: any) {
      Alert.alert('Could not assign', err?.message || 'Try again.');
    } finally {
      setAssigningTaskId(null);
    }
  };

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

          {feedback && (
            <Text
              style={[styles.caption, { color: colors.textPrimary }]}
              accessibilityLiveRegion="polite">
              {feedback}
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

          <Text style={[styles.overline, { color: colors.textTertiary }]}>
            VOLUNTEER APPLICATIONS ({applications.filter((a) => a.status === 'PENDING').length} pending)
          </Text>
          {applications.length === 0 ? (
            <Text style={[styles.caption, { color: colors.textSecondary }]}>No applications yet.</Text>
          ) : (
            applications.map((app) => {
              const busy = busyId === app.id;
              const askingReason = reasonFor?.id === app.id;
              return (
                <View key={app.id} style={[styles.card, { backgroundColor: colors.surface }]}>
                  <Text style={[styles.body, styles.bold, { color: colors.textPrimary }]}>
                    {app.name} · {app.source === 'INVITED' ? 'Invited' : 'Applied'}
                  </Text>
                  <Text style={[styles.caption, { color: colors.textSecondary }]}>
                    {app.skills.join(', ')} · {app.availability}
                  </Text>
                  <Text style={[styles.caption, { color: colors.textSecondary }]}>
                    {VOLUNTEER_STATUS_LABELS[app.status]}
                    {app.decisionReason ? ` · ${app.decisionReason}` : ''}
                  </Text>
                  {app.eligibility && (
                    <View style={[styles.eligibility, { backgroundColor: colors.surfaceMuted }]}>
                      <View style={styles.row}>
                        <View
                          style={[
                            styles.dot,
                            {
                              backgroundColor: app.eligibility.eligible
                                ? colors.statusResolved
                                : colors.statusWatch,
                            },
                          ]}
                        />
                        <Text style={[styles.caption, styles.bold, { color: colors.textPrimary }]}>
                          {app.eligibility.eligible ? 'Eligible' : 'Not eligible'}
                          {appsSimulated ? ' (Simulated)' : ''} — system check
                        </Text>
                      </View>
                      {app.eligibility.reasons.map((reason) => (
                        <Text key={reason} style={[styles.caption, { color: colors.textSecondary }]}>
                          • {reason}
                        </Text>
                      ))}
                    </View>
                  )}
                  {askingReason ? (
                    <>
                      <AuthField
                        label={reasonFor?.decision === 'REVOKE' ? 'Reason for revoking' : 'Reason for rejecting'}
                        value={decisionReason}
                        onChangeText={setDecisionReason}
                      />
                      <View style={styles.row}>
                        <Pressable
                          onPress={() => decide(app, reasonFor!.decision, decisionReason)}
                          disabled={busy || !decisionReason.trim()}
                          style={[styles.smallButton, { backgroundColor: colors.statusActive }]}
                          accessibilityRole="button">
                          <Text style={[styles.caption, styles.bold, { color: colors.onPrimary }]}>
                            {reasonFor?.decision === 'REVOKE' ? 'Revoke' : 'Reject'}
                          </Text>
                        </Pressable>
                        <Pressable
                          onPress={() => setReasonFor(null)}
                          style={[styles.smallButton, { backgroundColor: colors.surfaceMuted }]}
                          accessibilityRole="button">
                          <Text style={[styles.caption, styles.bold, { color: colors.textPrimary }]}>Cancel</Text>
                        </Pressable>
                      </View>
                    </>
                  ) : (
                    <View style={styles.row}>
                      {app.status === 'PENDING' && (
                        <>
                          <Pressable
                            onPress={() => decide(app, 'APPROVE')}
                            disabled={busy}
                            style={[styles.smallButton, { backgroundColor: colors.actionPrimary }]}
                            accessibilityRole="button"
                            accessibilityLabel={`Approve ${app.name}`}>
                            <Text style={[styles.caption, styles.bold, { color: colors.onActionPrimary }]}>
                              Approve
                            </Text>
                          </Pressable>
                          <Pressable
                            onPress={() => decide(app, 'REJECT')}
                            disabled={busy}
                            style={[styles.smallButton, { backgroundColor: colors.surfaceMuted }]}
                            accessibilityRole="button"
                            accessibilityLabel={`Reject ${app.name}`}>
                            <Text style={[styles.caption, styles.bold, { color: colors.textPrimary }]}>Reject</Text>
                          </Pressable>
                        </>
                      )}
                      {app.status === 'APPROVED' && (
                        <Pressable
                          onPress={() => decide(app, 'REVOKE')}
                          disabled={busy}
                          style={[styles.smallButton, { backgroundColor: colors.surfaceMuted }]}
                          accessibilityRole="button"
                          accessibilityLabel={`Revoke ${app.name}`}>
                          <Text style={[styles.caption, styles.bold, { color: colors.statusActive }]}>Revoke</Text>
                        </Pressable>
                      )}
                      {busy && <ActivityIndicator size="small" color={colors.textTertiary} />}
                    </View>
                  )}
                </View>
              );
            })
          )}

          <Text style={[styles.overline, { color: colors.textTertiary }]}>FIELD WORKERS</Text>
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
                      {member.kind === 'VOLUNTEER' ? ' · Volunteer' : ''}
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
                  <View style={[styles.row, styles.wrap]}>
                    {active && (
                      <Pressable
                        onPress={() => openAssign(member)}
                        disabled={busy}
                        style={[styles.smallButton, { backgroundColor: colors.actionPrimary }]}
                        accessibilityRole="button"
                        accessibilityLabel={`Assign a task to ${member.name}`}>
                        <Text style={[styles.caption, styles.bold, { color: colors.onActionPrimary }]}>
                          Assign task
                        </Text>
                      </Pressable>
                    )}
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
      <PickerSheet
        visible={!!assignFor}
        title={`Assign a task to ${assignFor?.name ?? ''}`}
        note="Open tasks from incidents near your NGO. The backend checks qualifications."
        items={(openTasks ?? []).map((t) => ({
          id: t.id,
          title: `${t.id} · ${t.targetLocality}`,
          subtitle: t.requiredQualification
            ? `${t.incidentTitle} · Requires ${t.requiredQualification}`
            : t.incidentTitle,
        }))}
        loading={openTasks === null}
        busyId={assigningTaskId}
        emptyText="No open tasks right now."
        onPick={assignTask}
        onClose={() => setAssignFor(null)}
      />
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
  overline: {
    ...typography.overline,
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.5,
    marginTop: spacing.sm,
  },
  eligibility: {
    borderRadius: radii.sm,
    padding: spacing.sm,
    gap: 2,
  },
  wrap: {
    flexWrap: 'wrap',
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
