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
import { InfoBar } from '@/components/InfoBar';
import { OpsBottomNavBar } from '@/components/OpsBottomNavBar';
import { SkeletonCard } from '@/components/SkeletonCard';
import {
  acknowledgeTask,
  fetchInterventions,
  reportTaskBlocker,
  startTask,
  submitTaskCompletion,
} from '@/services/operations-api';
import { useTheme } from '@/theme';
import { radii, spacing, touchTargets } from '@/theme/spacing';
import { typography } from '@/theme/typography';
import { InterventionRecord, InterventionStatus } from '@/types/operations';

type TaskFilter = 'ALL' | 'ASSIGNED' | 'ACTIVE' | 'BLOCKED';

export default function FieldWorkerTasksScreen() {
  const { colors } = useTheme();

  const [tasks, setTasks] = useState<InterventionRecord[]>([]);
  const [filter, setFilter] = useState<TaskFilter>('ALL');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Modals state
  const [blockerTarget, setBlockerTarget] = useState<InterventionRecord | null>(null);
  const [blockerReason, setBlockerReason] = useState('');
  const [isCriticalBlocker, setIsCriticalBlocker] = useState(true);
  const [submittingBlocker, setSubmittingBlocker] = useState(false);

  const [completeTarget, setCompleteTarget] = useState<InterventionRecord | null>(null);
  const [completionEvidence, setCompletionEvidence] = useState('');
  const [submittingComplete, setSubmittingComplete] = useState(false);

  const loadData = useCallback(async (isRefresh = false) => {
    try {
      if (isRefresh) {
        setRefreshing(true);
        setErrorMsg(null);
      }
      const all = await fetchInterventions();
      // Filter to tasks that have been assigned or are actionable
      const fieldTasks = all.filter(
        (i) => i.status !== 'AWAITING_ASSIGNMENT'
      );
      setTasks(fieldTasks);
    } catch (err: any) {
      setErrorMsg(err?.message || 'Failed to load field tasks.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadData();
  }, [loadData]);

  const onRefresh = () => {
    loadData(true);
  };

  const filteredTasks = tasks.filter((t) => {
    if (filter === 'ASSIGNED') return t.status === 'AWAITING_ACK';
    if (filter === 'ACTIVE') return t.status === 'IN_PROGRESS' || t.status === 'EN_ROUTE';
    if (filter === 'BLOCKED') return t.status === 'BLOCKED' || t.status === 'FAILED';
    return true;
  });

  const handleAcknowledge = async (item: InterventionRecord) => {
    try {
      const updated = await acknowledgeTask(item.id);
      setTasks((prev) => prev.map((t) => (t.id === updated.id ? updated : t)));
      Alert.alert(
        'Task Acknowledged',
        `Crew en-route to ${item.targetLocality}. Live sync staged.`
      );
    } catch (err: any) {
      Alert.alert('Error', err?.message || 'Failed to acknowledge task.');
    }
  };

  const handleStartWork = async (item: InterventionRecord) => {
    try {
      const updated = await startTask(item.id);
      setTasks((prev) => prev.map((t) => (t.id === updated.id ? updated : t)));
      Alert.alert(
        'Work Commenced',
        `Intervention ${item.id} is now recorded as IN PROGRESS.`
      );
    } catch (err: any) {
      Alert.alert('Error', err?.message || 'Failed to start task.');
    }
  };

  const handleReportBlockerSubmit = async () => {
    if (!blockerTarget || !blockerReason.trim()) {
      Alert.alert('Validation Error', 'Please describe the obstacle or equipment issue.');
      return;
    }

    try {
      setSubmittingBlocker(true);
      const updated = await reportTaskBlocker(
        blockerTarget.id,
        blockerReason.trim(),
        isCriticalBlocker
      );

      setTasks((prev) => prev.map((t) => (t.id === updated.id ? updated : t)));
      setBlockerTarget(null);
      setBlockerReason('');

      Alert.alert(
        'Obstacle Reported & Escalated',
        `Task marked as BLOCKED. An alternative allocation has been routed to the Replanning console.`
      );
    } catch (err: any) {
      Alert.alert('Error', err?.message || 'Failed to report obstacle.');
    } finally {
      setSubmittingBlocker(false);
    }
  };

  const handleCompleteSubmit = async () => {
    if (!completeTarget || !completionEvidence.trim()) {
      Alert.alert('Validation Error', 'Please enter completion outcome evidence.');
      return;
    }

    try {
      setSubmittingComplete(true);
      const updated = await submitTaskCompletion(
        completeTarget.id,
        completionEvidence.trim()
      );

      setTasks((prev) => prev.map((t) => (t.id === updated.id ? updated : t)));
      setCompleteTarget(null);
      setCompletionEvidence('');

      Alert.alert(
        'Completion Submitted',
        `Work order queued for coordinator verification sign-off.`
      );
    } catch (err: any) {
      Alert.alert('Error', err?.message || 'Failed to submit completion.');
    } finally {
      setSubmittingComplete(false);
    }
  };

  const getStatusBadge = (status: InterventionStatus) => {
    switch (status) {
      case 'AWAITING_ACK':
        return { label: 'PENDING ACKNOWLEDGEMENT', color: colors.statusWatch, bg: colors.statusWatchBg };
      case 'EN_ROUTE':
        return { label: 'CREW EN ROUTE', color: colors.brandTeal, bg: colors.brandTealBg };
      case 'IN_PROGRESS':
        return { label: 'WORK IN PROGRESS', color: colors.brandTeal, bg: colors.brandTealBg };
      case 'BLOCKED':
        return { label: 'BLOCKED / CORRIDOR HAZARD', color: colors.statusActive, bg: colors.statusActiveBg };
      case 'FAILED':
        return { label: 'UNSUCCESSFUL INTERVENTION', color: colors.statusActive, bg: colors.statusActiveBg };
      case 'AWAITING_VERIFICATION':
        return { label: 'AWAITING SIGN-OFF', color: colors.brandPrimary, bg: colors.surfaceMuted };
      case 'VERIFIED_RESOLVED':
        return { label: 'VERIFIED COMPLETE', color: colors.statusResolved, bg: colors.statusResolvedBg };
      default:
        return { label: status, color: colors.textSecondary, bg: colors.surfaceMuted };
    }
  };

  return (
    <SafeAreaView
      edges={['top', 'left', 'right']}
      style={[styles.safeArea, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerTitleWrap}>
          <Text style={[styles.headerOverline, { color: colors.brandTeal }]}>
            DISASTER RESPONSE NETWORK
          </Text>
          <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>
            Field Worker Tasks
          </Text>
        </View>
      </View>

      {/* Simulation Banner */}
      <InfoBar
        isSampleData={true}
        persistent={true}
        customMessage="SAMPLE DATA — OPERATIONAL SIMULATION — NOT LIVE OPERATIONS"
      />

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
      ) : errorMsg ? (
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
            const badge = getStatusBadge(item.status);

            return (
              <View
                style={[styles.taskCard, { backgroundColor: colors.surface }]}>
                {/* Header: Priority + Category Tag + Status Badge */}
                <View style={styles.cardHeader}>
                  <Text style={[styles.taskTypeTag, { color: colors.brandTeal }]}>
                    {item.type.replace(/_/g, ' ')}
                  </Text>
                  <View style={[styles.badgePill, { backgroundColor: badge.bg }]}>
                    <Text style={[styles.badgeText, { color: badge.color }]}>
                      {badge.label}
                    </Text>
                  </View>
                </View>

                {/* Target Locality & Incident */}
                <Text style={[styles.localityText, { color: colors.textPrimary }]}>
                  {item.targetLocality}
                </Text>
                <Text style={[styles.incidentSubtitle, { color: colors.textTertiary }]}>
                  {item.incidentTitle}
                </Text>

                {/* Work Instructions */}
                <View style={[styles.instructionBox, { backgroundColor: colors.surfaceMuted }]}>
                  <Text style={[styles.instructionLabel, { color: colors.textTertiary }]}>
                    DISPATCH ORDERS:
                  </Text>
                  <Text style={[styles.instructionBody, { color: colors.textPrimary }]}>
                    {item.instructions}
                  </Text>
                </View>

                {/* Assigned Crew & Equipment */}
                {item.assignedTeamName && (
                  <View style={styles.crewRow}>
                    <Feather name="users" size={13} color={colors.textTertiary} />
                    <Text style={[styles.crewText, { color: colors.textSecondary }]}>
                      Assigned: {item.assignedTeamName}
                    </Text>
                  </View>
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

                {/* Action Buttons */}
                <View style={styles.actionButtonsRow}>
                  {item.status === 'AWAITING_ACK' && (
                    <Pressable
                      onPress={() => handleAcknowledge(item)}
                      style={[styles.actionBtnPrimary, { backgroundColor: colors.brandTeal }]}
                      accessibilityRole="button"
                      accessibilityLabel="Accept and acknowledge task">
                      <Feather name="check" size={14} color="#0B111A" />
                      <Text style={styles.actionBtnPrimaryText}>
                        Acknowledge & En Route
                      </Text>
                    </Pressable>
                  )}

                  {item.status === 'EN_ROUTE' && (
                    <Pressable
                      onPress={() => handleStartWork(item)}
                      style={[styles.actionBtnPrimary, { backgroundColor: colors.brandTeal }]}
                      accessibilityRole="button"
                      accessibilityLabel="Start work on site">
                      <Feather name="play" size={14} color="#0B111A" />
                      <Text style={styles.actionBtnPrimaryText}>
                        Arrived & Start Work
                      </Text>
                    </Pressable>
                  )}

                  {(item.status === 'IN_PROGRESS' || item.status === 'EN_ROUTE') && (
                    <View style={styles.dualActionsRow}>
                      <Pressable
                        onPress={() => {
                          setBlockerTarget(item);
                          setBlockerReason('');
                        }}
                        style={[styles.actionBtnDanger, { backgroundColor: colors.surfaceMuted }]}
                        accessibilityRole="button"
                        accessibilityLabel="Report problem or route blockage">
                        <Feather name="alert-octagon" size={14} color={colors.statusActive} />
                        <Text style={[styles.actionBtnDangerText, { color: colors.statusActive }]}>
                          Report Problem
                        </Text>
                      </Pressable>

                      <Pressable
                        onPress={() => {
                          setCompleteTarget(item);
                          setCompletionEvidence('');
                        }}
                        style={[styles.actionBtnSuccess, { backgroundColor: colors.statusResolved }]}
                        accessibilityRole="button"
                        accessibilityLabel="Submit completion evidence">
                        <Feather name="check-circle" size={14} color="#FFFFFF" />
                        <Text style={styles.actionBtnSuccessText}>
                          Complete Work
                        </Text>
                      </Pressable>
                    </View>
                  )}
                </View>
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
        <View style={styles.modalOverlay}>
          <View style={[styles.modalCard, { backgroundColor: colors.surface }]}>
            <View style={styles.modalHeader}>
              <Feather name="alert-octagon" size={20} color={colors.statusActive} />
              <Text style={[styles.modalTitle, { color: colors.textPrimary }]}>
                Report Field Hazard / Blocker
              </Text>
            </View>

            <Text style={[styles.modalDesc, { color: colors.textSecondary }]}>
              Task: {blockerTarget?.type.replace(/_/g, ' ')} at {blockerTarget?.targetLocality}
            </Text>

            <TextInput
              style={[
                styles.modalTextInput,
                {
                  color: colors.textPrimary,
                  backgroundColor: colors.surfaceMuted,
                },
              ]}
              placeholder="Describe equipment malfunction, submerged transit road, or unmanageable current..."
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
              <Text style={{ ...typography.caption, color: colors.textPrimary, fontSize: 12 }}>
                Mark as Critical Impasse (Triggers immediate replanning escalation)
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
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <Text style={[styles.modalConfirmText, { color: '#FFFFFF' }]}>
                    Submit Blocker
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
        <View style={styles.modalOverlay}>
          <View style={[styles.modalCard, { backgroundColor: colors.surface }]}>
            <View style={styles.modalHeader}>
              <Feather name="check-circle" size={20} color={colors.statusResolved} />
              <Text style={[styles.modalTitle, { color: colors.textPrimary }]}>
                Submit Completion Evidence
              </Text>
            </View>

            <Text style={[styles.modalDesc, { color: colors.textSecondary }]}>
              Provide completion notes, water drawdown depth, or recipient supervisor acknowledgement.
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
                style={[styles.modalConfirm, { backgroundColor: colors.statusResolved }]}>
                {submittingComplete ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <Text style={[styles.modalConfirmText, { color: '#FFFFFF' }]}>
                    Submit For Sign-Off
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
  safeArea: {
    flex: 1,
  },
  header: {
    paddingHorizontal: spacing.screenPadding,
    paddingTop: spacing.md,
    paddingBottom: spacing.sm,
  },
  headerTitleWrap: {
    gap: 2,
  },
  headerOverline: {
    ...typography.overline,
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.8,
  },
  headerTitle: {
    ...typography.title,
    fontSize: 22,
    lineHeight: 28,
  },
  filterRow: {
    flexDirection: 'row',
    paddingHorizontal: spacing.screenPadding,
    gap: spacing.xs,
    marginBottom: spacing.sm,
  },
  filterChip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs + 2,
    borderRadius: radii.chip,
  },
  filterChipText: {
    ...typography.caption,
    fontSize: 11,
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
    gap: 6,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  taskTypeTag: {
    ...typography.caption,
    fontSize: 12,
    fontWeight: '700',
  },
  badgePill: {
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: radii.xs,
  },
  badgeText: {
    ...typography.overline,
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 0.4,
  },
  localityText: {
    ...typography.bodyMedium,
    fontSize: 15,
    fontWeight: '700',
  },
  incidentSubtitle: {
    ...typography.caption,
    fontSize: 11,
  },
  instructionBox: {
    borderRadius: radii.sm,
    padding: spacing.md,
    gap: 2,
    marginTop: 2,
  },
  instructionLabel: {
    ...typography.overline,
    fontSize: 9,
  },
  instructionBody: {
    ...typography.body,
    fontSize: 13,
    lineHeight: 18,
  },
  crewRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginTop: 2,
  },
  crewText: {
    ...typography.caption,
    fontSize: 12,
  },
  blockerAlert: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    padding: spacing.sm,
    borderRadius: radii.xs,
    marginTop: 2,
  },
  blockerAlertText: {
    ...typography.caption,
    fontSize: 12,
    fontWeight: '600',
  },
  actionButtonsRow: {
    marginTop: 4,
  },
  actionBtnPrimary: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    height: touchTargets.min,
    borderRadius: radii.button,
  },
  actionBtnPrimaryText: {
    ...typography.bodyMedium,
    color: '#0B111A',
    fontWeight: '700',
    fontSize: 13,
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
    gap: 5,
    height: touchTargets.min,
    borderRadius: radii.button,
  },
  actionBtnDangerText: {
    ...typography.bodyMedium,
    fontSize: 13,
    fontWeight: '700',
  },
  actionBtnSuccess: {
    flex: 1.2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    height: touchTargets.min,
    borderRadius: radii.button,
  },
  actionBtnSuccessText: {
    ...typography.bodyMedium,
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.65)',
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
    fontSize: 16,
  },
  modalDesc: {
    ...typography.body,
    fontSize: 13,
    lineHeight: 18,
  },
  modalTextInput: {
    borderRadius: radii.sm,
    padding: spacing.sm,
    minHeight: 90,
    fontSize: 13,
    lineHeight: 18,
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
    fontSize: 14,
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
    fontSize: 14,
  },
});
