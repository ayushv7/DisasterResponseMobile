/**
 * FieldWorkerTasksScreen — Field Responder Work Orders Console
 *
 * Screen C: Operational execution workflow for field workers & crew leads:
 * - Assigned work orders & dispatch instructions
 * - Accept / Acknowledge task assignment
 * - Start field work
 * - Report operational problems (e.g. equipment failure, submerged route)
 * - Submit verified completion evidence
 */

import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Modal,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';

import { EmptyState } from '@/components/EmptyState';
import { ErrorState } from '@/components/ErrorState';
import { AssignmentSummary } from '@/components/AssignmentSummary';
import { LocationBlock } from '@/components/LocationBlock';
import { InfoBar } from '@/components/InfoBar';
import { OfflineNotice } from '@/components/StateView';
import { TaskHistory } from '@/components/TaskHistory';
import { VerificationStatus } from '@/components/VerificationStatus';
import { OpsBottomNavBar } from '@/components/OpsBottomNavBar';
import { SkeletonCard } from '@/components/SkeletonCard';
import { EvidencePhotoPicker } from '@/components/EvidencePhotoPicker';
import { ChipTone, StatusChip } from '@/components/StatusChip';
import { api, ApiResult } from '@/services/api';
import { useConfirmExitAtRoot } from '@/hooks/use-confirm-exit-at-root';
import { useSession } from '@/session/session-context';
import { useTheme } from '@/theme';
import { radii, spacing, touchTargets } from '@/theme/spacing';
import { textScale, typography } from '@/theme/typography';
import { InterventionRecord, InterventionStatus, ReplanningReason } from '@/types/operations';

type TaskFilter = 'ALL' | 'ASSIGNED' | 'ACTIVE' | 'BLOCKED';

const STATE_CHIPS: Record<InterventionStatus, { label: string; tone: ChipTone }> = {
  AWAITING_ASSIGNMENT: { label: 'Unassigned', tone: 'neutral' },
  AWAITING_ACK: { label: 'Needs acknowledgement', tone: 'warning' },
  EN_ROUTE: { label: 'Acknowledged', tone: 'info' },
  IN_PROGRESS: { label: 'In progress', tone: 'info' },
  BLOCKED: { label: 'Blocked', tone: 'critical' },
  FAILED: { label: 'Failed', tone: 'critical' },
  AWAITING_VERIFICATION: { label: 'Awaiting sign-off', tone: 'neutral' },
  VERIFIED_RESOLVED: { label: 'Verified', tone: 'success' },
};

/** Tasks needing the worker's action first. */
const ORDER: Record<InterventionStatus, number> = {
  AWAITING_ACK: 0,
  EN_ROUTE: 1,
  IN_PROGRESS: 2,
  BLOCKED: 3,
  FAILED: 4,
  AWAITING_VERIFICATION: 5,
  AWAITING_ASSIGNMENT: 6,
  VERIFIED_RESOLVED: 7,
};

const PROBLEM_KINDS: { key: ReplanningReason; label: string }[] = [
  { key: 'ROUTE_BLOCKED', label: 'Route blocked' },
  { key: 'EQUIPMENT_FAILURE', label: 'Equipment failure' },
  { key: 'INTERVENTION_UNSUCCESSFUL', label: 'Work failed' },
];

