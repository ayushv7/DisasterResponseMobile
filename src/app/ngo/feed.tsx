/**
 * NgoEventFeedScreen — Responder Situational Event Feed
 *
 * Dedicated to authorized NGO field personnel to monitor active, candidate,
 * and resolved flood situations, inspect automated sensor observations,
 * and coordinate relief efforts.
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
import { radii, spacing, touchTargets } from '@/theme/spacing';
import { typography } from '@/theme/typography';
import { FloodEvent } from '@/types/disaster';
import { NgoSession } from '@/types/ngo-workspace';

export default function NgoEventFeedScreen() {
  const { colors } = useTheme();

  const [session, setSession] = useState<NgoSession | null>(null);
  const [events, setEvents] = useState<FloodEvent[]>([]);
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
        setEvents([]);
        return;
      }

      // Load events
      setEvents(SAMPLE_FLOOD_EVENTS);
    } catch (err: any) {
      setErrorMsg(err?.message || 'Failed to load situational feed.');
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
            Situational Feed
          </Text>
          <Text style={[styles.headerSubtitle, { color: colors.textTertiary }]}>
            {session?.ngoName || 'NGO Responder Workspace'}
          </Text>
        </View>
      </View>

      {!isVerified && !loading ? (
        <View style={styles.gateBlockedContainer}>
          <EmptyState
            title="Access Restricted"
            description={`Your organization is currently marked ${
              session?.verificationStatus || 'UNAUTHORIZED'
            }. Only independently VERIFIED organizations may access responder feeds.`}
          />
        </View>
      ) : loading && !refreshing ? (
        <View style={styles.skeletonContainer}>
          <SkeletonCard />
          <SkeletonCard />
          <SkeletonCard />
        </View>
      ) : errorMsg ? (
        <ErrorState message={errorMsg} onRetry={() => loadData()} />
      ) : (
        <FlatList
          data={events}
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
                  params: { id: item.id },
                })
              }
              android_ripple={{ color: colors.surfaceMuted }}
              accessibilityRole="button"
              accessibilityLabel={`Event ${item.title}`}
              style={[styles.card, { backgroundColor: colors.surface }]}>
              {/* Top Row: Severity dot + Status */}
              <View style={styles.cardHeader}>
                <View style={styles.statusWrap}>
                  <View
                    style={[
                      styles.dot,
                      {
                        backgroundColor:
                          item.severityLevel === 'CRITICAL'
                            ? colors.statusActive
                            : colors.statusWatch,
                      },
                    ]}
                  />
                  <Text
                    style={[
                      styles.statusText,
                      { color: colors.textSecondary },
                    ]}>
                    {item.status} · {item.severityLevel}
                  </Text>
                </View>
                <Text
                  style={[
                    styles.timeText,
                    typography.tabular,
                    { color: colors.textTertiary },
                  ]}>
                  {new Date(item.latestSourceTime).toLocaleTimeString([], {
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </Text>
              </View>

              {/* Title & Location */}
              <Text style={[styles.eventTitle, { color: colors.textPrimary }]}>
                {item.title}
              </Text>
              <Text style={[styles.locationText, { color: colors.textTertiary }]}>
                {item.location}
              </Text>

              {/* Summary */}
              <Text
                style={[styles.summaryText, { color: colors.textSecondary }]}
                numberOfLines={2}>
                {item.summary}
              </Text>

              {/* Telemetry info footer */}
              <View style={styles.cardFooter}>
                <View style={styles.footerItem}>
                  <Feather name="activity" size={12} color={colors.textTertiary} />
                  <Text
                    style={[
                      styles.footerText,
                      typography.tabular,
                      { color: colors.textTertiary },
                    ]}>
                    {item.observations.length} Source Observations
                  </Text>
                </View>
                <View style={styles.footerItem}>
                  <Feather
                    name="message-circle"
                    size={12}
                    color={colors.textTertiary}
                  />
                  <Text
                    style={[
                      styles.footerText,
                      typography.tabular,
                      { color: colors.textTertiary },
                    ]}>
                    {item.contributions.length} NGO Contributions
                  </Text>
                </View>
              </View>
            </Pressable>
          )}
        />
      )}

      {/* Dedicated NGO Bottom Navigation */}
      <NgoBottomNavBar activeTab="feed" />
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
  statusWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  statusText: {
    ...typography.caption,
    fontSize: 11,
    fontWeight: '600',
  },
  timeText: {
    ...typography.caption,
    fontSize: 11,
  },
  eventTitle: {
    ...typography.bodyMedium,
    fontSize: 15,
    fontWeight: '600',
  },
  locationText: {
    ...typography.caption,
    fontSize: 12,
  },
  summaryText: {
    ...typography.body,
    fontSize: 13,
    lineHeight: 18,
  },
  cardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    marginTop: spacing.xs,
  },
  footerItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  footerText: {
    ...typography.caption,
    fontSize: 11,
  },
});
