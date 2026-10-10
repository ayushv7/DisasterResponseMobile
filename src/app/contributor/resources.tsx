/**
 * My resources — the contributor's registered resources with the backend's
 * freshness, eligibility, last check-in and next due time. The app never
 * decides freshness; it shows what the service returns.
 */
import React, { useCallback, useRef } from 'react';
import { Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { router, useFocusEffect } from 'expo-router';

import { AssignmentSummary } from '@/components/AssignmentSummary';
import { LocationBlock } from '@/components/LocationBlock';
import { CheckInDueBanner, relativeTime } from '@/components/CheckInDue';
import { ContributorTabBar } from '@/components/ContributorTabBar';
import { SampleDataBadge } from '@/components/SampleDataBadge';
import { StateView } from '@/components/StateView';
import { ChipTone, StatusChip } from '@/components/StatusChip';
import { useApiQuery } from '@/hooks/use-api-query';
import { useConfirmExitAtRoot } from '@/hooks/use-confirm-exit-at-root';
import { api, IS_MOCK_API } from '@/services/api';
import { useStrings } from '@/i18n/language-context';
import { useSession } from '@/session/session-context';
import { useTheme } from '@/theme';
import { radii, spacing, touchTargets } from '@/theme/spacing';
import { typography } from '@/theme/typography';
import { ContributorResource, RESOURCE_CONDITION_LABELS, ResourceFreshness } from '@/types/contributors';

const FRESHNESS: Record<ResourceFreshness, { label: string; tone: ChipTone }> = {
  FRESH: { label: 'Confirmed', tone: 'success' },
  DUE: { label: 'Check-in due', tone: 'warning' },
  STALE: { label: 'Stale', tone: 'critical' },
  PENDING: { label: 'Pending review', tone: 'info' },
  UNVERIFIED: { label: 'Unverified', tone: 'neutral' },
};

const formatTime = (iso: string) =>
  new Date(iso).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' });

export default function MyResourcesScreen() {
  const { colors } = useTheme();
  const { session } = useSession();
  const { t } = useStrings();
  useConfirmExitAtRoot();
  const query = useApiQuery(() => api.getMyResources(), []);
  // Instructions from NGO-approved plans: where to bring which resource, by when
  const instructions = useApiQuery(() => api.getMyInstructions(), []);

  // Re-read from the service when returning from Add / Check-in
  const { refresh } = query;
  const { refresh: refreshInstructions } = instructions;
  const firstFocus = useRef(true);
  useFocusEffect(
    useCallback(() => {
      if (firstFocus.current) {
        firstFocus.current = false;
        return;
      }
      refresh();
      refreshInstructions();
    }, [refresh, refreshInstructions])
  );

  const resources = query.data ?? [];
  const dueTimes = resources.map((r) => r.checkInDueAt).filter((d): d is string => !!d).sort();
  const needsAction = resources.filter((r) => r.freshness === 'DUE' || r.freshness === 'STALE').length;

  const renderResource = (r: ContributorResource) => {
    const fresh = FRESHNESS[r.freshness];
    return (
      <View key={r.id} style={[styles.card, { backgroundColor: colors.surface }]}>
        <View style={styles.row}>
          <Text style={[styles.body, styles.bold, styles.flex, { color: colors.textPrimary }]}>
            {r.typeLabel} × {r.quantity} {r.unit}
          </Text>
          <StatusChip label={fresh.label} tone={fresh.tone} />
        </View>
        <View style={styles.row}>
          <Text style={[styles.caption, { color: colors.textSecondary }]}>
            Condition: {RESOURCE_CONDITION_LABELS[r.condition]}
          </Text>
          {r.availability === 'UNAVAILABLE' && <StatusChip label="Unavailable" tone="critical" />}
          {r.evidence?.unverified && r.freshness !== 'UNVERIFIED' && (
            <StatusChip label="Unverified evidence" tone="neutral" />
          )}
        </View>
        {r.statusReason && (
          <Text style={[styles.caption, { color: colors.textSecondary }]}>{r.statusReason}</Text>
        )}
        <Text style={[styles.caption, { color: colors.textTertiary }]}>
          {r.lastCheckInAt ? `Last check-in ${formatTime(r.lastCheckInAt)}` : 'No check-in yet'}
          {r.checkInDueAt ? ` · Next due ${relativeTime(r.checkInDueAt)}` : ''}
          {r.checkInIntervalHours ? ` · every ${r.checkInIntervalHours} h` : ''}
        </Text>
        {/* The contributor's own GPS evidence (never shown on public screens) */}
        {r.evidence?.gps && (
          <LocationBlock
            place="Location when last confirmed"
            coords={r.evidence.gps}
            capturedAt={r.evidence.capturedAt}
            compact
          />
        )}
        {!r.eligibleForAllocation && (
          <Text style={[styles.caption, { color: colors.statusWatch }]}>Not eligible for allocation right now.</Text>
        )}
        <Pressable
          onPress={() => router.push({ pathname: '/contributor/check-in/[id]', params: { id: r.id } })}
          style={[styles.button, { backgroundColor: colors.actionPrimary }]}
          accessibilityRole="button"
          accessibilityLabel={`Check in ${r.typeLabel}`}>
          <Text style={[styles.buttonText, { color: colors.onActionPrimary }]}>{t('resources.checkIn')}</Text>
        </Pressable>
      </View>
    );
  };

  return (
    <SafeAreaView edges={['top', 'left', 'right']} style={[styles.safeArea, { backgroundColor: colors.background }]}>
      <View style={styles.header}>
        <View style={styles.flex}>
          <Text style={[styles.title, { color: colors.textPrimary }]}>{t('resources.title')}</Text>
          {session?.user?.ngoName && (
            <Text style={[styles.caption, { color: colors.textSecondary }]}>{session.user.ngoName}</Text>
          )}
        </View>
        <SampleDataBadge source={query.source ?? undefined} />
        <Pressable
          onPress={() => router.push('/contributor/add-resource')}
          style={[styles.addButton, { backgroundColor: colors.actionPrimary }]}
          accessibilityRole="button"
          accessibilityLabel="Add resource">
          <Feather name="plus" size={18} color={colors.onActionPrimary} />
        </Pressable>
      </View>

      <StateView
        state={query.state}
        error={query.error}
        onRetry={query.refresh}
        emptyTitle="No resources yet"
        emptyDescription="Add a boat, food stock or equipment you can lend. You will confirm it regularly."
        receivedAt={query.receivedAt}>
        <ScrollView
          contentContainerStyle={styles.content}
          refreshControl={<RefreshControl refreshing={query.refreshing} onRefresh={query.refresh} />}>
          {dueTimes.length > 0 && <CheckInDueBanner dueAt={dueTimes[0]} count={needsAction} />}
          {IS_MOCK_API && (
            <Text style={[styles.caption, { color: colors.textTertiary }]}>
              Check-in reminders are Simulated. Push delivery is not set up yet.
            </Text>
          )}
          {(instructions.data ?? []).length > 0 && (
            <>
              <Text style={[styles.overline, { color: colors.textTertiary }]}>
                {t('resources.assignments')}
                {instructions.source === 'sample' ? ' · SIMULATED' : ''}
              </Text>
              {(instructions.data ?? []).map((ins) => (
                <View key={ins.id} style={[styles.card, { backgroundColor: colors.surface }]}>
                  <Text style={[styles.body, styles.bold, { color: colors.textPrimary }]}>{ins.resourceLabel}</Text>
                  <AssignmentSummary where={ins.where} what={ins.what} deadline={ins.deadline} ngoName={ins.ngoName} />
                  <LocationBlock place={ins.where} compact />
                  <Text style={[styles.caption, { color: colors.textTertiary }]}>
                    Plan v{ins.planVersion} · issued {formatTime(ins.issuedAt)}
                  </Text>
                </View>
              ))}
              <Text style={[styles.overline, { color: colors.textTertiary }]}>{t('resources.list')}</Text>
            </>
          )}
          {resources.map(renderResource)}
        </ScrollView>
      </StateView>
      <ContributorTabBar activeTab="resources" />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  flex: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.screenPadding,
    paddingTop: spacing.md,
    paddingBottom: spacing.sm,
  },
  title: { ...typography.title, fontSize: 20 },
  addButton: {
    width: touchTargets.min,
    height: touchTargets.min,
    borderRadius: touchTargets.min / 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: { paddingHorizontal: spacing.screenPadding, paddingBottom: spacing.xxl, gap: spacing.sm },
  card: { borderRadius: radii.card, padding: spacing.cardPadding, gap: spacing.xs },
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, flexWrap: 'wrap' },
  button: {
    minHeight: touchTargets.min,
    borderRadius: radii.button,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: spacing.xs,
  },
  buttonText: { ...typography.bodyMedium, fontWeight: '700', fontSize: 14 },
  overline: { ...typography.overline, fontSize: 11, fontWeight: '700', letterSpacing: 0.5, marginTop: spacing.xs },
  body: { ...typography.body, fontSize: 14, lineHeight: 20 },
  bold: { fontWeight: '600' },
  caption: { ...typography.caption, fontSize: 12, lineHeight: 17 },
});
