/**
 * NgoContributionComposeScreen — Draft & Publish Verified Field Updates
 *
 * Provides structured composition for authorized NGO officers:
 * - Decoupled from automated sensor observations
 * - Preserves citizen message attribution ID when prompted from triage
 * - Confirms editorial intent before publication
 */

import React, { useEffect, useRef, useState } from 'react';
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

import { InfoBar } from '@/components/InfoBar';
import { SAMPLE_FLOOD_EVENTS } from '@/fixtures/sample-events';
import {
  fetchContributionById,
  fetchNgoSession,
  publishContribution,
  saveContributionDraft,
} from '@/services/ngo-api';
import { useGoBack } from '@/navigation/use-go-back';
import { useTheme } from '@/theme';
import { radii, spacing, touchTargets } from '@/theme/spacing';
import { typography } from '@/theme/typography';
import {
  ContributionType,
  NgoContributionItem,
  NgoSession,
} from '@/types/ngo-workspace';

const CONTRIBUTION_TYPES: { key: ContributionType; label: string; icon: keyof typeof Feather.glyphMap }[] = [
  { key: 'SITUATION_UPDATE', label: 'Situation Update', icon: 'activity' },
  { key: 'RELIEF_DISTRIBUTION', label: 'Relief Supplies', icon: 'package' },
  { key: 'EVACUATION_ROUTE', label: 'Evacuation Route', icon: 'map-pin' },
  { key: 'MEDICAL_ASSISTANCE', label: 'Medical Assistance', icon: 'heart' },
];

