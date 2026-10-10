/**
 * My offers — the signed-in citizen's help offers and their status, as
 * returned by the backend. Private messages stay on the My Messages screen.
 */
import React, { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { router } from 'expo-router';

import { CitizenSignInPrompt } from '@/components/CitizenSignInPrompt';
import { EmptyState } from '@/components/EmptyState';
import { ErrorState } from '@/components/ErrorState';
import { useGoBack } from '@/navigation/use-go-back';
import { api } from '@/services/api';
import { useSession } from '@/session/session-context';
import { useTheme } from '@/theme';
import { radii, spacing, touchTargets } from '@/theme/spacing';
import { typography } from '@/theme/typography';
import { HELP_KIND_LABELS, HELP_OFFER_STATUS_LABELS, HelpOffer } from '@/types/offers';

export default function MyOffersScreen() {
  const goBack = useGoBack();
  const { colors } = useTheme();
  const { citizen } = useSession();

  const [offers, setOffers] = useState<HelpOffer[]>([]);
  const [simulated, setSimulated] = useState(false);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!citizen) {
      setLoading(false);
      return;
    }
    try {
      setErrorMsg(null);
      const result = await api.getMyOffers();
      setOffers(result.data);
      setSimulated(result.source === 'sample');
    } catch (err: any) {
      setErrorMsg(err?.message || 'Could not load your offers.');
    } finally {
      setLoading(false);
    }
  }, [citizen]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    load();
  }, [load]);

  const statusColor = (offer: HelpOffer) =>
    offer.status === 'ACCEPTED' || offer.status === 'MATCHED'
      ? colors.statusResolved
      : offer.status === 'SUBMITTED'
        ? colors.statusWatch
        : colors.textTertiary;

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
        <Text numberOfLines={1} style={[styles.headerTitle, { color: colors.textPrimary }]}>My offers</Text>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {!citizen ? (
          <CitizenSignInPrompt />
        ) : loading ? (
          <ActivityIndicator color={colors.brandPrimary} />
        ) : errorMsg ? (
          <ErrorState message={errorMsg} onRetry={load} />
        ) : offers.length === 0 ? (
          <EmptyState
            title="No offers yet"
            description="Offer food, money, equipment or your time to verified NGOs."
            actionLabel="Offer help"
            onAction={() => router.push('/offer-help')}
          />
        ) : (
          <>
            {simulated && (
              <Text style={[styles.caption, { color: colors.textTertiary }]}>
                Simulated: saved on this device only. No NGO has received these offers.
              </Text>
            )}
            {offers.map((offer) => (
              <View key={offer.id} style={[styles.card, { backgroundColor: colors.surface }]}>
                <View style={styles.row}>
                  <View style={[styles.dot, { backgroundColor: statusColor(offer) }]} />
                  <Text style={[styles.body, styles.bold, styles.flex, { color: colors.textPrimary }]}>
                    {HELP_KIND_LABELS[offer.kind]} · {offer.area}
                  </Text>
                </View>
                <Text style={[styles.body, { color: colors.textPrimary }]}>{offer.details}</Text>
                <Text style={[styles.caption, { color: colors.textSecondary }]}>
                  {HELP_OFFER_STATUS_LABELS[offer.status]}
                  {offer.matchedNgoName ? `: ${offer.matchedNgoName}` : ''} ·{' '}
                  {new Date(offer.createdAt).toLocaleString([], {
                    dateStyle: 'medium',
                    timeStyle: 'short',
                  })}
                </Text>
              </View>
            ))}
          </>
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
  card: {
    borderRadius: radii.card,
    padding: spacing.cardPadding,
    gap: spacing.xs,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  body: {
    ...typography.body,
    fontSize: 14,
    lineHeight: 20,
  },
  bold: {
    fontWeight: '600',
  },
  caption: {
    ...typography.caption,
    fontSize: 12,
    lineHeight: 17,
  },
});
