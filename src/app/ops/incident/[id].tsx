/**
 * IncidentWorkspaceScreen — Coordinator Incident Console
 *
 * Screen B: Single unified incident coordination workspace:
 * - Incident details, severity, affected population, critical infrastructure at risk
 * - Required interventions & field constraints
 * - Available pumps, crews, boats (condition, capability, proximity)
 * - Explainable allocation recommendation with explicit constraint analysis
 * - Contingency & deadline assignment actions
 */

import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';

import { ErrorState } from '@/components/ErrorState';
import { InfoBar } from '@/components/InfoBar';
import {
  assignIntervention,
  fetchAllocationRecommendation,
  fetchIncidentDetail,
  fetchOperationalResources,
} from '@/services/operations-api';
import { useTheme } from '@/theme';
import { radii, spacing, touchTargets } from '@/theme/spacing';
import { typography } from '@/theme/typography';
import {
  AllocationRecommendation,
  IncidentRecord,
  InterventionRecord,
  OperationalResource,
} from '@/types/operations';

export default function IncidentWorkspaceScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { colors } = useTheme();

  const [incident, setIncident] = useState<IncidentRecord | null>(null);
  const [interventions, setInterventions] = useState<InterventionRecord[]>([]);
  const [resources, setResources] = useState<OperationalResource[]>([]);
  const [selectedIntervention, setSelectedIntervention] = useState<InterventionRecord | null>(null);
  const [recommendation, setRecommendation] = useState<AllocationRecommendation | null>(null);

  const [loading, setLoading] = useState(true);
  const [assigning, setAssigning] = useState(false);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [selectedTeamId, setSelectedTeamId] = useState<string>('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const loadAll = useCallback(async () => {
    if (!id) return;
    try {
      setErrorMsg(null);
      const [detail, resList] = await Promise.all([
        fetchIncidentDetail(id),
        fetchOperationalResources(),
      ]);

      if (!detail) {
        setErrorMsg(`Incident ${id} could not be located.`);
        return;
      }

      setIncident(detail.incident);
      setInterventions(detail.interventions);
      setResources(resList);

      if (detail.interventions.length > 0) {
        const first = detail.interventions[0];
        setSelectedIntervention(first);
        const rec = await fetchAllocationRecommendation(first.id);
        setRecommendation(rec);
        if (rec) setSelectedTeamId(rec.recommendedTeamId);
      }
    } catch (err: any) {
      setErrorMsg(err?.message || 'Failed to load incident workspace.');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadAll();
  }, [loadAll]);

  const handleSelectIntervention = async (item: InterventionRecord) => {
    setSelectedIntervention(item);
    const rec = await fetchAllocationRecommendation(item.id);
    setRecommendation(rec);
    if (rec) setSelectedTeamId(rec.recommendedTeamId);
  };

  const handleExecuteAssignment = async () => {
    if (!selectedIntervention || !selectedTeamId) return;

    try {
      setAssigning(true);
      const chosenTeam = resources.find((r) => r.id === selectedTeamId);
      const equipment = recommendation ? recommendation.recommendedEquipment : [];
      const deadline = recommendation ? recommendation.suggestedDeadlineMinutes : 30;

      const updated = await assignIntervention(
        selectedIntervention.id,
        selectedTeamId,
        equipment,
        deadline
      );

      setInterventions((prev) =>
        prev.map((i) => (i.id === updated.id ? updated : i))
      );
      setSelectedIntervention(updated);
      setShowAssignModal(false);

      Alert.alert(
        'Assignment Staged (Simulation)',
        `Intervention ${updated.id} assigned to ${chosenTeam?.name || selectedTeamId}. Deadline: ${deadline} minutes.\n\nNotice: Live server dispatch requires POST /api/v1/ops/interventions/${updated.id}/assign.`
      );
    } catch (err: any) {
      Alert.alert('Assignment Error', err?.message || 'Could not complete assignment.');
    } finally {
      setAssigning(false);
    }
  };

  if (loading) {
    return (
      <SafeAreaView
        edges={['top', 'left', 'right']}
        style={[styles.safeArea, { backgroundColor: colors.background }]}>
        <View style={styles.centerBox}>
          <ActivityIndicator size="small" color={colors.brandTeal} />
          <Text style={[styles.loadingText, { color: colors.textSecondary }]}>
            Loading incident intelligence & resource availability...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  if (errorMsg || !incident) {
    return (
      <SafeAreaView
        edges={['top', 'left', 'right']}
        style={[styles.safeArea, { backgroundColor: colors.background }]}>
        <View style={styles.header}>
          <Pressable onPress={() => router.back()} style={styles.backButton}>
            <Feather name="arrow-left" size={22} color={colors.textPrimary} />
          </Pressable>
          <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>
            Incident Workspace
          </Text>
        </View>
        <ErrorState message={errorMsg || 'Incident record unavailable.'} onRetry={loadAll} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView
      edges={['top', 'left', 'right']}
      style={[styles.safeArea, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable
          onPress={() => router.back()}
          style={styles.backButton}
          accessibilityRole="button"
          accessibilityLabel="Back to operations queue">
          <Feather name="arrow-left" size={22} color={colors.textPrimary} />
        </Pressable>
        <View style={styles.headerTitleWrap}>
          <Text style={[styles.headerId, typography.tabular, { color: colors.brandTeal }]}>
            {incident.id} · {incident.severity} SEVERITY
          </Text>
          <Text style={[styles.headerTitle, { color: colors.textPrimary }]} numberOfLines={1}>
            {incident.title}
          </Text>
        </View>
      </View>

      {/* Persistent Simulation Notice */}
      <InfoBar
        isSampleData={true}
        persistent={true}
        customMessage="SAMPLE DATA — OPERATIONAL SIMULATION — NOT LIVE OPERATIONS"
      />

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* 1. Situation Assessment Card */}
        <View style={[styles.card, { backgroundColor: colors.surface }]}>
          <View style={styles.locationRow}>
            <Feather name="map-pin" size={13} color={colors.textTertiary} />
            <Text style={[styles.locationText, { color: colors.textSecondary }]}>
              {incident.location}
            </Text>
          </View>

          <Text style={[styles.sectionHeading, { color: colors.textPrimary }]}>
            {incident.affectedAreaDescription}
          </Text>

          <View style={[styles.metaBox, { backgroundColor: colors.surfaceMuted }]}>
            <View style={styles.metaCol}>
              <Text style={[styles.metaKey, { color: colors.textTertiary }]}>
                Estimated Population:
              </Text>
              <Text style={[styles.metaVal, typography.tabular, { color: colors.textPrimary }]}>
                {incident.estimatedPopulationImpact.toLocaleString()} residents
              </Text>
            </View>
            <View style={styles.metaCol}>
              <Text style={[styles.metaKey, { color: colors.textTertiary }]}>
                Detection Source:
              </Text>
              <Text style={[styles.metaVal, { color: colors.textPrimary }]}>
                {incident.detectionSource}
              </Text>
            </View>
          </View>

          {/* Critical Assets at Risk */}
          <Text style={[styles.subHeading, { color: colors.textTertiary }]}>
            CRITICAL ASSETS THREATENED
          </Text>
          <View style={styles.chipRow}>
            {incident.criticalAssetsAtRisk.map((asset, idx) => (
              <View
                key={idx}
                style={[styles.assetChip, { backgroundColor: colors.surfaceMuted }]}>
                <Feather name="shield" size={11} color={colors.statusWatch} />
                <Text style={[styles.assetChipText, { color: colors.textSecondary }]}>
                  {asset}
                </Text>
              </View>
            ))}
          </View>
        </View>

        {/* 2. Required Interventions Selector */}
        <View style={styles.sectionWrap}>
          <Text style={[styles.sectionOverline, { color: colors.textTertiary }]}>
            REQUIRED FIELD INTERVENTIONS ({interventions.length})
          </Text>

          {interventions.map((item) => {
            const isSelected = selectedIntervention?.id === item.id;
            return (
              <Pressable
                key={item.id}
                onPress={() => handleSelectIntervention(item)}
                style={[
                  styles.interventionSelectorCard,
                  {
                    backgroundColor: isSelected
                      ? colors.surfaceMuted
                      : colors.surface,
                  },
                ]}>
                <View style={styles.interventionHeader}>
                  <View style={styles.badgeRow}>
                    <Text
                      style={[
                        styles.interventionType,
                        { color: colors.brandTeal },
                      ]}>
                      {item.type.replace(/_/g, ' ')}
                    </Text>
                    <Text
                      style={[
                        styles.priorityPill,
                        {
                          color:
                            item.priority === 'IMMEDIATE'
                              ? colors.statusActive
                              : colors.statusWatch,
                        },
                      ]}>
                      {item.priority}
                    </Text>
                  </View>
                  <Text
                    style={[
                      styles.statusPillSmall,
                      typography.tabular,
                      { color: colors.textTertiary },
                    ]}>
                    {item.status}
                  </Text>
                </View>

                <Text style={[styles.targetLocality, { color: colors.textPrimary }]}>
                  {item.targetLocality}
                </Text>
                <Text style={[styles.instructionSummary, { color: colors.textSecondary }]}>
                  {item.instructions}
                </Text>

                {/* Constraints Callout */}
                {item.constraints.length > 0 && (
                  <View style={styles.constraintsWrap}>
                    <Feather name="alert-circle" size={11} color={colors.statusWatch} />
                    <Text style={[styles.constraintsText, { color: colors.statusWatch }]}>
                      Constraints: {item.constraints.join(' · ')}
                    </Text>
                  </View>
                )}

                {/* Current assignment status */}
                {item.assignedTeamName && (
                  <View style={styles.currentTeamRow}>
                    <Feather name="user-check" size={12} color={colors.brandTeal} />
                    <Text style={[styles.currentTeamText, { color: colors.textSecondary }]}>
                      Assigned to: {item.assignedTeamName}
                    </Text>
                  </View>
                )}
              </Pressable>
            );
          })}
        </View>

        {/* 3. Resource Allocation Engine & Recommendation */}
        {selectedIntervention && (
          <View style={styles.sectionWrap}>
            <Text style={[styles.sectionOverline, { color: colors.textTertiary }]}>
              EXPLAINABLE ALLOCATION RECOMMENDATION ({selectedIntervention.id})
            </Text>

            {recommendation ? (
              <View style={[styles.card, { backgroundColor: colors.surface }]}>
                {/* Recommended Crew / Team */}
                <View style={styles.recommendationHeader}>
                  <View style={styles.recommendationIconBox}>
                    <Feather name="check-circle" size={20} color={colors.brandTeal} />
                  </View>
                  <View style={styles.recommendationInfo}>
                    <Text style={[styles.recommendationTitle, { color: colors.textPrimary }]}>
                      {recommendation.recommendedTeamName}
                    </Text>
                    <Text style={[styles.recommendationSubtitle, { color: colors.brandTeal }]}>
                      Suggested Deadline: {recommendation.suggestedDeadlineMinutes} minutes
                    </Text>
                  </View>
                </View>

                {/* Explainable Rationale */}
                <View style={[styles.rationaleBox, { backgroundColor: colors.surfaceMuted }]}>
                  <Text style={[styles.rationaleHeader, { color: colors.textSecondary }]}>
                    Matching Rationale:
                  </Text>
                  <Text style={[styles.rationaleBody, { color: colors.textPrimary }]}>
                    {recommendation.matchingRationale}
                  </Text>
                </View>

                {/* Equipment Pack */}
                <Text style={[styles.subHeading, { color: colors.textTertiary }]}>
                  RECOMMENDED EQUIPMENT SPECIFICATIONS
                </Text>
                {recommendation.recommendedEquipment.map((eq, idx) => (
                  <View key={idx} style={styles.bulletRow}>
                    <Feather name="package" size={12} color={colors.textTertiary} />
                    <Text style={[styles.bulletText, { color: colors.textSecondary }]}>
                      {eq}
                    </Text>
                  </View>
                ))}

                {/* Explicit Constraints & Missing Inputs */}
                {recommendation.missingInputs.length > 0 && (
                  <View style={[styles.warningBox, { backgroundColor: colors.statusWatchBg }]}>
                    <Feather name="help-circle" size={14} color={colors.statusWatch} />
                    <View style={styles.warningInfo}>
                      <Text style={[styles.warningTitle, { color: colors.statusWatch }]}>
                        Missing Inputs Requiring Field Verification:
                      </Text>
                      {recommendation.missingInputs.map((mi, idx) => (
                        <Text key={idx} style={[styles.warningItem, { color: colors.textPrimary }]}>
                          • {mi}
                        </Text>
                      ))}
                    </View>
                  </View>
                )}

                {/* Contingency Plan */}
                <View style={styles.contingencyBox}>
                  <Text style={[styles.contingencyTitle, { color: colors.textTertiary }]}>
                    CONTINGENCY PLAN:
                  </Text>
                  <Text style={[styles.contingencyText, { color: colors.textSecondary }]}>
                    {selectedIntervention.contingencyPlan}
                  </Text>
                </View>

                {/* Assignment Action Button */}
                {selectedIntervention.status === 'AWAITING_ASSIGNMENT' && (
                  <Pressable
                    onPress={() => setShowAssignModal(true)}
                    style={[styles.assignButton, { backgroundColor: colors.brandTeal }]}
                    accessibilityRole="button"
                    accessibilityLabel="Authorize and assign team">
                    <Feather name="send" size={16} color="#0B111A" />
                    <Text style={styles.assignButtonText}>
                      Confirm & Authorize Assignment
                    </Text>
                  </Pressable>
                )}
              </View>
            ) : (
              <View style={[styles.card, { backgroundColor: colors.surface }]}>
                <Text style={[styles.noRecText, { color: colors.textTertiary }]}>
                  Awaiting backend resource optimizer response for this task type.
                </Text>
              </View>
            )}
          </View>
        )}

        {/* 4. Available Pool of Operational Resources */}
        <View style={styles.sectionWrap}>
          <Text style={[styles.sectionOverline, { color: colors.textTertiary }]}>
            ELIGIBLE POOL RESOURCES ({resources.length})
          </Text>

          {resources.map((res) => (
            <View
              key={res.id}
              style={[styles.resourceCard, { backgroundColor: colors.surface }]}>
              <View style={styles.resourceHeader}>
                <Text style={[styles.resourceName, { color: colors.textPrimary }]}>
                  {res.name}
                </Text>
                <Text
                  style={[
                    styles.conditionBadge,
                    {
                      color:
                        res.operationalCondition === 'OPERATIONAL'
                          ? colors.statusResolved
                          : colors.statusActive,
                    },
                  ]}>
                  {res.operationalCondition}
                </Text>
              </View>

              <Text style={[styles.resourceSpecs, { color: colors.textSecondary }]}>
                {res.specifications}
              </Text>

              <View style={styles.resourceFooter}>
                <Text style={[styles.resourceMeta, typography.tabular, { color: colors.textTertiary }]}>
                  Base: {res.currentBaseLocation} · {res.proximityKm}km away
                </Text>
                <Text
                  style={[
                    styles.resourceStatus,
                    {
                      color:
                        res.availabilityStatus === 'AVAILABLE'
                          ? colors.brandTeal
                          : colors.statusWatch,
                    },
                  ]}>
                  {res.availabilityStatus}
                </Text>
              </View>
            </View>
          ))}
        </View>
      </ScrollView>

      {/* Assignment Modal */}
      <Modal
        visible={showAssignModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowAssignModal(false)}>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalCard, { backgroundColor: colors.surface }]}>
            <View style={styles.modalHeader}>
              <Feather name="check-square" size={20} color={colors.brandTeal} />
              <Text style={[styles.modalTitle, { color: colors.textPrimary }]}>
                Stage Operational Assignment
              </Text>
            </View>

            <Text style={[styles.modalDesc, { color: colors.textSecondary }]}>
              Confirm crew and equipment dispatch for{' '}
              <Text style={{ fontWeight: '700', color: colors.textPrimary }}>
                {selectedIntervention?.targetLocality}
              </Text>
              .
            </Text>

            {/* Team Picker */}
            <Text style={[styles.modalLabel, { color: colors.textTertiary }]}>
              SELECT DISPATCH CREW / UNIT:
            </Text>
            {resources
              .filter((r) => r.category === 'CREW')
              .map((crew) => {
                const isSelected = selectedTeamId === crew.id;
                return (
                  <Pressable
                    key={crew.id}
                    onPress={() => setSelectedTeamId(crew.id)}
                    style={[
                      styles.teamOption,
                      {
                        backgroundColor: isSelected
                          ? colors.surfaceMuted
                          : 'transparent',
                      },
                    ]}>
                    <Text style={[styles.teamOptionName, { color: colors.textPrimary }]}>
                      {crew.name}
                    </Text>
                    <Text style={[styles.teamOptionDist, typography.tabular, { color: colors.textTertiary }]}>
                      {crew.proximityKm}km
                    </Text>
                  </Pressable>
                );
              })}

            <View style={styles.modalActions}>
              <Pressable
                onPress={() => setShowAssignModal(false)}
                style={[styles.modalCancel, { backgroundColor: colors.surfaceMuted }]}>
                <Text style={[styles.modalCancelText, { color: colors.textSecondary }]}>
                  Cancel
                </Text>
              </Pressable>

              <Pressable
                onPress={handleExecuteAssignment}
                disabled={assigning}
                style={[styles.modalConfirm, { backgroundColor: colors.brandTeal }]}>
                {assigning ? (
                  <ActivityIndicator size="small" color="#0B111A" />
                ) : (
                  <Text style={styles.modalConfirmText}>
                    Stage Assignment
                  </Text>
                )}
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  centerBox: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    padding: spacing.xl,
  },
  loadingText: {
    ...typography.caption,
    fontSize: 13,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.screenPadding,
    paddingTop: spacing.sm,
    paddingBottom: spacing.xs,
    gap: spacing.sm,
  },
  backButton: {
    width: touchTargets.min,
    height: touchTargets.min,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitleWrap: {
    flex: 1,
    gap: 2,
  },
  headerId: {
    ...typography.overline,
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.8,
  },
  headerTitle: {
    ...typography.title,
    fontSize: 18,
    lineHeight: 22,
  },
  scrollContent: {
    paddingHorizontal: spacing.screenPadding,
    paddingTop: spacing.xs,
    paddingBottom: spacing.xxxl,
    gap: spacing.md,
  },
  card: {
    borderRadius: radii.card,
    padding: spacing.cardPadding,
    gap: spacing.sm,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  locationText: {
    ...typography.caption,
    fontSize: 12,
  },
  sectionHeading: {
    ...typography.bodyMedium,
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '600',
  },
  metaBox: {
    borderRadius: radii.sm,
    padding: spacing.md,
    gap: spacing.xs,
  },
  metaCol: {
    gap: 1,
  },
  metaKey: {
    ...typography.caption,
    fontSize: 11,
  },
  metaVal: {
    ...typography.caption,
    fontSize: 13,
    fontWeight: '600',
  },
  subHeading: {
    ...typography.overline,
    fontSize: 10,
    letterSpacing: 0.6,
    marginTop: 4,
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
  },
  assetChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: spacing.sm + 2,
    paddingVertical: spacing.xs,
    borderRadius: radii.xs,
  },
  assetChipText: {
    ...typography.caption,
    fontSize: 11,
  },
  sectionWrap: {
    gap: spacing.xs,
  },
  sectionOverline: {
    ...typography.overline,
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.6,
  },
  interventionSelectorCard: {
    borderRadius: radii.card,
    padding: spacing.cardPadding,
    gap: 6,
    marginBottom: spacing.xs,
  },
  interventionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  interventionType: {
    ...typography.caption,
    fontSize: 12,
    fontWeight: '700',
  },
  priorityPill: {
    ...typography.overline,
    fontSize: 10,
    fontWeight: '800',
  },
  statusPillSmall: {
    ...typography.caption,
    fontSize: 11,
  },
  targetLocality: {
    ...typography.bodyMedium,
    fontSize: 14,
    fontWeight: '700',
  },
  instructionSummary: {
    ...typography.body,
    fontSize: 13,
    lineHeight: 18,
  },
  constraintsWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 2,
  },
  constraintsText: {
    ...typography.caption,
    fontSize: 11,
  },
  currentTeamRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginTop: 2,
  },
  currentTeamText: {
    ...typography.caption,
    fontSize: 12,
  },
  recommendationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  recommendationIconBox: {
    width: 36,
    height: 36,
    borderRadius: radii.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  recommendationInfo: {
    flex: 1,
    gap: 2,
  },
  recommendationTitle: {
    ...typography.cardTitle,
    fontSize: 15,
  },
  recommendationSubtitle: {
    ...typography.caption,
    fontSize: 12,
    fontWeight: '600',
  },
  rationaleBox: {
    borderRadius: radii.sm,
    padding: spacing.md,
    gap: 4,
  },
  rationaleHeader: {
    ...typography.caption,
    fontSize: 11,
    fontWeight: '600',
  },
  rationaleBody: {
    ...typography.body,
    fontSize: 13,
    lineHeight: 18,
  },
  bulletRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  bulletText: {
    ...typography.caption,
    fontSize: 12,
  },
  warningBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
    padding: spacing.md,
    borderRadius: radii.sm,
  },
  warningInfo: {
    flex: 1,
    gap: 2,
  },
  warningTitle: {
    ...typography.caption,
    fontSize: 12,
    fontWeight: '700',
  },
  warningItem: {
    ...typography.caption,
    fontSize: 11,
    lineHeight: 16,
  },
  contingencyBox: {
    gap: 2,
    paddingTop: 4,
  },
  contingencyTitle: {
    ...typography.overline,
    fontSize: 10,
  },
  contingencyText: {
    ...typography.caption,
    fontSize: 12,
    lineHeight: 17,
  },
  assignButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    height: touchTargets.min,
    borderRadius: radii.button,
    marginTop: spacing.xs,
  },
  assignButtonText: {
    ...typography.bodyMedium,
    color: '#0B111A',
    fontWeight: '700',
    fontSize: 14,
  },
  noRecText: {
    ...typography.caption,
    fontSize: 12,
  },
  resourceCard: {
    borderRadius: radii.card,
    padding: spacing.cardPadding,
    gap: 4,
    marginBottom: spacing.xs,
  },
  resourceHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  resourceName: {
    ...typography.bodyMedium,
    fontSize: 13,
    fontWeight: '700',
    flex: 1,
  },
  conditionBadge: {
    ...typography.overline,
    fontSize: 9,
    fontWeight: '700',
  },
  resourceSpecs: {
    ...typography.caption,
    fontSize: 12,
    lineHeight: 16,
  },
  resourceFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 2,
  },
  resourceMeta: {
    ...typography.caption,
    fontSize: 11,
  },
  resourceStatus: {
    ...typography.caption,
    fontSize: 11,
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
  modalLabel: {
    ...typography.overline,
    fontSize: 10,
    marginTop: 4,
  },
  teamOption: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: spacing.sm,
    borderRadius: radii.sm,
  },
  teamOptionName: {
    ...typography.bodyMedium,
    fontSize: 13,
  },
  teamOptionDist: {
    ...typography.caption,
    fontSize: 12,
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
    color: '#0B111A',
    fontWeight: '700',
    fontSize: 14,
  },
});