export default function NgoContributionComposeScreen() {
  const goBack = useGoBack();
  const { eventId: initialEventId, messageId, draftId } = useLocalSearchParams<{
    eventId?: string;
    messageId?: string;
    draftId?: string;
  }>();

  const { colors } = useTheme();

  const [session, setSession] = useState<NgoSession | null>(null);
  const [activeDraftId, setActiveDraftId] = useState<string | undefined>(draftId);
  const [selectedEventId, setSelectedEventId] = useState(
    initialEventId || SAMPLE_FLOOD_EVENTS[0]?.id || ''
  );
  const [contributionType, setContributionType] = useState<ContributionType>(
    'SITUATION_UPDATE'
  );
  const [locality, setLocality] = useState('');
  const [summary, setSummary] = useState('');
  const [needs, setNeeds] = useState('');
  const [resources, setResources] = useState('');
  const [evidenceRefs, setEvidenceRefs] = useState('');
  const [verificationMethod, setVerificationMethod] = useState(
    'On-site field team direct observation'
  );

  const [isDraftSaving, setIsDraftSaving] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [successItem, setSuccessItem] = useState<NgoContributionItem | null>(null);

  const isSubmittingRef = useRef(false);

  useEffect(() => {
    fetchNgoSession().then((sess) => {
      setSession(sess);
      if (!sess) {
        Alert.alert('Sign In Required', 'You must sign in as an authorized responder to compose contributions.', [
          { text: 'OK', onPress: () => router.replace('/login') },
        ]);
      }
    });

    if (draftId) {
      fetchContributionById(draftId).then((draft) => {
        if (draft) {
          setSelectedEventId(draft.eventId);
          setContributionType(draft.contributionType);
          setLocality(draft.locality);
          setSummary(draft.summary);
          setNeeds(draft.needs || '');
          setResources(draft.availableResources || '');
          setEvidenceRefs(draft.evidenceReferences || '');
          setVerificationMethod(draft.verificationMethod);
        }
      });
    }
  }, [draftId]);

  const selectedEvent = SAMPLE_FLOOD_EVENTS.find((e) => e.id === selectedEventId);

  const validateFields = (): boolean => {
    if (!selectedEventId) {
      Alert.alert('Validation Error', 'Please select a linked flood event.');
      return false;
    }
    if (!locality.trim()) {
      Alert.alert('Validation Error', 'Please enter the specific locality or affected area.');
      return false;
    }
    if (summary.trim().length < 20) {
      Alert.alert('Validation Error', 'Summary must be at least 20 characters long to provide actionable detail.');
      return false;
    }
    if (!verificationMethod.trim()) {
      Alert.alert('Validation Error', 'Please specify the verification method.');
      return false;
    }
    return true;
  };

  const handleSaveDraft = async () => {
    if (isSubmittingRef.current) return;
    if (!validateFields()) return;

    try {
      isSubmittingRef.current = true;
      setIsDraftSaving(true);

      const saved = await saveContributionDraft({
        draftId: activeDraftId,
        eventId: selectedEventId,
        eventTitle: selectedEvent?.title || 'Flood Situation',
        citizenMessageRef: messageId,
        contributionType,
        summary: summary.trim(),
        locality: locality.trim(),
        needs: needs.trim() || undefined,
        availableResources: resources.trim() || undefined,
        evidenceReferences: evidenceRefs.trim() || undefined,
        verificationMethod: verificationMethod.trim(),
      });

      setActiveDraftId(saved.id);

      Alert.alert(
        'Draft Saved Locally',
        `Draft ${saved.id} stored in local responder workspace.`,
        [{ text: 'View Contributions', onPress: () => router.replace('/ngo/contributions') }]
      );
    } catch (err: any) {
      Alert.alert('Error', err?.message || 'Failed to save draft.');
    } finally {
      setIsDraftSaving(false);
      isSubmittingRef.current = false;
    }
  };

  const handleConfirmPublish = async () => {
    setShowConfirmModal(false);
    if (isSubmittingRef.current) return;

    try {
      isSubmittingRef.current = true;
      setIsPublishing(true);

      const published = await publishContribution({
        draftId: activeDraftId,
        eventId: selectedEventId,
        eventTitle: selectedEvent?.title || 'Flood Situation',
        citizenMessageRef: messageId,
        contributionType,
        summary: summary.trim(),
        locality: locality.trim(),
        needs: needs.trim() || undefined,
        availableResources: resources.trim() || undefined,
        evidenceReferences: evidenceRefs.trim() || undefined,
        verificationMethod: verificationMethod.trim(),
      });

      setSuccessItem(published);
    } catch (err: any) {
      // Backend publication endpoint is missing or returns error.
      // Automatically preserve work in local drafts so no officer inputs are lost.
      try {
        const savedDraft = await saveContributionDraft({
          draftId: activeDraftId,
          eventId: selectedEventId,
          eventTitle: selectedEvent?.title || 'Flood Situation',
          citizenMessageRef: messageId,
          contributionType,
          summary: summary.trim(),
          locality: locality.trim(),
          needs: needs.trim() || undefined,
          availableResources: resources.trim() || undefined,
          evidenceReferences: evidenceRefs.trim() || undefined,
          verificationMethod: verificationMethod.trim(),
        });
        setActiveDraftId(savedDraft.id);

        Alert.alert(
          'Server Confirmation Required',
          `${err?.message || 'Remote publication endpoint is unavailable.'}\n\nYour inputs have been safely preserved as Draft ${savedDraft.id} in local memory.`,
          [
            { text: 'View Contributions', onPress: () => router.replace('/ngo/contributions') },
            { text: 'Keep Editing', style: 'cancel' },
          ]
        );
      } catch {
        Alert.alert('Publish Error', err?.message || 'Failed to publish contribution.');
      }
    } finally {
      setIsPublishing(false);
      isSubmittingRef.current = false;
    }
  };

  // Success view with confirmed attribution
  if (successItem) {
    return (
      <SafeAreaView
        edges={['top', 'left', 'right']}
        style={[styles.safeArea, { backgroundColor: colors.background }]}>
        <InfoBar isSampleData={true} />
        <View style={styles.successContainer}>
          <View
            style={[
              styles.successIconCircle,
              { backgroundColor: colors.statusResolvedBg },
            ]}>
            <Feather
              name="check-circle"
              size={36}
              color={colors.statusResolved}
            />
          </View>

          <Text style={[styles.successTitle, { color: colors.textPrimary }]}>
            Contribution Staged (Preview)
          </Text>
          <Text style={[styles.successSubtitle, { color: colors.textSecondary }]}>
            Attributed to {successItem.ngoName} by {successItem.authorOfficer}. Saved in device memory for UI testing — remote publishing pending live FastAPI backend.
          </Text>

          <View style={[styles.receiptCard, { backgroundColor: colors.surface }]}>
            <View style={styles.receiptRow}>
              <Text style={[styles.receiptLabel, { color: colors.textSecondary }]}>
                Contribution ID:
              </Text>
              <Text
                style={[
                  styles.receiptValue,
                  typography.tabular,
                  { color: colors.textPrimary },
                ]}>
                {successItem.id}
              </Text>
            </View>
            <View style={styles.receiptRow}>
              <Text style={[styles.receiptLabel, { color: colors.textSecondary }]}>
                Event:
              </Text>
              <Text
                style={[styles.receiptValue, { color: colors.textPrimary }]}
                numberOfLines={1}>
                {successItem.eventTitle}
              </Text>
            </View>
            <View style={styles.receiptRow}>
              <Text style={[styles.receiptLabel, { color: colors.textSecondary }]}>
                Published At:
              </Text>
              <Text
                style={[
                  styles.receiptValue,
                  typography.tabular,
                  { color: colors.textPrimary },
                ]}>
                {new Date(successItem.publishedAt!).toLocaleString()}
              </Text>
            </View>
            <View style={styles.receiptRow}>
              <Text style={[styles.receiptLabel, { color: colors.textSecondary }]}>
                Author Officer:
              </Text>
              <Text style={[styles.receiptValue, { color: colors.textPrimary }]}>
                {successItem.authorOfficer}
              </Text>
            </View>
            {successItem.citizenMessageRef && (
              <View style={styles.receiptRow}>
                <Text style={[styles.receiptLabel, { color: colors.textSecondary }]}>
                  Citizen Ref:
                </Text>
                <Text
                  style={[
                    styles.receiptValue,
                    typography.tabular,
                    { color: colors.textPrimary },
                  ]}>
                  {successItem.citizenMessageRef}
                </Text>
              </View>
            )}
          </View>

          <Pressable
            onPress={() => router.replace('/ngo/contributions')}
            style={[
              styles.doneButton,
              { backgroundColor: colors.brandPrimary },
            ]}>
            <Text style={styles.doneButtonText}>
              Return to Contributions
            </Text>
          </Pressable>
        </View>
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
        <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>
          {activeDraftId ? 'Edit Draft' : 'New Contribution'}
        </Text>
      </View>

      {/* Persistent Sample Data Notice */}
      <InfoBar isSampleData={true} />

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Attribution & Notice Banner */}
        <View style={[styles.noticeBanner, { backgroundColor: colors.surface }]}>
          <Feather name="shield" size={14} color={colors.brandPrimary} />
          <Text style={[styles.noticeBannerText, { color: colors.textSecondary }]}>
            Publishing as {session?.ngoName || 'Verified NGO'} ({session?.authorizedOfficerName || 'Authorized Officer'}). Official
            contributions are attributed publicly and decoupled from raw sensor observations.
          </Text>
        </View>

        {/* Linked Message Ref if present */}
        {messageId && (
          <View style={[styles.refCard, { backgroundColor: colors.surface }]}>
            <Feather name="link" size={14} color={colors.statusWatch} />
            <Text style={[styles.refCardText, { color: colors.textSecondary }]}>
              Linked to citizen report REF: <Text style={typography.tabular}>{messageId}</Text>
            </Text>
          </View>
        )}

        {/* 1. Linked Event Picker */}
        <View style={styles.section}>
          <Text style={[styles.sectionLabel, { color: colors.textTertiary }]}>
            LINKED FLOOD SITUATION
          </Text>
          <View style={[styles.card, { backgroundColor: colors.surface }]}>
            {SAMPLE_FLOOD_EVENTS.map((ev) => {
              const isSelected = ev.id === selectedEventId;
              return (
                <Pressable
                  key={ev.id}
                  onPress={() => setSelectedEventId(ev.id)}
                  style={[
                    styles.eventOption,
                    {
                      backgroundColor: isSelected
                        ? colors.surfaceMuted
                        : 'transparent',
                    },
                  ]}>
                  <View style={styles.eventOptionContent}>
                    <Text
                      style={[
                        styles.eventOptionTitle,
                        {
                          color: colors.textPrimary,
                          fontWeight: isSelected ? '700' : '500',
                        },
                      ]}
                      numberOfLines={1}>
                      {ev.title}
                    </Text>
                    <Text
                      style={[
                        styles.eventOptionSub,
                        { color: colors.textTertiary },
                      ]}>
                      {ev.location} · {ev.status}
                    </Text>
                  </View>
                  <View
                    style={[
                      styles.radioCircle,
                      {
                        borderColor: isSelected
                          ? colors.brandPrimary
                          : colors.textTertiary,
                      },
                    ]}>
                    {isSelected && (
                      <View
                        style={[
                          styles.radioDot,
                          { backgroundColor: colors.brandPrimary },
                        ]}
                      />
                    )}
                  </View>
                </Pressable>
              );
            })}
          </View>
        </View>

        {/* 2. Contribution Type */}
        <View style={styles.section}>
          <Text style={[styles.sectionLabel, { color: colors.textTertiary }]}>
            CONTRIBUTION CATEGORY
          </Text>
          <View style={styles.typeRow}>
            {CONTRIBUTION_TYPES.map((t) => {
              const active = contributionType === t.key;
              return (
                <Pressable
                  key={t.key}
                  onPress={() => setContributionType(t.key)}
                  style={[
                    styles.typeChip,
                    {
                      backgroundColor: active
                        ? colors.surfaceMuted
                        : colors.surface,
                    },
                  ]}>
                  <Feather
                    name={t.icon}
                    size={14}
                    color={active ? colors.brandPrimary : colors.textTertiary}
                  />
                  <Text
                    style={[
                      styles.typeChipText,
                      {
                        color: active
                          ? colors.textPrimary
                          : colors.textSecondary,
                        fontWeight: active ? '700' : '500',
                      },
                    ]}>
                    {t.label}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>

        {/* 3. Locality */}
        <View style={styles.section}>
          <Text style={[styles.sectionLabel, { color: colors.textTertiary }]}>
            SPECIFIC LOCALITY / SECTOR (REQUIRED)
          </Text>
          <View style={[styles.card, { backgroundColor: colors.surface }]}>
            <TextInput
              style={[
                styles.textInput,
                {
                  color: colors.textPrimary,
                  backgroundColor: colors.surfaceMuted,
                },
              ]}
              placeholder="e.g. Sector 4, Kamalabari Ghat Embankment"
              placeholderTextColor={colors.textTertiary}
              value={locality}
              onChangeText={setLocality}
            />
          </View>
        </View>

        {/* 4. Public Summary */}
        <View style={styles.section}>
          <Text style={[styles.sectionLabel, { color: colors.textTertiary }]}>
            PUBLIC BULLETIN SUMMARY (MIN 20 CHARS)
          </Text>
          <View style={[styles.card, { backgroundColor: colors.surface }]}>
            <TextInput
              style={[
                styles.textArea,
                {
                  color: colors.textPrimary,
                  backgroundColor: colors.surfaceMuted,
                },
              ]}
              placeholder="Describe current relief status, water level movement, evacuation guidance, or humanitarian conditions..."
              placeholderTextColor={colors.textTertiary}
              multiline
              numberOfLines={4}
              value={summary}
              onChangeText={setSummary}
              textAlignVertical="top"
            />
            <Text
              style={[
                styles.charCounter,
                typography.tabular,
                {
                  color:
                    summary.length >= 20
                      ? colors.statusResolved
                      : colors.textTertiary,
                },
              ]}>
              {summary.length} / 20 min chars
            </Text>
          </View>
        </View>

        {/* 5. Identified Needs & Available Resources */}
        <View style={styles.section}>
          <Text style={[styles.sectionLabel, { color: colors.textTertiary }]}>
            RELIEF INVENTORY & NEEDS (OPTIONAL)
          </Text>
          <View style={[styles.card, { backgroundColor: colors.surface }]}>
            <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>
              Identified Urgent Needs:
            </Text>
            <TextInput
              style={[
                styles.textInput,
                {
                  color: colors.textPrimary,
                  backgroundColor: colors.surfaceMuted,
                },
              ]}
              placeholder="e.g. Water purification packets, dry rations"
              placeholderTextColor={colors.textTertiary}
              value={needs}
              onChangeText={setNeeds}
            />

            <Text
              style={[
                styles.inputLabel,
                { color: colors.textSecondary, marginTop: spacing.xs },
              ]}>
              Deployed / Available Resources:
            </Text>
            <TextInput
              style={[
                styles.textInput,
                {
                  color: colors.textPrimary,
                  backgroundColor: colors.surfaceMuted,
                },
              ]}
              placeholder="e.g. 2 rescue boats on standby, 6 volunteers"
              placeholderTextColor={colors.textTertiary}
              value={resources}
              onChangeText={setResources}
            />
          </View>
        </View>

        {/* 6. Verification Method */}
        <View style={styles.section}>
          <Text style={[styles.sectionLabel, { color: colors.textTertiary }]}>
            VERIFICATION AUDIT METHOD (REQUIRED)
          </Text>
          <View style={[styles.card, { backgroundColor: colors.surface }]}>
            <TextInput
              style={[
                styles.textInput,
                {
                  color: colors.textPrimary,
                  backgroundColor: colors.surfaceMuted,
                },
              ]}
              placeholder="e.g. Physical on-site assessment by sector officer"
              placeholderTextColor={colors.textTertiary}
              value={verificationMethod}
              onChangeText={setVerificationMethod}
            />
          </View>
        </View>

        {/* Action Buttons */}
        <View style={styles.actionsColumn}>
          <Pressable
            onPress={() => setShowPreviewModal(true)}
            style={[
              styles.previewButton,
              { backgroundColor: colors.surfaceMuted },
            ]}>
            <Feather name="eye" size={15} color={colors.textPrimary} />
            <Text
              style={[
                styles.previewButtonText,
                { color: colors.textPrimary },
              ]}>
              Preview Public Bulletin
            </Text>
          </Pressable>

          <View style={styles.actionsRow}>
            <Pressable
              onPress={handleSaveDraft}
              disabled={isDraftSaving || isPublishing}
              style={[
                styles.actionButtonSecondary,
                {
                  backgroundColor: colors.surface,
                  opacity: isDraftSaving ? 0.6 : 1,
                },
              ]}>
              {isDraftSaving ? (
                <ActivityIndicator size="small" color={colors.textPrimary} />
              ) : (
                <>
                  <Feather name="file-text" size={16} color={colors.textPrimary} />
                  <Text
                    style={[
                      styles.actionButtonSecondaryText,
                      { color: colors.textPrimary },
                    ]}>
                    Save Draft
                  </Text>
                </>
              )}
            </Pressable>

            <Pressable
              onPress={() => {
                if (validateFields()) {
                  setShowConfirmModal(true);
                }
              }}
              disabled={isDraftSaving || isPublishing}
              style={[
                styles.actionButtonPrimary,
                {
                  backgroundColor: colors.brandPrimary,
                  opacity: isPublishing ? 0.6 : 1,
                },
              ]}>
              <Feather name="send" size={16} color="#FFFFFF" />
              <Text style={styles.actionButtonPrimaryText}>
                Publish Contribution
              </Text>
            </Pressable>
          </View>
        </View>
      </ScrollView>

      {/* Confirmation Modal */}
      <Modal
        visible={showConfirmModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowConfirmModal(false)}>
        <View style={styles.modalOverlay}>
          <View
            style={[styles.modalCard, { backgroundColor: colors.surface }]}>
            <View style={styles.modalHeader}>
              <Feather name="alert-circle" size={22} color={colors.brandPrimary} />
              <Text style={[styles.modalTitle, { color: colors.textPrimary }]}>
                Confirm Public Publication
              </Text>
            </View>

            <Text style={[styles.modalBody, { color: colors.textSecondary }]}>
              This will publish an officially attributed contribution under{' '}
              <Text style={{ fontWeight: '700', color: colors.textPrimary }}>
                {session?.ngoName || 'your NGO'}
              </Text>
              .
            </Text>
            <Text style={[styles.modalBody, { color: colors.textTertiary }]}>
              Note: This creates a separate verified contribution and does NOT
              alter raw government source observations or private citizen messages.
            </Text>

            <View style={styles.modalActions}>
              <Pressable
                onPress={() => setShowConfirmModal(false)}
                style={[
                  styles.modalCancel,
                  { backgroundColor: colors.surfaceMuted },
                ]}>
                <Text
                  style={[
                    styles.modalCancelText,
                    { color: colors.textSecondary },
                  ]}>
                  Cancel
                </Text>
              </Pressable>

              <Pressable
                onPress={handleConfirmPublish}
                disabled={isPublishing}
                style={[
                  styles.modalConfirm,
                  { backgroundColor: colors.brandPrimary },
                ]}>
                {isPublishing ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <Text style={styles.modalConfirmText}>
                    Confirm & Publish
                  </Text>
                )}
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>

      {/* Labelled UI Preview Modal */}
      <Modal
        visible={showPreviewModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowPreviewModal(false)}>
        <View style={styles.modalOverlay}>
          <View style={[styles.previewModalCard, { backgroundColor: colors.surface }]}>
            <View style={styles.previewModalHeader}>
              <View style={styles.previewHeaderWrap}>
                <View style={[styles.previewBadge, { backgroundColor: colors.surfaceMuted }]}>
                  <Text style={[styles.previewBadgeText, { color: colors.statusWatch }]}>
                    UI PREVIEW — PENDING BACKEND INTEGRATION
                  </Text>
                </View>
                <Text style={[styles.previewModalTitle, { color: colors.textPrimary }]}>
                  Public Bulletin Preview
                </Text>
              </View>
              <Pressable
                onPress={() => setShowPreviewModal(false)}
                hitSlop={spacing.sm}
                accessibilityRole="button"
                accessibilityLabel="Close preview">
                <Feather name="x" size={20} color={colors.textSecondary} />
              </Pressable>
            </View>

            <ScrollView contentContainerStyle={styles.previewScroll}>
              <View style={[styles.previewAttribution, { backgroundColor: colors.surfaceMuted }]}>
                <Feather name="shield" size={14} color={colors.brandPrimary} />
                <Text style={[styles.previewAttributionText, { color: colors.textPrimary }]}>
                  {session?.ngoName || 'Disaster Relief Network India'} · {session?.authorizedOfficerName || 'Authorized Officer'}
                </Text>
              </View>

              <View style={styles.previewRow}>
                <Text style={[styles.previewKey, { color: colors.textTertiary }]}>SITUATION:</Text>
                <Text style={[styles.previewVal, { color: colors.textPrimary }]}>
                  {selectedEvent?.title || 'Selected Flood Event'}
                </Text>
              </View>

              {messageId ? (
                <View style={styles.previewRow}>
                  <Text style={[styles.previewKey, { color: colors.textTertiary }]}>CITIZEN REF:</Text>
                  <Text style={[styles.previewVal, typography.tabular, { color: colors.textPrimary }]}>
                    {messageId}
                  </Text>
                </View>
              ) : null}

              <View style={styles.previewRow}>
                <Text style={[styles.previewKey, { color: colors.textTertiary }]}>CATEGORY:</Text>
                <Text style={[styles.previewVal, { color: colors.textPrimary }]}>
                  {contributionType.replace(/_/g, ' ')}
                </Text>
              </View>

              <View style={styles.previewRow}>
                <Text style={[styles.previewKey, { color: colors.textTertiary }]}>LOCALITY:</Text>
                <Text style={[styles.previewVal, { color: colors.textPrimary }]}>
                  {locality || '(No locality specified)'}
                </Text>
              </View>

              <View style={styles.previewRow}>
                <Text style={[styles.previewKey, { color: colors.textTertiary }]}>SUMMARY:</Text>
                <Text style={[styles.previewVal, { color: colors.textPrimary }]}>
                  {summary || '(No summary entered)'}
                </Text>
              </View>

              {needs.trim() ? (
                <View style={styles.previewRow}>
                  <Text style={[styles.previewKey, { color: colors.textTertiary }]}>URGENT NEEDS:</Text>
                  <Text style={[styles.previewVal, { color: colors.textPrimary }]}>
                    {needs}
                  </Text>
                </View>
              ) : null}

              {resources.trim() ? (
                <View style={styles.previewRow}>
                  <Text style={[styles.previewKey, { color: colors.textTertiary }]}>AVAILABLE RESOURCES:</Text>
                  <Text style={[styles.previewVal, { color: colors.textPrimary }]}>
                    {resources}
                  </Text>
                </View>
              ) : null}

              <View style={styles.previewRow}>
                <Text style={[styles.previewKey, { color: colors.textTertiary }]}>VERIFICATION METHOD:</Text>
                <Text style={[styles.previewVal, { color: colors.textPrimary }]}>
                  {verificationMethod}
                </Text>
              </View>
            </ScrollView>

            <View style={styles.previewFooterNotice}>
              <Feather name="info" size={13} color={colors.textTertiary} />
              <Text style={[styles.previewFooterText, { color: colors.textTertiary }]}>
                Live public publication requires confirmation from backend endpoint POST /api/v1/ngo/contributions/publish.
              </Text>
            </View>

            <Pressable
              onPress={() => setShowPreviewModal(false)}
              style={[styles.closePreviewBtn, { backgroundColor: colors.brandPrimary }]}>
              <Text style={styles.closePreviewBtnText}>Close Preview</Text>
            </Pressable>
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
  headerTitle: {
    ...typography.title,
    fontSize: 20,
    lineHeight: 24,
  },
  scrollContent: {
    paddingHorizontal: spacing.screenPadding,
    paddingTop: spacing.xs,
    paddingBottom: spacing.xxl,
    gap: spacing.md,
  },
  noticeBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    padding: spacing.md,
    borderRadius: radii.card,
  },
  noticeBannerText: {
    ...typography.caption,
    fontSize: 12,
    lineHeight: 16,
    flex: 1,
  },
  refCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    padding: spacing.sm,
    borderRadius: radii.sm,
  },
  refCardText: {
    ...typography.caption,
    fontSize: 12,
  },
  section: {
    gap: spacing.xs,
  },
  sectionLabel: {
    ...typography.overline,
    fontSize: 11,
  },
  card: {
    borderRadius: radii.card,
    padding: spacing.cardPadding,
    gap: spacing.xs,
  },
  eventOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.sm,
    borderRadius: radii.sm,
    gap: spacing.sm,
  },
  eventOptionContent: {
    flex: 1,
    gap: 2,
  },
  eventOptionTitle: {
    ...typography.bodyMedium,
    fontSize: 13,
  },
  eventOptionSub: {
    ...typography.caption,
    fontSize: 11,
  },
  radioCircle: {
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  typeRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
  },
  typeChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: spacing.sm + 2,
    paddingVertical: spacing.sm,
    borderRadius: radii.chip,
  },
  typeChipText: {
    ...typography.caption,
    fontSize: 12,
  },
  textInput: {
    borderRadius: radii.sm,
    paddingHorizontal: spacing.sm + 2,
    paddingVertical: spacing.sm,
    fontSize: 13,
    minHeight: touchTargets.min,
  },
  textArea: {
    borderRadius: radii.sm,
    padding: spacing.sm,
    minHeight: 90,
    fontSize: 13,
    lineHeight: 18,
  },
  charCounter: {
    ...typography.caption,
    fontSize: 11,
    textAlign: 'right',
    marginTop: 2,
  },
  inputLabel: {
    ...typography.caption,
    fontSize: 12,
    fontWeight: '600',
  },
  actionsColumn: {
    gap: spacing.sm,
    marginTop: spacing.xs,
  },
  previewButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    height: touchTargets.min,
    borderRadius: radii.button,
  },
  previewButtonText: {
    ...typography.bodyMedium,
    fontSize: 13,
    fontWeight: '600',
  },
  actionsRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  actionButtonSecondary: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    height: touchTargets.min,
    borderRadius: radii.button,
  },
  actionButtonSecondaryText: {
    ...typography.bodyMedium,
    fontSize: 14,
    fontWeight: '600',
  },
  actionButtonPrimary: {
    flex: 1.2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    height: touchTargets.min,
    borderRadius: radii.button,
  },
  actionButtonPrimaryText: {
    ...typography.bodyMedium,
    color: '#FFFFFF',
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
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  modalTitle: {
    ...typography.cardTitle,
    fontSize: 16,
  },
  modalBody: {
    ...typography.body,
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
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 14,
  },
  successContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.screenPadding,
    gap: spacing.md,
  },
  successIconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  successTitle: {
    ...typography.title,
    fontSize: 22,
    textAlign: 'center',
  },
  successSubtitle: {
    ...typography.body,
    fontSize: 13,
    textAlign: 'center',
    maxWidth: 280,
  },
  receiptCard: {
    width: '100%',
    borderRadius: radii.card,
    padding: spacing.cardPadding,
    gap: spacing.sm,
  },
  receiptRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  receiptLabel: {
    ...typography.caption,
    fontSize: 12,
  },
  receiptValue: {
    ...typography.caption,
    fontSize: 12,
    fontWeight: '600',
    maxWidth: '65%',
  },
  doneButton: {
    width: '100%',
    height: touchTargets.min,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radii.button,
    marginTop: spacing.sm,
  },
  doneButtonText: {
    ...typography.bodyMedium,
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 15,
  },
  previewModalCard: {
    width: '100%',
    maxHeight: '85%',
    borderRadius: radii.card,
    padding: spacing.cardPadding,
    gap: spacing.sm,
  },
  previewModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: spacing.sm,
  },
  previewHeaderWrap: {
    flex: 1,
    gap: 4,
  },
  previewBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
    borderRadius: radii.xs,
  },
  previewBadgeText: {
    ...typography.overline,
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  previewModalTitle: {
    ...typography.cardTitle,
    fontSize: 17,
  },
  previewScroll: {
    gap: spacing.sm,
    paddingVertical: spacing.xs,
  },
  previewAttribution: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    padding: spacing.sm,
    borderRadius: radii.sm,
  },
  previewAttributionText: {
    ...typography.caption,
    fontSize: 12,
    fontWeight: '600',
  },
  previewRow: {
    gap: 2,
  },
  previewKey: {
    ...typography.caption,
    fontSize: 11,
    fontWeight: '700',
  },
  previewVal: {
    ...typography.body,
    fontSize: 13,
    lineHeight: 18,
  },
  previewFooterNotice: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingTop: spacing.xs,
  },
  previewFooterText: {
    ...typography.caption,
    fontSize: 11,
    lineHeight: 15,
    flex: 1,
  },
  closePreviewBtn: {
    height: touchTargets.min,
    borderRadius: radii.button,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: spacing.xs,
  },
  closePreviewBtnText: {
    ...typography.bodyMedium,
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 14,
  },
});
