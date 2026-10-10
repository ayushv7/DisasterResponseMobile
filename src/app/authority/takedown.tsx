/**
 * Takedown — the authority removes a published NGO update, with a reason.
 * The backend enforces who may take content down.
 */
import React, { useCallback, useEffect, useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AuthField } from '@/components/AuthForm';
import { AuthorityTabBar } from '@/components/AuthorityTabBar';
import { EmptyState } from '@/components/EmptyState';
import { StateView } from '@/components/StateView';
import { useConfirmExitAtRoot } from '@/hooks/use-confirm-exit-at-root';
import { deriveQueryState } from '@/hooks/use-api-query';
import { api, IS_MOCK_API } from '@/services/api';
import { useTheme } from '@/theme';
import { radii, spacing, touchTargets } from '@/theme/spacing';
import { typography } from '@/theme/typography';
import { NgoContributionItem } from '@/types/ngo-workspace';

export default function TakedownScreen() {
  const { colors } = useTheme();
  useConfirmExitAtRoot();
  const [updates, setUpdates] = useState<NgoContributionItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  /** Last successful load; earlier data stays visible if a refresh fails. */
  const [lastLoadedAt, setLastLoadedAt] = useState<string | null>(null);
  const [targetId, setTargetId] = useState<string | null>(null);
  const [reason, setReason] = useState('');
  const [feedback, setFeedback] = useState<string | null>(null);
  const [pendingId, setPendingId] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      setErrorMsg(null);
      setUpdates((await api.getPublishedUpdates()).data);
      setLastLoadedAt(new Date().toISOString());
    } catch (err: any) {
      setErrorMsg(err?.message || 'Could not load published updates.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    load();
  }, [load]);

  const takedown = async (item: NgoContributionItem) => {
    if (!reason.trim()) {
      Alert.alert('Reason required', 'Say why this update is being taken down.');
      return;
    }
    if (pendingId) return;
    try {
      setPendingId(item.id);
      const result = await api.takedownUpdate(item.id, reason.trim());
      setUpdates((prev) => prev.filter((u) => u.id !== item.id));
      setFeedback(`${result.source === 'sample' ? 'Simulated: ' : ''}update from ${item.ngoName} taken down.`);
      setTargetId(null);
      setReason('');
      load();
    } catch (err: any) {
      Alert.alert('Could not take down', err?.message || 'Try again.');
    } finally {
      setPendingId(null);
    }
  };

  return (
    <SafeAreaView edges={['top', 'left', 'right']} style={[styles.safeArea, { backgroundColor: colors.background }]}>
      <Text style={[styles.title, { color: colors.textPrimary }]}>Takedown</Text>
      <StateView
        state={deriveQueryState({ loading, error: errorMsg, hasData: lastLoadedAt !== null, isEmpty: false })}
        error={errorMsg}
        onRetry={load}
        receivedAt={lastLoadedAt}>
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          {IS_MOCK_API && (
            <Text style={[styles.caption, { color: colors.textTertiary }]}>SAMPLE DATA — published NGO updates</Text>
          )}
          {feedback && <Text style={[styles.caption, { color: colors.textPrimary }]}>{feedback}</Text>}
          {updates.length === 0 ? (
            <EmptyState title="No published updates" description="Nothing to review." />
          ) : (
            updates.map((item) => (
              <View key={item.id} style={[styles.card, { backgroundColor: colors.surface }]}>
                <Text style={[styles.body, styles.bold, { color: colors.textPrimary }]}>{item.ngoName}</Text>
                <Text style={[styles.body, { color: colors.textPrimary }]}>{item.summary}</Text>
                <Text style={[styles.caption, { color: colors.textTertiary }]}>
                  {item.locality} · {item.eventTitle}
                </Text>
                {targetId === item.id ? (
                  <>
                    <AuthField label="Reason" value={reason} onChangeText={setReason} />
                    <View style={styles.row}>
                      <Pressable
                        onPress={() => takedown(item)}
                        disabled={pendingId === item.id}
                        style={[
                          styles.button,
                          { backgroundColor: colors.statusActive, opacity: pendingId === item.id ? 0.6 : 1 },
                        ]}
                        accessibilityRole="button"
                        accessibilityState={{ disabled: pendingId === item.id, busy: pendingId === item.id }}>
                        <Text style={[styles.caption, styles.bold, { color: colors.onPrimary }]}>
                          {pendingId === item.id ? 'Taking down…' : 'Take down'}
                        </Text>
                      </Pressable>
                      <Pressable
                        onPress={() => setTargetId(null)}
                        style={[styles.button, { backgroundColor: colors.surfaceMuted }]}
                        accessibilityRole="button">
                        <Text style={[styles.caption, styles.bold, { color: colors.textPrimary }]}>Cancel</Text>
                      </Pressable>
                    </View>
                  </>
                ) : (
                  <Pressable
                    onPress={() => {
                      setTargetId(item.id);
                      setReason('');
                    }}
                    style={[styles.button, styles.self, { backgroundColor: colors.surfaceMuted }]}
                    accessibilityRole="button"
                    accessibilityLabel={`Take down update from ${item.ngoName}`}>
                    <Text style={[styles.caption, styles.bold, { color: colors.statusActive }]}>Take down…</Text>
                  </Pressable>
                )}
              </View>
            ))
          )}
        </ScrollView>
      </StateView>
      <AuthorityTabBar activeTab="takedown" />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  title: {
    ...typography.title,
    fontSize: 20,
    paddingHorizontal: spacing.screenPadding,
    paddingTop: spacing.md,
    paddingBottom: spacing.sm,
  },
  content: { paddingHorizontal: spacing.screenPadding, paddingBottom: spacing.xxl, gap: spacing.sm },
  card: { borderRadius: radii.card, padding: spacing.cardPadding, gap: spacing.xs },
  row: { flexDirection: 'row', gap: spacing.sm },
  self: { alignSelf: 'flex-start' },
  button: {
    minHeight: touchTargets.min,
    paddingHorizontal: spacing.md,
    borderRadius: radii.button,
    justifyContent: 'center',
    marginTop: spacing.xs,
  },
  body: { ...typography.body, fontSize: 14, lineHeight: 20 },
  bold: { fontWeight: '600' },
  caption: { ...typography.caption, fontSize: 12, lineHeight: 17 },
});
