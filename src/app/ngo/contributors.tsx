/**
 * Contributor applications — the NGO approves, rejects or revokes citizens
 * who offer resources. On approval the backend issues a contributor ID and
 * sign-in code; the app shows them once and never stores them.
 */
import React, { useState } from 'react';
import { ActivityIndicator, Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';

import { AuthField, PrimaryButton } from '@/components/AuthForm';
import { SampleDataBadge } from '@/components/SampleDataBadge';
import { StateView } from '@/components/StateView';
import { ChipTone, StatusChip } from '@/components/StatusChip';
import { useApiQuery } from '@/hooks/use-api-query';
import { useGoBack } from '@/navigation/use-go-back';
import { api } from '@/services/api';
import { useTheme } from '@/theme';
import { radii, spacing, touchTargets } from '@/theme/spacing';
import { typography } from '@/theme/typography';
import { ContributorApplication, ContributorCredentials } from '@/types/contributors';
import { VOLUNTEER_STATUS_LABELS, VolunteerDecision } from '@/types/volunteers';

const TONES: Record<ContributorApplication['status'], ChipTone> = {
  PENDING: 'warning',
  APPROVED: 'success',
  REJECTED: 'neutral',
  REVOKED: 'critical',
};

export default function NgoContributorsScreen() {
  const goBack = useGoBack();
  const { colors } = useTheme();
  const query = useApiQuery(() => api.listContributorApplications(), []);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [reasonFor, setReasonFor] = useState<{ id: string; decision: VolunteerDecision } | null>(null);
  const [reason, setReason] = useState('');
  const [issued, setIssued] = useState<(ContributorCredentials & { name: string; simulated: boolean }) | null>(null);

  const decide = async (app: ContributorApplication, decision: VolunteerDecision) => {
    if (busyId) return;
    if (decision !== 'APPROVE' && reasonFor?.id !== app.id) {
      setReasonFor({ id: app.id, decision });
      setReason('');
      return;
    }
    try {
      setBusyId(app.id);
      const result = await api.decideContributorApplication(app.id, decision, reason.trim() || undefined);
      query.setData((query.data ?? []).map((a) => (a.id === app.id ? result.data.application : a)));
      query.refresh();
      if (result.data.credentials) {
        setIssued({ ...result.data.credentials, name: app.name, simulated: result.source === 'sample' });
      }
      setReasonFor(null);
    } catch (err) {
      Alert.alert('Could not save decision', err instanceof Error ? err.message : 'Try again.');
    } finally {
      setBusyId(null);
    }
  };

  return (
    <SafeAreaView edges={['top', 'left', 'right']} style={[styles.safeArea, { backgroundColor: colors.background }]}>
      <View style={styles.header}>
        <Pressable onPress={goBack} style={styles.iconButton} accessibilityRole="button" accessibilityLabel="Go back">
          <Feather name="arrow-left" size={22} color={colors.textPrimary} />
        </Pressable>
        <Text numberOfLines={1} style={[styles.headerTitle, { color: colors.textPrimary }]}>Contributor applications</Text>
        <SampleDataBadge source={query.source ?? undefined} />
      </View>

      <StateView
        state={query.state}
        error={query.error}
        onRetry={query.refresh}
        emptyTitle="No applications"
        emptyDescription="Citizens who offer resources to your NGO appear here."
        receivedAt={query.receivedAt}>
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          {issued && (
            <View style={[styles.card, { backgroundColor: colors.surface }]} accessibilityLiveRegion="polite">
              <Text style={[styles.body, styles.bold, { color: colors.textPrimary }]}>
                {issued.name} approved{issued.simulated ? ' (Simulated — sample values)' : ''}
              </Text>
              <Text style={[styles.caption, { color: colors.textSecondary }]}>Contributor ID</Text>
              <Text style={[styles.mono, { color: colors.textPrimary }]} selectable>{issued.contributorId}</Text>
              <Text style={[styles.caption, { color: colors.textSecondary }]}>Sign-in code</Text>
              <Text style={[styles.mono, { color: colors.textPrimary }]} selectable>{issued.signInCode}</Text>
              {issued.codeExpiresAt && (
                <Text style={[styles.caption, { color: colors.textSecondary }]}>
                  Code expires {new Date(issued.codeExpiresAt).toLocaleString()}
                </Text>
              )}
              <Text style={[styles.caption, { color: colors.info }]}>
                Shown only once. Give these to the contributor directly.
              </Text>
              <PrimaryButton label="Done" onPress={() => setIssued(null)} />
            </View>
          )}

          {(query.data ?? []).map((app) => {
            const busy = busyId === app.id;
            return (
              <View key={app.id} style={[styles.card, { backgroundColor: colors.surface }]}>
                <View style={styles.row}>
                  <Text style={[styles.body, styles.bold, styles.flex, { color: colors.textPrimary }]}>{app.name}</Text>
                  <StatusChip label={VOLUNTEER_STATUS_LABELS[app.status]} tone={TONES[app.status]} />
                </View>
                <Text style={[styles.body, { color: colors.textPrimary }]}>{app.offering}</Text>
                <Text style={[styles.caption, { color: colors.textSecondary }]}>
                  {app.area} · {app.contact}
                </Text>
                {app.decisionReason && (
                  <Text style={[styles.caption, { color: colors.textSecondary }]}>Reason: {app.decisionReason}</Text>
                )}
                {reasonFor?.id === app.id ? (
                  <>
                    <AuthField
                      label={reasonFor.decision === 'REVOKE' ? 'Reason for revoking' : 'Reason for rejecting'}
                      value={reason}
                      onChangeText={setReason}
                    />
                    <View style={styles.row}>
                      <Pressable
                        onPress={() => decide(app, reasonFor.decision)}
                        disabled={busy || !reason.trim()}
                        style={[styles.button, { backgroundColor: colors.statusActive, opacity: reason.trim() ? 1 : 0.5 }]}
                        accessibilityRole="button">
                        <Text style={[styles.caption, styles.bold, { color: colors.onPrimary }]}>
                          {reasonFor.decision === 'REVOKE' ? 'Revoke' : 'Reject'}
                        </Text>
                      </Pressable>
                      <Pressable
                        onPress={() => setReasonFor(null)}
                        style={[styles.button, { backgroundColor: colors.surfaceMuted }]}
                        accessibilityRole="button">
                        <Text style={[styles.caption, styles.bold, { color: colors.textPrimary }]}>Cancel</Text>
                      </Pressable>
                      {busy && <ActivityIndicator size="small" color={colors.textTertiary} />}
                    </View>
                  </>
                ) : (
                  <View style={styles.row}>
                    {app.status === 'PENDING' && (
                      <>
                        <Pressable
                          onPress={() => decide(app, 'APPROVE')}
                          disabled={busy}
                          style={[styles.button, { backgroundColor: colors.actionPrimary }]}
                          accessibilityRole="button"
                          accessibilityLabel={`Approve ${app.name}`}>
                          <Text style={[styles.caption, styles.bold, { color: colors.onActionPrimary }]}>Approve</Text>
                        </Pressable>
                        <Pressable
                          onPress={() => decide(app, 'REJECT')}
                          disabled={busy}
                          style={[styles.button, { backgroundColor: colors.surfaceMuted }]}
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
                        style={[styles.button, { backgroundColor: colors.surfaceMuted }]}
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
          })}
        </ScrollView>
      </StateView>
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
  iconButton: { width: touchTargets.min, height: touchTargets.min, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { ...typography.title, fontSize: 18, lineHeight: 24, flex: 1 },
  content: { paddingHorizontal: spacing.screenPadding, paddingTop: spacing.sm, paddingBottom: spacing.xxl, gap: spacing.sm },
  card: { borderRadius: radii.card, padding: spacing.cardPadding, gap: spacing.xs },
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, flexWrap: 'wrap' },
  button: {
    minHeight: touchTargets.min,
    paddingHorizontal: spacing.md,
    borderRadius: radii.button,
    justifyContent: 'center',
    marginTop: spacing.xs,
  },
  body: { ...typography.body, fontSize: 14, lineHeight: 20 },
  bold: { fontWeight: '600' },
  caption: { ...typography.caption, fontSize: 12, lineHeight: 17 },
  mono: { fontFamily: 'monospace', fontSize: 16 },
});
