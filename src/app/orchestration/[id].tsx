/**
 * OrchestrationScreen — Central Disaster-Response Decision Support
 *
 * Core orchestration engine combining:
 * 1. Consolidated situation assessment with source provenance & conflict flags
 * 2. Prioritized needs, affected sectors & unresolved information gaps
 * 3. Evidence-traceable action recommendations (distinguishing recommendations from decisions)
 * 4. NGO capability & resource matching
 * 5. Multi-agency response coordination & outcome tracking
 */

import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { useLocalSearchParams } from 'expo-router';

import { ErrorState } from '@/components/ErrorState';
import { InfoBar } from '@/components/InfoBar';
import { SAMPLE_FLOOD_EVENTS } from '@/fixtures/sample-events';
import {
  fetchActionRecommendations,
  fetchNgoCapabilityMatches,
  fetchOutcomeUpdates,
  fetchPrioritizedNeeds,
  fetchResponseCoordinationTasks,
  fetchSituationAssessment,
  updateActionLifecycle,
  updateCoordinationTaskStatus,
} from '@/services/orchestration-api';
import { useGoBack } from '@/navigation/use-go-back';
import { useTheme } from '@/theme';
import { radii, spacing, touchTargets } from '@/theme/spacing';
import { typography } from '@/theme/typography';
import { FloodEvent } from '@/types/disaster';
import {
  ActionLifecycle,
  ActionRecommendation,
  CoordinationStatus,
  NgoCapabilityMatch,
  OutcomeUpdateEntry,
  PrioritizedNeed,
  ResponseCoordinationTask,
  SituationAssessment,
  UrgencyLevel,
} from '@/types/orchestration';

type SectionTab = 'SITUATION' | 'NEEDS' | 'ACTIONS' | 'COORDINATION';

