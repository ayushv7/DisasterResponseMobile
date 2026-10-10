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
import { typography } from '@/theme/typography';
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

              {/* 4. Counts by state */}
              <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Work by state</Text>
        {/* 3. Operational State Ribbon */}
        {stats && (
          <View style={[styles.readinessRibbon, { backgroundColor: colors.surface }]}>
            <View style={styles.readinessItem}>
                <Text style={[styles.readinessCount, typography.tabular, { color: colors.textPrimary }]}>
                  {stats.activeIncidents}
                </Text>
                <Text style={[styles.readinessLabel, { color: colors.textTertiary }]}>
                  Incidents
                </Text>
            </View>

            <View style={[styles.ribbonDivider, { backgroundColor: colors.divider }]} />

            <View style={styles.readinessItem}>
                <Text style={[styles.readinessCount, typography.tabular, { color: colors.statusActive }]}>
                  {stats.immediateInterventions}
                </Text>
                <Text style={[styles.readinessLabel, { color: colors.textTertiary }]}>
                  Immediate
                </Text>
            </View>

            <View style={[styles.ribbonDivider, { backgroundColor: colors.divider }]} />

            <View style={styles.readinessItem}>
                <Text style={[styles.readinessCount, typography.tabular, { color: colors.statusWatch }]}>
                  {stats.pendingAcknowledgement}
                </Text>
                <Text style={[styles.readinessLabel, { color: colors.textTertiary }]}>
                  Pending Ack
                </Text>
            </View>

            <View style={[styles.ribbonDivider, { backgroundColor: colors.divider }]} />

            <View style={styles.readinessItem}>
                <Text style={[styles.readinessCount, typography.tabular, { color: colors.brandTeal }]}>
                  {stats.inProgressTasks}
                </Text>
                <Text style={[styles.readinessLabel, { color: colors.textTertiary }]}>
                  In Field
                </Text>
            </View>

            <View style={[styles.ribbonDivider, { backgroundColor: colors.divider }]} />

            <View style={styles.readinessItem}>
                <Text style={[styles.readinessCount, typography.tabular, { color: colors.statusActive }]}>
                  {stats.blockedOrFailedInterventions}
                </Text>
                <Text style={[styles.readinessLabel, { color: colors.textTertiary }]}>
                  Blocked
                </Text>
            </View>
          </View>
        )}


              {/* 5. Full list, collapsed by default */}
              <Pressable
                onPress={() => setShowAllWork((v) => !v)}
                style={styles.disclosureRow}
                accessibilityRole="button"
                accessibilityState={{ expanded: showAllWork }}>
                <Text style={[styles.sectionTitle, styles.disclosureTitle, { color: colors.textPrimary }]}>
                  All work orders ({interventions.length})
                </Text>
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
    fontSize: 12,
  },
  sectionTitle: {
    ...typography.bodyMedium,
    fontSize: 15,
    fontWeight: '700',
    paddingHorizontal: spacing.screenPadding,
    marginTop: spacing.lg,
    marginBottom: spacing.sm,
  },
  sectionNote: {
    ...typography.body,
    fontSize: 15,
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
    fontSize: 15,
    flex: 1,
  },
  disclosureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    minHeight: touchTargets.min,
    paddingRight: spacing.screenPadding,
  },
  disclosureTitle: {
    marginTop: 0,
    marginBottom: 0,
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
    gap: 2,
    flex: 1,
  },
  headerOverline: {
    ...typography.overline,
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 0.8,
  },
  headerTitle: {
    ...typography.title,
    fontSize: 22,
    lineHeight: 28,
    flexShrink: 1,
  },
  roleChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: spacing.sm + 2,
    paddingVertical: spacing.xs + 2,
    borderRadius: radii.chip,
  },
  roleChipText: {
    ...typography.caption,
    fontSize: 12,
    fontWeight: '600',
  },
  readinessRibbon: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginHorizontal: spacing.screenPadding,
    marginTop: spacing.xs,
    marginBottom: spacing.sm,
    paddingVertical: spacing.sm + 2,
    paddingHorizontal: spacing.md,
    borderRadius: radii.card,
  },
  readinessItem: {
    alignItems: 'center',
    flex: 1,
    gap: 2,
  },
  readinessCount: {
    ...typography.caption,
    fontSize: 15,
    fontWeight: '800',
  },
  readinessLabel: {
    ...typography.caption,
    fontSize: 12,
    fontWeight: '500',
  },
  ribbonDivider: {
    width: 1,
    height: 24,
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
    paddingVertical: spacing.xs + 2,
    borderRadius: radii.chip,
  },
  filterChipText: {
    ...typography.caption,
    fontSize: 12,
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
    gap: 6,
  },
  cardTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  priorityGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  priorityDot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
  },
  priorityText: {
    ...typography.caption,
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.4,
  },
  statusPill: {
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: radii.xs,
  },
  statusPillText: {
    ...typography.overline,
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  targetLocality: {
    ...typography.bodyMedium,
    fontSize: 15,
    fontWeight: '700',
    marginTop: 2,
  },
  incidentSubtitle: {
    ...typography.caption,
    fontSize: 12,
  },
  instructionsText: {
    ...typography.body,
    fontSize: 12,
    lineHeight: 18,
  },
  blockerBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    padding: spacing.sm,
    borderRadius: radii.xs,
    marginTop: 2,
  },
  blockerText: {
    ...typography.caption,
    fontSize: 12,
    fontWeight: '600',
    flex: 1,
    lineHeight: 16,
  },
  assignmentRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radii.sm,
    marginTop: 4,
  },
  assignmentInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flex: 1,
  },
  assignmentText: {
    ...typography.caption,
    fontSize: 12,
    fontWeight: '600',
  },
  deadlineCountdown: {
    ...typography.caption,
    fontSize: 12,
    fontWeight: '700',
  },
});
