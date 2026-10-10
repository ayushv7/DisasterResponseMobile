/**
 * NgoReviewScreen — Protected NGO Message Triage & Verification Workspace
 *
 * Provides granular evaluation of citizen claims, decoupled from official
 * telemetry and government source observations.
 *
 * GATED OPERATIONS:
 * - Request clarification (dispatches inquiry to citizen)
 * - Reject/close with a recorded reason
 * - Prepare contribution for publication (strictly requires VERIFIED org status)
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
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';

import { ErrorState } from '@/components/ErrorState';
import { SAMPLE_FLOOD_EVENTS } from '@/fixtures/sample-events';
import {
  fetchNgoMessageDetail,
  fetchNgoSession,
  prepareContributionForPublication,
  rejectAndCloseMessage,
  requestClarification,
} from '@/services/ngo-api';
import { useGoBack } from '@/navigation/use-go-back';
import { useTheme } from '@/theme';
import { radii, spacing, touchTargets } from '@/theme/spacing';
import { typography } from '@/theme/typography';
import { FloodEvent, SourceObservation } from '@/types/disaster';
import {
  NgoInboxMessage,
  NgoSession,
} from '@/types/ngo-workspace';

export default function NgoReviewScreen() {
  const goBack = useGoBack();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { colors } = useTheme();

  const [session, setSession] = useState<NgoSession | null>(null);
  const [message, setMessage] = useState<NgoInboxMessage | null>(null);
  const [linkedEvent, setLinkedEvent] = useState<FloodEvent | null>(null);
  const [internalNotes, setInternalNotes] = useState('');
  const [loading, setLoading] = useState(true);
  const [actionInProgress, setActionInProgress] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Modal states for dialogs
  const [modalMode, setModalMode] = useState<
    'none' | 'clarify' | 'reject' | 'prepare'
  >('none');
  const [modalInput, setModalInput] = useState('');

  const loadDetail = useCallback(async () => {
    if (!id) return;
    try {
      const sess = await fetchNgoSession();
      setSession(sess);

      const msg = await fetchNgoMessageDetail(id);
      setMessage(msg);
      setInternalNotes(msg.internalNotes || '');

      // Locate linked flood event for telemetry comparison
      const ev = SAMPLE_FLOOD_EVENTS.find((e) => e.id === msg.eventId);
      if (ev) setLinkedEvent(ev);
    } catch (err: any) {
      setErrorMsg(err?.message || 'Failed to load message telemetry.');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadDetail();
  }, [loadDetail]);

  const isVerified = session?.verificationStatus === 'VERIFIED';

  const handleActionSubmit = async () => {
    if (!message) return;
    if (!isVerified) {
      Alert.alert(
        'Action Blocked',
        `Your organization status is ${session?.verificationStatus}. Only independently VERIFIED organizations may perform triage actions.`
      );
      return;
    }

    try {
      setActionInProgress(true);
      let updated: NgoInboxMessage;

      if (modalMode === 'clarify') {
        if (!modalInput.trim()) {
          Alert.alert('Required', 'Please enter a clarification inquiry.');
          setActionInProgress(false);
          return;
        }
        updated = await requestClarification(
          message.messageId,
          modalInput.trim(),
          internalNotes.trim()
        );
      } else if (modalMode === 'reject') {
        if (!modalInput.trim()) {
          Alert.alert('Required', 'Please specify a reason for closing.');
          setActionInProgress(false);
          return;
        }
        updated = await rejectAndCloseMessage(
          message.messageId,
          modalInput.trim(),
          internalNotes.trim()
        );
      } else if (modalMode === 'prepare') {
        updated = await prepareContributionForPublication(
          message.messageId,
          internalNotes.trim()
        );
      } else {
        return;
      }

      setMessage(updated);
      const wasPrepare = modalMode === 'prepare';
      setModalMode('none');
      setModalInput('');

      if (wasPrepare) {
        Alert.alert(
          'Contribution Prepared',
          'Observation queued. Open contribution composer to finalize public update?',
          [
            { text: 'Stay Here', style: 'cancel' },
            {
              text: 'Open Composer',
              onPress: () =>
                router.push({
                  pathname: '/ngo/contributions/compose',
                  params: {
                    eventId: message.eventId,
                    messageId: message.messageId,
                  },
                }),
            },
          ]
        );
      } else {
        Alert.alert('Action Recorded', `Status updated to ${updated.status}.`);
      }
    } catch (err: any) {
      Alert.alert('Error', err?.message || 'Failed to update review status.');
    } finally {
      setActionInProgress(false);
    }
  };

  if (loading) {
    return (
      <SafeAreaView
        edges={['top', 'left', 'right']}
        style={[styles.safeArea, { backgroundColor: colors.background }]}>
        <View style={styles.centerContainer}>
          <ActivityIndicator size="small" color={colors.brandPrimary} />
          <Text style={[styles.loadingText, { color: colors.textSecondary }]}>
            Loading review telemetry...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  if (errorMsg || !message) {
    return (
      <SafeAreaView
        edges={['top', 'left', 'right']}
        style={[styles.safeArea, { backgroundColor: colors.background }]}>
        <View style={styles.header}>
          <Pressable
            onPress={goBack}
            style={styles.backButton}
            accessibilityRole="button"
            accessibilityLabel="Go back">
            <Feather name="arrow-left" size={22} color={colors.textPrimary} />
          </Pressable>
          <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>
            Review
          </Text>
        </View>
        <ErrorState
          message={errorMsg || 'Message not found'}
          onRetry={loadDetail}
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
          accessibilityLabel="Go back">
          <Feather name="arrow-left" size={22} color={colors.textPrimary} />
        </Pressable>
        <View style={styles.headerTitleWrap}>
          <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>
            Message Triage
          </Text>
          <Text
            style={[
              styles.headerSubtitle,
              typography.tabular,
              { color: colors.textTertiary },
            ]}>
            REF: {message.messageId}
          </Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Security Notice */}
        <View style={[styles.infoBanner, { backgroundColor: colors.surface }]}>
          <Feather name="shield" size={14} color={colors.brandPrimary} />
          <Text style={[styles.infoBannerText, { color: colors.textSecondary }]}>
            UI Preview Workspace. Real publishing requires independent backend
            cryptographic authorization.
          </Text>
        </View>

        {/* SECTION 1: Citizen Claim (Decoupled) */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.textTertiary }]}>
            CITIZEN OBSERVATION (UNVERIFIED CLAIM)
          </Text>
          <View style={[styles.card, { backgroundColor: colors.surface }]}>
            <View style={styles.claimMeta}>
              <Text
                style={[
                  styles.claimSender,
                  { color: colors.textSecondary },
                ]}>
                Source: {message.senderPseudonym}
              </Text>
              <Text
                style={[
                  styles.claimTime,
                  typography.tabular,
                  { color: colors.textTertiary },
                ]}>
                {new Date(message.receivedAt).toLocaleString()}
              </Text>
            </View>
            <Text
              style={[
                styles.claimText,
                { color: colors.textPrimary },
              ]}>
              {message.observationText}
            </Text>
          </View>
        </View>

        {/* SECTION 2: Privacy Safeguards & Location Metadata */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.textTertiary }]}>
            LOCATION METADATA & PRIVACY SAFEGUARDS
          </Text>
          <View style={[styles.card, { backgroundColor: colors.surface }]}>
            <View style={styles.metaRow}>
              <Feather name="map-pin" size={14} color={colors.textSecondary} />
              <Text
                style={[
                  styles.metaLabel,
                  { color: colors.textSecondary },
                ]}>
                Approximate Area:
              </Text>
              <Text
                style={[
                  styles.metaValue,
                  { color: colors.textPrimary },
                ]}>
                {message.locationMetadata.approximateArea}
              </Text>
            </View>
            <View style={styles.privacyNoteBox}>
              <Feather name="lock" size={12} color={colors.statusWatch} />
              <Text
                style={[
                  styles.privacyNoteText,
                  { color: colors.textTertiary },
                ]}>
                {message.locationMetadata.privacyNotice}
              </Text>
            </View>

            {message.attachments.length > 0 && (
              <View style={styles.attachmentWrap}>
                <Text
                  style={[
                    styles.attachmentHeading,
                    { color: colors.textSecondary },
                  ]}>
                  Attached Evidence ({message.attachments.length}):
                </Text>
                {message.attachments.map((att) => (
                  <View
                    key={att.id}
                    style={[
                      styles.attachmentChip,
                      { backgroundColor: colors.surfaceMuted },
                    ]}>
                    <Feather
                      name="paperclip"
                      size={12}
                      color={colors.textSecondary}
                    />
                    <Text
                      style={[
                        styles.attachmentName,
                        { color: colors.textPrimary },
                      ]}>
                      {att.filename}
                    </Text>
                    <Text
                      style={[
                        styles.attachmentSize,
                        typography.tabular,
                        { color: colors.textTertiary },
                      ]}>
                      {(att.sizeBytes / 1024).toFixed(0)} KB
                    </Text>
                  </View>
                ))}
              </View>
            )}
          </View>
        </View>

        {/* SECTION 3: Linked Flood Event (Official Context) */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.textTertiary }]}>
            SYSTEM FLOOD EVENT CONTEXT
          </Text>
          <View style={[styles.card, { backgroundColor: colors.surface }]}>
            <Text style={[styles.eventTitle, { color: colors.textPrimary }]}>
              {message.eventTitle}
            </Text>
            <Text
              style={[
                styles.eventSubtitle,
                { color: colors.textTertiary },
              ]}>
              Event Ref: {message.eventId}
            </Text>
            {linkedEvent && (
              <Text
                style={[
                  styles.eventSummary,
                  { color: colors.textSecondary },
                ]}>
                {linkedEvent.summary}
              </Text>
            )}
          </View>
        </View>

        {/* SECTION 4: Dedicated Source Observations (Decoupled Telemetry) */}
        {linkedEvent && linkedEvent.observations && (
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.textTertiary }]}>
              OFFICIAL SOURCE OBSERVATIONS (GAUGE / TELEMETRY)
            </Text>
            <View style={styles.obsList}>
              {linkedEvent.observations.map((obs: SourceObservation) => (
                <View
                  key={obs.id}
                  style={[styles.card, { backgroundColor: colors.surface }]}>
                  <View style={styles.obsHeader}>
                    <Text
                      style={[
                        styles.obsSource,
                        { color: colors.textSecondary },
                      ]}>
                      {obs.sourceName} ({obs.sourceType})
                    </Text>
                    <Text
                      style={[
                        styles.obsTime,
                        typography.tabular,
                        { color: colors.textTertiary },
                      ]}>
                      {new Date(obs.sourceObservedAt).toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </Text>
                  </View>
                  <Text
                    style={[
                      styles.obsHeadline,
                      { color: colors.textPrimary },
                    ]}>
                    {obs.headline}
                  </Text>
                  <Text
                    style={[
                      styles.obsSnippet,
                      { color: colors.textSecondary },
                    ]}>
                    {obs.evidenceSnippet}
                  </Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* SECTION 5: Status History & Audit Trail */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.textTertiary }]}>
            STATUS & ATTRIBUTION AUDIT TRAIL
          </Text>
          <View style={[styles.card, { backgroundColor: colors.surface }]}>
            {message.statusHistory.map((item, idx) => (
              <View
                key={idx}
                style={[
                  styles.historyItem,
                  idx > 0 && styles.historyItemMargin,
                ]}>
                <View style={styles.historyHeader}>
                  <Text
                    style={[
                      styles.historyStatus,
                      { color: colors.textPrimary },
                    ]}>
                    {item.status}
                  </Text>
                  <Text
                    style={[
                      styles.historyTime,
                      typography.tabular,
                      { color: colors.textTertiary },
                    ]}>
                    {new Date(item.timestamp).toLocaleString()}
                  </Text>
                </View>
                <Text
                  style={[
                    styles.historyActor,
                    { color: colors.textSecondary },
                  ]}>
                  By: {item.actor}
                </Text>
                {item.notes && (
                  <Text
                    style={[
                      styles.historyNotes,
                      { color: colors.textTertiary },
                    ]}>
                    &quot;{item.notes}&quot;
                  </Text>
                )}
              </View>
            ))}
          </View>
        </View>

        {/* SECTION 6: Internal Review Notes Field */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.textTertiary }]}>
            INTERNAL NGO REVIEW NOTES
          </Text>
          <View style={[styles.card, { backgroundColor: colors.surface }]}>
            <TextInput
              style={[
                styles.notesInput,
                {
                  color: colors.textPrimary,
                  backgroundColor: colors.surfaceMuted,
                },
              ]}
              placeholder="Record internal operational notes, verification checks, or coordination steps..."
              placeholderTextColor={colors.textTertiary}
              multiline
              numberOfLines={4}
              value={internalNotes}
              onChangeText={setInternalNotes}
              textAlignVertical="top"
            />
          </View>
        </View>

        {/* SECTION 7: Gated Review Actions */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.textTertiary }]}>
            TRIAGE & PUBLICATION ACTIONS
          </Text>
          <View style={styles.actionsContainer}>
            {/* Action 1: Request Clarification */}
            <Pressable
              onPress={() => {
                setModalInput('');
                setModalMode('clarify');
              }}
              style={[
                styles.actionButton,
                { backgroundColor: colors.surface },
              ]}>
              <Feather
                name="help-circle"
                size={18}
                color={colors.brandPrimary}
              />
              <Text
                style={[
                  styles.actionButtonText,
                  { color: colors.textPrimary },
                ]}>
                Request Clarification
              </Text>
            </Pressable>

            {/* Action 2: Reject / Close */}
            <Pressable
              onPress={() => {
                setModalInput('');
                setModalMode('reject');
              }}
              style={[
                styles.actionButton,
                { backgroundColor: colors.surface },
              ]}>
              <Feather name="x-circle" size={18} color={colors.statusActive} />
              <Text
                style={[
                  styles.actionButtonText,
                  { color: colors.textPrimary },
                ]}>
                Reject / Close with Reason
              </Text>
            </Pressable>

            {/* Action 3: Prepare Contribution for Publication */}
            <Pressable
              onPress={() => {
                if (!isVerified) {
                  Alert.alert(
                    'Publishing Privilege Blocked',
                    `Organization status is ${session?.verificationStatus}. Only independently VERIFIED organizations may prepare contributions.`
                  );
                  return;
                }
                setModalMode('prepare');
              }}
              style={[
                styles.actionButtonPrimary,
                {
                  backgroundColor: isVerified
                    ? colors.statusResolved
                    : colors.surfaceMuted,
                  opacity: isVerified ? 1 : 0.6,
                },
              ]}>
              <Feather
                name="check-circle"
                size={18}
                color={isVerified ? '#FFFFFF' : colors.textTertiary}
              />
              <Text
                style={[
                  styles.actionButtonPrimaryText,
                  {
                    color: isVerified ? '#FFFFFF' : colors.textTertiary,
                  },
                ]}>
                Prepare Contribution for Publication
              </Text>
            </Pressable>
          </View>
        </View>
      </ScrollView>

      {/* Action Dialog Modal */}
      <Modal
        visible={modalMode !== 'none'}
        transparent
        animationType="fade"
        onRequestClose={() => setModalMode('none')}>
        <View style={styles.modalOverlay}>
          <View
            style={[styles.modalCard, { backgroundColor: colors.surface }]}>
            <Text style={[styles.modalTitle, { color: colors.textPrimary }]}>
              {modalMode === 'clarify'
                ? 'Request Citizen Clarification'
                : modalMode === 'reject'
                ? 'Close / Reject Observation'
                : 'Prepare Contribution for Publication'}
            </Text>
            <Text
              style={[
                styles.modalDescription,
                { color: colors.textSecondary },
              ]}>
              {modalMode === 'clarify'
                ? 'Send a targeted request to the reporting citizen for more information.'
                : modalMode === 'reject'
                ? 'Record the justification for discarding or closing this observation.'
                : 'Queue verified observation into the official NGO bulletin draft. Live broadcast requires backend editorial signoff.'}
            </Text>

            {modalMode !== 'prepare' && (
              <TextInput
                style={[
                  styles.modalInput,
                  {
                    color: colors.textPrimary,
                    backgroundColor: colors.surfaceMuted,
                  },
                ]}
                placeholder={
                  modalMode === 'clarify'
                    ? 'Enter inquiry details for the citizen...'
                    : 'Enter rejection / closure reason...'
                }
                placeholderTextColor={colors.textTertiary}
                multiline
                numberOfLines={3}
                value={modalInput}
                onChangeText={setModalInput}
                textAlignVertical="top"
              />
            )}

            <View style={styles.modalButtons}>
              <Pressable
                onPress={() => setModalMode('none')}
                disabled={actionInProgress}
                style={[
                  styles.modalButtonSecondary,
                  { backgroundColor: colors.surfaceMuted },
                ]}>
                <Text
                  style={[
                    styles.modalButtonText,
                    { color: colors.textSecondary },
                  ]}>
                  Cancel
                </Text>
              </Pressable>
              <Pressable
                onPress={handleActionSubmit}
                disabled={actionInProgress}
                style={[
                  styles.modalButtonPrimary,
                  {
                    backgroundColor:
                      modalMode === 'reject'
                        ? colors.statusActive
                        : modalMode === 'clarify'
                        ? colors.brandPrimary
                        : colors.statusResolved,
                  },
                ]}>
                {actionInProgress ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <Text
                    style={[
                      styles.modalButtonText,
                      { color: '#FFFFFF', fontWeight: '700' },
                    ]}>
                    Confirm
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
  centerContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
  },
  loadingText: {
    ...typography.body,
    fontSize: 14,
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
    fontSize: 11,
  },
  scrollContent: {
    paddingHorizontal: spacing.screenPadding,
    paddingTop: spacing.xs,
    paddingBottom: spacing.xxl,
    gap: spacing.md,
  },
  infoBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    padding: spacing.md,
    borderRadius: radii.card,
  },
  infoBannerText: {
    ...typography.caption,
    fontSize: 12,
    flex: 1,
    lineHeight: 16,
  },
  section: {
    gap: spacing.xs,
  },
  sectionTitle: {
    ...typography.overline,
    fontSize: 11,
  },
  card: {
    borderRadius: radii.card,
    padding: spacing.cardPadding,
    gap: spacing.xs,
  },
  claimMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  claimSender: {
    ...typography.caption,
    fontSize: 12,
    fontWeight: '600',
  },
  claimTime: {
    ...typography.caption,
    fontSize: 11,
  },
  claimText: {
    ...typography.body,
    fontSize: 14,
    lineHeight: 20,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  metaLabel: {
    ...typography.caption,
    fontSize: 12,
  },
  metaValue: {
    ...typography.caption,
    fontSize: 12,
    fontWeight: '600',
  },
  privacyNoteBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 4,
  },
  privacyNoteText: {
    ...typography.caption,
    fontSize: 11,
    fontStyle: 'italic',
    flex: 1,
  },
  attachmentWrap: {
    marginTop: spacing.xs,
    gap: spacing.xs,
  },
  attachmentHeading: {
    ...typography.caption,
    fontSize: 12,
    fontWeight: '600',
  },
  attachmentChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: spacing.sm,
    paddingVertical: 6,
    borderRadius: radii.sm,
  },
  attachmentName: {
    ...typography.caption,
    fontSize: 12,
    flex: 1,
  },
  attachmentSize: {
    ...typography.caption,
    fontSize: 11,
  },
  eventTitle: {
    ...typography.bodyMedium,
    fontSize: 15,
    fontWeight: '700',
  },
  eventSubtitle: {
    ...typography.caption,
    fontSize: 12,
  },
  eventSummary: {
    ...typography.body,
    fontSize: 13,
    lineHeight: 18,
    marginTop: 4,
  },
  obsList: {
    gap: spacing.xs,
  },
  obsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  obsSource: {
    ...typography.caption,
    fontSize: 12,
    fontWeight: '600',
  },
  obsTime: {
    ...typography.caption,
    fontSize: 11,
  },
  obsHeadline: {
    ...typography.bodyMedium,
    fontSize: 13,
    fontWeight: '600',
  },
  obsSnippet: {
    ...typography.body,
    fontSize: 12,
    lineHeight: 17,
  },
  historyItem: {
    gap: 2,
  },
  historyItemMargin: {
    paddingTop: spacing.xs,
  },
  historyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  historyStatus: {
    ...typography.caption,
    fontSize: 12,
    fontWeight: '700',
  },
  historyTime: {
    ...typography.caption,
    fontSize: 11,
  },
  historyActor: {
    ...typography.caption,
    fontSize: 11,
  },
  historyNotes: {
    ...typography.caption,
    fontSize: 12,
    fontStyle: 'italic',
  },
  notesInput: {
    borderRadius: radii.sm,
    padding: spacing.sm,
    minHeight: 80,
    fontSize: 13,
    lineHeight: 18,
  },
  actionsContainer: {
    gap: spacing.sm,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.md,
    borderRadius: radii.button,
    minHeight: touchTargets.min,
  },
  actionButtonText: {
    ...typography.bodyMedium,
    fontSize: 14,
    fontWeight: '600',
  },
  actionButtonPrimary: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.md,
    borderRadius: radii.button,
    minHeight: touchTargets.min,
  },
  actionButtonPrimaryText: {
    ...typography.bodyMedium,
    fontSize: 14,
    fontWeight: '700',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
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
  modalTitle: {
    ...typography.cardTitle,
    fontSize: 16,
  },
  modalDescription: {
    ...typography.caption,
    fontSize: 13,
    lineHeight: 18,
  },
  modalInput: {
    borderRadius: radii.sm,
    padding: spacing.sm,
    minHeight: 70,
    fontSize: 13,
    marginTop: 4,
  },
  modalButtons: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.xs,
  },
  modalButtonSecondary: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.sm + 2,
    borderRadius: radii.sm,
    minHeight: touchTargets.min,
  },
  modalButtonPrimary: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.sm + 2,
    borderRadius: radii.sm,
    minHeight: touchTargets.min,
  },
  modalButtonText: {
    ...typography.bodyMedium,
    fontSize: 14,
  },
});