export default function FieldWorkerTasksScreen() {
  const { colors } = useTheme();
  const { role, session } = useSession();
  useConfirmExitAtRoot();

  const [tasks, setTasks] = useState<InterventionRecord[]>([]);
  const [filter, setFilter] = useState<TaskFilter>('ALL');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  /** Last successful load; earlier tasks stay visible if a refresh fails. */
  const [lastLoadedAt, setLastLoadedAt] = useState<string | null>(null);

  // Modals state
  const [blockerTarget, setBlockerTarget] = useState<InterventionRecord | null>(null);
  const [blockerReason, setBlockerReason] = useState('');
  const [isCriticalBlocker, setIsCriticalBlocker] = useState(true);
  const [submittingBlocker, setSubmittingBlocker] = useState(false);

  const [completeTarget, setCompleteTarget] = useState<InterventionRecord | null>(null);
  const [completionEvidence, setCompletionEvidence] = useState('');
  const [completionPhotos, setCompletionPhotos] = useState<string[]>([]);
  const [problemKind, setProblemKind] = useState<ReplanningReason>('ROUTE_BLOCKED');
  // Short confirmation shown after each action
  const [feedback, setFeedback] = useState<string | null>(null);
  const [busyTaskId, setBusyTaskId] = useState<string | null>(null);
  const [expandedIds, setExpandedIds] = useState<string[]>([]);
  const toggleExpanded = (id: string) =>
    setExpandedIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  const [submittingComplete, setSubmittingComplete] = useState(false);

  const loadData = useCallback(async (isRefresh = false) => {
    try {
      if (isRefresh) {
        setRefreshing(true);
        setErrorMsg(null);
      }
      // Field workers get only their own tasks; coordinators see every dispatched order
      const all = (role === 'field_worker' ? await api.getMyTasks() : await api.getWorkOrders()).data;
      // Filter to tasks that have been assigned or are actionable
      const fieldTasks = all.filter(
        (i) => i.status !== 'AWAITING_ASSIGNMENT'
      );
      setTasks(fieldTasks);
      setLastLoadedAt(new Date().toISOString());
    } catch (err: any) {
      setErrorMsg(err?.message || 'Failed to load field tasks.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [role]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadData();
  }, [loadData]);

  const onRefresh = () => {
    loadData(true);
  };

  const showFeedback = (result: ApiResult<InterventionRecord>, message: string) => {
    setTasks((prev) => prev.map((t) => (t.id === result.data.id ? result.data : t)));
    setFeedback(result.source === 'sample' ? `Simulated: ${message}` : message);
    setTimeout(() => setFeedback(null), 4000);
    // Re-read from the service so plan/verification changes show up too
    loadData();
  };

  const filteredTasks = [...tasks].sort((a, b) => ORDER[a.status] - ORDER[b.status]).filter((t) => {
    if (filter === 'ASSIGNED') return t.status === 'AWAITING_ACK';
    if (filter === 'ACTIVE') return t.status === 'IN_PROGRESS' || t.status === 'EN_ROUTE';
    if (filter === 'BLOCKED') return t.status === 'BLOCKED' || t.status === 'FAILED';
    return true;
  });

  /** The first actionable card in the sorted list; only it gets a filled button. */
  const urgentTaskId = filteredTasks.find((t) =>
    ['AWAITING_ACK', 'EN_ROUTE', 'IN_PROGRESS'].includes(t.status)
  )?.id;

  const handleAcknowledge = async (item: InterventionRecord) => {
    try {
      setBusyTaskId(item.id);
      showFeedback(await api.acknowledge(item.id), `acknowledged ${item.id}.`);
    } catch (err: any) {
      Alert.alert('Could not acknowledge', err?.message || 'Try again.');
    } finally {
      setBusyTaskId(null);
    }
  };

  const handleStartWork = async (item: InterventionRecord) => {
    try {
      setBusyTaskId(item.id);
      showFeedback(await api.start(item.id), `work started on ${item.id}.`);
    } catch (err: any) {
      Alert.alert('Could not start', err?.message || 'Try again.');
    } finally {
      setBusyTaskId(null);
    }
  };

  const handleReportBlockerSubmit = async () => {
    if (!blockerTarget || !blockerReason.trim()) {
      Alert.alert('Describe the problem', 'Add a short description so the coordinator can replan.');
      return;
    }
    try {
      setSubmittingBlocker(true);
      const result = await api.reportProblem(
        blockerTarget.id,
        blockerReason.trim(),
        isCriticalBlocker,
        problemKind
      );
      setBlockerTarget(null);
      setBlockerReason('');
      showFeedback(result, `problem reported on ${blockerTarget.id}. Coordinator will replan.`);
    } catch (err: any) {
      Alert.alert('Could not report problem', err?.message || 'Try again.');
    } finally {
      setSubmittingBlocker(false);
    }
  };

  const handleCompleteSubmit = async () => {
    if (!completeTarget) return;
    if (!completionEvidence.trim() && completionPhotos.length === 0) {
      Alert.alert('Add evidence', 'Add a note or at least one photo of the completed work.');
      return;
    }
    try {
      setSubmittingComplete(true);
      const result = await api.submitCompletion(completeTarget.id, {
        note: completionEvidence.trim(),
        photoUris: completionPhotos,
      });
      setCompleteTarget(null);
      setCompletionEvidence('');
      setCompletionPhotos([]);
      showFeedback(result, `completion sent for sign-off on ${completeTarget.id}.`);
    } catch (err: any) {
      Alert.alert('Could not submit', err?.message || 'Your evidence is kept. Try again.');
    } finally {
      setSubmittingComplete(false);
    }
  };

  return (
    <SafeAreaView
      edges={['top', 'left', 'right']}
      style={[styles.safeArea, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={styles.header}>
        <Text numberOfLines={1} style={[styles.headerTitle, { color: colors.textPrimary }]}>Tasks</Text>
        {role === 'field_worker' && session?.user && (
          <Text style={[styles.crewText, { color: colors.textSecondary }]}>
            {session.user.name}
            {session.user.ngoName ? ` · ${session.user.ngoName}` : ''}
          </Text>
        )}
      </View>

      {/* Simulation Banner */}
      <InfoBar
        isSampleData={true}
        persistent={true}
        customMessage="SAMPLE DATA — OPERATIONAL SIMULATION — NOT LIVE OPERATIONS"
      />

      {/* Feedback after each action */}
      {feedback && (
        <View
          style={[styles.feedbackStrip, { backgroundColor: colors.surfaceMuted }]}
          accessibilityLiveRegion="polite">
          <Feather name="check" size={16} color={colors.actionPrimary} />
          <Text style={[styles.feedbackText, { color: colors.textPrimary }]}>{feedback}</Text>
        </View>
      )}

      {/* Filter Chips */}
      <View style={styles.filterRow}>
        {(
          [
            { key: 'ALL', label: 'All Orders' },
            { key: 'ASSIGNED', label: 'Needs Ack' },
            { key: 'ACTIVE', label: 'In Progress' },
            { key: 'BLOCKED', label: 'Blocked / Failed' },
          ] as { key: TaskFilter; label: string }[]
        ).map((f) => {
          const isSelected = filter === f.key;
          return (
            <Pressable
              key={f.key}
              onPress={() => setFilter(f.key)}
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

      {/* Main List */}
      {loading && !refreshing ? (
        <View style={styles.skeletonWrap}>
          <SkeletonCard />
          <SkeletonCard />
        </View>
      ) : errorMsg && !lastLoadedAt ? (
        <ErrorState message={errorMsg} onRetry={() => loadData()} />
      ) : filteredTasks.length === 0 ? (
        <EmptyState
          title="No Field Tasks Found"
          description="There are currently no active work orders matching this filter."
          actionLabel="Refresh Tasks"
          onAction={() => loadData(true)}
        />
      ) : (
        <FlatList
          ListHeaderComponent={
            errorMsg ? <OfflineNotice receivedAt={lastLoadedAt} onRetry={() => loadData(true)} /> : null
          }
          data={filteredTasks}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={colors.brandTeal}
            />
          }
          renderItem={({ item }) => {
            const chip = STATE_CHIPS[item.status];
            const busy = busyTaskId === item.id;
            const expanded = expandedIds.includes(item.id);
            const isUrgent = item.id === urgentTaskId;

            return (
              <View
                style={[styles.taskCard, { backgroundColor: colors.surface }]}>
                {/* Header: Priority + Category Tag + Status Badge */}
                <View style={styles.cardHeader}>
                  <Text style={[styles.taskTypeTag, { color: colors.brandTeal }]}>
                    {item.type.replace(/_/g, ' ')}
                  </Text>
                  <StatusChip label={chip.label} tone={chip.tone} />
                </View>

                {/* Summary: where, what, by when, which NGO */}
                <AssignmentSummary
                  where={`${item.targetLocality} · ${item.incidentTitle}`}
                  what={item.instructions}
                  whatLines={2}
                  deadline={item.deadlineTimestamp}
                  ngoName={item.assignedNgoName ?? (role === 'field_worker' ? session?.user?.ngoName : undefined)}
                />
                <LocationBlock place={item.targetLocality} compact />
                {item.deadlineTimestamp && item.status === 'AWAITING_ACK' && (
                  <Text style={[styles.crewText, { color: colors.statusWatch }]}>
                    Acknowledge by{' '}
                    {new Date(item.deadlineTimestamp).toLocaleTimeString([], {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </Text>
                )}

                {/* Blocker details if blocked */}
                {item.blockerReport && (
                  <View style={[styles.blockerAlert, { backgroundColor: colors.statusActiveBg }]}>
                    <Feather name="alert-triangle" size={13} color={colors.statusActive} />
                    <Text style={[styles.blockerAlertText, { color: colors.statusActive }]}>
                      Hazard: {item.blockerReport.reason}
                    </Text>
                  </View>
                )}

                {/* One primary action per state; Report problem is secondary */}
                {(() => {
                  const primary =
                    item.status === 'AWAITING_ACK'
                      ? { label: 'Acknowledge', onPress: () => handleAcknowledge(item) }
                      : item.status === 'EN_ROUTE'
                        ? { label: 'Start work', onPress: () => handleStartWork(item) }
                        : item.status === 'IN_PROGRESS'
                          ? {
                              label: 'Submit completion',
                              onPress: () => {
                                setCompleteTarget(item);
                                setCompletionEvidence('');
                                setCompletionPhotos([]);
                              },
                            }
                          : null;
                  const canReport = item.status === 'EN_ROUTE' || item.status === 'IN_PROGRESS';
                  const waitingNote =
                    item.status === 'BLOCKED' || item.status === 'FAILED'
                      ? 'Waiting for the coordinator to replan.'
                      : item.status === 'AWAITING_VERIFICATION'
                        ? 'Waiting for coordinator sign-off.'
                        : null;
                  return (
                    <View style={styles.actionButtonsRow}>
                      {primary && (
                        <Pressable
                          onPress={primary.onPress}
                          disabled={busy}
                          style={({ pressed }) => [
                            styles.actionBtnPrimary,
                            {
                              // Only the most urgent card gets the filled button
                              backgroundColor: isUrgent
                                ? pressed
                                  ? colors.actionPrimaryPressed
                                  : colors.actionPrimary
                                : colors.surfaceMuted,
                            },
                          ]}
                          accessibilityRole="button"
                          accessibilityLabel={`${primary.label}: ${item.id}`}>
                          {busy ? (
                            <ActivityIndicator
                              size="small"
                              color={isUrgent ? colors.onActionPrimary : colors.textPrimary}
                            />
                          ) : (
                            <Text
                              style={[
                                styles.actionBtnPrimaryText,
                                { color: isUrgent ? colors.onActionPrimary : colors.textPrimary },
                              ]}>
                              {primary.label}
                            </Text>
                          )}
                        </Pressable>
                      )}
                      {canReport && (
                        <Pressable
                          onPress={() => {
                            setBlockerTarget(item);
                            setBlockerReason('');
                            setProblemKind('ROUTE_BLOCKED');
                          }}
                          disabled={busy}
                          style={styles.secondaryAction}
                          accessibilityRole="button"
                          accessibilityState={{ disabled: busy }}
                          accessibilityLabel={`Report a problem: ${item.id}`}>
                          <Text style={[styles.secondaryActionText, { color: colors.statusActive }]}>
                            Report problem
                          </Text>
                        </Pressable>
                      )}
                      {waitingNote && (
                        <Text style={[styles.crewText, { color: colors.textSecondary }]}>
                          {waitingNote}
                        </Text>
                      )}
                    </View>
                  );
                })()}

                {/* Details: progressive disclosure */}
                <Pressable
                  onPress={() => toggleExpanded(item.id)}
                  style={styles.moreRow}
                  accessibilityRole="button"
                  accessibilityState={{ expanded }}
                  accessibilityLabel={`${expanded ? 'Hide' : 'Show'} details for ${item.id}`}>
                  <Text style={[styles.crewText, { color: colors.textSecondary }]}>
                    {expanded ? 'Less' : 'More details'}
                  </Text>
                  <Feather name={expanded ? 'chevron-up' : 'chevron-down'} size={16} color={colors.textSecondary} />
                </Pressable>
                {expanded && (
                  <View style={styles.details}>
                    <View style={[styles.instructionBox, { backgroundColor: colors.surfaceMuted }]}>
                      <Text style={[styles.instructionLabel, { color: colors.textTertiary }]}>DISPATCH ORDERS</Text>
                      <Text style={[styles.instructionBody, { color: colors.textPrimary }]}>{item.instructions}</Text>
                    </View>
                    {item.assignedTeamName && (
                      <View style={styles.crewRow}>
                        <Feather name="users" size={13} color={colors.textTertiary} />
                        <Text style={[styles.crewText, { color: colors.textSecondary }]}>
                          Assigned: {item.assignedTeamName}
                          {item.assignedNgoName ? ` · ${item.assignedNgoName}` : ''}
                        </Text>
                      </View>
                    )}
                    {item.assignedWorkerName && (
                      <Text style={[styles.crewText, { color: colors.textSecondary }]}>
                        Worker: {item.assignedWorkerName}
                        {item.assignedWorkerIsVolunteer ? ' · Volunteer' : ''}
                      </Text>
                    )}
                    {item.requiredQualification && (
                      <Text style={[styles.crewText, { color: colors.textSecondary }]}>
                        Requires: {item.requiredQualification}
                      </Text>
                    )}
                    <VerificationStatus item={item} />
                    <TaskHistory history={item.history} />
                  </View>
                )}
              </View>
            );
          }}
        />
      )}

      {/* Blocker Reporting Modal */}
      <Modal
        visible={!!blockerTarget}
        transparent
        animationType="fade"
        onRequestClose={() => setBlockerTarget(null)}>
        <View style={[styles.modalOverlay, { backgroundColor: colors.scrim }]}>
          <View style={[styles.modalCard, { backgroundColor: colors.surface }]}>
            <View style={styles.modalHeader}>
              <Feather name="alert-octagon" size={20} color={colors.statusActive} />
              <Text style={[styles.modalTitle, { color: colors.textPrimary }]}>
                Report a problem
              </Text>
            </View>

            <Text style={[styles.modalDesc, { color: colors.textSecondary }]}>
              Task: {blockerTarget?.type.replace(/_/g, ' ')} at {blockerTarget?.targetLocality}
            </Text>

            <View style={styles.kindRow}>
              {PROBLEM_KINDS.map((k) => {
                const selected = problemKind === k.key;
                return (
                  <Pressable
                    key={k.key}
                    onPress={() => setProblemKind(k.key)}
                    style={[
                      styles.kindChip,
                      { backgroundColor: selected ? colors.chipActiveBg : colors.surfaceMuted },
                    ]}
                    accessibilityRole="radio"
                    accessibilityState={{ selected }}>
                    <Text
                      style={[
                        styles.kindChipText,
                        { color: selected ? colors.chipActiveText : colors.textPrimary },
                      ]}>
                      {k.label}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
            <TextInput
              style={[
                styles.modalTextInput,
                {
                  color: colors.textPrimary,
                  backgroundColor: colors.surfaceMuted,
                },
              ]}
              placeholder="What happened? e.g. causeway submerged, pump engine seized"
              placeholderTextColor={colors.textTertiary}
              multiline
              numberOfLines={4}
              value={blockerReason}
              onChangeText={setBlockerReason}
              textAlignVertical="top"
            />

            <Pressable
              onPress={() => setIsCriticalBlocker(!isCriticalBlocker)}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                gap: 8,
                paddingVertical: 4,
              }}>
              <Feather
                name={isCriticalBlocker ? 'check-square' : 'square'}
                size={16}
                color={isCriticalBlocker ? colors.statusActive : colors.textTertiary}
              />
              <Text style={{ ...typography.caption, ...textScale.caption, color: colors.textPrimary }}>
                Critical: work cannot continue
              </Text>
            </Pressable>

            <View style={styles.modalActions}>
              <Pressable
                onPress={() => setBlockerTarget(null)}
                style={[styles.modalCancel, { backgroundColor: colors.surfaceMuted }]}>
                <Text style={[styles.modalCancelText, { color: colors.textSecondary }]}>
                  Cancel
                </Text>
              </Pressable>

              <Pressable
                onPress={handleReportBlockerSubmit}
                disabled={submittingBlocker}
                style={[styles.modalConfirm, { backgroundColor: colors.statusActive }]}>
                {submittingBlocker ? (
                  <ActivityIndicator size="small" color={colors.onPrimary} />
                ) : (
                  <Text style={[styles.modalConfirmText, { color: colors.onPrimary }]}>
                    Report
                  </Text>
                )}
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>

      {/* Completion Evidence Modal */}
      <Modal
        visible={!!completeTarget}
        transparent
        animationType="fade"
        onRequestClose={() => setCompleteTarget(null)}>
        <View style={[styles.modalOverlay, { backgroundColor: colors.scrim }]}>
          <View style={[styles.modalCard, { backgroundColor: colors.surface }]}>
            <View style={styles.modalHeader}>
              <Feather name="check-circle" size={20} color={colors.statusResolved} />
              <Text style={[styles.modalTitle, { color: colors.textPrimary }]}>
                Submit completion
              </Text>
            </View>

            <Text style={[styles.modalDesc, { color: colors.textSecondary }]}>
              Add photos and/or a short note. The coordinator verifies before closing.
            </Text>

            <TextInput
              style={[
                styles.modalTextInput,
                {
                  color: colors.textPrimary,
                  backgroundColor: colors.surfaceMuted,
                },
              ]}
              placeholder="e.g. Pumped 1.2M liters; water level depressed by 60cm; signed off by field lead..."
              placeholderTextColor={colors.textTertiary}
              multiline
              numberOfLines={4}
              value={completionEvidence}
              onChangeText={setCompletionEvidence}
              textAlignVertical="top"
            />
            <EvidencePhotoPicker photoUris={completionPhotos} onChange={setCompletionPhotos} />

            <View style={styles.modalActions}>
              <Pressable
                onPress={() => setCompleteTarget(null)}
                style={[styles.modalCancel, { backgroundColor: colors.surfaceMuted }]}>
                <Text style={[styles.modalCancelText, { color: colors.textSecondary }]}>
                  Cancel
                </Text>
              </Pressable>

              <Pressable
                onPress={handleCompleteSubmit}
                disabled={submittingComplete}
                style={[styles.modalConfirm, { backgroundColor: colors.actionPrimary }]}>
                {submittingComplete ? (
                  <ActivityIndicator size="small" color={colors.onActionPrimary} />
                ) : (
                  <Text style={[styles.modalConfirmText, { color: colors.onActionPrimary }]}>
                    Submit
                  </Text>
                )}
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>

      <OpsBottomNavBar activeTab="tasks" />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  moreRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    minHeight: touchTargets.min,
  },
  details: {
    gap: spacing.sm,
  },
  feedbackStrip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginHorizontal: spacing.screenPadding,
    marginBottom: spacing.sm,
    padding: spacing.md,
    borderRadius: radii.sm,
  },
  feedbackText: {
    ...typography.body,
    ...textScale.body,
    flex: 1,
  },
  secondaryAction: {
    minHeight: touchTargets.min,
    alignItems: 'center',
    justifyContent: 'center',
  },
  secondaryActionText: {
    ...typography.bodyMedium,
    ...textScale.body,
    fontWeight: '600',
  },
  kindRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
  },
  kindChip: {
    minHeight: touchTargets.min,
    justifyContent: 'center',
    paddingHorizontal: spacing.md,
    borderRadius: radii.chip,
  },
  kindChipText: {
    ...typography.caption,
    ...textScale.caption,
    fontWeight: '600',
  },
  safeArea: {
    flex: 1,
  },
  header: {
    paddingHorizontal: spacing.screenPadding,
    paddingTop: spacing.md,
    paddingBottom: spacing.sm,
  },
  headerTitleWrap: {
    gap: spacing.xxs,
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
  filterRow: {
    flexDirection: 'row',
    paddingHorizontal: spacing.screenPadding,
    gap: spacing.xs,
    marginBottom: spacing.sm,
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
  taskCard: {
    borderRadius: radii.card,
    padding: spacing.cardPadding,
    gap: spacing.sm,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  taskTypeTag: {
    ...typography.caption,
    ...textScale.caption,
    fontWeight: '700',
  },
  badgePill: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: radii.xs,
  },
  badgeText: {
    ...typography.overline,
    ...textScale.caption,
    fontWeight: '700',
    letterSpacing: 0.4,
  },
  localityText: {
    ...typography.bodyMedium,
    ...textScale.body,
    fontWeight: '700',
  },
  incidentSubtitle: {
    ...typography.caption,
    ...textScale.caption,
  },
  instructionBox: {
    borderRadius: radii.sm,
    padding: spacing.md,
    gap: spacing.xxs,
    marginTop: spacing.xxs,
  },
  instructionLabel: {
    ...typography.overline,
    ...textScale.caption,
  },
  instructionBody: {
    ...typography.body,
    ...textScale.caption,
  },
  crewRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginTop: spacing.xxs,
  },
  crewText: {
    ...typography.caption,
    ...textScale.caption,
  },
  blockerAlert: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    padding: spacing.sm,
    borderRadius: radii.xs,
    marginTop: spacing.xxs,
  },
  blockerAlertText: {
    ...typography.caption,
    ...textScale.caption,
    fontWeight: '600',
  },
  actionButtonsRow: {
    marginTop: spacing.xs,
  },
  actionBtnPrimary: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    height: touchTargets.min,
    borderRadius: radii.button,
  },
  actionBtnPrimaryText: {
    ...typography.bodyMedium,
    fontWeight: '700',
    ...textScale.body,
  },
  dualActionsRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  actionBtnDanger: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    height: touchTargets.min,
    borderRadius: radii.button,
  },
  actionBtnDangerText: {
    ...typography.bodyMedium,
    ...textScale.caption,
    fontWeight: '700',
  },
  actionBtnSuccess: {
    flex: 1.2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    height: touchTargets.min,
    borderRadius: radii.button,
  },
  actionBtnSuccessText: {
    ...typography.bodyMedium,
    ...textScale.caption,
    fontWeight: '700',
  },
  modalOverlay: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.screenPadding,
  },
  modalCard: {
    width: '100%',
    borderRadius: radii.card,
    padding: spacing.cardPadding,
    gap: spacing.sm,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  modalTitle: {
    ...typography.cardTitle,
    ...textScale.body,
  },
  modalDesc: {
    ...typography.body,
    ...textScale.caption,
  },
  modalTextInput: {
    borderRadius: radii.sm,
    padding: spacing.sm,
    minHeight: touchTargets.min * 2,
    ...textScale.caption,
  },
  modalActions: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.xs,
  },
  modalCancel: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    height: touchTargets.min,
    borderRadius: radii.sm,
  },
  modalCancelText: {
    ...typography.bodyMedium,
    ...textScale.body,
  },
  modalConfirm: {
    flex: 1.2,
    alignItems: 'center',
    justifyContent: 'center',
    height: touchTargets.min,
    borderRadius: radii.sm,
  },
  modalConfirmText: {
    ...typography.bodyMedium,
    fontWeight: '700',
    ...textScale.body,
  },
});
