/**
 * IncidentsCatalogueScreen — Coordinator Incidents & Signal Telemetry
 *
 * Screen E: Situational incident registry:
 * - Real-time catalogue of detected flood and drainage incidents
 * - Multi-source provenance: Central Water Commission gauges, radar anomalies, citizen alerts
 * - Severity levels, affected population estimates, and active intervention counts
 * - Deep link into the Incident Workspace (/ops/incident/[id])
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
import { InfoBar } from '@/components/InfoBar';
import { NgoScopeNote } from '@/components/NgoScopeNote';
import { OpsBottomNavBar } from '@/components/OpsBottomNavBar';
import { SkeletonCard } from '@/components/SkeletonCard';
import { fetchIncidents } from '@/services/operations-api';
import { useConfirmExitAtRoot } from '@/hooks/use-confirm-exit-at-root';
import { useTheme } from '@/theme';
import { radii, spacing, touchTargets } from '@/theme/spacing';
import { typography } from '@/theme/typography';
import { IncidentRecord, SeverityLevel } from '@/types/operations';

type IncidentFilter = 'ALL' | 'CRITICAL' | 'ACTIVE' | 'WATCH';

export default function IncidentsCatalogueScreen() {
  const { colors } = useTheme();
  useConfirmExitAtRoot();

  const [incidents, setIncidents] = useState<IncidentRecord[]>([]);
  const [filter, setFilter] = useState<IncidentFilter>('ALL');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const loadData = useCallback(async (isRefresh = false) => {
    try {
      if (isRefresh) {
        setRefreshing(true);
        setErrorMsg(null);
      }
      const data = await fetchIncidents();
      setIncidents(data);
    } catch (err: any) {
      setErrorMsg(err?.message || 'Failed to sync incidents catalogue.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadData();
  }, [loadData]);

  const onRefresh = () => {
    loadData(true);
  };

  const filteredIncidents = incidents.filter((item) => {
    if (filter === 'CRITICAL') return item.severity === 'CRITICAL';
    if (filter === 'ACTIVE') return item.status === 'ACTIVE';
    if (filter === 'WATCH') return item.status === 'WATCH';
    return true;
  });

  const getSeverityColors = (severity: SeverityLevel) => {
    switch (severity) {
      case 'CRITICAL':
        return { bg: colors.statusActiveBg, text: colors.statusActive, border: colors.statusActive };
      case 'HIGH':
        return { bg: colors.statusWatchBg, text: colors.statusWatch, border: colors.statusWatch };
      case 'MODERATE':
      case 'LOW':
      default:
        return { bg: colors.surfaceMuted, text: colors.textSecondary, border: colors.border };
    }
  };

  const renderIncidentCard = ({ item }: { item: IncidentRecord }) => {
    const sevColors = getSeverityColors(item.severity);

    return (
      <Pressable
        onPress={() => router.push(`/ops/incident/${item.id}` as any)}
        accessibilityRole="button"
        accessibilityLabel={`View incident workspace for ${item.title}`}
        style={[styles.card, { backgroundColor: colors.surface }]}>
        {/* Top Badges */}
        <View style={styles.topRow}>
          <View style={styles.badgeCluster}>
            <View
              style={[
                styles.badge,
                { backgroundColor: sevColors.bg, borderColor: sevColors.border },
              ]}>
              <Text style={[styles.badgeText, { color: sevColors.text }]}>
                {item.severity}
              </Text>
            </View>
            <View
              style={[
                styles.badge,
                {
                  backgroundColor: item.status === 'ACTIVE' ? colors.brandTealBg : colors.surfaceMuted,
                  borderColor: item.status === 'ACTIVE' ? colors.brandTeal : colors.border,
                },
              ]}>
              <Text
                style={[
                  styles.badgeText,
                  { color: item.status === 'ACTIVE' ? colors.brandTeal : colors.textTertiary },
                ]}>
                {item.status}
              </Text>
            </View>
          </View>
          <Text style={[styles.timeText, { color: colors.textTertiary }]}>
            {new Date(item.detectedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </Text>
        </View>

        {/* Title & Location */}
        <View style={styles.titleBlock}>
          <Text style={[styles.title, { color: colors.textPrimary }]}>
            {item.title}
          </Text>
          <View style={styles.localityRow}>
            <Feather name="map-pin" size={13} color={colors.textSecondary} />
            <Text style={[styles.locality, { color: colors.textSecondary }]}>
              {item.location}
            </Text>
          </View>
        </View>

        {/* Area Description */}
        <Text style={[styles.description, { color: colors.textSecondary }]} numberOfLines={2}>
          {item.affectedAreaDescription}
        </Text>

        {/* Telemetry Metrics Bar */}
        <View style={[styles.metricsRow, { backgroundColor: colors.surfaceMuted }]}>
          <View style={styles.metricItem}>
            <Text style={[styles.metricLabel, { color: colors.textTertiary }]}>
              POPULATION
            </Text>
            <Text style={[styles.metricVal, { color: colors.textPrimary }]}>
              ~{item.estimatedPopulationImpact.toLocaleString()}
            </Text>
          </View>
          <View style={[styles.metricDivider, { backgroundColor: colors.divider }]} />
          <View style={styles.metricItem}>
            <Text style={[styles.metricLabel, { color: colors.textTertiary }]}>
              AT-RISK ASSETS
            </Text>
            <Text style={[styles.metricVal, { color: colors.textPrimary }]}>
              {item.criticalAssetsAtRisk.length} Sites
            </Text>
          </View>
          <View style={[styles.metricDivider, { backgroundColor: colors.divider }]} />
          <View style={styles.metricItem}>
            <Text style={[styles.metricLabel, { color: colors.textTertiary }]}>
              INTERVENTIONS
            </Text>
            <Text style={[styles.metricVal, { color: colors.brandTeal }]}>
              {item.requiredInterventionIds.length} Required
            </Text>
          </View>
        </View>

        {/* Source Provenance */}
        <View style={styles.provenanceRow}>
          <Feather name="shield" size={12} color={colors.brandTeal} />
          <Text style={[styles.provenanceText, { color: colors.textTertiary }]} numberOfLines={1}>
            Source: {item.detectionSource}
          </Text>
        </View>

        {/* Workspace Link CTA */}
        <View style={styles.cardFooter}>
          <Text style={[styles.footerLinkText, { color: colors.brandTeal }]}>
            Open Incident Workspace
          </Text>
          <Feather name="chevron-right" size={16} color={colors.brandTeal} />
        </View>
      </Pressable>
    );
  };

  return (
    <SafeAreaView
      edges={['top', 'left', 'right']}
      style={[styles.safeArea, { backgroundColor: colors.background }]}>
      {/* Top Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={[styles.screenTitle, { color: colors.textPrimary }]}>
            Incident Registry
          </Text>
          <Text style={[styles.screenSubtitle, { color: colors.textTertiary }]}>
            Detected signals, sensor telemetry and provenance
          </Text>
        </View>
        <Pressable
          onPress={() => loadData(true)}
          style={styles.headerIconButton}
          accessibilityRole="button"
          accessibilityLabel="Refresh incidents">
          <Feather name="refresh-cw" size={18} color={colors.textSecondary} />
        </Pressable>
      </View>

      {/* Persistent simulation banner */}
      <InfoBar customMessage="SAMPLE DATA — OPERATIONAL SIMULATION — NOT LIVE OPERATIONS" />
      <NgoScopeNote />

      {/* Filter Chips */}
      <View style={styles.filterRow}>
        {(['ALL', 'CRITICAL', 'ACTIVE', 'WATCH'] as IncidentFilter[]).map((f) => {
          const isActive = filter === f;
          return (
            <Pressable
              key={f}
              onPress={() => setFilter(f)}
              accessibilityRole="button"
              accessibilityLabel={`Filter by ${f}`}
              style={[
                styles.filterChip,
                {
                  backgroundColor: isActive ? colors.surface : colors.surfaceMuted,
                  borderColor: isActive ? colors.brandTeal : 'transparent',
                },
              ]}>
              <Text
                style={[
                  styles.filterText,
                  {
                    color: isActive ? colors.brandTeal : colors.textSecondary,
                    fontWeight: isActive ? '700' : '500',
                  },
                ]}>
                {f}
              </Text>
            </Pressable>
          );
        })}
      </View>

      {/* Main List */}
      {loading ? (
        <View style={styles.loadingContainer}>
          <SkeletonCard />
          <SkeletonCard />
          <SkeletonCard />
        </View>
      ) : errorMsg ? (
        <ErrorState message={errorMsg} onRetry={() => loadData(true)} />
      ) : (
        <FlatList
          data={filteredIncidents}
          keyExtractor={(item) => item.id}
          renderItem={renderIncidentCard}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={colors.brandTeal}
            />
          }
          ListEmptyComponent={
            <EmptyState
              title="No Incidents Found"
              description={`No incidents match filter '${filter}'. Active monitoring continues.`}
            />
          }
        />
      )}

      {/* Bottom Navigation */}
      <OpsBottomNavBar activeTab="incidents" />
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
    justifyContent: 'space-between',
    paddingHorizontal: spacing.screenPadding,
    paddingTop: spacing.sm,
    paddingBottom: spacing.xs,
  },
  headerLeft: {
    flex: 1,
  },
  screenTitle: {
    ...typography.title,
    fontSize: 20,
    lineHeight: 24,
  },
  screenSubtitle: {
    ...typography.caption,
    fontSize: 12,
    lineHeight: 16,
    marginTop: 2,
  },
  headerIconButton: {
    width: touchTargets.min,
    height: touchTargets.min,
    alignItems: 'center',
    justifyContent: 'center',
  },
  filterRow: {
    flexDirection: 'row',
    paddingHorizontal: spacing.screenPadding,
    gap: spacing.xs,
    paddingVertical: spacing.sm,
  },
  filterChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: radii.chip,
    borderWidth: 1,
  },
  filterText: {
    ...typography.caption,
    fontSize: 12,
  },
  loadingContainer: {
    padding: spacing.screenPadding,
    gap: spacing.md,
  },
  listContent: {
    padding: spacing.screenPadding,
    gap: spacing.md,
    paddingBottom: spacing.xxl,
  },
  card: {
    borderRadius: radii.card,
    padding: spacing.cardPadding,
    gap: spacing.sm,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  badgeCluster: {
    flexDirection: 'row',
    gap: 6,
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: radii.sm,
    borderWidth: 1,
  },
  badgeText: {
    ...typography.overline,
    fontSize: 10,
    fontWeight: '700',
  },
  timeText: {
    ...typography.caption,
    fontSize: 11,
  },
  titleBlock: {
    gap: 3,
  },
  title: {
    ...typography.bodyMedium,
    fontSize: 16,
    fontWeight: '700',
    lineHeight: 20,
  },
  localityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  locality: {
    ...typography.caption,
    fontSize: 12,
  },
  description: {
    ...typography.caption,
    fontSize: 12,
    lineHeight: 16,
  },
  metricsRow: {
    flexDirection: 'row',
    borderRadius: radii.sm,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.xs,
    justifyContent: 'space-around',
    alignItems: 'center',
  },
  metricItem: {
    alignItems: 'center',
    flex: 1,
  },
  metricLabel: {
    ...typography.overline,
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  metricVal: {
    ...typography.bodyMedium,
    fontSize: 13,
    fontWeight: '700',
    marginTop: 2,
  },
  metricDivider: {
    width: 1,
    height: 24,
  },
  provenanceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingTop: 2,
  },
  provenanceText: {
    ...typography.caption,
    fontSize: 11,
    flex: 1,
  },
  cardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: 4,
    paddingTop: 4,
  },
  footerLinkText: {
    ...typography.caption,
    fontSize: 12,
    fontWeight: '700',
  },
});
