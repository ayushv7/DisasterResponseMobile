/**
 * NgoContributionsScreen — Authorized NGO Contributions Workspace
 *
 * Displays public bulletins, relief notices, and field updates published
 * or prepared by the authenticated verified NGO.
 *
 * GATED:
 * Only independently VERIFIED organizations may author, manage, or publish
 * relief contributions.
 */

import React, { useEffect, useState } from 'react';
import {
  FlatList,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { router } from 'expo-router';

import { EmptyState } from '@/components/EmptyState';
import { ErrorState } from '@/components/ErrorState';
import { NgoBottomNavBar } from '@/components/NgoBottomNavBar';
import { SkeletonCard } from '@/components/SkeletonCard';
import { SAMPLE_FLOOD_EVENTS } from '@/fixtures/sample-events';
import { fetchNgoSession } from '@/services/ngo-api';
import { useTheme } from '@/theme';
import { radii, spacing } from '@/theme/spacing';
import { typography } from '@/theme/typography';
import { NgoContribution } from '@/types/disaster';
import { NgoSession } from '@/types/ngo-workspace';

interface ContributionWithEvent extends NgoContribution {
  eventId: string;
  eventTitle: string;
}

export default function NgoContributionsScreen() {
  const { colors } = useTheme();

  const [session, setSession] = useState<NgoSession | null>(null);
  const [contributions, setContributions] = useState<ContributionWithEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const loadData = async (isRefresh = false) => {
    try {
      if (!isRefresh) setLoading(true);
      setErrorMsg(null);

      const sess = await fetchNgoSession();
      setSession(sess);

      if (sess.verificationStatus !== 'VERIFIED') {
        setContributions([]);
        return;
      }

      // Collect all NGO contributions from fixtures matching this NGO or all verified contributions
      const collected: ContributionWithEvent[] = [];
      SAMPLE_FLOOD_EVENTS.forEach((evt) => {
        evt.contributions.forEach((c) => {
          collected.push({
            ...c,
            eventId: evt.id,
            eventTitle: evt.title,
          });
        });
      });

      setContributions(collected);
    } catch (err: any) {
      setErrorMsg(err?.message || 'Failed to load contributions.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    loadData(true);
  };

  const isVerified = session?.verificationStatus === 'VERIFIED';

  return (
    <SafeAreaView
      edges={['top', 'left', 'right']}
      style={[styles.safeArea, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerTitleWrap}>
          <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>
            Contributions
          </Text>
          <Text style={[styles.headerSubtitle, { color: colors.textTertiary }]}>
            {session ? session.ngoName : 'Loading session...'}
          </Text>
        </View>
      </View>

      {!isVerified && !loading ? (
        <View style={styles.gateBlockedContainer}>
          <EmptyState
            title="Access Restricted"
            description={`Your organization is currently marked ${
              session?.verificationStatus || 'UNAUTHORIZED'
            }. Only independently VERIFIED organizations may publish official contributions.`}
          />
        </View>
      ) : loading && !refreshing ? (
        <View style={styles.skeletonContainer}>
          <SkeletonCard />
          <SkeletonCard />
        </View>
      ) : errorMsg ? (
        <ErrorState message={errorMsg} onRetry={() => loadData()} />
      ) : contributions.length === 0 ? (
        <EmptyState
          title="No Published Contributions"
          description="Your organization has not yet published any verified situation updates."
        />
      ) : (
        <FlatList
          data={contributions}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={colors.brandPrimary}
            />
          }
          renderItem={({ item }) => (
            <Pressable
              onPress={() =>
                router.push({
                  pathname: '/event/[id]',
                  params: { id: item.eventId },
                })
              }
              android_ripple={{ color: colors.surfaceMuted }}
              accessibilityRole="button"
              accessibilityLabel={`Contribution for ${item.eventTitle}`}
              style={[styles.card, { backgroundColor: colors.surface }]}>
              {/* Header */}
              <View style={styles.cardHeader}>
                <View style={styles.badgeRow}>
                  <Feather
                    name="check-circle"
                    size={13}
                    color={colors.statusResolved}
                  />
                  <Text
                    style={[
                      styles.badgeText,
                      { color: colors.statusResolved },
                    ]}>
                    VERIFIED CONTRIBUTION
                  </Text>
                </View>
                <Text
                  style={[
                    styles.timeText,
                    typography.tabular,
                    { color: colors.textTertiary },
                  ]}>
                  {new Date(item.publishedAt).toLocaleDateString([], {
                    month: 'short',
                    day: 'numeric',
                  })}
                </Text>
              </View>

              {/* Event Link */}
              <Text
                style={[styles.eventLink, { color: colors.textSecondary }]}
                numberOfLines={1}>
                Event: {item.eventTitle}
              </Text>

              {/* Summary & Action Taken */}
              <Text style={[styles.contribTitle, { color: colors.textPrimary }]}>
                {item.summary}
              </Text>
              {item.actionTaken && (
                <Text
                  style={[styles.contribBody, { color: colors.textSecondary }]}
                  numberOfLines={3}>
                  Action: {item.actionTaken}
                </Text>
              )}

              {/* Verification Info */}
              <View style={styles.cardFooter}>
                <Feather name="shield" size={12} color={colors.textTertiary} />
                <Text
                  style={[
                    styles.verificationInfo,
                    { color: colors.textTertiary },
                  ]}>
                  Published by {item.ngoName} (Verified)
                </Text>
              </View>
            </Pressable>
          )}
        />
      )}

      {/* Dedicated NGO Bottom Navigation */}
      <NgoBottomNavBar activeTab="contributions" />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  header: {
    paddingHorizontal: spacing.screenPadding,
    paddingTop: spacing.md,
    paddingBottom: spacing.sm,
  },
  headerTitleWrap: {
    gap: 2,
  },
  headerTitle: {
    ...typography.title,
    fontSize: 22,
    lineHeight: 28,
  },
  headerSubtitle: {
    ...typography.caption,
    fontSize: 12,
  },
  gateBlockedContainer: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: spacing.screenPadding,
  },
  skeletonContainer: {
    paddingHorizontal: spacing.screenPadding,
    gap: spacing.sm,
  },
  listContent: {
    paddingHorizontal: spacing.screenPadding,
    paddingBottom: spacing.xxl,
    gap: spacing.sm,
  },
  card: {
    borderRadius: radii.card,
    padding: spacing.cardPadding,
    gap: spacing.xs,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  badgeText: {
    ...typography.caption,
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  timeText: {
    ...typography.caption,
    fontSize: 11,
  },
  eventLink: {
    ...typography.caption,
    fontSize: 12,
  },
  contribTitle: {
    ...typography.bodyMedium,
    fontSize: 15,
    fontWeight: '600',
  },
  contribBody: {
    ...typography.body,
    fontSize: 13,
    lineHeight: 18,
  },
  cardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginTop: spacing.xs,
  },
  verificationInfo: {
    ...typography.caption,
    fontSize: 11,
    flex: 1,
  },
});
