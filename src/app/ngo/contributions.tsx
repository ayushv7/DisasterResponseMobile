/**
 * NgoContributionsScreen — Authorized NGO Contributions Workspace
 *
 * Displays public bulletins, relief notices, and field updates published
 * or drafted by the authenticated verified NGO.
 *
 * GATED:
 * Only independently VERIFIED organizations may author, manage, or publish
 * relief contributions.
 */

import React, { useCallback, useEffect, useState } from 'react';
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
import {
  fetchNgoContributions,
  fetchNgoSession,
} from '@/services/ngo-api';
import { useTheme } from '@/theme';
import { radii, spacing, touchTargets } from '@/theme/spacing';
import { typography } from '@/theme/typography';
import {
  ContributionStatus,
  NgoContributionItem,
  NgoSession,
} from '@/types/ngo-workspace';

type FilterTab = 'ALL' | 'PUBLISHED' | 'DRAFT';

export default function NgoContributionsScreen() {
  const { colors } = useTheme();

  const [session, setSession] = useState<NgoSession | null>(null);
  const [activeFilter, setActiveFilter] = useState<FilterTab>('ALL');
  const [items, setItems] = useState<NgoContributionItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const loadData = useCallback(async (isRefresh = false) => {
    try {
      if (!isRefresh) setLoading(true);
      setErrorMsg(null);

      const sess = await fetchNgoSession();
      setSession(sess);

      if (!sess || sess.verificationStatus !== 'VERIFIED') {
        setItems([]);
        return;
      }

      const all = await fetchNgoContributions();
      setItems(all);
    } catch (err: any) {
      setErrorMsg(err?.message || 'Failed to load contributions.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const onRefresh = () => {
    setRefreshing(true);
    loadData(true);
  };

  const isVerified = session?.verificationStatus === 'VERIFIED';

  const filteredItems = items.filter((item) => {
    if (activeFilter === 'ALL') return true;
    return item.status === activeFilter;
  });

  const renderStatusDot = (status: ContributionStatus) => {
    const isPub = status === 'PUBLISHED';
    return (
      <View
        style={[
          styles.statusDot,
          {
            backgroundColor: isPub
              ? colors.statusResolved
              : colors.statusWatch,
          },
        ]}
      />
    );
  };

  const formatTypeLabel = (type: string) => {
    return type.replace(/_/g, ' ');
  };

  return (
    <SafeAreaView
      edges={['top', 'left', 'right']}
      style={[styles.safeArea, { backgroundColor: colors.background }]}>
      {/* Top Header */}
      <View style={styles.header}>
        <View style={styles.headerTitleWrap}>
          <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>
            Contributions
          </Text>
          <Text style={[styles.headerSubtitle, { color: colors.textTertiary }]}>
            {session ? session.ngoName : 'Responder Workspace'}
          </Text>
        </View>

        {isVerified && (
          <Pressable
            onPress={() => router.push('/ngo/contributions/compose')}
            style={[
              styles.composeButton,
              { backgroundColor: colors.brandPrimary },
            ]}
            android_ripple={{ color: colors.primaryPressed }}
            accessibilityRole="button"
            accessibilityLabel="Compose new contribution">
            <Feather name="plus" size={16} color="#FFFFFF" />
            <Text style={styles.composeButtonText}>Compose</Text>
          </Pressable>
        )}
      </View>

      {!isVerified && !loading ? (
        <View style={styles.gateBlockedContainer}>
          <EmptyState
            title={!session ? 'Sign In Required' : 'Access Restricted'}
            description={
              !session
                ? 'You must be signed in as an authorized responder to access and author NGO contributions.'
                : `Your organization is currently marked ${session.verificationStatus}. Only independently VERIFIED organizations may author official contributions.`
            }
            actionLabel={!session ? 'Sign In' : undefined}
            onAction={!session ? () => router.replace('/login') : undefined}
          />
        </View>
      ) : (
        <>
          {/* Filter Chips */}
          <View style={styles.filterBar}>
            {(['ALL', 'PUBLISHED', 'DRAFT'] as FilterTab[]).map((tab) => {
              const selected = activeFilter === tab;
              return (
                <Pressable
                  key={tab}
                  onPress={() => setActiveFilter(tab)}
                  style={[
                    styles.filterChip,
                    {
                      backgroundColor: selected
                        ? colors.surfaceMuted
                        : colors.surface,
                    },
                  ]}>
                  <Text
                    style={[
                      styles.filterText,
                      {
                        color: selected
                          ? colors.textPrimary
                          : colors.textTertiary,
                        fontWeight: selected ? '700' : '400',
                      },
                    ]}>
                    {tab === 'ALL'
                      ? 'All'
                      : tab === 'PUBLISHED'
                      ? 'Published'
                      : 'Drafts'}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          {/* List Content */}
          {loading && !refreshing ? (
            <View style={styles.skeletonContainer}>
              <SkeletonCard />
              <SkeletonCard />
            </View>
          ) : errorMsg ? (
            <ErrorState message={errorMsg} onRetry={() => loadData()} />
          ) : filteredItems.length === 0 ? (
            <EmptyState
              title={
                activeFilter === 'DRAFT'
                  ? 'No Draft Contributions'
                  : 'No Contributions Found'
              }
              description={
                activeFilter === 'DRAFT'
                  ? 'You do not have any pending drafts in progress.'
                  : 'No verified situation updates match this filter.'
              }
              actionLabel="Create Contribution"
              onAction={() => router.push('/ngo/contributions/compose')}
            />
          ) : (
            <FlatList
              data={filteredItems}
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
                <View
                  style={[styles.card, { backgroundColor: colors.surface }]}>
                  {/* Top Status & Timestamp */}
                  <View style={styles.cardHeader}>
                    <View style={styles.statusWrap}>
                      {renderStatusDot(item.status)}
                      <Text
                        style={[
                          styles.statusText,
                          {
                            color:
                              item.status === 'PUBLISHED'
                                ? colors.statusResolved
                                : colors.statusWatch,
                          },
                        ]}>
                        {item.status}
                      </Text>
                      <Text
                        style={[
                          styles.typeTag,
                          { color: colors.textTertiary },
                        ]}>
                        · {formatTypeLabel(item.contributionType)}
                      </Text>
                    </View>
                    <Text
                      style={[
                        styles.timeText,
                        typography.tabular,
                        { color: colors.textTertiary },
                      ]}>
                      {new Date(
                        item.publishedAt || item.createdAt
                      ).toLocaleDateString([], {
                        month: 'short',
                        day: 'numeric',
                      })}
                    </Text>
                  </View>

                  {/* Linked Event Title */}
                  <Text
                    style={[styles.eventLink, { color: colors.textSecondary }]}
                    numberOfLines={1}>
                    Event: {item.eventTitle}
                  </Text>

                  {/* Locality */}
                  <View style={styles.localityRow}>
                    <Feather
                      name="map-pin"
                      size={12}
                      color={colors.textTertiary}
                    />
                    <Text
                      style={[
                        styles.localityText,
                        { color: colors.textSecondary },
                      ]}>
                      {item.locality}
                    </Text>
                  </View>

                  {/* Summary */}
                  <Text
                    style={[styles.summaryText, { color: colors.textPrimary }]}>
                    {item.summary}
                  </Text>

                  {/* Extra fields if present */}
                  {item.needs && (
                    <Text
                      style={[styles.metaText, { color: colors.textSecondary }]}
                      numberOfLines={1}>
                      Needs: {item.needs}
                    </Text>
                  )}
                  {item.availableResources && (
                    <Text
                      style={[styles.metaText, { color: colors.textSecondary }]}
                      numberOfLines={1}>
                      Resources: {item.availableResources}
                    </Text>
                  )}

                  {/* Attribution Footer */}
                  <View style={styles.cardFooter}>
                    <Feather
                      name="shield"
                      size={12}
                      color={colors.textTertiary}
                    />
                    <Text
                      style={[
                        styles.attributionText,
                        { color: colors.textTertiary },
                      ]}>
                      Attributed to {item.ngoName} ({item.authorOfficer})
                    </Text>
                  </View>
                </View>
              )}
            />
          )}
        </>
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
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.screenPadding,
    paddingTop: spacing.md,
    paddingBottom: spacing.sm,
  },
  headerTitleWrap: {
    gap: 2,
    flex: 1,
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
  composeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs + 3,
    borderRadius: radii.button,
  },
  composeButtonText: {
    ...typography.bodyMedium,
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 13,
  },
  gateBlockedContainer: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: spacing.screenPadding,
  },
  filterBar: {
    flexDirection: 'row',
    paddingHorizontal: spacing.screenPadding,
    gap: spacing.xs,
    marginBottom: spacing.sm,
  },
  filterChip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs + 2,
    borderRadius: radii.chip,
  },
  filterText: {
    ...typography.caption,
    fontSize: 12,
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
    gap: 6,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statusWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  statusText: {
    ...typography.caption,
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  typeTag: {
    ...typography.caption,
    fontSize: 11,
    textTransform: 'capitalize',
  },
  timeText: {
    ...typography.caption,
    fontSize: 11,
  },
  eventLink: {
    ...typography.caption,
    fontSize: 12,
    fontWeight: '600',
  },
  localityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  localityText: {
    ...typography.caption,
    fontSize: 12,
  },
  summaryText: {
    ...typography.body,
    fontSize: 13,
    lineHeight: 18,
  },
  metaText: {
    ...typography.caption,
    fontSize: 12,
  },
  cardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginTop: spacing.xs,
  },
  attributionText: {
    ...typography.caption,
    fontSize: 11,
  },
});
