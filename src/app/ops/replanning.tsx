/**
 * VerificationAndReplanningScreen — Coordinator Replanning & Sign-Off
 *
 * Screen D: Supervisory closeout and adaptive response loop:
 * 1. Verification Queue: Completed interventions awaiting supervisor sign-off with evidence audit.
 * 2. Replanning Queue: Blocked corridors, equipment breakdowns, or capacity breaches
 *    requiring contingency assignment and algorithmic alternative dispatch.
 */

import React, { useCallback, useEffect, useState } from 'react';
import {
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
import { router } from 'expo-router';

import { EmptyState } from '@/components/EmptyState';
import { ErrorState } from '@/components/ErrorState';
import { InfoBar } from '@/components/InfoBar';
import { OpsBottomNavBar } from '@/components/OpsBottomNavBar';
import { SkeletonCard } from '@/components/SkeletonCard';
import {
  executeReplanningDecision,
  fetchInterventions,
  fetchReplanningRecords,
  verifyIntervention,
} from '@/services/operations-api';
import { useConfirmExitAtRoot } from '@/hooks/use-confirm-exit-at-root';
import { useTheme } from '@/theme';
import { radii, spacing, touchTargets } from '@/theme/spacing';
import { typography } from '@/theme/typography';
import { InterventionRecord, ReplanningRecord } from '@/types/operations';

type TabView = 'VERIFICATION' | 'REPLANNING';

export default function VerificationAndReplanningScreen() {
  const { colors } = useTheme();
  useConfirmExitAtRoot();

  const [activeTab, setActiveTab] = useState<TabView>('VERIFICATION');
  const [verificationItems, setVerificationItems] = useState<InterventionRecord[]>([]);
  const [replanningItems, setReplanningItems] = useState<ReplanningRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Sign-off confirmation modal
  const [selectedVerification, setSelectedVerification] = useState<InterventionRecord | null>(null);
  const [signOffNotes, setSignOffNotes] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  // Replanning execution modal
  const [selectedReplanning, setSelectedReplanning] = useState<ReplanningRecord | null>(null);
  const [replanInstructions, setReplanInstructions] = useState('');

  const loadData = useCallback(async (isRefresh = false) => {
    try {
      if (isRefresh) {
        setRefreshing(true);
        setErrorMsg(null);
      }
      const [allInterventions, replanRecords] = await Promise.all([
        fetchInterventions(),
        fetchReplanningRecords(),
      ]);
      setVerificationItems(
        allInterventions.filter((i) => i.status === 'AWAITING_VERIFICATION')
      );
      setReplanningItems(replanRecords);
    } catch (err: any) {
      setErrorMsg(err?.message || 'Failed to sync verification and replanning queues.');
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

  const handleSignOff = async (approved: boolean) => {
    if (!selectedVerification) return;
    try {
      setActionLoading(true);
      await verifyIntervention(selectedVerification.id, approved);
      Alert.alert(
        approved ? 'Verification Staged' : 'Work Resumed',
        approved
          ? `Intervention ${selectedVerification.id} verified as resolved in local simulation. FastAPI endpoint POST /api/v1/ops/verification/{id}/sign-off required for audit sign-off.`
          : `Intervention ${selectedVerification.id} returned to in-progress status for remediation.`
      );
      setSelectedVerification(null);
      setSignOffNotes('');
      await loadData();
    } catch (err: any) {
      Alert.alert('Action Failed', err?.message || 'Verification could not be recorded.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleExecuteReplanning = async () => {
    if (!selectedReplanning) return;
    try {
      setActionLoading(true);
      await executeReplanningDecision(
        selectedReplanning.id,
        replanInstructions.trim() || 'Alternative route & asset reassignment dispatched'
      );
      Alert.alert(
        'Replanning Staged',
        `Alternative allocation staged for incident ${selectedReplanning.incidentId}. Local state updated; requires backend confirmation via POST /api/v1/ops/replanning/{id}/execute.`
      );
      setSelectedReplanning(null);
      setReplanInstructions('');
      await loadData();
    } catch (err: any) {
      Alert.alert('Action Failed', err?.message || 'Replanning execution failed.');
    } finally {
      setActionLoading(false);
    }
  };

  const renderVerificationCard = ({ item }: { item: InterventionRecord }) => {
    return (
      <View style={[styles.card, { backgroundColor: colors.surface }]}>
        <View style={styles.cardHeader}>
          <View style={styles.badgeRow}>
            <View
              style={[
                styles.badge,
                { backgroundColor: colors.brandTealBg, borderColor: colors.brandTeal },
              ]}>
              <Text style={[styles.badgeText, { color: colors.brandTeal }]}>
                AWAITING SIGN-OFF
              </Text>
            </View>
            <Text style={[styles.timeText, { color: colors.textTertiary }]}>
              Completed {item.completedAt ? new Date(item.completedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'recently'}
            </Text>
          </View>
          <Text style={[styles.incidentTitle, { color: colors.textPrimary }]}>
            {item.incidentTitle}
          </Text>
          <Text style={[styles.localityText, { color: colors.textSecondary }]}>
            {item.targetLocality} • Required: {item.requiredCapabilities.join(', ')}
          </Text>
        </View>

        {/* Evidence box */}
        <View style={[styles.evidenceBox, { backgroundColor: colors.surfaceMuted }]}>
          <View style={styles.evidenceHeader}>
            <Feather name="file-text" size={13} color={colors.brandTeal} />
            <Text style={[styles.evidenceTitle, { color: colors.brandTeal }]}>
              SUBMITTED COMPLETION EVIDENCE
            </Text>
          </View>
          <Text style={[styles.evidenceText, { color: colors.textPrimary }]}>
            {item.completionEvidence || 'Field observation logged. Awaiting telemetry validation.'}
          </Text>
        </View>

        {/* Team attribution */}
        <View style={styles.teamMeta}>
          <Feather name="users" size={13} color={colors.textTertiary} />
          <Text style={[styles.teamMetaText, { color: colors.textTertiary }]}>
            Assigned: {item.assignedTeamName || 'Field Unit'} • Equipment: {item.assignedEquipment?.join(', ') || 'Standard kit'}
          </Text>
        </View>

        {/* Actions */}
        <View style={styles.actionRow}>
          <Pressable
            onPress={() => setSelectedVerification(item)}
            accessibilityRole="button"
            accessibilityLabel={`Audit evidence and sign off ${item.id}`}
            style={[styles.primaryButton, { backgroundColor: colors.brandTeal }]}>
            <Feather name="check-circle" size={15} color="#FFFFFF" />
            <Text style={styles.primaryButtonText}>Verify & Sign Off</Text>
          </Pressable>
          <Pressable
            onPress={() => router.push(`/ops/incident/${item.incidentId}` as any)}
            accessibilityRole="button"
            accessibilityLabel="View full incident telemetry"
            style={[styles.outlineButton, { borderColor: colors.border }]}>
            <Text style={[styles.outlineButtonText, { color: colors.textSecondary }]}>
              View Telemetry
            </Text>
          </Pressable>
        </View>
      </View>
    );
  };

  const renderReplanningCard = ({ item }: { item: ReplanningRecord }) => {
    const isResolved = item.status === 'REASSIGNED';
    return (
      <View style={[styles.card, { backgroundColor: colors.surface }]}>
        <View style={styles.cardHeader}>
          <View style={styles.badgeRow}>
            <View
              style={[
                styles.badge,
                {
                  backgroundColor: isResolved ? colors.surfaceMuted : colors.statusWatchBg,
                  borderColor: isResolved ? colors.border : colors.statusWatch,
                },
              ]}>
              <Text
                style={[
                  styles.badgeText,
                  { color: isResolved ? colors.textTertiary : colors.statusWatch },
                ]}>
                {item.triggerReason.replace(/_/g, ' ')}
              </Text>
            </View>
            <Text style={[styles.timeText, { color: colors.textTertiary }]}>
              Status: {item.status.replace(/_/g, ' ')}
            </Text>
          </View>
          <Text style={[styles.incidentTitle, { color: colors.textPrimary }]}>
            {item.incidentTitle}
          </Text>
          <Text style={[styles.localityText, { color: colors.textSecondary }]}>
            Target: {item.targetLocality}
          </Text>
        </View>

        {/* Blocker breakdown */}
        <View style={[styles.blockerBox, { backgroundColor: colors.statusWatchBg }]}>
          <View style={styles.evidenceHeader}>
            <Feather name="alert-circle" size={13} color={colors.statusWatch} />
            <Text style={[styles.evidenceTitle, { color: colors.statusWatch }]}>
              OPERATIONAL IMPASSE REPORTED
            </Text>
          </View>
          <Text style={[styles.blockerText, { color: colors.textPrimary }]}>
            {item.blockerDetails}
          </Text>
          <Text style={[styles.originalAssignText, { color: colors.textSecondary }]}>
            Failed Unit: {item.originalAssignment}
          </Text>
        </View>

        {/* Algorithmic recommendation */}
        <View style={[styles.contingencyBox, { backgroundColor: colors.surfaceMuted }]}>
          <View style={styles.evidenceHeader}>
            <Feather name="compass" size={13} color={colors.brandTeal} />
            <Text style={[styles.evidenceTitle, { color: colors.brandTeal }]}>
              RECOMMENDED ALTERNATIVE ALLOCATION
            </Text>
          </View>
          <Text style={[styles.contingencyText, { color: colors.textPrimary }]}>
            {item.recommendedAlternative}
          </Text>
        </View>

        {/* Dispatch Action */}
        {!isResolved ? (
          <View style={styles.actionRow}>
            <Pressable
              onPress={() => setSelectedReplanning(item)}
              accessibilityRole="button"
              accessibilityLabel={`Execute alternative allocation for ${item.id}`}
              style={[styles.primaryButton, { backgroundColor: colors.brandNavy }]}>
              <Feather name="refresh-cw" size={14} color="#FFFFFF" />
              <Text style={styles.primaryButtonText}>Execute Alternative Reassignment</Text>
            </Pressable>
          </View>
        ) : (
          <View style={styles.resolvedRow}>
            <Feather name="check" size={14} color={colors.brandTeal} />
            <Text style={[styles.resolvedText, { color: colors.brandTeal }]}>
              Replanning decision logged. Staged in local state.
            </Text>
          </View>
        )}
      </View>
    );
  };

  return (
    <SafeAreaView
      edges={['top', 'left', 'right']}
      style={[styles.safeArea, { backgroundColor: colors.background }]}>
      {/* Top Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={[styles.screenTitle, { color: colors.textPrimary }]}>
            Replanning & Sign-Off
          </Text>
          <Text style={[styles.screenSubtitle, { color: colors.textTertiary }]}>
            Supervisory verification and adaptive assignment loop
          </Text>
        </View>
        <Pressable
          onPress={() => loadData(true)}
          style={styles.headerIconButton}
          accessibilityRole="button"
          accessibilityLabel="Refresh replanning queue">
          <Feather name="refresh-cw" size={18} color={colors.textSecondary} />
        </Pressable>
      </View>

      {/* Persistent simulation banner */}
      <InfoBar customMessage="SAMPLE DATA — OPERATIONAL SIMULATION — NOT LIVE OPERATIONS" />

      {/* Tab Switcher */}
      <View style={[styles.tabBar, { borderBottomColor: colors.border }]}>
        <Pressable
          onPress={() => setActiveTab('VERIFICATION')}
          style={[
            styles.tabItem,
            activeTab === 'VERIFICATION' && {
              borderBottomColor: colors.brandTeal,
              borderBottomWidth: 2,
            },
          ]}>
          <Text
            style={[
              styles.tabText,
              {
                color: activeTab === 'VERIFICATION' ? colors.brandTeal : colors.textTertiary,
                fontWeight: activeTab === 'VERIFICATION' ? '700' : '500',
              },
            ]}>
            Sign-Off ({verificationItems.length})
          </Text>
        </Pressable>

        <Pressable
          onPress={() => setActiveTab('REPLANNING')}
          style={[
            styles.tabItem,
            activeTab === 'REPLANNING' && {
              borderBottomColor: colors.brandTeal,
              borderBottomWidth: 2,
            },
          ]}>
          <Text
            style={[
              styles.tabText,
              {
                color: activeTab === 'REPLANNING' ? colors.brandTeal : colors.textTertiary,
                fontWeight: activeTab === 'REPLANNING' ? '700' : '500',
              },
            ]}>
            Contingencies ({replanningItems.length})
          </Text>
        </Pressable>
      </View>

      {/* Main Content */}
      {loading ? (
        <View style={styles.loadingContainer}>
          <SkeletonCard />
          <SkeletonCard />
          <SkeletonCard />
        </View>
      ) : errorMsg ? (
        <ErrorState message={errorMsg} onRetry={() => loadData(true)} />
      ) : activeTab === 'VERIFICATION' ? (
        <FlatList
          data={verificationItems}
          keyExtractor={(item) => item.id}
          renderItem={renderVerificationCard}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={colors.brandTeal}
            />
          }
          ListEmptyComponent={
            <EmptyState
              title="No Pending Sign-Offs"
              description="No field teams have submitted completions awaiting supervisory sign-off."
            />
          }
        />
      ) : (
        <FlatList
          data={replanningItems}
          keyExtractor={(item) => item.id}
          renderItem={renderReplanningCard}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={colors.brandTeal}
            />
          }
          ListEmptyComponent={
            <EmptyState
              title="No Active Impasses"
              description="All assigned interventions are operating normally without reported equipment failures or blocked routes."
            />
          }
        />
      )}

      {/* Modal: Sign-Off Verification */}
      <Modal
        visible={!!selectedVerification}
        animationType="slide"
        transparent
        onRequestClose={() => setSelectedVerification(null)}>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.surface }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.textPrimary }]}>
                Supervisor Sign-Off Audit
              </Text>
              <Pressable
                onPress={() => setSelectedVerification(null)}
                style={styles.modalCloseButton}>
                <Feather name="x" size={20} color={colors.textSecondary} />
              </Pressable>
            </View>

            <Text style={[styles.modalDesc, { color: colors.textSecondary }]}>
              Verify that field objectives for {selectedVerification?.incidentTitle} have been satisfied
              according to submitted telemetry and physical outcome reports.
            </Text>

            <View style={[styles.modalEvidenceBox, { backgroundColor: colors.surfaceMuted }]}>
              <Text style={[styles.evidenceTitle, { color: colors.brandTeal }]}>
                FIELD OUTCOME SUBMISSION:
              </Text>
              <Text style={[styles.evidenceText, { color: colors.textPrimary }]}>
                {selectedVerification?.completionEvidence || 'Field observation logged.'}
              </Text>
            </View>

            <Text style={[styles.inputLabel, { color: colors.textTertiary }]}>
              SUPERVISOR AUDIT NOTES (OPTIONAL)
            </Text>
            <TextInput
              style={[
                styles.notesInput,
                {
                  backgroundColor: colors.surfaceMuted,
                  color: colors.textPrimary,
                  borderColor: colors.border,
                },
              ]}
              placeholder="e.g., Water gauge checked at 0.4m below flood mark. Approved."
              placeholderTextColor={colors.textTertiary}
              value={signOffNotes}
              onChangeText={setSignOffNotes}
              multiline
              numberOfLines={3}
            />

            <View style={styles.modalActions}>
              <Pressable
                onPress={() => handleSignOff(false)}
                disabled={actionLoading}
                style={[styles.modalRejectButton, { borderColor: colors.border }]}>
                <Text style={[styles.modalRejectText, { color: colors.textSecondary }]}>
                  Reject / Reopen
                </Text>
              </Pressable>
              <Pressable
                onPress={() => handleSignOff(true)}
                disabled={actionLoading}
                style={[styles.modalApproveButton, { backgroundColor: colors.brandTeal }]}>
                <Text style={styles.modalApproveText}>
                  {actionLoading ? 'Staging...' : 'Approve & Mark Resolved'}
                </Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>

      {/* Modal: Execute Replanning Reassignment */}
      <Modal
        visible={!!selectedReplanning}
        animationType="slide"
        transparent
        onRequestClose={() => setSelectedReplanning(null)}>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.surface }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.textPrimary }]}>
                Execute Contingency Reassignment
              </Text>
              <Pressable
                onPress={() => setSelectedReplanning(null)}
                style={styles.modalCloseButton}>
                <Feather name="x" size={20} color={colors.textSecondary} />
              </Pressable>
            </View>

            <Text style={[styles.modalDesc, { color: colors.textSecondary }]}>
              Deploy alternative resources or reroute units for {selectedReplanning?.targetLocality}.
            </Text>

            <View style={[styles.modalEvidenceBox, { backgroundColor: colors.surfaceMuted }]}>
              <Text style={[styles.evidenceTitle, { color: colors.brandTeal }]}>
                RECOMMENDED CONTINGENCY:
              </Text>
              <Text style={[styles.evidenceText, { color: colors.textPrimary }]}>
                {selectedReplanning?.recommendedAlternative}
              </Text>
            </View>

            <Text style={[styles.inputLabel, { color: colors.textTertiary }]}>
              OVERRIDE OR OPERATIONAL INSTRUCTIONS
            </Text>
            <TextInput
              style={[
                styles.notesInput,
                {
                  backgroundColor: colors.surfaceMuted,
                  color: colors.textPrimary,
                  borderColor: colors.border,
                },
              ]}
              placeholder="e.g., Confirmed with SDRF Base. Route approved via NH-31 Bypass."
              placeholderTextColor={colors.textTertiary}
              value={replanInstructions}
              onChangeText={setReplanInstructions}
              multiline
              numberOfLines={3}
            />

            <View style={styles.modalActions}>
              <Pressable
                onPress={() => setSelectedReplanning(null)}
                style={[styles.modalRejectButton, { borderColor: colors.border }]}>
                <Text style={[styles.modalRejectText, { color: colors.textSecondary }]}>
                  Cancel
                </Text>
              </Pressable>
              <Pressable
                onPress={handleExecuteReplanning}
                disabled={actionLoading}
                style={[styles.modalApproveButton, { backgroundColor: colors.brandNavy }]}>
                <Text style={styles.modalApproveText}>
                  {actionLoading ? 'Staging...' : 'Confirm Reassignment'}
                </Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>

      {/* Bottom Navigation */}
      <OpsBottomNavBar activeTab="replanning" />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.screenPadding,
    paddingTop: spacing.sm,
    paddingBottom: spacing.xs,
  },
  headerLeft: {
    flex: 1,
  },
  screenTitle: {
    ...typography.title,
    fontSize: 20,
    lineHeight: 24,
  },
  screenSubtitle: {
    ...typography.caption,
    fontSize: 12,
    lineHeight: 16,
    marginTop: 2,
  },
  headerIconButton: {
    width: touchTargets.min,
    height: touchTargets.min,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabBar: {
    flexDirection: 'row',
    paddingHorizontal: spacing.screenPadding,
    borderBottomWidth: 1,
    marginTop: spacing.xs,
  },
  tabItem: {
    paddingVertical: spacing.sm + 2,
    marginRight: spacing.lg,
    borderBottomWidth: 0,
  },
  tabText: {
    ...typography.bodyMedium,
    fontSize: 14,
  },
  loadingContainer: {
    padding: spacing.screenPadding,
    gap: spacing.md,
  },
  listContent: {
    padding: spacing.screenPadding,
    gap: spacing.md,
    paddingBottom: spacing.xxl,
  },
  card: {
    borderRadius: radii.card,
    padding: spacing.cardPadding,
    gap: spacing.sm,
  },
  cardHeader: {
    gap: 4,
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: radii.sm,
    borderWidth: 1,
  },
  badgeText: {
    ...typography.overline,
    fontSize: 10,
    fontWeight: '700',
  },
  timeText: {
    ...typography.caption,
    fontSize: 11,
  },
  incidentTitle: {
    ...typography.bodyMedium,
    fontSize: 15,
    fontWeight: '700',
    marginTop: 2,
  },
  localityText: {
    ...typography.caption,
    fontSize: 12,
  },
  evidenceBox: {
    borderRadius: radii.sm,
    padding: spacing.sm,
    gap: 4,
  },
  evidenceHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  evidenceTitle: {
    ...typography.overline,
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  evidenceText: {
    ...typography.caption,
    fontSize: 12,
    lineHeight: 16,
  },
  teamMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingTop: 2,
  },
  teamMetaText: {
    ...typography.caption,
    fontSize: 11,
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginTop: 4,
  },
  primaryButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    height: 40,
    borderRadius: radii.button,
  },
  primaryButtonText: {
    ...typography.caption,
    fontWeight: '700',
    color: '#FFFFFF',
    fontSize: 13,
  },
  outlineButton: {
    paddingHorizontal: spacing.md,
    height: 40,
    borderRadius: radii.button,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  outlineButtonText: {
    ...typography.caption,
    fontWeight: '600',
    fontSize: 12,
  },
  blockerBox: {
    borderRadius: radii.sm,
    padding: spacing.sm,
    gap: 4,
  },
  blockerText: {
    ...typography.caption,
    fontSize: 12,
    lineHeight: 16,
    fontWeight: '500',
  },
  originalAssignText: {
    ...typography.caption,
    fontSize: 11,
    marginTop: 2,
  },
  contingencyBox: {
    borderRadius: radii.sm,
    padding: spacing.sm,
    gap: 4,
  },
  contingencyText: {
    ...typography.caption,
    fontSize: 12,
    lineHeight: 16,
  },
  resolvedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingTop: 4,
  },
  resolvedText: {
    ...typography.caption,
    fontSize: 12,
    fontWeight: '600',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    borderTopLeftRadius: radii.card,
    borderTopRightRadius: radii.card,
    padding: spacing.cardPadding,
    gap: spacing.md,
    maxHeight: '85%',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  modalTitle: {
    ...typography.title,
    fontSize: 17,
  },
  modalCloseButton: {
    padding: 4,
  },
  modalDesc: {
    ...typography.caption,
    fontSize: 12,
    lineHeight: 16,
  },
  modalEvidenceBox: {
    borderRadius: radii.sm,
    padding: spacing.sm,
    gap: 4,
  },
  inputLabel: {
    ...typography.overline,
    fontSize: 10,
    fontWeight: '700',
  },
  notesInput: {
    borderWidth: 1,
    borderRadius: radii.sm,
    padding: spacing.sm,
    fontSize: 13,
    textAlignVertical: 'top',
  },
  modalActions: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.xs,
  },
  modalRejectButton: {
    flex: 1,
    height: 42,
    borderRadius: radii.button,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalRejectText: {
    ...typography.caption,
    fontWeight: '600',
    fontSize: 13,
  },
  modalApproveButton: {
    flex: 2,
    height: 42,
    borderRadius: radii.button,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalApproveText: {
    ...typography.caption,
    fontWeight: '700',
    color: '#FFFFFF',
    fontSize: 13,
  },
});
