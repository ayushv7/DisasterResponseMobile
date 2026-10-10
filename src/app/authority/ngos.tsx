/**
 * NGOs — authority home. Approve or reject pending NGOs and suspend approved
 * ones. Coordinator and admin share this screen; the backend decides who may.
 * Only approved NGOs can publish updates, receive messages or get plans.
 */
import React, { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { EmptyState } from '@/components/EmptyState';
import { ErrorState } from '@/components/ErrorState';
import { AuthorityTabBar } from '@/components/AuthorityTabBar';
import { useConfirmExitAtRoot } from '@/hooks/use-confirm-exit-at-root';
import { api, IS_MOCK_API } from '@/services/api';
import { useTheme } from '@/theme';
import { radii, spacing, touchTargets } from '@/theme/spacing';
import { typography } from '@/theme/typography';
import { NgoApplication } from '@/types/ngo-workspace';

const STATUS_LABELS: Record<NgoApplication['status'], string> = {
  PENDING: 'Pending',
  APPROVED: 'Approved',
  SUSPENDED: 'Rejected / suspended',
};

export default function ApproveNgosScreen() {
  const { colors } = useTheme();
  useConfirmExitAtRoot();

  const [applications, setApplications] = useState<NgoApplication[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      setErrorMsg(null);
      setApplications((await api.getNgoApplications()).data);
    } catch (err: any) {
      setErrorMsg(err?.message || 'Could not load NGO registrations.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    load();
  }, [load]);

  const decide = (app: NgoApplication, approved: boolean) => {
    const verb = approved ? 'Approve' : app.status === 'APPROVED' ? 'Suspend' : 'Reject';
    Alert.alert(
      `${verb} ${app.name}?`,
      approved
        ? 'They will be able to publish updates, receive citizen messages and get response plans.'
        : 'They will not be able to publish, receive messages or get response plans.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: verb,
          style: approved ? 'default' : 'destructive',
          onPress: async () => {
            try {
              setBusyId(app.id);
              const result = await api.approveNgo(app.id, approved);
              setApplications((prev) => prev.map((a) => (a.id === app.id ? result.data : a)));
              load();
              const done = `${app.name}: ${verb.toLowerCase()} saved.`;
              setFeedback(result.source === 'sample' ? `Simulated: ${done}` : done);
            } catch (err: any) {
              Alert.alert('Could not save decision', err?.message || 'Try again.');
            } finally {
              setBusyId(null);
            }
          },
        },
      ]
    );
  };

  const pending = applications.filter((a) => a.status === 'PENDING');
  const decided = applications.filter((a) => a.status !== 'PENDING');

  const renderCard = (app: NgoApplication) => {
    const busy = busyId === app.id;
    return (
      <View key={app.id} style={[styles.card, { backgroundColor: colors.surface }]}>
        <View style={styles.row}>
          <View
            style={[
              styles.dot,
              {
                backgroundColor:
                  app.status === 'APPROVED'
                    ? colors.statusResolved
                    : app.status === 'PENDING'
                      ? colors.statusWatch
                      : colors.textTertiary,
              },
            ]}
          />
          <Text style={[styles.body, styles.bold, styles.flex, { color: colors.textPrimary }]}>
            {app.name}
          </Text>
          <Text style={[styles.caption, { color: colors.textSecondary }]}>
            {STATUS_LABELS[app.status]}
          </Text>
        </View>
        <Text style={[styles.caption, { color: colors.textSecondary }]}>
          {app.focusAreas.join(', ')}
        </Text>
        <Text style={[styles.caption, { color: colors.textTertiary }]}>
          Registered {new Date(app.registeredAt).toLocaleDateString()}
          {app.registrationRef ? ` · Ref ${app.registrationRef}` : ' · No registration reference'}
        </Text>
        {app.status === 'PENDING' && (
          <View style={styles.row}>
            <Pressable
              onPress={() => decide(app, true)}
              disabled={busy}
              style={[styles.button, { backgroundColor: colors.actionPrimary }]}
              accessibilityRole="button"
              accessibilityLabel={`Approve ${app.name}`}>
              <Text style={[styles.caption, styles.bold, { color: colors.onActionPrimary }]}>
                Approve
              </Text>
            </Pressable>
            <Pressable
              onPress={() => decide(app, false)}
              disabled={busy}
              style={[styles.button, { backgroundColor: colors.surfaceMuted }]}
              accessibilityRole="button"
              accessibilityLabel={`Reject ${app.name}`}>
              <Text style={[styles.caption, styles.bold, { color: colors.textPrimary }]}>
                Reject
              </Text>
            </Pressable>
            {busy && <ActivityIndicator size="small" color={colors.textTertiary} />}
          </View>
        )}
        {app.status === 'APPROVED' && (
          <View style={styles.row}>
            <Pressable
              onPress={() => decide(app, false)}
              disabled={busy}
              style={[styles.button, { backgroundColor: colors.surfaceMuted }]}
              accessibilityRole="button"
              accessibilityLabel={`Suspend ${app.name}`}>
              <Text style={[styles.caption, styles.bold, { color: colors.statusActive }]}>
                Suspend
              </Text>
            </Pressable>
            {busy && <ActivityIndicator size="small" color={colors.textTertiary} />}
          </View>
        )}
      </View>
    );
  };

  return (
    <SafeAreaView
      edges={['top', 'left', 'right']}
      style={[styles.safeArea, { backgroundColor: colors.background }]}>
      <View style={styles.header}>
        <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>NGOs</Text>
      </View>

      {loading ? (
        <ActivityIndicator style={styles.loader} color={colors.brandPrimary} />
      ) : errorMsg ? (
        <ErrorState message={errorMsg} onRetry={load} />
      ) : (
        <ScrollView contentContainerStyle={styles.content}>
          <Text style={[styles.caption, { color: colors.textTertiary }]}>
            {IS_MOCK_API ? 'SAMPLE DATA — not real organizations. ' : ''}
            The backend checks who may approve, reject or suspend.
          </Text>
          {feedback && (
            <Text
              style={[styles.caption, { color: colors.textPrimary }]}
              accessibilityLiveRegion="polite">
              {feedback}
            </Text>
          )}

          <Text style={[styles.overline, { color: colors.textTertiary }]}>
            PENDING ({pending.length})
          </Text>
          {pending.length === 0 ? (
            <EmptyState title="Nothing to review" description="No NGO registrations are waiting." />
          ) : (
            pending.map(renderCard)
          )}

          {decided.length > 0 && (
            <>
              <Text style={[styles.overline, { color: colors.textTertiary }]}>DECIDED</Text>
              {decided.map(renderCard)}
            </>
          )}
        </ScrollView>
      )}
      <AuthorityTabBar activeTab="ngos" />
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
    paddingTop: spacing.md,
    paddingBottom: spacing.xs,
    gap: spacing.sm,
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
    gap: spacing.sm,
  },
  overline: {
    ...typography.overline,
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.5,
    marginTop: spacing.sm,
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
  button: {
    minHeight: touchTargets.min,
    paddingHorizontal: spacing.md,
    borderRadius: radii.button,
    justifyContent: 'center',
    marginTop: spacing.xs,
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
});
