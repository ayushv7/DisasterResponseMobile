/**
 * Offer help — food, money, equipment or volunteering, optionally in reply to
 * a need published by a verified NGO. Anyone can read the needs; submitting
 * an offer needs the optional citizen sign-in. Matching happens on the backend.
 */
import React, { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { router } from 'expo-router';

import { AuthField, PrimaryButton } from '@/components/AuthForm';
import { CitizenSignInPrompt } from '@/components/CitizenSignInPrompt';
import { EmptyState } from '@/components/EmptyState';
import { ErrorState } from '@/components/ErrorState';
import { useGoBack } from '@/navigation/use-go-back';
import { api, IS_MOCK_API } from '@/services/api';
import { useSession } from '@/session/session-context';
import { useTheme } from '@/theme';
import { radii, spacing, touchTargets } from '@/theme/spacing';
import { typography } from '@/theme/typography';
import { HELP_KIND_LABELS, HelpKind, HelpOffer, NgoNeed } from '@/types/offers';

const KINDS = Object.keys(HELP_KIND_LABELS) as HelpKind[];

export default function OfferHelpScreen() {
  const goBack = useGoBack();
  const { colors } = useTheme();
  const { citizen } = useSession();

  const [needs, setNeeds] = useState<NgoNeed[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const [needId, setNeedId] = useState<string | undefined>();
  const [kind, setKind] = useState<HelpKind>('FOOD');
  const [area, setArea] = useState('');
  const [details, setDetails] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState<{ offer: HelpOffer; simulated: boolean } | null>(null);

  const load = useCallback(async () => {
    try {
      setErrorMsg(null);
      setNeeds((await api.getNgoNeeds()).data);
    } catch (err: any) {
      setErrorMsg(err?.message || 'Could not load NGO needs.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    load();
  }, [load]);

  const handleSubmit = async () => {
    if (!area.trim() || !details.trim()) {
      Alert.alert('Required fields', 'Enter your area and what you can offer.');
      return;
    }
    try {
      setSubmitting(true);
      const result = await api.offerHelp({ kind, area: area.trim(), details: details.trim(), needId });
      setSubmitted({ offer: result.data, simulated: result.source === 'sample' });
      setDetails('');
      setNeedId(undefined);
    } catch (err: any) {
      Alert.alert('Could not submit offer', err?.message || 'Try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <SafeAreaView
      edges={['top', 'left', 'right']}
      style={[styles.safeArea, { backgroundColor: colors.background }]}>
      <View style={styles.header}>
        <Pressable
          onPress={goBack}
          style={styles.iconButton}
          accessibilityRole="button"
          accessibilityLabel="Go back">
          <Feather name="arrow-left" size={22} color={colors.textPrimary} />
        </Pressable>
        <Text numberOfLines={1} style={[styles.headerTitle, { color: colors.textPrimary }]}>Offer help</Text>
      </View>

      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <Text style={[styles.caption, { color: colors.textSecondary }]}>
          In an emergency, message an NGO from any alert. No sign-in needed.
        </Text>

        <Text style={[styles.overline, { color: colors.textTertiary }]}>
          NEEDS FROM VERIFIED NGOS{IS_MOCK_API ? ' · SAMPLE DATA' : ''}
        </Text>
        {loading ? (
          <ActivityIndicator color={colors.brandPrimary} />
        ) : errorMsg ? (
          <ErrorState message={errorMsg} onRetry={load} />
        ) : needs.length === 0 ? (
          <EmptyState
            title="No published needs right now"
            description="You can still make a general offer below."
          />
        ) : (
          needs.map((need) => {
            const selected = need.id === needId;
            return (
              <Pressable
                key={need.id}
                onPress={() => citizen && setNeedId(selected ? undefined : need.id)}
                disabled={!citizen}
                style={[
                  styles.card,
                  { backgroundColor: selected ? colors.surfaceMuted : colors.surface },
                ]}
                accessibilityRole={citizen ? 'radio' : undefined}
                accessibilityState={{ selected }}>
                <View style={styles.row}>
                  <Text style={[styles.body, styles.bold, styles.flex, { color: colors.textPrimary }]}>
                    {need.ngoName}
                  </Text>
                  {selected && <Feather name="check" size={16} color={colors.actionPrimary} />}
                </View>
                <Text style={[styles.body, { color: colors.textPrimary }]}>{need.needs}</Text>
                <Text style={[styles.caption, { color: colors.textTertiary }]}>
                  {need.locality} · {need.incidentTitle}
                </Text>
              </Pressable>
            );
          })
        )}

        {submitted && (
          <View
            style={[styles.card, { backgroundColor: colors.surface }]}
            accessibilityLiveRegion="polite">
            <Text style={[styles.body, styles.bold, { color: colors.textPrimary }]}>
              {submitted.simulated
                ? 'Simulated: offer saved on this device only. Nothing was sent to an NGO.'
                : 'Offer submitted. An NGO will contact you if it is matched.'}
            </Text>
            <Pressable
              onPress={() => router.push('/my-offers')}
              style={styles.textButton}
              accessibilityRole="link">
              <Text style={[styles.body, { color: colors.brandPrimary }]}>View my offers</Text>
            </Pressable>
          </View>
        )}

        <Text style={[styles.overline, { color: colors.textTertiary }]}>YOUR OFFER</Text>
        {!citizen ? (
          <CitizenSignInPrompt />
        ) : (
          <View style={[styles.card, styles.form, { backgroundColor: colors.surface }]}>
            <View style={styles.chips}>
              {KINDS.map((k) => {
                const active = k === kind;
                return (
                  <Pressable
                    key={k}
                    onPress={() => setKind(k)}
                    style={[
                      styles.chip,
                      { backgroundColor: active ? colors.actionPrimary : colors.surfaceMuted },
                    ]}
                    accessibilityRole="radio"
                    accessibilityState={{ selected: active }}>
                    <Text
                      style={[
                        styles.caption,
                        styles.bold,
                        { color: active ? colors.onActionPrimary : colors.textPrimary },
                      ]}>
                      {HELP_KIND_LABELS[k]}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
            {kind === 'MONEY' && (
              <Text style={[styles.caption, { color: colors.textSecondary }]}>
                No payment is taken in this app. A matched NGO contacts you directly.
              </Text>
            )}
            <AuthField
              label="Your area"
              placeholder="Town or district"
              value={area}
              onChangeText={setArea}
            />
            <AuthField
              label="What you can offer"
              placeholder="Quantities, availability, how to reach you"
              multiline
              value={details}
              onChangeText={setDetails}
            />
            {needId && (
              <Text style={[styles.caption, { color: colors.textSecondary }]}>
                Responding to the selected NGO need.
              </Text>
            )}
            <PrimaryButton label="Submit offer" onPress={handleSubmit} busy={submitting} />
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
  flex: {
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
  iconButton: {
    width: touchTargets.min,
    height: touchTargets.min,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    ...typography.title,
    fontSize: 20,
    lineHeight: 24,
    flexShrink: 1,
  },
  content: {
    paddingHorizontal: spacing.screenPadding,
    paddingTop: spacing.sm,
    paddingBottom: spacing.xxl,
    gap: spacing.sm,
  },
  overline: {
    ...typography.overline,
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.5,
    marginTop: spacing.sm,
  },
  card: {
    borderRadius: radii.card,
    padding: spacing.cardPadding,
    gap: spacing.xs,
  },
  form: {
    gap: spacing.md,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  chips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
  },
  chip: {
    minHeight: touchTargets.min,
    paddingHorizontal: spacing.md,
    borderRadius: radii.button,
    justifyContent: 'center',
  },
  body: {
    ...typography.body,
    fontSize: 14,
    lineHeight: 20,
  },
  bold: {
    fontWeight: '600',
  },
  textButton: {
    minHeight: touchTargets.min,
    justifyContent: 'center',
  },
  caption: {
    ...typography.caption,
    fontSize: 12,
    lineHeight: 17,
  },
});
