/**
 * NgoInboxScreen — Verified NGO Private Message Review Hub
 *
 * UI PREVIEW / DEMO NOTICE:
 * This screen demonstrates the protected NGO triage workspace.
 * Real access is strictly gated by backend OAuth/JWT tokens and independent
 * administrative verification. Organizations cannot verify themselves.
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
  fetchNgoInbox,
  fetchNgoSession,
  IS_STUB_NGO_API,
} from '@/services/ngo-api';
import { useTheme } from '@/theme';
import { radii, spacing, touchTargets } from '@/theme/spacing';
import { typography } from '@/theme/typography';
import {
  NgoInboxFilter,
  NgoInboxMessage,
  NgoMessageStatus,
  NgoOrgStatus,
  NgoSession,
} from '@/types/ngo-workspace';

export default function NgoInboxScreen() {
  const { colors } = useTheme();

  const [session, setSession] = useState<NgoSession | null>(null);
  const [activeFilter, setActiveFilter] = useState<NgoInboxFilter>('ALL');
  const [messages, setMessages] = useState<NgoInboxMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const loadData = useCallback(
    async (isRefresh = false) => {
      try {
        if (!isRefresh) setLoading(true);
        setErrorMsg(null);

        const currentSess = await fetchNgoSession();
        setSession(currentSess);

        if (currentSess.verificationStatus !== 'VERIFIED') {
          setMessages([]);
          return;
        }

        const data = await fetchNgoInbox(activeFilter);
        setMessages(data);
      } catch (err: any) {
        setErrorMsg(err?.message || 'Failed to load NGO inbox.');
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [activeFilter]
  );

  useEffect(() => {
    loadData();
  }, [loadData]);

  const onRefresh = () => {
    setRefreshing(true);
    loadData(true);
  };

  const handleOrgStatusToggle = (newStatus: NgoOrgStatus) => {
    const updated = setMockOrgStatus(newStatus);
    setSession(updated);
    loadData();
  };

  const renderStatusDot = (status: NgoMessageStatus) => {
    let dotColor = colors.textTertiary;
    if (status === 'NEEDS_REVIEW') dotColor = colors.statusWatch;
    if (status === 'CLARIFICATION_REQUESTED') dotColor = colors.brandPrimary;
    if (status === 'REVIEWED') dotColor = colors.textSecondary;
    if (status === 'PREPARED_FOR_PUBLICATION') dotColor = colors.statusResolved;
    if (status === 'REJECTED') dotColor = colors.statusActive;

    return <View style={[styles.statusDot, { backgroundColor: dotColor }]} />;
  };

  const formatStatusLabel = (status: NgoMessageStatus) => {
    switch (status) {
      case 'NEEDS_REVIEW':
        return 'Needs Review';
      case 'CLARIFICATION_REQUESTED':
        return 'Clarification';
      case 'PREPARED_FOR_PUBLICATION':
        return 'Prepared for Bulletin';
      case 'REVIEWED':
        return 'Reviewed';
      case 'REJECTED':
        return 'Closed / Rejected';
      default:
        return status;
    }
  };

  const filterTabs: { label: string; value: NgoInboxFilter }[] = [
    { label: 'All', value: 'ALL' },
    { label: 'Needs Review', value: 'NEEDS_REVIEW' },
    { label: 'Clarification', value: 'CLARIFICATION' },
    { label: 'Reviewed', value: 'REVIEWED' },
  ];

  const isVerified = session?.verificationStatus === 'VERIFIED';

  return (
    <SafeAreaView
      edges={['top', 'left', 'right']}
      style={[styles.safeArea, { backgroundColor: colors.background }]}>
      {/* Top Header */}
      <View style={styles.header}>
        <View style={styles.headerTitleWrap}>
          <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>
            Triage Inbox
          </Text>
          <Text style={[styles.headerSubtitle, { color: colors.textTertiary }]}>
            {session ? session.ngoName : 'Loading session...'}
          </Text>
        </View>
      </View>

      {/* Security & Verification Status Banner */}
      <View style={[styles.bannerCard, { backgroundColor: colors.surface }]}>
        <View style={styles.bannerRow}>
          <View style={styles.orgBadge}>
            <View
              style={[
                styles.orgStatusDot,
                {
                  backgroundColor: isVerified
                    ? colors.statusResolved
                    : colors.statusActive,
                },
              ]}
            />
            <Text
              style={[
                styles.orgStatusText,
                {
                  color: isVerified ? colors.statusResolved : colors.statusActive,
                },
              ]}>
              {session?.verificationStatus || 'CHECKING'}
            </Text>
          </View>
          <Text style={[styles.previewTag, { color: colors.textTertiary }]}>
            {IS_STUB_NGO_API ? 'Stub Gateway' : 'Live Gateway'}
          </Text>
        </View>
        <Text style={[styles.bannerText, { color: colors.textSecondary }]}>
          Protected NGO operations require independent server authorization.
          Self-verification is strictly prohibited.
        </Text>
      </View>

      {!isVerified ? (
        <View style={styles.gateBlockedContainer}>
          <EmptyState
            title="Access Restricted"
            description={`Your organization is currently marked ${
              session?.verificationStatus
            }. Publishing and triage privileges are disabled until an independent system administrator authorizes your organization.`}
          />
        </View>
      ) : (
        <>
          {/* Filters */}
          <View style={styles.filterBar}>
            {filterTabs.map((tab) => {
              const selected = activeFilter === tab.value;
              return (
                <Pressable
                  key={tab.value}
                  onPress={() => setActiveFilter(tab.value)}
                  accessibilityRole="button"
                  accessibilityState={{ selected }}
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
                        fontWeight: selected ? '600' : '400',
                      },
                    ]}>
                    {tab.label}
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
              <SkeletonCard />
            </View>
          ) : errorMsg ? (
            <ErrorState message={errorMsg} onRetry={() => loadData()} />
          ) : messages.length === 0 ? (
            <EmptyState
              title="No Messages"
              description="No incoming citizen reports match the selected triage filter."
            />
          ) : (
            <FlatList
              data={messages}
              keyExtractor={(item) => item.messageId}
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
                      pathname: '/ngo/review/[id]',
                      params: { id: item.messageId },
                    })
                  }
                  android_ripple={{ color: colors.surfaceMuted }}
                  accessibilityRole="button"
                  accessibilityLabel={`Message ${item.messageId} for event ${item.eventTitle}`}
                  style={[styles.card, { backgroundColor: colors.surface }]}>
                  {/* Top line: ref + status dot */}
                  <View style={styles.cardHeader}>
                    <View style={styles.refWrap}>
                      <Text
                        style={[
                          styles.refText,
                          typography.tabular,
                          { color: colors.textTertiary },
                        ]}>
                        REF: {item.messageId}
                      </Text>
                      <Text
                        style={[
                          styles.senderPseudonym,
                          { color: colors.textSecondary },
                        ]}>
                        via {item.senderPseudonym}
                      </Text>
                    </View>
                    <View style={styles.statusBadge}>
                      {renderStatusDot(item.status)}
                      <Text
                        style={[
                          styles.statusLabel,
                          { color: colors.textSecondary },
                        ]}>
                        {formatStatusLabel(item.status)}
                      </Text>
                    </View>
                  </View>

                  {/* Related Event */}
                  <Text
                    style={[styles.eventTitle, { color: colors.textPrimary }]}
                    numberOfLines={1}>
                    {item.eventTitle}
                  </Text>

                  {/* Excerpt */}
                  <Text
                    style={[styles.observationExcerpt, { color: colors.textSecondary }]}
                    numberOfLines={2}>
                    {item.observationText}
                  </Text>

                  {/* Footer: evidence and timestamp */}
                  <View style={styles.cardFooter}>
                    <View style={styles.evidenceWrap}>
                      <Feather
                        name="paperclip"
                        size={12}
                        color={colors.textTertiary}
                      />
                      <Text
                        style={[
                          styles.evidenceText,
                          { color: colors.textTertiary },
                        ]}
                        numberOfLines={1}>
                        {item.evidenceSummary}
                      </Text>
                    </View>
                    <Text
                      style={[
                        styles.receivedTime,
                        typography.tabular,
                        { color: colors.textTertiary },
                      ]}>
                      {new Date(item.receivedAt).toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </Text>
                  </View>
                </Pressable>
              )}
            />
          )}
        </>
      )}

      {/* Dedicated NGO Bottom Navigation */}
      <NgoBottomNavBar activeTab="inbox" />
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
  bannerCard: {
    marginHorizontal: spacing.screenPadding,
    marginTop: spacing.xs,
    marginBottom: spacing.sm,
    padding: spacing.md,
    borderRadius: radii.card,
    gap: spacing.xs,
  },
  bannerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  orgBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  orgStatusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  orgStatusText: {
    ...typography.caption,
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  previewTag: {
    ...typography.caption,
    fontSize: 11,
  },
  bannerText: {
    ...typography.caption,
    fontSize: 12,
    lineHeight: 16,
  },
  demoToggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginTop: spacing.xs,
    flexWrap: 'wrap',
  },
  demoToggleLabel: {
    ...typography.caption,
    fontSize: 11,
  },
  demoToggleChip: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
    borderRadius: radii.sm,
  },
  demoToggleText: {
    ...typography.caption,
    fontSize: 11,
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
    paddingBottom: spacing.xl,
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
  refWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  refText: {
    ...typography.caption,
    fontSize: 11,
  },
  senderPseudonym: {
    ...typography.caption,
    fontSize: 11,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  statusLabel: {
    ...typography.caption,
    fontSize: 11,
    fontWeight: '500',
  },
  eventTitle: {
    ...typography.bodyMedium,
    fontSize: 14,
    fontWeight: '600',
  },
  observationExcerpt: {
    ...typography.body,
    fontSize: 13,
    lineHeight: 18,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: spacing.xs,
  },
  evidenceWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    flex: 1,
  },
  evidenceText: {
    ...typography.caption,
    fontSize: 11,
  },
  receivedTime: {
    ...typography.caption,
    fontSize: 11,
  },
});
