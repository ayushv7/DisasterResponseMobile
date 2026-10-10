/**
 * Check in a resource: confirm it is still available (or not), optionally
 * with updated live evidence. Nothing changes on screen until the backend
 * returns the updated resource; on failure the old state stays.
 */
import React, { useRef, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Switch, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { useLocalSearchParams } from 'expo-router';

import { PrimaryButton } from '@/components/AuthForm';
import { CheckInDueBanner } from '@/components/CheckInDue';
import { LiveEvidence } from '@/components/LiveEvidence';
import { SampleDataBadge } from '@/components/SampleDataBadge';
import { useToast } from '@/components/Toast';
import { StateView } from '@/components/StateView';
import { useApiQuery } from '@/hooks/use-api-query';
import { useGoBack } from '@/navigation/use-go-back';
import { api } from '@/services/api';
import { prepareEvidence } from '@/services/evidence';
import { useTheme } from '@/theme';
import { radii, spacing, touchTargets } from '@/theme/spacing';
import { typography } from '@/theme/typography';
import { ContributorResource, EvidenceDraft } from '@/types/contributors';

export default function CheckInScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const goBack = useGoBack();
  const toast = useToast();
  const { colors } = useTheme();
  const query = useApiQuery(
    async () => {
      const res = await api.getMyResources();
      return { ...res, data: res.data.find((r) => r.id === id) ?? null };
    },
    [id],
    (r) => r === null
  );

  const [available, setAvailable] = useState(true);
  const [withEvidence, setWithEvidence] = useState(false);
  const [evidence, setEvidence] = useState<EvidenceDraft>({ capturedAt: new Date().toISOString() });
  const [stage, setStage] = useState<'idle' | 'uploading' | 'submitting'>('idle');
  const [result, setResult] = useState<{ resource: ContributorResource; simulated: boolean } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const inFlight = useRef(false);

  const resource = query.data;

  const submit = async () => {
    if (inFlight.current || !resource) return;
    inFlight.current = true;
    setError(null);
    try {
      let payload;
      if (available && withEvidence) {
        payload = (await prepareEvidence(evidence, setStage)).evidence;
      }
      setStage('submitting');
      const res = await api.checkInResource(resource.id, { available, evidence: payload });
      setResult({ resource: res.data, simulated: res.source === 'sample' });
      toast(res.source === 'sample' ? 'Simulated: check-in recorded.' : 'Check-in recorded.');
      query.setData(res.data);
      query.refresh();
    } catch (err) {
      // Keep the previous state: the check-in did not happen
      setError(err instanceof Error ? err.message : 'Check-in failed. Try again.');
    } finally {
      inFlight.current = false;
      setStage('idle');
    }
  };

  const busy = stage !== 'idle';

  return (
    <SafeAreaView edges={['top', 'left', 'right']} style={[styles.safeArea, { backgroundColor: colors.background }]}>
      <View style={styles.header}>
        <Pressable onPress={goBack} style={styles.iconButton} accessibilityRole="button" accessibilityLabel="Go back">
          <Feather name="arrow-left" size={22} color={colors.textPrimary} />
        </Pressable>
        <Text numberOfLines={1} style={[styles.headerTitle, { color: colors.textPrimary }]}>Check in</Text>
        <SampleDataBadge source={query.source ?? undefined} />
      </View>
      <StateView
        state={query.state}
        error={query.error}
        onRetry={query.refresh}
        emptyTitle="Resource not found"
        emptyDescription="It may have been removed by your NGO.">
        {resource && (
          <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
            <View style={[styles.card, { backgroundColor: colors.surface }]}>
              <Text style={[styles.body, styles.bold, { color: colors.textPrimary }]}>
                {resource.typeLabel} × {resource.quantity} {resource.unit}
              </Text>
              {resource.statusReason && (
                <Text style={[styles.caption, { color: colors.textSecondary }]}>{resource.statusReason}</Text>
              )}
            </View>
            {resource.checkInDueAt && <CheckInDueBanner dueAt={resource.checkInDueAt} count={1} />}

            {result ? (
              <View style={[styles.card, { backgroundColor: colors.surface }]} accessibilityLiveRegion="polite">
                <Text style={[styles.body, styles.bold, { color: colors.textPrimary }]}>
                  {result.simulated ? 'Simulated: check-in recorded' : 'Check-in recorded'}
                </Text>
                <Text style={[styles.caption, { color: colors.textSecondary }]}>
                  {result.resource.statusReason ?? result.resource.freshness}
                </Text>
                {result.resource.checkInDueAt && (
                  <Text style={[styles.caption, { color: colors.textSecondary }]}>
                    Next due {new Date(result.resource.checkInDueAt).toLocaleString()}
                  </Text>
                )}
                <PrimaryButton label="Done" onPress={goBack} />
              </View>
            ) : (
              <>
                <View style={[styles.card, styles.row, { backgroundColor: colors.surface }]}>
                  <Text style={[styles.body, styles.flex, { color: colors.textPrimary }]}>
                    {available ? 'Still available' : 'Not available right now'}
                  </Text>
                  <Switch
                    value={available}
                    onValueChange={setAvailable}
                    disabled={busy}
                    accessibilityLabel="Resource is available"
                  />
                </View>
                {available && (
                  <View style={[styles.card, styles.row, { backgroundColor: colors.surface }]}>
                    <Text style={[styles.body, styles.flex, { color: colors.textPrimary }]}>
                      Add updated GPS and photo
                    </Text>
                    <Switch
                      value={withEvidence}
                      onValueChange={setWithEvidence}
                      disabled={busy}
                      accessibilityLabel="Add updated evidence"
                    />
                  </View>
                )}
                {available && withEvidence && <LiveEvidence value={evidence} onChange={setEvidence} disabled={busy} />}
                {error && (
                  <View style={[styles.card, { backgroundColor: colors.statusActiveBg }]} accessibilityLiveRegion="polite">
                    <Text style={[styles.body, styles.bold, { color: colors.statusActive }]}>Check-in not recorded</Text>
                    <Text style={[styles.caption, { color: colors.textPrimary }]}>{error}</Text>
                  </View>
                )}
                <PrimaryButton
                  label={
                    stage === 'uploading'
                      ? 'Uploading photo…'
                      : stage === 'submitting'
                        ? 'Sending…'
                        : available
                          ? 'Confirm available'
                          : 'Report unavailable'
                  }
                  onPress={submit}
                  busy={busy}
                />
              </>
            )}
          </ScrollView>
        )}
      </StateView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  flex: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.screenPadding,
    paddingTop: spacing.sm,
    paddingBottom: spacing.xs,
    gap: spacing.sm,
  },
  iconButton: { width: touchTargets.min, height: touchTargets.min, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { ...typography.title, fontSize: 20, lineHeight: 24, flex: 1 },
  content: { paddingHorizontal: spacing.screenPadding, paddingBottom: spacing.xxl, gap: spacing.sm },
  card: { borderRadius: radii.card, padding: spacing.cardPadding, gap: spacing.xs },
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  body: { ...typography.body, fontSize: 14, lineHeight: 20 },
  bold: { fontWeight: '600' },
  caption: { ...typography.caption, fontSize: 12, lineHeight: 17 },
});
