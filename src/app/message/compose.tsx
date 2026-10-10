/**
 * PrivateMessageComposeScreen
 *
 * Route: /message/compose?eventId=fl-2026-081
 *
 * Allows a public user to compose and submit a private message to a
 * verified NGO in the context of a specific flood event.
 *
 * ─── BACKEND STATUS (Oct 2026) ───────────────────────────────────────────────
 * This screen is a UI-COMPLETE STUB. The API layer (src/services/messaging-api.ts)
 * returns fixture NGOs and sends nothing (no receipt). To integrate:
 *   1. Set EXPO_PUBLIC_API_BASE_URL in your .env file.
 *   2. Remove IS_STUB_API = true from the service module.
 *   3. Add real authentication (Bearer token) to the service headers.
 * See messaging-api.ts for the full backend contract specification.
 * ─────────────────────────────────────────────────────────────────────────────
 */

import React, { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';

import { FormField, PrivacyNoticeBanner } from '@/components/FormField';
import { NgoSelector } from '@/components/NgoSelector';
import { IS_MOCK_API } from '@/services/api';
import { IS_STUB_API, fetchVerifiedNgos, submitPrivateMessage } from '@/services/messaging-api';
import { SAMPLE_FLOOD_EVENTS } from '@/fixtures/sample-events';
import { useTheme } from '@/theme';
import { radii, spacing, touchTargets } from '@/theme/spacing';
import { typography } from '@/theme/typography';
import { ComposeUiState, MESSAGE_CHAR_LIMIT, MESSAGE_MIN_CHARS, MessageReceipt, VerifiedNgo } from '@/types/messaging';

export default function PrivateMessageComposeScreen() {
  const { eventId } = useLocalSearchParams<{ eventId: string }>();
  const { colors } = useTheme();

  // ── Resolve event from params ─────────────────────────────────────────────
  const event = SAMPLE_FLOOD_EVENTS.find((e) => e.id === eventId) ?? null;

  // ── NGO list state ────────────────────────────────────────────────────────
  const [ngos, setNgos] = useState<VerifiedNgo[]>([]);
  const [ngoLoading, setNgoLoading] = useState(true);
  const [ngoLoadError, setNgoLoadError] = useState<string | null>(null);

  // ── Form state ────────────────────────────────────────────────────────────
  const [selectedNgo, setSelectedNgo] = useState<VerifiedNgo | null>(null);
  const [messageText, setMessageText] = useState('');

  // ── Validation ────────────────────────────────────────────────────────────
  const [ngoError, setNgoError] = useState<string | null>(null);
  const [messageError, setMessageError] = useState<string | null>(null);

  // ── Submission state ──────────────────────────────────────────────────────
  const [uiState, setUiState] = useState<ComposeUiState>('idle');
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [receipt, setReceipt] = useState<MessageReceipt | null>(null);

  // Guard: prevents double-submit if the component re-renders mid-flight
  const isSubmittingRef = useRef(false);

  // ── Load NGO list ─────────────────────────────────────────────────────────
  const loadNgos = async () => {
    setNgoLoading(true);
    setNgoLoadError(null);
    try {
      const list = await fetchVerifiedNgos();
      setNgos(list);
    } catch (err) {
      setNgoLoadError(
        err instanceof Error ? err.message : 'Unable to load NGO list. Please try again.'
      );
    } finally {
      setNgoLoading(false);
    }
  };

  useEffect(() => {
    (async () => {
      setNgoLoading(true);
      setNgoLoadError(null);
      try {
        const list = await fetchVerifiedNgos();
        setNgos(list);
      } catch (err) {
        setNgoLoadError(
          err instanceof Error ? err.message : 'Unable to load NGO list. Please try again.'
        );
      } finally {
        setNgoLoading(false);
      }
    })();
  }, []);

  // ── Inline validation ─────────────────────────────────────────────────────
  const validate = (): boolean => {
    let valid = true;

    if (!selectedNgo) {
      setNgoError('Please select a verified NGO to contact.');
      valid = false;
    } else {
      setNgoError(null);
    }

    const trimmed = messageText.trim();
    if (trimmed.length === 0) {
      setMessageError('Please describe your observation or need.');
      valid = false;
    } else if (trimmed.length < MESSAGE_MIN_CHARS) {
      setMessageError(`Please provide at least ${MESSAGE_MIN_CHARS} characters.`);
      valid = false;
    } else if (trimmed.length > MESSAGE_CHAR_LIMIT) {
      setMessageError(`Message must be ${MESSAGE_CHAR_LIMIT} characters or fewer.`);
      valid = false;
    } else {
      setMessageError(null);
    }

    return valid;
  };

  // ── Submit handler ────────────────────────────────────────────────────────
  const handleSubmit = async () => {
    if (isSubmittingRef.current) return; // Guard against double-tap
    if (!validate()) return;
    if (!selectedNgo || !eventId) return;

    isSubmittingRef.current = true;
    setUiState('submitting');
    setSubmitError(null);

    try {
      const result = await submitPrivateMessage({
        eventId,
        ngoId: selectedNgo.id,
        observationText: messageText.trim(),
      });
      setReceipt(result);
      setUiState('success');
    } catch (err) {
      setSubmitError(
        err instanceof Error
          ? err.message
          : 'Something went wrong. Your message was not sent. Please try again.'
      );
      setUiState('error');
    } finally {
      isSubmittingRef.current = false;
    }
  };

  const handleRetry = () => {
    setUiState('idle');
    setSubmitError(null);
  };

  const charCount = messageText.length;
  const isOverLimit = charCount > MESSAGE_CHAR_LIMIT;
  const isSubmitting = uiState === 'submitting';

  // ─── SUCCESS VIEW ─────────────────────────────────────────────────────────
  // `receipt` is null when the stub is active: nothing was sent.
  if (uiState === 'success') {
    return (
      <SafeAreaView
        edges={['top', 'left', 'right']}
        style={[styles.safeArea, { backgroundColor: colors.background }]}
      >
        <View style={[styles.header, { backgroundColor: colors.background }]}>
          <Pressable
            onPress={() => router.back()}
            style={styles.backButton}
            accessibilityRole="button"
            accessibilityLabel="Back"
          >
            <Feather name="x" size={20} color={colors.textPrimary} />
          </Pressable>
        </View>

        <ScrollView
          contentContainerStyle={styles.successContainer}
          showsVerticalScrollIndicator={false}
        >
          {receipt ? (
            <>
              <View style={[styles.successIconRing, { backgroundColor: colors.statusResolvedBg }]}>
                <Feather name="check" size={32} color={colors.statusResolved} />
              </View>

              <Text style={[styles.successTitle, { color: colors.textPrimary }]}>
                Message Submitted
              </Text>
              <Text style={[styles.successDesc, { color: colors.textSecondary }]}>
                The server accepted your private message for{' '}
                <Text style={{ fontWeight: '700' }}>{selectedNgo?.name}</Text>. It will not
                appear publicly on the platform.
              </Text>

              {/* Server receipt — only fields returned by the backend */}
              <View style={[styles.receiptBox, { backgroundColor: colors.surface }]}>
                <ReceiptRow label="Message ID" value={receipt.messageId} />
                <ReceiptRow label="NGO" value={selectedNgo?.name ?? receipt.ngoId} />
                <ReceiptRow
                  label="Submitted"
                  value={new Date(receipt.submittedAt).toLocaleString([], {
                    month: 'short',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                    hour12: false,
                  })}
                />
              </View>

              <Text style={[styles.nextStepNote, { color: colors.textTertiary }]}>
                Review status is reported by the NGO through the server and will
                appear in Messages when available.
              </Text>
            </>
          ) : (
            <>
              <View style={[styles.successIconRing, { backgroundColor: colors.surfaceMuted }]}>
                <Feather name="eye" size={28} color={colors.textSecondary} />
              </View>

              <Text style={[styles.successTitle, { color: colors.textPrimary }]}>
                Not Sent — Preview Only
              </Text>
              <Text style={[styles.successDesc, { color: colors.textSecondary }]}>
                The backend is not connected yet, so this message was not sent to{' '}
                <Text style={{ fontWeight: '700' }}>{selectedNgo?.name}</Text> and was not
                stored. No message ID or status exists.
              </Text>

              <View style={[styles.receiptBox, { backgroundColor: colors.surface }]}>
                <ReceiptRow label="NGO" value={selectedNgo?.name ?? '—'} />
                <ReceiptRow label="Event" value={eventId ?? '—'} />
              </View>
            </>
          )}

          <Pressable
            onPress={() => router.replace('/alerts')}
            style={[styles.primaryBtn, { backgroundColor: colors.brandPrimary }]}
            accessibilityRole="button"
            accessibilityLabel="Return to flood alerts feed"
          >
            <Text style={[styles.primaryBtnText, { color: colors.onPrimary }]}>
              Return to Alerts
            </Text>
          </Pressable>
        </ScrollView>
      </SafeAreaView>
    );
  }

  // ─── COMPOSE VIEW ─────────────────────────────────────────────────────────
  return (
    <SafeAreaView
      edges={['top', 'left', 'right']}
      style={[styles.safeArea, { backgroundColor: colors.background }]}
    >
      {/* Header */}
      <View style={[styles.header, { backgroundColor: colors.background }]}>
        <Pressable
          onPress={() => router.back()}
          style={styles.backButton}
          accessibilityRole="button"
          accessibilityLabel="Cancel and go back"
        >
          <Feather name="arrow-left" size={20} color={colors.textPrimary} />
          <Text style={[styles.backText, { color: colors.textPrimary }]}>Cancel</Text>
        </Pressable>
        <Text style={[styles.headerTitle, { color: colors.textPrimary }]} numberOfLines={1}>
          Message NGO
        </Text>
        <View style={styles.headerSpacer} />
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
        keyboardVerticalOffset={0}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* ── Stub notice (only if the rest of the app is live) ── */}
          {IS_STUB_API && !IS_MOCK_API && (
            <View style={[styles.stubBanner, styles.stubBannerPage, { backgroundColor: colors.statusWatchBg }]}>
              <Feather name="alert-triangle" size={13} color={colors.statusWatch} />
              <Text style={[styles.stubBannerText, { color: colors.statusWatch }]}>
                UI preview — backend not yet connected. No real message will be sent.
              </Text>
            </View>
          )}

          {/* ── Event context block ──────────────────────── */}
          {event && (
            <View style={[styles.eventContext, { backgroundColor: colors.surface }]}>
              <Text style={[styles.eventContextLabel, { color: colors.textTertiary }]}>
                Regarding flood alert
              </Text>
              <Text style={[styles.eventContextTitle, { color: colors.textPrimary }]} numberOfLines={2}>
                {event.title}
              </Text>
              <Text style={[styles.eventContextLocation, { color: colors.textSecondary }]}>
                {event.location}
              </Text>
              <Text style={[styles.eventContextId, { color: colors.textTertiary }]}>
                {event.id}
              </Text>
            </View>
          )}

          {!event && (
            <View style={[styles.eventContext, { backgroundColor: colors.surface }]}>
              <Text style={[styles.eventContextLabel, { color: colors.textTertiary }]}>
                Event ID
              </Text>
              <Text style={[styles.eventContextId, { color: colors.textPrimary }]}>
                {eventId ?? 'Not specified'}
              </Text>
            </View>
          )}

          <View style={styles.form}>
            {/* ── NGO Selector field ───────────────────── */}
            <FormField
              label="Verified NGO"
              required
              errorText={ngoError ?? undefined}
              hint="Only independently verified humanitarian organizations are listed."
            >
              <NgoSelector
                selected={selectedNgo}
                ngos={ngos}
                isLoading={ngoLoading}
                loadError={ngoLoadError}
                onSelect={(ngo) => {
                  setSelectedNgo(ngo);
                  setNgoError(null);
                }}
                onRetryLoad={loadNgos}
              />
            </FormField>

            {/* ── Message body ─────────────────────────── */}
            <FormField
              label="Your Observation or Need"
              required
              errorText={messageError ?? undefined}
              hint={`Describe what you have observed or what assistance is needed. ${MESSAGE_MIN_CHARS}–${MESSAGE_CHAR_LIMIT} characters.`}
            >
              <View
                style={[
                  styles.textAreaWrapper,
                  {
                    backgroundColor: colors.surface,
                    borderColor: isOverLimit ? colors.statusActive : 'transparent',
                    borderWidth: isOverLimit ? 1 : 0,
                  },
                ]}
              >
                <TextInput
                  value={messageText}
                  onChangeText={(t) => {
                    setMessageText(t);
                    if (messageError) setMessageError(null);
                  }}
                  placeholder="Describe what you have witnessed, or describe the assistance that is needed in your area…"
                  placeholderTextColor={colors.textTertiary}
                  multiline
                  numberOfLines={6}
                  maxLength={MESSAGE_CHAR_LIMIT + 50} // soft over-limit to show counter
                  textAlignVertical="top"
                  editable={!isSubmitting}
                  style={[
                    styles.textArea,
                    {
                      color: colors.textPrimary,
                    },
                  ]}
                  accessibilityLabel="Message to the NGO"
                />
                {/* Character counter */}
                <Text
                  style={[
                    styles.charCounter,
                    {
                      color: isOverLimit
                        ? colors.statusActive
                        : charCount > MESSAGE_CHAR_LIMIT * 0.9
                        ? colors.statusWatch
                        : colors.textTertiary,
                    },
                  ]}
                >
                  {charCount}/{MESSAGE_CHAR_LIMIT}
                </Text>
              </View>
            </FormField>

            {/* ── Privacy disclosure ───────────────────── */}
            <PrivacyNoticeBanner />

            {/* ── Submission error ─────────────────────── */}
            {uiState === 'error' && submitError && (
              <View style={[styles.submitErrorBox, { backgroundColor: colors.statusActiveBg }]}>
                <Feather name="alert-circle" size={15} color={colors.statusActive} />
                <View style={{ flex: 1 }}>
                  <Text style={[styles.submitErrorTitle, { color: colors.statusActive }]}>
                    Message not sent
                  </Text>
                  <Text style={[styles.submitErrorDesc, { color: colors.textSecondary }]}>
                    {submitError}
                  </Text>
                </View>
              </View>
            )}

            {/* ── Submit button ────────────────────────── */}
            <Pressable
              onPress={uiState === 'error' ? handleRetry : handleSubmit}
              disabled={isSubmitting || isOverLimit}
              accessibilityRole="button"
              accessibilityLabel={
                isSubmitting
                  ? 'Sending message…'
                  : uiState === 'error'
                  ? 'Retry sending message'
                  : 'Send message privately to NGO'
              }
              style={({ pressed }) => [
                styles.submitBtn,
                {
                  backgroundColor:
                    isSubmitting || isOverLimit
                      ? colors.surfaceMuted
                      : colors.brandPrimary,
                  opacity: pressed ? 0.88 : 1,
                },
              ]}
            >
              {isSubmitting ? (
                <View style={styles.submitBtnInner}>
                  <ActivityIndicator size="small" color={colors.textTertiary} />
                  <Text style={[styles.submitBtnText, { color: colors.textTertiary }]}>
                    Sending…
                  </Text>
                </View>
              ) : (
                <View style={styles.submitBtnInner}>
                  <Feather
                    name={uiState === 'error' ? 'refresh-cw' : 'send'}
                    size={16}
                    color={isOverLimit ? colors.textTertiary : colors.onPrimary}
                  />
                  <Text
                    style={[
                      styles.submitBtnText,
                      {
                        color: isOverLimit ? colors.textTertiary : colors.onPrimary,
                      },
                    ]}
                  >
                    {uiState === 'error' ? 'Try Again' : 'Send Privately to NGO'}
                  </Text>
                </View>
              )}
            </Pressable>

            {/* ── Cancellation note ────────────────────── */}
            <Text style={[styles.cancelNote, { color: colors.textTertiary }]}>
              Tap Cancel above to discard this message.
            </Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

// ─── ReceiptRow helper ────────────────────────────────────────────────────────

function ReceiptRow({ label, value }: { label: string; value: string }) {
  const { colors } = useTheme();
  return (
    <View style={receiptStyles.row}>
      <Text style={[receiptStyles.label, { color: colors.textTertiary }]}>{label}</Text>
      <Text
        style={[receiptStyles.value, typography.tabular, { color: colors.textPrimary }]}
        selectable
      >
        {value}
      </Text>
    </View>
  );
}

const receiptStyles = StyleSheet.create({
  row: {
    flexDirection: 'column',
    gap: 2,
    marginBottom: spacing.sm,
  },
  label: {
    ...typography.caption,
    fontSize: 11,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  value: {
    ...typography.caption,
    fontSize: 13,
    fontWeight: '500',
  },
});

// ─── Main styles ──────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.screenPadding,
    paddingVertical: spacing.sm,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    height: touchTargets.min,
    paddingHorizontal: spacing.xs,
  },
  backText: {
    ...typography.bodyMedium,
    fontWeight: '600',
    fontSize: 15,
  },
  headerTitle: {
    ...typography.cardTitle,
    fontSize: 16,
  },
  headerSpacer: {
    width: 70,
  },

  // Scroll content
  scrollContent: {
    paddingBottom: spacing.xxxl * 2,
  },

  // Stub banner
  stubBanner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.xs,
    borderRadius: radii.sm,
    padding: spacing.sm,
  },
  stubBannerPage: {
    marginHorizontal: spacing.screenPadding,
    marginBottom: spacing.md,
    marginTop: spacing.xs,
  },
  stubBannerText: {
    ...typography.caption,
    fontSize: 12,
    lineHeight: 17,
    flex: 1,
  },

  // Event context card
  eventContext: {
    borderRadius: radii.card,
    padding: spacing.cardPadding,
    marginHorizontal: spacing.screenPadding,
    marginBottom: spacing.lg,
    gap: 3,
  },
  eventContextLabel: {
    ...typography.caption,
    fontSize: 11,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  eventContextTitle: {
    ...typography.cardTitle,
    fontSize: 15,
    lineHeight: 21,
  },
  eventContextLocation: {
    ...typography.caption,
    fontSize: 13,
    fontWeight: '500',
  },
  eventContextId: {
    ...typography.caption,
    ...typography.tabular,
    fontSize: 11,
    marginTop: 2,
  },

  // Form container
  form: {
    paddingHorizontal: spacing.screenPadding,
  },

  // TextArea
  textAreaWrapper: {
    borderRadius: radii.card,
    paddingHorizontal: spacing.cardPadding,
    paddingTop: spacing.md,
    paddingBottom: spacing.sm,
  },
  textArea: {
    ...typography.body,
    fontSize: 15,
    lineHeight: 22,
    minHeight: 140,
  },
  charCounter: {
    ...typography.caption,
    ...typography.tabular,
    fontSize: 11,
    textAlign: 'right',
    marginTop: spacing.xs,
  },

  // Submission error box
  submitErrorBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
    borderRadius: radii.sm,
    padding: spacing.md,
    marginBottom: spacing.lg,
  },
  submitErrorTitle: {
    ...typography.caption,
    fontSize: 13,
    fontWeight: '700',
    marginBottom: 2,
  },
  submitErrorDesc: {
    ...typography.caption,
    fontSize: 12,
    lineHeight: 17,
  },

  // Submit button
  submitBtn: {
    height: touchTargets.min,
    borderRadius: radii.button,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },
  submitBtnInner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  submitBtnText: {
    ...typography.bodyMedium,
    fontSize: 15,
    fontWeight: '700',
  },

  cancelNote: {
    ...typography.caption,
    fontSize: 12,
    textAlign: 'center',
    marginBottom: spacing.md,
  },

  // Success view
  successContainer: {
    flex: 1,
    alignItems: 'center',
    padding: spacing.xl,
    paddingTop: spacing.xxxl,
  },
  successIconRing: {
    width: 72,
    height: 72,
    borderRadius: 36,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.xl,
  },
  successTitle: {
    ...typography.title,
    fontSize: 22,
    textAlign: 'center',
    marginBottom: spacing.md,
  },
  successDesc: {
    ...typography.body,
    fontSize: 15,
    lineHeight: 23,
    textAlign: 'center',
    marginBottom: spacing.xl,
  },
  receiptBox: {
    borderRadius: radii.card,
    padding: spacing.cardPadding,
    width: '100%',
    marginBottom: spacing.xl,
    gap: spacing.xs,
  },
  nextStepNote: {
    ...typography.caption,
    fontSize: 12,
    lineHeight: 18,
    textAlign: 'center',
    marginBottom: spacing.xl,
    paddingHorizontal: spacing.md,
  },
  primaryBtn: {
    height: touchTargets.min,
    paddingHorizontal: spacing.xxxl,
    borderRadius: radii.button,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryBtnText: {
    ...typography.bodyMedium,
    fontSize: 15,
    fontWeight: '700',
  },
});
