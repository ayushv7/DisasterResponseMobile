/**
 * OperationsHomeScreen — Coordinator Operations Queue
 *
 * Screen A: Core operational response console:
 * - Prioritized incident & intervention queue
 * - Critical incidents and outstanding interventions
 * - Tasks awaiting assignment, acknowledgement, execution, or verification
 * - Failed / overdue work requiring attention
 * - Live operational readiness state
 */

import React, { useCallback, useRef, useState } from 'react';
import {
  FlatList,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { router, useFocusEffect } from 'expo-router';

import { ActionQueueCard } from '@/components/ActionQueueCard';
import { InfoBar } from '@/components/InfoBar';
import { NgoScopeNote, ResourcePlanLink } from '@/components/NgoScopeNote';
import { OpsBottomNavBar } from '@/components/OpsBottomNavBar';
import { StateView } from '@/components/StateView';
import { useApiQuery } from '@/hooks/use-api-query';
import { useConfirmExitAtRoot } from '@/hooks/use-confirm-exit-at-root';
import { api } from '@/services/api';
import { useTheme } from '@/theme';
import { radii, spacing, touchTargets } from '@/theme/spacing';
import { textScale, typography } from '@/theme/typography';
import {
  ActionQueueItem,
  InterventionPriority,
  InterventionStatus,
  OperationalOverviewStats,
} from '@/types/operations';

type QueueFilter = 'ALL' | 'IMMEDIATE' | 'AWAITING_ASSIGNMENT' | 'AWAITING_ACK' | 'FAILED_OR_BLOCKED';

export default function OperationsHomeScreen() {
  const { colors } = useTheme();
  useConfirmExitAtRoot();

  const [activeFilter, setActiveFilter] = useState<QueueFilter>('ALL');
  const [showAllWork, setShowAllWork] = useState(false);

  const query = useApiQuery(
    async () => {
      const [summary, queue, orders, incidents] = await Promise.all([
        api.getOpsSummary(),
        api.getActionQueue(),
        api.getWorkOrders(),
        api.getIncidents(),
      ]);
      return {
        data: {
          stats: summary.data,
          queue: queue.data,
          orders: orders.data,
          criticalIncidents: incidents.data.filter(
            (i) => i.severity === 'CRITICAL' && i.status !== 'RESOLVED'
          ),
        },
        source: summary.source,
        receivedAt: summary.receivedAt,
      };
    },
    [],
    () => false
  );

  // Reload when coming back from the incident workspace or replanning.
  const hasFocusedOnce = useRef(false);
  const { refresh } = query;
  useFocusEffect(
    useCallback(() => {
      if (hasFocusedOnce.current) refresh();
      hasFocusedOnce.current = true;
    }, [refresh])
  );

  const stats: OperationalOverviewStats | null = query.data?.stats ?? null;
  const interventions = query.data?.orders ?? [];
  const actionQueue = query.data?.queue ?? [];
  const criticalIncidents = query.data?.criticalIncidents ?? [];
  const refreshing = query.refreshing;
  const onRefresh = query.refresh;

  const openQueueItem = (item: ActionQueueItem) => {
    if (item.reason === 'FAILED' || item.reason === 'BLOCKED' || item.reason === 'NEEDS_VERIFICATION') {
      router.navigate('/ops/replanning');
    } else {
      router.push({ pathname: '/ops/incident/[id]', params: { id: item.incidentId } });
    }
  };

  const filteredItems = interventions.filter((item) => {
    if (activeFilter === 'IMMEDIATE') return item.priority === 'IMMEDIATE';
    if (activeFilter === 'AWAITING_ASSIGNMENT') return item.status === 'AWAITING_ASSIGNMENT';
    if (activeFilter === 'AWAITING_ACK') return item.status === 'AWAITING_ACK';
    if (activeFilter === 'FAILED_OR_BLOCKED')
      return item.status === 'BLOCKED' || item.status === 'FAILED';
    return true;
  });

  const getStatusBadge = (status: InterventionStatus) => {
    switch (status) {
      case 'AWAITING_ASSIGNMENT':
        return { label: 'UNASSIGNED', color: colors.statusActive, bg: colors.statusActiveBg };
      case 'AWAITING_ACK':
        return { label: 'PENDING ACK', color: colors.statusWatch, bg: colors.statusWatchBg };
      case 'BLOCKED':
        return { label: 'CORRIDOR BLOCKED', color: colors.statusActive, bg: colors.statusActiveBg };
      case 'FAILED':
        return { label: 'FAILED / RETRY', color: colors.statusActive, bg: colors.statusActiveBg };
      case 'IN_PROGRESS':
      case 'EN_ROUTE':
        return { label: 'ACTIVE WORK', color: colors.brandTeal, bg: colors.brandTealBg };
      case 'AWAITING_VERIFICATION':
        return { label: 'NEEDS SIGN-OFF', color: colors.brandPrimary, bg: colors.surfaceMuted };
      case 'VERIFIED_RESOLVED':
        return { label: 'RESOLVED', color: colors.statusResolved, bg: colors.statusResolvedBg };
    }
  };

  const getPriorityColor = (priority: InterventionPriority) => {
    if (priority === 'IMMEDIATE') return colors.statusActive;
    if (priority === 'HIGH') return colors.statusWatch;
    return colors.textSecondary;
  };

  return (
    <SafeAreaView
      edges={['top', 'left', 'right']}
      style={[styles.safeArea, { backgroundColor: colors.background }]}>
      {/* 1. Header: title + when the data was loaded */}
      <View style={styles.header}>
        <Text numberOfLines={1} style={[styles.headerTitle, { color: colors.textPrimary }]}>Operations</Text>
        {query.receivedAt && (
          <Text style={[styles.updatedText, typography.tabular, { color: colors.textTertiary }]}>
            Loaded{' '}
            {new Date(query.receivedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </Text>
        )}
      </View>
      <InfoBar isSampleData={true} persistent={true} />
      <NgoScopeNote />
      <ResourcePlanLink />

      <StateView
        state={query.state}
        error={query.error}
        onRetry={onRefresh}
        receivedAt={query.receivedAt}>
        <FlatList
          data={showAllWork ? filteredItems : []}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={colors.actionPrimary}
              colors={[colors.actionPrimary]}
            />
          }
          ListHeaderComponent={
            <>
              {/* 2. What needs me now */}
              <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>
                Needs action now{actionQueue.length > 0 ? ` (${actionQueue.length})` : ''}
              </Text>
              {actionQueue.length === 0 ? (
                <Text style={[styles.sectionNote, { color: colors.textSecondary }]}>
                  Nothing needs your action right now.
                </Text>
              ) : (
                actionQueue.map((item, index) => (
                  <ActionQueueCard
                    key={`${item.workOrderId}-${item.reason}`}
                    item={item}
                    isTop={index === 0}
                    onAction={() => openQueueItem(item)}
                  />
                ))
              )}

              {/* 3. Critical incidents (one line) */}
              {criticalIncidents.length > 0 && (
                <Pressable
                  onPress={() => router.navigate('/ops/incidents')}
                  style={[styles.linkRow, { backgroundColor: colors.surface }]}
                  android_ripple={{ color: colors.surfaceMuted }}
                  accessibilityRole="button">
                  <View style={[styles.priorityDot, { backgroundColor: colors.statusActive }]} />
                  <Text style={[styles.linkRowText, { color: colors.textPrimary }]} numberOfLines={1}>
                    {criticalIncidents.length} critical{' '}
                    {criticalIncidents.length === 1 ? 'incident' : 'incidents'}:{' '}
                    {criticalIncidents.map((i) => i.location).join(', ')}
                  </Text>
                  <Feather name="chevron-right" size={18} color={colors.textTertiary} />
                </Pressable>
              )}

              {/* 5. Full list, collapsed by default */}
              <Pressable
                onPress={() => setShowAllWork((v) => !v)}
                style={styles.disclosureRow}
                accessibilityRole="button"
                accessibilityState={{ expanded: showAllWork }}>
                <View style={styles.disclosureText}>
                  <Text style={[styles.sectionTitle, styles.disclosureTitle, { color: colors.textPrimary }]}>
                    All work orders ({interventions.length})
                  </Text>
                  {/* One-line counts summary (replaces the separate counts ribbon) */}
                  {stats && (
                    <Text style={[styles.summaryLine, { color: colors.textSecondary }]} numberOfLines={2}>
                      {stats.activeIncidents} incidents · {stats.immediateInterventions} immediate ·{' '}
                      {stats.pendingAcknowledgement} awaiting ack · {stats.inProgressTasks} in field ·{' '}
                      {stats.blockedOrFailedInterventions} blocked
                    </Text>
                  )}
                </View>
                <Feather
                  name={showAllWork ? 'chevron-up' : 'chevron-down'}
                  size={18}
                  color={colors.textSecondary}
                />
              </Pressable>
              {showAllWork && (
          <View style={styles.filterRow}>
            {(
              [
                    { key: 'ALL', label: 'All Tasks' },
                    { key: 'IMMEDIATE', label: 'Immediate' },
                    { key: 'AWAITING_ASSIGNMENT', label: 'Unassigned' },
                    { key: 'AWAITING_ACK', label: 'Awaiting Ack' },
                    { key: 'FAILED_OR_BLOCKED', label: 'Blocked / Failed' },
              ] as { key: QueueFilter; label: string }[]
            ).map((f) => {
              const isSelected = activeFilter === f.key;
              return (
                    <Pressable
                      accessibilityRole="button"
                      accessibilityState={{ selected: isSelected }}
                      key={f.key}
                      onPress={() => setActiveFilter(f.key)}
                      style={[
                        styles.filterChip,
                        {
                              backgroundColor: isSelected
                                ? colors.surfaceMuted
                                : colors.surface,
                        },
                      ]}>
                      <Text
                        style={[
                              styles.filterChipText,
                              {
                                color: isSelected ? colors.textPrimary : colors.textTertiary,
                                fontWeight: isSelected ? '700' : '500',
                              },
                        ]}>
                        {f.label}
                      </Text>
                    </Pressable>
              );
            })}
          </View>

              )}
            </>
          }
          ListEmptyComponent={
            showAllWork ? (
              <Text style={[styles.sectionNote, { color: colors.textSecondary }]}>
                No work orders match this filter.
              </Text>
            ) : null
          }
          renderItem={({ item }) => {
            const badge = getStatusBadge(item.status);
            const isBlockedOrFailed =
              item.status === 'BLOCKED' || item.status === 'FAILED';

            return (
              <Pressable
                onPress={() =>
                  router.push({
                    pathname: '/ops/incident/[id]',
                    params: { id: item.incidentId },
                  })
                }
                style={[
                  styles.interventionCard,
                  {
                    backgroundColor: colors.surface,
                  },
                ]}
                accessibilityRole="button"
                accessibilityLabel={`Intervention ${item.type} in ${item.targetLocality}. Status: ${badge.label}`}>
                {/* Header: Priority + Category Tag + Status Badge */}
                <View style={styles.cardTopRow}>
                  <View style={styles.priorityGroup}>
                    <View
                      style={[
                        styles.priorityDot,
                        { backgroundColor: getPriorityColor(item.priority) },
                      ]}
                    />
                    <Text
                      style={[
                        styles.priorityText,
                        { color: getPriorityColor(item.priority) },
                      ]}>
                      {item.priority} · {item.type.replace(/_/g, ' ')}
                    </Text>
                  </View>

                  <View
                    style={[
                      styles.statusPill,
                      { backgroundColor: badge.bg },
                    ]}>
                    <Text
                      style={[
                        styles.statusPillText,
                        { color: badge.color },
                      ]}>
                      {badge.label}
                    </Text>
                  </View>
                </View>

                {/* Target Locality & Incident Name */}
                <Text
                  style={[styles.targetLocality, { color: colors.textPrimary }]}>
                  {item.targetLocality}
                </Text>
                <Text
                  style={[styles.incidentSubtitle, { color: colors.textTertiary }]}
                  numberOfLines={1}>
                  Linked: {item.incidentTitle}
                </Text>

                {/* Specific Instructions */}
                <Text
                  style={[styles.instructionsText, { color: colors.textSecondary }]}
                  numberOfLines={2}>
                  {item.instructions}
                </Text>

                {/* Blocker Callout if present */}
                {isBlockedOrFailed && item.blockerReport && (
                  <View
                    style={[
                      styles.blockerBanner,
                      { backgroundColor: colors.statusActiveBg },
                    ]}>
                    <Feather
                      name="alert-octagon"
                      size={14}
                      color={colors.statusActive}
                    />
                    <Text
                      style={[
                        styles.blockerText,
                        { color: colors.statusActive },
                      ]}
                      numberOfLines={2}>
                      Alert: {item.blockerReport.reason}
                    </Text>
                  </View>
                )}

                {/* Assigned Resource or Missing Action */}
                <View
                  style={[
                    styles.assignmentRow,
                    { backgroundColor: colors.surfaceMuted },
                  ]}>
                  <View style={styles.assignmentInfo}>
                    <Feather
                      name={item.assignedTeamName ? 'user-check' : 'alert-circle'}
                      size={13}
                      color={
                        item.assignedTeamName
                          ? colors.brandTeal
                          : colors.statusActive
                      }
                    />
                    <Text
                      style={[
                        styles.assignmentText,
                        {
                          color: item.assignedTeamName
                            ? colors.textPrimary
                            : colors.statusActive,
                        },
                      ]}
                      numberOfLines={1}>
                      {item.assignedTeamName
                        ? `Crew: ${item.assignedTeamName}`
                        : 'Awaiting Crew / Equipment Allocation'}
                    </Text>
                  </View>

                  {item.deadlineMinutes && item.status === 'AWAITING_ACK' ? (
                    <Text
                      style={[
                        styles.deadlineCountdown,
                        typography.tabular,
                        { color: colors.statusWatch },
                      ]}>
                      Deadline: {item.deadlineMinutes}m
                    </Text>
                  ) : (
                    <Feather
                      name="chevron-right"
                      size={14}
                      color={colors.textTertiary}
                    />
                  )}
                </View>
              </Pressable>
            );
          }}
        />
      </StateView>

      {/* 6. Coordinator Operational Bottom Navigation */}
      <OpsBottomNavBar activeTab="operations" />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  updatedText: {
    ...typography.caption,
    ...textScale.caption,
  },
  sectionTitle: {
    ...typography.bodyMedium,
    ...textScale.subtitle,
    fontWeight: '700',
    paddingHorizontal: spacing.screenPadding,
    marginTop: spacing.lg,
    marginBottom: spacing.sm,
  },
  sectionNote: {
    ...typography.body,
    ...textScale.body,
    paddingHorizontal: spacing.screenPadding,
    marginBottom: spacing.sm,
  },
  linkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    minHeight: touchTargets.min,
    borderRadius: radii.card,
    paddingHorizontal: spacing.cardPadding,
    marginHorizontal: spacing.screenPadding,
    marginTop: spacing.sm,
  },
  linkRowText: {
    ...typography.body,
    ...textScale.body,
    flex: 1,
  },
  disclosureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    minHeight: touchTargets.min,
    paddingVertical: spacing.sm,
    paddingRight: spacing.screenPadding,
    marginTop: spacing.sm,
  },
  disclosureText: {
    flex: 1,
    paddingLeft: spacing.screenPadding,
    gap: spacing.xxs,
  },
  summaryLine: {
    ...typography.caption,
    ...textScale.caption,
  },
  disclosureTitle: {
    marginTop: 0,
    marginBottom: 0,
    paddingHorizontal: 0,
  },
  safeArea: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.screenPadding,
    paddingTop: spacing.md,
    paddingBottom: spacing.sm,
  },
  headerTitleWrap: {
    gap: spacing.xxs,
    flex: 1,
  },
  headerOverline: {
    ...typography.overline,
    ...textScale.caption,
    fontWeight: '800',
    letterSpacing: 0.8,
  },
  headerTitle: {
    ...typography.title,
    ...textScale.title,
    flexShrink: 1,
  },
  roleChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radii.chip,
  },
  roleChipText: {
    ...typography.caption,
    ...textScale.caption,
    fontWeight: '600',
  },
  filterRow: {
    flexDirection: 'row',
    paddingHorizontal: spacing.screenPadding,
    gap: spacing.xs,
    marginBottom: spacing.sm,
    flexWrap: 'wrap',
  },
  filterChip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radii.chip,
  },
  filterChipText: {
    ...typography.caption,
    ...textScale.caption,
  },
  skeletonWrap: {
    paddingHorizontal: spacing.screenPadding,
    gap: spacing.sm,
  },
  listContent: {
    paddingHorizontal: spacing.screenPadding,
    paddingBottom: spacing.xxl,
    gap: spacing.sm,
  },
  interventionCard: {
    borderRadius: radii.card,
    padding: spacing.cardPadding,
    gap: spacing.sm,
  },
  cardTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  priorityGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  priorityDot: {
    width: spacing.sm,
    height: spacing.sm,
    borderRadius: radii.xs,
  },
  priorityText: {
    ...typography.caption,
    ...textScale.caption,
    fontWeight: '700',
    letterSpacing: 0.4,
  },
  statusPill: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: radii.xs,
  },
  statusPillText: {
    ...typography.overline,
    ...textScale.caption,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  targetLocality: {
    ...typography.bodyMedium,
    ...textScale.body,
    fontWeight: '700',
    marginTop: spacing.xxs,
  },
  incidentSubtitle: {
    ...typography.caption,
    ...textScale.caption,
  },
  instructionsText: {
    ...typography.body,
    ...textScale.caption,
  },
  blockerBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    padding: spacing.sm,
    borderRadius: radii.xs,
    marginTop: spacing.xxs,
  },
  blockerText: {
    ...typography.caption,
    ...textScale.caption,
    fontWeight: '600',
    flex: 1,
  },
  assignmentRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radii.sm,
    marginTop: spacing.xs,
  },
  assignmentInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    flex: 1,
  },
  assignmentText: {
    ...typography.caption,
    ...textScale.caption,
    fontWeight: '600',
  },
  deadlineCountdown: {
    ...typography.caption,
    ...textScale.caption,
    fontWeight: '700',
  },
});