export default function OrchestrationScreen() {
  const goBack = useGoBack();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { colors } = useTheme();

  const [activeTab, setActiveTab] = useState<SectionTab>('SITUATION');
  const [event, setEvent] = useState<FloodEvent | null>(null);
  const [assessment, setAssessment] = useState<SituationAssessment | null>(null);
  const [needs, setNeeds] = useState<PrioritizedNeed[]>([]);
  const [actions, setActions] = useState<ActionRecommendation[]>([]);
  const [ngoMatches, setNgoMatches] = useState<NgoCapabilityMatch[]>([]);
  const [tasks, setTasks] = useState<ResponseCoordinationTask[]>([]);
  const [outcomes, setOutcomes] = useState<OutcomeUpdateEntry[]>([]);

  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [actionUpdating, setActionUpdating] = useState(false);

  const loadAllData = useCallback(async () => {
    if (!id) return;
    try {
      const foundEvent = SAMPLE_FLOOD_EVENTS.find((e) => e.id === id);
      setEvent(foundEvent || null);

      const [ass, nds, acts, ngos, tsk, outc] = await Promise.all([
        fetchSituationAssessment(id),
        fetchPrioritizedNeeds(id),
        fetchActionRecommendations(id),
        fetchNgoCapabilityMatches(id),
        fetchResponseCoordinationTasks(id),
        fetchOutcomeUpdates(id),
      ]);

      setAssessment(ass);
      setNeeds(nds);
      setActions(acts);
      setNgoMatches(ngos);
      setTasks(tsk);
      setOutcomes(outc);
    } catch (err: any) {
      setErrorMsg(err?.message || 'Failed to load orchestration data.');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadAllData();
  }, [loadAllData]);

  const handleAuthorizeAction = async (actionId: string, currentLifecycle: ActionLifecycle) => {
    if (!id) return;
    try {
      setActionUpdating(true);
      const nextState: ActionLifecycle =
        currentLifecycle === 'RECOMMENDATION'
          ? 'AUTHORIZED_DECISION'
          : 'COMPLETED';

      const updated = await updateActionLifecycle(
        id,
        actionId,
        nextState,
        'Field Operations Desk'
      );

      setActions((prev) =>
        prev.map((a) => (a.id === updated.id ? updated : a))
      );

      // Reload outcomes to show updated audit trail
      const freshOutcomes = await fetchOutcomeUpdates(id);
      setOutcomes(freshOutcomes);

      Alert.alert(
        'Action Status Updated',
        `Action is now recorded as: ${nextState}. Traceable to source evidence.`
      );
    } catch (err: any) {
      Alert.alert('Update Failed', err?.message || 'Could not update action.');
    } finally {
      setActionUpdating(false);
    }
  };

  const handleToggleTaskStatus = async (taskId: string, currentStatus: CoordinationStatus) => {
    if (!id) return;
    try {
      const nextStatus: CoordinationStatus =
        currentStatus === 'PROPOSED'
          ? 'IN_PROGRESS'
          : currentStatus === 'IN_PROGRESS'
          ? 'COMPLETED'
          : 'PROPOSED';

      const updated = await updateCoordinationTaskStatus(id, taskId, nextStatus);
      setTasks((prev) => prev.map((t) => (t.id === updated.id ? updated : t)));
    } catch (err: any) {
      Alert.alert('Error', err?.message || 'Failed to update coordination task.');
    }
  };

  const getUrgencyColor = (urgency: UrgencyLevel) => {
    switch (urgency) {
      case 'CRITICAL':
        return colors.statusActive;
      case 'HIGH':
        return colors.statusWatch;
      case 'MODERATE':
      case 'ROUTINE':
        return colors.brandPrimary;
      default:
        return colors.textSecondary;
    }
  };

  const getLifecycleBadge = (lifecycle: ActionLifecycle) => {
    switch (lifecycle) {
      case 'RECOMMENDATION':
        return {
          label: 'PROPOSED RECOMMENDATION',
          color: colors.statusWatch,
          bg: colors.statusWatchBg,
        };
      case 'AUTHORIZED_DECISION':
        return {
          label: 'AUTHORIZED DECISION',
          color: colors.brandPrimary,
          bg: colors.surfaceMuted,
        };
      case 'COMPLETED':
        return {
          label: 'COMPLETED ACTION',
          color: colors.statusResolved,
          bg: colors.statusResolvedBg,
        };
    }
  };

  if (loading) {
    return (
      <SafeAreaView
        edges={['top', 'left', 'right']}
        style={[styles.safeArea, { backgroundColor: colors.background }]}>
        <View style={styles.centerBox}>
          <ActivityIndicator size="small" color={colors.brandPrimary} />
          <Text style={[styles.loadingText, { color: colors.textSecondary }]}>
            Compiling multi-source situational assessment...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  if (errorMsg || !event) {
    return (
      <SafeAreaView
        edges={['top', 'left', 'right']}
        style={[styles.safeArea, { backgroundColor: colors.background }]}>
        <View style={styles.header}>
          <Pressable onPress={goBack} style={styles.backButton}>
            <Feather name="arrow-left" size={22} color={colors.textPrimary} />
          </Pressable>
          <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>
            Orchestration
          </Text>
        </View>
        <ErrorState
          message={errorMsg || 'Situation intelligence not available.'}
          onRetry={loadAllData}
        />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView
      edges={['top', 'left', 'right']}
      style={[styles.safeArea, { backgroundColor: colors.background }]}>
      {/* Top Header */}
      <View style={styles.header}>
        <Pressable
          onPress={goBack}
          style={styles.backButton}
          accessibilityRole="button"
          accessibilityLabel="Back to situation">
          <Feather name="arrow-left" size={22} color={colors.textPrimary} />
        </Pressable>
        <View style={styles.headerTitleWrap}>
          <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>
            Response Orchestration
          </Text>
          <Text style={[styles.headerSubtitle, { color: colors.textTertiary }]}>
            {event.title}
          </Text>
        </View>
      </View>

      {/* Persistent Sample Data Notice */}
      <InfoBar isSampleData={true} />

      {/* Orchestration Tabs */}
      <View style={styles.tabBar}>
        {[
          { key: 'SITUATION', label: 'Situation' },
          { key: 'NEEDS', label: `Needs (${needs.length})` },
          { key: 'ACTIONS', label: `Actions (${actions.length})` },
          { key: 'COORDINATION', label: 'Coordination' },
        ].map((tab) => {
          const isSelected = activeTab === tab.key;
          return (
            <Pressable
              key={tab.key}
              onPress={() => setActiveTab(tab.key as SectionTab)}
              style={[
                styles.tabItem,
                {
                  backgroundColor: isSelected
                    ? colors.surfaceMuted
                    : colors.surface,
                },
              ]}>
              <Text
                style={[
                  styles.tabText,
                  {
                    color: isSelected
                      ? colors.textPrimary
                      : colors.textTertiary,
                    fontWeight: isSelected ? '700' : '400',
                  },
                ]}>
                {tab.label}
              </Text>
            </Pressable>
          );
        })}
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* ── TAB 1: SITUATION PICTURE ────────────────────────── */}
        {activeTab === 'SITUATION' && (
          <View style={styles.sectionStack}>
            {/* Status & Freshness Summary Card */}
            <View style={[styles.card, { backgroundColor: colors.surface }]}>
              <View style={styles.cardHeaderRow}>
                <View style={styles.badgeRow}>
                  <View
                    style={[
                      styles.statusDot,
                      {
                        backgroundColor:
                          assessment?.status === 'CRITICAL'
                            ? colors.statusActive
                            : colors.statusWatch,
                      },
                    ]}
                  />
                  <Text
                    style={[
                      styles.badgeText,
                      {
                        color:
                          assessment?.status === 'CRITICAL'
                            ? colors.statusActive
                            : colors.statusWatch,
                      },
                    ]}>
                    ASSESSMENT: {assessment?.status || 'MONITORING'}
                  </Text>
                </View>
                <Text
                  style={[
                    styles.timeCaption,
                    typography.tabular,
                    { color: colors.textTertiary },
                  ]}>
                  Freshness: {assessment?.freshness || event.freshness}
                </Text>
              </View>

              <Text style={[styles.summaryText, { color: colors.textPrimary }]}>
                {event.summary}
              </Text>

              {/* Provenance breakdown metrics */}
              <View style={styles.provenanceBox}>
                <Text
                  style={[
                    styles.provenanceTitle,
                    { color: colors.textSecondary },
                  ]}>
                  Multi-Source Provenance Ingestion:
                </Text>
                <View style={styles.provenancePillRow}>
                  <View
                    style={[
                      styles.provenancePill,
                      { backgroundColor: colors.surfaceMuted },
                    ]}>
                    <Feather name="shield" size={11} color={colors.brandPrimary} />
                    <Text
                      style={[
                        styles.provenancePillText,
                        { color: colors.textPrimary },
                      ]}>
                      Govt: {assessment?.provenance.governmentCount ?? 1}
                    </Text>
                  </View>
                  <View
                    style={[
                      styles.provenancePill,
                      { backgroundColor: colors.surfaceMuted },
                    ]}>
                    <Feather name="activity" size={11} color={colors.statusResolved} />
                    <Text
                      style={[
                        styles.provenancePillText,
                        { color: colors.textPrimary },
                      ]}>
                      Gauges: {assessment?.provenance.gaugeCount ?? 1}
                    </Text>
                  </View>
                  <View
                    style={[
                      styles.provenancePill,
                      { backgroundColor: colors.surfaceMuted },
                    ]}>
                    <Feather name="user" size={11} color={colors.statusWatch} />
                    <Text
                      style={[
                        styles.provenancePillText,
                        { color: colors.textPrimary },
                      ]}>
                      Citizen: {assessment?.provenance.citizenReportsCount ?? 2}
                    </Text>
                  </View>
                  <View
                    style={[
                      styles.provenancePill,
                      { backgroundColor: colors.surfaceMuted },
                    ]}>
                    <Feather name="check-circle" size={11} color={colors.brandPrimary} />
                    <Text
                      style={[
                        styles.provenancePillText,
                        { color: colors.textPrimary },
                      ]}>
                      NGO: {assessment?.provenance.verifiedNgoCount ?? 1}
                    </Text>
                  </View>
                </View>
              </View>

              {/* Uncertainty Gauge */}
              <View style={styles.uncertaintyBox}>
                <View style={styles.cardHeaderRow}>
                  <Text
                    style={[
                      styles.uncertaintyLabel,
                      { color: colors.textSecondary },
                    ]}>
                    Uncertainty Index:
                  </Text>
                  <Text
                    style={[
                      styles.uncertaintyScore,
                      typography.tabular,
                      { color: colors.statusWatch },
                    ]}>
                    {assessment?.uncertaintyScore ?? 25}%
                  </Text>
                </View>
                <Text
                  style={[
                    styles.uncertaintyRationale,
                    { color: colors.textTertiary },
                  ]}>
                  {assessment?.uncertaintyRationale ||
                    'Telemetry confidence high; localized runoff dynamics unverified.'}
                </Text>
              </View>
            </View>

            {/* Conflicting Reports Section */}
            {assessment?.conflictingReports &&
              assessment.conflictingReports.length > 0 && (
                <View style={styles.sectionBlock}>
                  <Text
                    style={[
                      styles.sectionHeading,
                      { color: colors.statusWatch },
                    ]}>
                    REPORT DISCREPANCIES DETECTED
                  </Text>
                  {assessment.conflictingReports.map((cnf) => (
                    <View
                      key={cnf.id}
                      style={[
                        styles.card,
                        { backgroundColor: colors.surface },
                      ]}>
                      <View style={styles.cardHeaderRow}>
                        <Text
                          style={[
                            styles.conflictTopic,
                            { color: colors.textPrimary },
                          ]}>
                          {cnf.topic}
                        </Text>
                        <Text
                          style={[
                            styles.conflictConfidence,
                            { color: colors.statusWatch },
                          ]}>
                          Confidence: {cnf.confidence}
                        </Text>
                      </View>
                      <Text
                        style={[
                          styles.conflictDesc,
                          { color: colors.textSecondary },
                        ]}>
                        {cnf.discrepancy}
                      </Text>
                      <View style={styles.verificationNote}>
                        <Feather
                          name="compass"
                          size={12}
                          color={colors.brandPrimary}
                        />
                        <Text
                          style={[
                            styles.verificationText,
                            { color: colors.textTertiary },
                          ]}>
                          Verification: {cnf.suggestedVerification}
                        </Text>
                      </View>
                    </View>
                  ))}
                </View>
              )}
          </View>
        )}

        {/* ── TAB 2: PRIORITIZED NEEDS & GAPS ─────────────────── */}
        {activeTab === 'NEEDS' && (
          <View style={styles.sectionStack}>
            <Text
              style={[styles.sectionHeading, { color: colors.textTertiary }]}>
              FIELD NEEDS RANKED BY OPERATIONAL URGENCY
            </Text>

            {needs.map((need) => (
              <View
                key={need.id}
                style={[styles.card, { backgroundColor: colors.surface }]}>
                {/* Header: Urgency + Category */}
                <View style={styles.cardHeaderRow}>
                  <View style={styles.badgeRow}>
                    <View
                      style={[
                        styles.statusDot,
                        { backgroundColor: getUrgencyColor(need.urgency) },
                      ]}
                    />
                    <Text
                      style={[
                        styles.badgeText,
                        { color: getUrgencyColor(need.urgency) },
                      ]}>
                      {need.urgency} · {need.category}
                    </Text>
                  </View>
                </View>

                {/* Locality & affected volume */}
                <Text
                  style={[styles.needLocality, { color: colors.textPrimary }]}>
                  {need.affectedLocality}
                </Text>
                <Text
                  style={[styles.needCount, { color: colors.textSecondary }]}>
                  Estimated Impact: {need.estimatedCountDescription}
                </Text>

                {/* Unresolved information gap */}
                <View
                  style={[
                    styles.gapCallout,
                    { backgroundColor: colors.surfaceMuted },
                  ]}>
                  <Feather
                    name="help-circle"
                    size={13}
                    color={colors.statusWatch}
                  />
                  <Text
                    style={[
                      styles.gapText,
                      { color: colors.textTertiary },
                    ]}>
                    Information Gap: {need.unresolvedGaps}
                  </Text>
                </View>

                {/* Provenance trace */}
                <Text
                  style={[
                    styles.provenanceCitation,
                    { color: colors.textTertiary },
                  ]}>
                  Source: {need.evidenceSource}
                </Text>
              </View>
            ))}
          </View>
        )}

        {/* ── TAB 3: ACTION RECOMMENDATIONS ────────────────────── */}
        {activeTab === 'ACTIONS' && (
          <View style={styles.sectionStack}>
            <Text
              style={[styles.sectionHeading, { color: colors.textTertiary }]}>
              EVIDENCE-TRACED RECOMMENDATIONS & DECISIONS
            </Text>

            {actions.map((act) => {
              const badge = getLifecycleBadge(act.lifecycleState);
              return (
                <View
                  key={act.id}
                  style={[styles.card, { backgroundColor: colors.surface }]}>
                  {/* Lifecycle Badge & Urgency */}
                  <View style={styles.cardHeaderRow}>
                    <View
                      style={[
                        styles.lifecyclePill,
                        { backgroundColor: badge.bg },
                      ]}>
                      <Text
                        style={[
                          styles.lifecycleText,
                          { color: badge.color },
                        ]}>
                        {badge.label}
                      </Text>
                    </View>
                    <Text
                      style={[
                        styles.urgencyTag,
                        { color: getUrgencyColor(act.urgency) },
                      ]}>
                      Urgency: {act.urgency}
                    </Text>
                  </View>

                  {/* Title & Target */}
                  <Text
                    style={[styles.actionTitle, { color: colors.textPrimary }]}>
                    {act.actionTitle}
                  </Text>
                  <Text
                    style={[
                      styles.actionLocality,
                      { color: colors.textSecondary },
                    ]}>
                    Target: {act.targetLocality}
                  </Text>

                  {/* Justification */}
                  <Text
                    style={[
                      styles.actionJustification,
                      { color: colors.textPrimary },
                    ]}>
                    Why: {act.justification}
                  </Text>

                  {/* Supporting Evidence Citations */}
                  <View style={styles.evidenceContainer}>
                    <Text
                      style={[
                        styles.evidenceHeader,
                        { color: colors.textSecondary },
                      ]}>
                      Supporting Evidence:
                    </Text>
                    {act.supportingEvidence.map((ev, idx) => (
                      <View
                        key={idx}
                        style={[
                          styles.evidenceItem,
                          { backgroundColor: colors.surfaceMuted },
                        ]}>
                        <Text
                          style={[
                            styles.evidenceSource,
                            { color: colors.brandPrimary },
                          ]}>
                          {ev.sourceName} ({ev.sourceType})
                        </Text>
                        <Text
                          style={[
                            styles.evidenceQuote,
                            { color: colors.textSecondary },
                          ]}>
                          &quot;{ev.citationSnippet}&quot;
                        </Text>
                      </View>
                    ))}
                  </View>

                  {/* Assigned Responder */}
                  {act.assignedNgoName && (
                    <View style={styles.assignedRow}>
                      <Feather
                        name="user-check"
                        size={12}
                        color={colors.textTertiary}
                      />
                      <Text
                        style={[
                          styles.assignedText,
                          { color: colors.textSecondary },
                        ]}>
                        Assigned: {act.assignedNgoName}
                      </Text>
                    </View>
                  )}

                  {/* Action Transition Button */}
                  {act.lifecycleState !== 'COMPLETED' && (
                    <Pressable
                      onPress={() =>
                        handleAuthorizeAction(act.id, act.lifecycleState)
                      }
                      disabled={actionUpdating}
                      style={[
                        styles.actionButton,
                        {
                          backgroundColor:
                            act.lifecycleState === 'RECOMMENDATION'
                              ? colors.brandPrimary
                              : colors.statusResolved,
                        },
                      ]}>
                      <Feather
                        name={
                          act.lifecycleState === 'RECOMMENDATION'
                            ? 'check-circle'
                            : 'flag'
                        }
                        size={14}
                        color="#FFFFFF"
                      />
                      <Text style={styles.actionButtonText}>
                        {act.lifecycleState === 'RECOMMENDATION'
                          ? 'Authorize Recommendation'
                          : 'Mark Action Completed'}
                      </Text>
                    </Pressable>
                  )}
                </View>
              );
            })}
          </View>
        )}

        {/* ── TAB 4: COORDINATION & OUTCOMES ───────────────────── */}
        {activeTab === 'COORDINATION' && (
          <View style={styles.sectionStack}>
            {/* NGO Capability Matching */}
            <View style={styles.sectionBlock}>
              <Text
                style={[styles.sectionHeading, { color: colors.textTertiary }]}>
                CAPABILITY-MATCHED HUMANITARIAN NGOS
              </Text>
              {ngoMatches.map((ngo) => (
                <View
                  key={ngo.ngoId}
                  style={[styles.card, { backgroundColor: colors.surface }]}>
                  <View style={styles.cardHeaderRow}>
                    <Text
                      style={[styles.ngoName, { color: colors.textPrimary }]}>
                      {ngo.ngoName}
                    </Text>
                    <Text
                      style={[
                        styles.readinessBadge,
                        {
                          color:
                            ngo.readinessStatus === 'DEPLOYED'
                              ? colors.statusResolved
                              : colors.statusWatch,
                        },
                      ]}>
                      {ngo.readinessStatus}
                    </Text>
                  </View>
                  <Text
                    style={[styles.ngoProximity, { color: colors.textTertiary }]}>
                    {ngo.proximityDescription}
                  </Text>
                  <View style={styles.capabilitiesWrap}>
                    {ngo.matchingFocusAreas.map((area, idx) => (
                      <View
                        key={idx}
                        style={[
                          styles.capChip,
                          { backgroundColor: colors.surfaceMuted },
                        ]}>
                        <Text
                          style={[
                            styles.capChipText,
                            { color: colors.textSecondary },
                          ]}>
                          {area}
                        </Text>
                      </View>
                    ))}
                  </View>
                </View>
              ))}
            </View>

            {/* Coordination Tasks */}
            <View style={styles.sectionBlock}>
              <Text
                style={[styles.sectionHeading, { color: colors.textTertiary }]}>
                INTER-AGENCY COORDINATION MATRIX
              </Text>
              {tasks.map((task) => (
                <Pressable
                  key={task.id}
                  onPress={() =>
                    handleToggleTaskStatus(task.id, task.status)
                  }
                  style={[styles.card, { backgroundColor: colors.surface }]}>
                  <View style={styles.cardHeaderRow}>
                    <Text
                      style={[
                        styles.taskTitle,
                        { color: colors.textPrimary },
                      ]}>
                      {task.title}
                    </Text>
                    <Text
                      style={[
                        styles.taskStatusText,
                        {
                          color:
                            task.status === 'COMPLETED'
                              ? colors.statusResolved
                              : task.status === 'IN_PROGRESS'
                              ? colors.brandPrimary
                              : colors.statusWatch,
                        },
                      ]}>
                      {task.status.replace(/_/g, ' ')}
                    </Text>
                  </View>
                  <Text
                    style={[styles.taskOrg, { color: colors.textSecondary }]}>
                    Responsible: {task.responsibleOrg}
                  </Text>
                  {task.dependencies.length > 0 && (
                    <Text
                      style={[
                        styles.taskDependencies,
                        { color: colors.textTertiary },
                      ]}>
                      Dependency: {task.dependencies.join(', ')}
                    </Text>
                  )}
                </Pressable>
              ))}
            </View>

            {/* Outcome Tracking Timeline */}
            <View style={styles.sectionBlock}>
              <Text
                style={[styles.sectionHeading, { color: colors.textTertiary }]}>
                OUTCOME AUDIT TRAIL
              </Text>
              {outcomes.map((out) => (
                <View
                  key={out.id}
                  style={[styles.card, { backgroundColor: colors.surface }]}>
                  <View style={styles.cardHeaderRow}>
                    <Text
                      style={[
                        styles.outcomeHeadline,
                        { color: colors.textPrimary },
                      ]}>
                      {out.headline}
                    </Text>
                    <Text
                      style={[
                        styles.timeCaption,
                        typography.tabular,
                        { color: colors.textTertiary },
                      ]}>
                      {new Date(out.timestamp).toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </Text>
                  </View>
                  <Text
                    style={[
                      styles.outcomeSource,
                      { color: colors.textTertiary },
                    ]}>
                    Source: {out.source}
                  </Text>
                  <Text
                    style={[
                      styles.outcomeImpact,
                      { color: colors.textSecondary },
                    ]}>
                    Impact: {out.operationalImpact}
                  </Text>
                </View>
              ))}
            </View>
          </View>
        )}
      </ScrollView>
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
  },
  headerTitle: {
    ...typography.title,
    fontSize: 20,
    lineHeight: 24,
  },
  headerSubtitle: {
    ...typography.caption,
    fontSize: 12,
  },
  tabBar: {
    flexDirection: 'row',
    paddingHorizontal: spacing.screenPadding,
    gap: spacing.xs,
    marginTop: spacing.xs,
    marginBottom: spacing.xs,
  },
  tabItem: {
    flex: 1,
    paddingVertical: spacing.xs + 3,
    alignItems: 'center',
    borderRadius: radii.chip,
  },
  tabText: {
    ...typography.caption,
    fontSize: 11,
  },
  scrollContent: {
    paddingHorizontal: spacing.screenPadding,
    paddingTop: spacing.sm,
    paddingBottom: spacing.xxl,
  },
  sectionStack: {
    gap: spacing.sm,
  },
  sectionBlock: {
    gap: spacing.xs,
  },
  sectionHeading: {
    ...typography.overline,
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  card: {
    borderRadius: radii.card,
    padding: spacing.cardPadding,
    gap: spacing.xs,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  statusDot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
  },
  badgeText: {
    ...typography.caption,
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  timeCaption: {
    ...typography.caption,
    fontSize: 11,
  },
  summaryText: {
    ...typography.body,
    fontSize: 13,
    lineHeight: 18,
  },
  provenanceBox: {
    marginTop: spacing.xs,
    gap: spacing.xs,
  },
  provenanceTitle: {
    ...typography.caption,
    fontSize: 11,
    fontWeight: '600',
  },
  provenancePillRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  provenancePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
    borderRadius: radii.chip,
  },
  provenancePillText: {
    ...typography.caption,
    fontSize: 11,
    fontWeight: '600',
  },
  uncertaintyBox: {
    marginTop: spacing.xs,
    gap: 2,
  },
  uncertaintyLabel: {
    ...typography.caption,
    fontSize: 12,
  },
  uncertaintyScore: {
    ...typography.caption,
    fontSize: 12,
    fontWeight: '700',
  },
  uncertaintyRationale: {
    ...typography.caption,
    fontSize: 11,
    lineHeight: 15,
  },
  conflictTopic: {
    ...typography.bodyMedium,
    fontSize: 13,
    fontWeight: '600',
  },
  conflictConfidence: {
    ...typography.caption,
    fontSize: 11,
    fontWeight: '600',
  },
  conflictDesc: {
    ...typography.body,
    fontSize: 12,
    lineHeight: 16,
  },
  verificationNote: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginTop: 2,
  },
  verificationText: {
    ...typography.caption,
    fontSize: 11,
    flex: 1,
  },
  needLocality: {
    ...typography.bodyMedium,
    fontSize: 14,
    fontWeight: '600',
  },
  needCount: {
    ...typography.body,
    fontSize: 12,
  },
  gapCallout: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 6,
    padding: spacing.sm,
    borderRadius: radii.sm,
  },
  gapText: {
    ...typography.caption,
    fontSize: 11,
    lineHeight: 15,
    flex: 1,
  },
  provenanceCitation: {
    ...typography.caption,
    fontSize: 11,
  },
  lifecyclePill: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
    borderRadius: radii.chip,
  },
  lifecycleText: {
    ...typography.caption,
    fontSize: 10,
    fontWeight: '700',
  },
  urgencyTag: {
    ...typography.caption,
    fontSize: 11,
    fontWeight: '600',
  },
  actionTitle: {
    ...typography.bodyMedium,
    fontSize: 14,
    fontWeight: '700',
  },
  actionLocality: {
    ...typography.caption,
    fontSize: 12,
  },
  actionJustification: {
    ...typography.body,
    fontSize: 12,
    lineHeight: 17,
  },
  evidenceContainer: {
    gap: 4,
    marginTop: spacing.xs,
  },
  evidenceHeader: {
    ...typography.caption,
    fontSize: 11,
    fontWeight: '600',
  },
  evidenceItem: {
    padding: spacing.sm,
    borderRadius: radii.sm,
    gap: 2,
  },
  evidenceSource: {
    ...typography.caption,
    fontSize: 11,
    fontWeight: '600',
  },
  evidenceQuote: {
    ...typography.caption,
    fontSize: 11,
    lineHeight: 15,
  },
  assignedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 2,
  },
  assignedText: {
    ...typography.caption,
    fontSize: 11,
    fontWeight: '500',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: spacing.sm + 2,
    borderRadius: radii.button,
    marginTop: spacing.xs,
    minHeight: touchTargets.min,
  },
  actionButtonText: {
    ...typography.bodyMedium,
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 13,
  },
  ngoName: {
    ...typography.bodyMedium,
    fontSize: 14,
    fontWeight: '600',
  },
  readinessBadge: {
    ...typography.caption,
    fontSize: 11,
    fontWeight: '700',
  },
  ngoProximity: {
    ...typography.caption,
    fontSize: 12,
  },
  capabilitiesWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 4,
    marginTop: 2,
  },
  capChip: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: radii.chip,
  },
  capChipText: {
    ...typography.caption,
    fontSize: 11,
  },
  taskTitle: {
    ...typography.bodyMedium,
    fontSize: 13,
    fontWeight: '600',
    flex: 1,
  },
  taskStatusText: {
    ...typography.caption,
    fontSize: 11,
    fontWeight: '700',
  },
  taskOrg: {
    ...typography.caption,
    fontSize: 12,
  },
  taskDependencies: {
    ...typography.caption,
    fontSize: 11,
  },
  outcomeHeadline: {
    ...typography.bodyMedium,
    fontSize: 13,
    fontWeight: '600',
  },
  outcomeSource: {
    ...typography.caption,
    fontSize: 11,
  },
  outcomeImpact: {
    ...typography.caption,
    fontSize: 11,
    lineHeight: 15,
  },
});
