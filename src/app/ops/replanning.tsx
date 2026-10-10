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
  Image,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { router } from 'expo-router';

import { EmptyState } from '@/components/EmptyState';
import { ErrorState } from '@/components/ErrorState';
import { InfoBar } from '@/components/InfoBar';
import { NgoScopeNote } from '@/components/NgoScopeNote';
import { OpsBottomNavBar } from '@/components/OpsBottomNavBar';
import { SkeletonCard } from '@/components/SkeletonCard';
import { StatusChip } from '@/components/StatusChip';
import { useToast } from '@/components/Toast';
import { TaskHistory } from '@/components/TaskHistory';
import { VerificationStatus } from '@/components/VerificationStatus';
import { api } from '@/services/api';
import { useConfirmExitAtRoot } from '@/hooks/use-confirm-exit-at-root';
import { useTheme } from '@/theme';
import { radii, spacing, touchTargets } from '@/theme/spacing';
import { typography } from '@/theme/typography';
import { InterventionRecord, OperationalResource, ReplanningRecord } from '@/types/operations';

type TabView = 'VERIFICATION' | 'REPLANNING';

export default function VerificationAndReplanningScreen() {
  const toast = useToast();
  const { colors } = useTheme();
  useConfirmExitAtRoot();

  const [activeTab, setActiveTab] = useState<TabView>('VERIFICATION');
  const [verificationItems, setVerificationItems] = useState<InterventionRecord[]>([]);
  const [replanningItems, setReplanningItems] = useState<ReplanningRecord[]>([]);
  const [unavailableResources, setUnavailableResources] = useState<OperationalResource[]>([]);
  const [showDecided, setShowDecided] = useState(false);
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
      const [ordersRes, replanRes, resourcesRes] = await Promise.all([
        api.getWorkOrders(),
        api.getReassignments(),
        api.getResources(),
      ]);
      const allInterventions = ordersRes.data;
      const replanRecords = replanRes.data;
      setUnavailableResources(
        resourcesRes.data.filter((r) => r.operationalCondition !== 'OPERATIONAL')
      );
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
      const result = await api.verify(selectedVerification.id, approved);
      const prefix = result.source === 'sample' ? 'Simulated: ' : '';
      toast(
        approved
          ? `${prefix}${selectedVerification.id} checked. Final verification is up to the authority.`
          : `${prefix}${selectedVerification.id} sent back to the field team.`
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
      const actual = replanInstructions.trim() || selectedReplanning.recommendedAlternative;
      const result = await api.reassign(selectedReplanning.id, actual);
      toast(
        `${result.source === 'sample' ? 'Simulated: ' : ''}${selectedReplanning.interventionId} goes back to the assignment queue.` +
          (result.source === 'sample' ? ' No crew was notified.' : '')
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

  const pendingReplans = replanningItems.filter((r) => r.status !== 'REASSIGNED');
  const decidedReplans = replanningItems.filter((r) => r.status === 'REASSIGNED');

  const renderVerificationCard = ({ item }: { item: InterventionRecord }) => {
    return (
      <View style={[styles.card, { backgroundColor: colors.surface }]}>
        <View style={styles.cardHeader}>
          <View style={styles.badgeRow}>
            <StatusChip label="Awaiting sign-off" tone="info" />
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
            {item.completionEvidence || 'No note submitted.'}
          </Text>
          {item.completionPhotoUris && item.completionPhotoUris.length > 0 && (
            <View style={styles.photoRow}>
              {item.completionPhotoUris.map((uri) => (
                <Image key={uri} source={{ uri }} style={styles.photo} accessibilityLabel="Evidence photo" />
              ))}
            </View>
          )}
        </View>
        <VerificationStatus item={item} />
        <TaskHistory history={item.history} />

        {/* Team attribution */}
        <View style={styles.teamMeta}>
          <Feather name="users" size={13} color={colors.textTertiary} />
          <Text style={[styles.teamMetaText, { color: colors.textTertiary }]}>
            Assigned: {item.assignedWorkerName ?? item.assignedTeamName ?? 'Field Unit'}
            {item.assignedWorkerIsVolunteer ? ' (Volunteer)' : ''} • Equipment: {item.assignedEquipment?.join(', ') || 'Standard kit'}
          </Text>
        </View>

        {/* Actions */}
        <View style={styles.actionRow}>
          {item.ngoVerification?.status !== 'VERIFIED' && (
            <Pressable
              onPress={() => setSelectedVerification(item)}
              accessibilityRole="button"
              accessibilityLabel={`Audit evidence and sign off ${item.id}`}
              style={[styles.primaryButton, { backgroundColor: colors.actionPrimary }]}>
              <Text style={[styles.primaryButtonText, { color: colors.onActionPrimary }]}>Verify</Text>
            </Pressable>
          )}
          <Pressable
            onPress={() => router.push({ pathname: '/ops/incident/[id]', params: { id: item.incidentId } })}
            accessibilityRole="button"
            accessibilityLabel="Open incident"
            style={styles.outlineButton}>
            <Text style={[styles.outlineButtonText, { color: colors.actionPrimary }]}>
              Open incident
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
            <StatusChip
              label={item.triggerReason.replace(/_/g, ' ').toLowerCase().replace(/^\w/, (c) => c.toUpperCase())}
              tone={isResolved ? 'neutral' : 'critical'}
            />
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
            <Text style={[styles.evidenceTitle, { color: colors.textSecondary }]}>
              RECOMMENDED (BACKEND)
            </Text>
          </View>
          <Text style={[styles.contingencyText, { color: colors.textPrimary }]}>
            {item.recommendedAlternative}
          </Text>
          {item.actualAssignment && (
            <>
              <Text style={[styles.evidenceTitle, styles.actualTitle, { color: colors.textSecondary }]}>
                ACTUAL{item.actualAssignment !== item.recommendedAlternative ? ' (DIFFERS)' : ''}
              </Text>
              <Text style={[styles.contingencyText, { color: colors.textPrimary }]}>
                {item.actualAssignment}
              </Text>
            </>
          )}
        </View>

        {/* Dispatch Action */}
        {!isResolved ? (
          <View style={styles.actionRow}>
            <Pressable
              onPress={() => {
                setSelectedReplanning(item);
                setReplanInstructions(item.recommendedAlternative);
              }}
              accessibilityRole="button"
              accessibilityLabel={`Reassign ${item.interventionId}`}
              style={[styles.primaryButton, { backgroundColor: colors.actionPrimary }]}>
              <Text style={[styles.primaryButtonText, { color: colors.onActionPrimary }]}>Reassign</Text>
            </Pressable>
          </View>
        ) : (
          <View style={styles.resolvedRow}>
            <Feather name="check" size={14} color={colors.brandTeal} />
            <Text style={[styles.resolvedText, { color: colors.brandTeal }]}>
              Decided{item.decidedAt ? ` ${new Date(item.decidedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}` : ''}
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
          <Text style={[styles.screenTitle, { color: colors.textPrimary }]}>Replan & verify</Text>
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
      <NgoScopeNote />

      {/* Tab Switcher */}
      <View style={[styles.tabBar, { borderBottomColor: colors.border }]}>
        <Pressable
          accessibilityRole="button"
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

          accessibilityRole="button"
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
            Replan ({pendingReplans.length})
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
              title="Nothing to verify"
              description="No completed work is waiting for sign-off."
            />
          }
        />
      ) : (
        <FlatList
          data={showDecided ? [...pendingReplans, ...decidedReplans] : pendingReplans}
          keyExtractor={(item) => item.id}
          renderItem={renderReplanningCard}
          ListFooterComponent={
            <View style={styles.footer}>
              {unavailableResources.length > 0 && (
                <View style={[styles.card, { backgroundColor: colors.surface }]}>
                  <Text style={[styles.evidenceTitle, { color: colors.textSecondary }]}>
                    RESOURCES OUT OF ACTION ({unavailableResources.length})
                  </Text>
                  {unavailableResources.map((r) => (
                    <Text key={r.id} style={[styles.localityText, { color: colors.textPrimary }]}>
                      {r.name} · {r.operationalCondition.replace(/_/g, ' ').toLowerCase()}
                    </Text>
                  ))}
                </View>
              )}
              {decidedReplans.length > 0 && (
                <Pressable
                  onPress={() => setShowDecided((v) => !v)}
                  style={styles.disclosureRow}
                  accessibilityRole="button"
                  accessibilityState={{ expanded: showDecided }}>
                  <Text style={[styles.localityText, { color: colors.textSecondary }]}>
                    {showDecided ? 'Hide' : 'Show'} decided ({decidedReplans.length})
                  </Text>
                  <Feather
                    name={showDecided ? 'chevron-up' : 'chevron-down'}
                    size={16}
                    color={colors.textTertiary}
                  />
                </Pressable>
              )}
            </View>
          }
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
              title="Nothing to replan"
              description="No failed work, blocked routes or equipment failures are waiting for a decision."
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
        <View style={[styles.modalOverlay, { backgroundColor: colors.scrim }]}>
          <View style={[styles.modalContent, { backgroundColor: colors.surface }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.textPrimary }]}>
                Verify completion
              </Text>
              <Pressable
                accessibilityRole="button"
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
                {selectedVerification?.completionEvidence || 'No note submitted.'}
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
                accessibilityRole="button"
                onPress={() => handleSignOff(false)}
                disabled={actionLoading}
                style={[styles.modalRejectButton, { borderColor: colors.border }]}>
                <Text style={[styles.modalRejectText, { color: colors.textSecondary }]}>
                  Reject / Reopen
                </Text>
              </Pressable>
              <Pressable
                accessibilityRole="button"
                onPress={() => handleSignOff(true)}
                disabled={actionLoading}
                style={[styles.modalApproveButton, { backgroundColor: colors.actionPrimary }]}>
                <Text style={[styles.modalApproveText, { color: colors.onActionPrimary }]}>
                  {actionLoading ? 'Saving…' : 'Verify'}
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
        <View style={[styles.modalOverlay, { backgroundColor: colors.scrim }]}>
          <View style={[styles.modalContent, { backgroundColor: colors.surface }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.textPrimary }]}>
                Reassign
              </Text>
              <Pressable
                accessibilityRole="button"
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
                RECOMMENDED (BACKEND):
              </Text>
              <Text style={[styles.evidenceText, { color: colors.textPrimary }]}>
                {selectedReplanning?.recommendedAlternative}
              </Text>
            </View>

            <Text style={[styles.inputLabel, { color: colors.textTertiary }]}>
              ACTUAL ASSIGNMENT (EDIT IF DIFFERENT)
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
                accessibilityRole="button"
                onPress={() => setSelectedReplanning(null)}
                style={[styles.modalRejectButton, { borderColor: colors.border }]}>
                <Text style={[styles.modalRejectText, { color: colors.textSecondary }]}>
                  Cancel
                </Text>
              </Pressable>
              <Pressable
                accessibilityRole="button"
                onPress={handleExecuteReplanning}
                disabled={actionLoading}
                style={[styles.modalApproveButton, { backgroundColor: colors.actionPrimary }]}>
                <Text style={[styles.modalApproveText, { color: colors.onActionPrimary }]}>
                  {actionLoading ? 'Saving…' : 'Confirm reassignment'}
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
  photoRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
  photo: {
    width: 64,
    height: 64,
    borderRadius: radii.sm,
  },
  actualTitle: {
    marginTop: spacing.sm,
  },
  footer: {
    gap: spacing.sm,
  },
  disclosureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    minHeight: touchTargets.min,
    paddingHorizontal: spacing.xs,
  },
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
    minHeight: 40,
    borderRadius: radii.button,
  },
  primaryButtonText: {
    ...typography.caption,
    fontWeight: '700',
    fontSize: 13,
  },
  outlineButton: {
    paddingHorizontal: spacing.md,
    minHeight: 40,
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
    minHeight: 42,
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
    minHeight: 42,
    borderRadius: radii.button,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalApproveText: {
    ...typography.caption,
    fontWeight: '700',
    fontSize: 13,
  },
});
