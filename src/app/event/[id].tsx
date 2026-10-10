import React from 'react';
import {
  Linking,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';

import { InfoBar } from '@/components/InfoBar';
import { SAMPLE_FLOOD_EVENTS } from '@/fixtures/sample-events';
import { useSession } from '@/session/session-context';
import { useTheme } from '@/theme';
import { radii, spacing, touchTargets } from '@/theme/spacing';
import { typography } from '@/theme/typography';
import { FloodEvent, SourceObservation } from '@/types/disaster';

export default function EventDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { colors } = useTheme();
  const { role } = useSession();

  const event = SAMPLE_FLOOD_EVENTS.find((e) => e.id === id);

  const getSeverityDotColor = (currentEvent: FloodEvent) => {
    if (currentEvent.severityLevel === 'CRITICAL' || currentEvent.severityLevel === 'HIGH') {
      return colors.statusActive; // Red
    }
    if (currentEvent.severityLevel === 'MODERATE') {
      return colors.statusWatch; // Yellow / Amber
    }
    if (currentEvent.severityLevel === 'LOW') {
      return colors.statusResolved; // Green
    }

    if (currentEvent.status === 'ACTIVE') return colors.statusActive; // Red
    if (currentEvent.status === 'CANDIDATE') return colors.statusWatch; // Yellow / Amber
    if (currentEvent.status === 'RESOLVED') return colors.statusResolved; // Green
    return colors.brandPrimary; // Blue
  };

  const formatTimestamp = (isoString: string) => {
    try {
      const date = new Date(isoString);
      return (
        date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false }) +
        ' UTC · ' +
        date.toLocaleDateString([], {
          month: 'short',
          day: 'numeric',
          year: 'numeric',
        })
      );
    } catch {
      return isoString;
    }
  };

  const getSourceTypeLabel = (type: SourceObservation['sourceType']) => {
    switch (type) {
      case 'GOVERNMENT':
        return 'Official Government';
      case 'GAUGE_NETWORK':
        return 'Hydrometric Telemetry';
      case 'OFFICIAL_NEWS':
        return 'Verified News Wire';
      default:
        return type;
    }
  };

  if (!event) {
    return (
      <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]}>
        <View style={[styles.header, { backgroundColor: colors.surface }]}>
          <Pressable
            onPress={() => router.back()}
            style={styles.backButton}
            accessibilityRole="button"
            accessibilityLabel="Back to alerts">
            <Feather name="arrow-left" size={20} color={colors.textPrimary} />
            <Text style={[styles.backText, { color: colors.textPrimary }]}>Alerts</Text>
          </Pressable>
        </View>
        <View style={styles.errorContainer}>
          <Text style={[styles.errorTitle, { color: colors.textPrimary }]}>Alert Not Found</Text>
          <Text style={[styles.errorDesc, { color: colors.textSecondary }]}>
            Unable to locate event record with ID: {id}
          </Text>
          <Pressable
            onPress={() => router.back()}
            style={[styles.primaryBtn, { backgroundColor: colors.brandPrimary }]}>
            <Text style={[styles.primaryBtnText, { color: colors.onPrimary }]}>Return to Feed</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  const severityDotColor = getSeverityDotColor(event);

  return (
    <SafeAreaView
      edges={['top', 'left', 'right']}
      style={[styles.safeArea, { backgroundColor: colors.background }]}>
      {/* 1. Header Bar (Flat surface, zero borders) */}
      <View style={[styles.header, { backgroundColor: colors.background }]}>
        <Pressable
          onPress={() => router.back()}
          style={styles.backButton}
          accessibilityRole="button"
          accessibilityLabel="Back to alerts">
          <Feather name="arrow-left" size={20} color={colors.textPrimary} />
          <Text style={[styles.backText, { color: colors.textPrimary }]}>Alerts</Text>
        </Pressable>
        <Text style={[styles.headerTitle, { color: colors.textPrimary }]} numberOfLines={1}>
          Event Telemetry
        </Text>
        <View style={styles.headerSpacer} />
      </View>

      {/* Persistent Sample Data Notice */}
      <InfoBar isSampleData={true} />

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}>
        {/* 2. Primary Event Overview Card */}
        <View style={[styles.card, { backgroundColor: colors.surface }]}>
          <View style={styles.badgeRow}>
            <View style={styles.statusGroup}>
              <View style={[styles.severityDot, { backgroundColor: severityDotColor }]} />
              <Text style={[styles.statusText, { color: severityDotColor }]}>
                {event.status === 'CANDIDATE' ? 'Watch' : event.status === 'ACTIVE' ? 'Active' : event.status === 'RESOLVED' ? 'Resolved' : 'Dismissed'}
              </Text>
            </View>
            <Text style={[styles.headerId, typography.tabular, { color: colors.textTertiary }]}>
              {event.id}
            </Text>
          </View>

          <Text style={[styles.eventTitle, { color: colors.textPrimary }]}>{event.title}</Text>

          <View style={styles.metaRow}>
            <Feather name="map-pin" size={14} color={colors.textTertiary} style={styles.metaIcon} />
            <Text style={[styles.metaValue, { color: colors.textSecondary }]}>
              {event.location}
            </Text>
          </View>

          <Text style={[styles.summaryText, { color: colors.textSecondary }]}>
            {event.summary}
          </Text>

          {/* Timestamps Key-Value Box (Soft surfaceMuted container) */}
          <View style={[styles.timeBox, { backgroundColor: colors.surfaceMuted }]}>
            <View style={styles.timeRow}>
              <View style={styles.timeLabelGroup}>
                <Feather name="clock" size={13} color={colors.textTertiary} style={styles.timeIcon} />
                <Text style={[styles.timeKey, { color: colors.textSecondary }]}>
                  Source Observation
                </Text>
              </View>
              <Text style={[styles.timeVal, typography.tabular, { color: colors.textPrimary }]}>
                {formatTimestamp(event.latestSourceTime)}
              </Text>
            </View>

            <View style={styles.timeRow}>
              <View style={styles.timeLabelGroup}>
                <Feather name="download-cloud" size={13} color={colors.textTertiary} style={styles.timeIcon} />
                <Text style={[styles.timeKey, { color: colors.textSecondary }]}>
                  System Ingested
                </Text>
              </View>
              <Text style={[styles.timeVal, typography.tabular, { color: colors.textPrimary }]}>
                {formatTimestamp(event.systemRetrievedTime)}
              </Text>
            </View>
          </View>

          {/* Primary action for the public: message a verified NGO privately */}
          {role === 'public' && (
            <>
              <Pressable
                onPress={() =>
                  router.push({ pathname: '/message/compose', params: { eventId: event.id } })
                }
                style={({ pressed }) => [
                  styles.ngoActionBtn,
                  {
                    backgroundColor: pressed ? colors.actionPrimaryPressed : colors.actionPrimary,
                  },
                ]}
                accessibilityRole="button"
                accessibilityLabel="Message a verified NGO privately about this alert">
                <Feather name="message-square" size={18} color={colors.onActionPrimary} />
                <Text style={[styles.ngoActionBtnText, { color: colors.onActionPrimary }]}>
                  Message an NGO
                </Text>
              </Pressable>
              <Text style={[styles.ngoNoticeDesc, { color: colors.textTertiary }]}>
                Private. Only the verified NGO you choose can read it.
              </Text>
            </>
          )}
        </View>

        {/* 2b. Decision support: staff only (backend enforces access) */}
        {role !== 'public' && (
        <View style={[styles.orchestrationBanner, { backgroundColor: colors.surface }]}>
          <View style={styles.orchestrationHeader}>
            <View style={[styles.orchestrationIcon, { backgroundColor: colors.surfaceMuted }]}>
              <Feather name="compass" size={20} color={colors.brandPrimary} />
            </View>
            <View style={styles.orchestrationInfo}>
              <Text style={[styles.orchestrationTitle, { color: colors.textPrimary }]}>
                Response Orchestration
              </Text>
              <Text style={[styles.orchestrationDesc, { color: colors.textSecondary }]}>
                Multi-source situation assessment, prioritized needs, and evidence-traced action recommendations.
              </Text>
            </View>
          </View>
          <Pressable
            onPress={() =>
              router.push({
                pathname: '/orchestration/[id]',
                params: { id: event.id },
              })
            }
            style={[styles.orchestrationBtn, { backgroundColor: colors.surfaceMuted }]}
            android_ripple={{ color: colors.surface }}
            accessibilityRole="button"
            accessibilityLabel="View Decision Support & Recommendations">
            <Text style={[styles.orchestrationBtnText, { color: colors.brandPrimary }]}>
              View Decision Support & Actions
            </Text>
            <Feather name="arrow-right" size={15} color={colors.brandPrimary} />
          </Pressable>
        </View>
        )}

        {/* 3. Section: Source Observations */}
        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>
            Source Observations ({event.observations.length})
          </Text>
          <Text style={[styles.sectionNote, { color: colors.textTertiary }]}>
            Automated government & hydrometric gauge network reports
          </Text>
        </View>

        {event.observations.map((obs) => (
          <View
            key={obs.id}
            style={[styles.observationCard, { backgroundColor: colors.surface }]}>
            {/* Header: Severity Dot + Source Name + Category Tag */}
            <View style={styles.obsHeader}>
              <View style={styles.obsSourceGroup}>
                <View style={[styles.severityDotSmall, { backgroundColor: severityDotColor }]} />
                <Feather name="shield" size={14} color={colors.brandPrimary} style={styles.sourceShieldIcon} />
                <Text style={[styles.obsSourceName, { color: colors.brandPrimary }]} numberOfLines={2}>
                  {obs.sourceName}
                </Text>
              </View>
              <View style={[styles.sourceBadge, { backgroundColor: colors.surfaceMuted }]}>
                <Text style={[styles.sourceBadgeText, { color: colors.textSecondary }]}>
                  {getSourceTypeLabel(obs.sourceType)}
                </Text>
              </View>
            </View>

            {/* Headline */}
            <Text style={[styles.obsHeadline, { color: colors.textPrimary }]}>
              {obs.headline}
            </Text>

            {/* Evidence Callout (Pure background tint, zero borders) */}
            <View style={[styles.evidenceBox, { backgroundColor: colors.surfaceMuted }]}>
              <Text style={[styles.evidenceSnippet, { color: colors.textSecondary }]}>
                &ldquo;{obs.evidenceSnippet}&rdquo;
              </Text>
            </View>

            {/* Telemetry Timestamps Table */}
            <View style={[styles.obsTelemetryTable, { backgroundColor: colors.surfaceMuted }]}>
              <View style={styles.obsTelemetryRow}>
                <View style={styles.obsTelemetryLabelGroup}>
                  <Feather name="clock" size={12} color={colors.textTertiary} />
                  <Text style={[styles.obsTelemetryLabel, { color: colors.textTertiary }]}>
                    Source Observed
                  </Text>
                </View>
                <Text style={[styles.obsTelemetryValue, typography.tabular, { color: colors.textPrimary }]}>
                  {formatTimestamp(obs.sourceObservedAt)}
                </Text>
              </View>

              <View style={styles.obsTelemetryRow}>
                <View style={styles.obsTelemetryLabelGroup}>
                  <Feather name="download-cloud" size={12} color={colors.textTertiary} />
                  <Text style={[styles.obsTelemetryLabel, { color: colors.textTertiary }]}>
                    System Ingested
                  </Text>
                </View>
                <Text style={[styles.obsTelemetryValue, typography.tabular, { color: colors.textPrimary }]}>
                  {formatTimestamp(obs.systemRetrievedAt)}
                </Text>
              </View>
            </View>

            {/* Source Link if present */}
            {obs.sourceUrl && (
              <Pressable
                onPress={() => Linking.openURL(obs.sourceUrl!).catch(() => {})}
                style={styles.sourceLink}
                accessibilityRole="link"
                accessibilityLabel="Open official source bulletin in browser">
                <Text style={[styles.sourceLinkText, { color: colors.brandPrimary }]}>
                  View official bulletin
                </Text>
                <Feather name="external-link" size={13} color={colors.brandPrimary} />
              </Pressable>
            )}
          </View>
        ))}

        {/* 4. Section: Verified NGO Contributions */}
        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>
            Verified NGO Contributions ({event.contributions.length})
          </Text>
          <Text style={[styles.sectionNote, { color: colors.textTertiary }]}>
            Field telemetry published strictly by authorized humanitarian organizations
          </Text>
        </View>

        {event.contributions.length === 0 ? (
          <View
            style={[styles.emptySection, { backgroundColor: colors.surface }]}>
            <Text style={[styles.emptySectionText, { color: colors.textTertiary }]}>
              No verified NGO reports published for this event yet.
            </Text>
          </View>
        ) : (
          event.contributions.map((contrib) => (
            <View
              key={contrib.id}
              style={[styles.observationCard, { backgroundColor: colors.surface }]}>
              <View style={styles.obsHeader}>
                <View style={styles.obsSourceGroup}>
                  <View style={[styles.severityDotSmall, { backgroundColor: colors.statusResolved }]} />
                  <Feather name="check-circle" size={14} color={colors.statusResolved} style={styles.sourceShieldIcon} />
                  <Text style={[styles.obsSourceName, { color: colors.textPrimary }]} numberOfLines={2}>
                    {contrib.ngoName}
                  </Text>
                </View>
                <View style={[styles.sourceBadge, { backgroundColor: colors.statusResolvedBg }]}>
                  <Text style={[styles.sourceBadgeText, { color: colors.statusResolved }]}>
                    VERIFIED
                  </Text>
                </View>
              </View>

              <Text style={[styles.obsHeadline, { color: colors.textPrimary, fontWeight: '500' }]}>
                {contrib.summary}
              </Text>

              {contrib.actionTaken && (
                <View style={[styles.actionRecord, { backgroundColor: colors.surfaceMuted }]}>
                  <Text style={[styles.actionKey, { color: colors.textTertiary }]}>Action Log:</Text>
                  <Text style={[styles.actionVal, { color: colors.textPrimary }]}>
                    {contrib.actionTaken}
                  </Text>
                </View>
              )}

              <View style={[styles.obsTelemetryTable, { backgroundColor: colors.surfaceMuted }]}>
                <View style={styles.obsTelemetryRow}>
                  <View style={styles.obsTelemetryLabelGroup}>
                    <Feather name="calendar" size={12} color={colors.textTertiary} />
                    <Text style={[styles.obsTelemetryLabel, { color: colors.textTertiary }]}>
                      Published Time
                    </Text>
                  </View>
                  <Text style={[styles.obsTelemetryValue, typography.tabular, { color: colors.textPrimary }]}>
                    {formatTimestamp(contrib.publishedAt)}
                  </Text>
                </View>
              </View>
            </View>
          ))
        )}
      </ScrollView>
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
  },
  headerTitle: {
    ...typography.cardTitle,
    fontSize: 16,
  },
  headerSpacer: {
    width: 60,
  },
  scrollContent: {
    paddingTop: spacing.md,
    paddingBottom: spacing.xxxl,
  },
  card: {
    borderRadius: radii.card,
    padding: spacing.cardPadding,
    marginHorizontal: spacing.screenPadding,
    marginBottom: spacing.lg,
  },
  badgeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  statusGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  severityDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  statusText: {
    ...typography.caption,
    fontSize: 13,
    fontWeight: '700',
  },
  severityDotSmall: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginTop: 6,
  },
  headerId: {
    ...typography.caption,
    fontSize: 12,
  },
  eventTitle: {
    ...typography.title,
    fontSize: 18,
    lineHeight: 24,
    marginBottom: spacing.xs,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  metaIcon: {
    marginRight: 6,
  },
  metaValue: {
    ...typography.caption,
    fontSize: 13,
    fontWeight: '500',
  },
  summaryText: {
    ...typography.body,
    fontSize: 14,
    lineHeight: 21,
    marginBottom: spacing.md,
  },
  timeBox: {
    borderRadius: radii.sm,
    padding: spacing.md,
    marginBottom: spacing.md,
    gap: spacing.sm,
  },
  timeRow: {
    flexDirection: 'column',
    gap: 2,
  },
  timeLabelGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  timeIcon: {
    marginTop: 1,
  },
  timeKey: {
    ...typography.caption,
    fontSize: 12,
    fontWeight: '500',
  },
  timeVal: {
    ...typography.caption,
    fontSize: 13,
    fontWeight: '600',
    marginLeft: 19,
  },
  ngoNotice: {
    borderRadius: radii.sm,
    padding: spacing.md,
    gap: spacing.xs,
  },
  ngoNoticeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  ngoNoticeTitle: {
    ...typography.caption,
    fontWeight: '700',
    fontSize: 13,
  },
  ngoNoticeDesc: {
    ...typography.caption,
    fontSize: 12,
    lineHeight: 17,
    marginTop: spacing.xs,
    textAlign: 'center',
  },
  ngoActionBtn: {
    minHeight: touchTargets.min,
    flexDirection: 'row',
    gap: spacing.sm,
    borderRadius: radii.button,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: spacing.md,
  },
  ngoActionBtnText: {
    ...typography.bodyMedium,
    fontSize: 15,
    fontWeight: '700',
  },
  sectionHeader: {
    marginHorizontal: spacing.screenPadding,
    marginTop: spacing.md,
    marginBottom: spacing.sm,
  },
  sectionTitle: {
    ...typography.cardTitle,
    fontSize: 15,
  },
  sectionNote: {
    ...typography.caption,
    fontSize: 12,
    marginTop: 2,
  },
  observationCard: {
    borderRadius: radii.card,
    padding: spacing.cardPadding,
    marginHorizontal: spacing.screenPadding,
    marginBottom: spacing.md,
    gap: spacing.sm,
  },
  obsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: spacing.sm,
  },
  obsSourceGroup: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 6,
  },
  sourceShieldIcon: {
    marginTop: 2,
  },
  obsSourceName: {
    ...typography.bodyMedium,
    fontSize: 13,
    fontWeight: '700',
    lineHeight: 18,
    flex: 1,
  },
  sourceBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: radii.xs,
    alignSelf: 'flex-start',
  },
  sourceBadgeText: {
    ...typography.overline,
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.4,
  },
  obsHeadline: {
    ...typography.cardTitle,
    fontSize: 15,
    lineHeight: 21,
    fontWeight: '600',
  },
  evidenceBox: {
    borderRadius: radii.xs,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  evidenceSnippet: {
    ...typography.body,
    fontSize: 13,
    lineHeight: 19,
    fontStyle: 'italic',
  },
  obsTelemetryTable: {
    borderRadius: radii.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    gap: spacing.sm,
  },
  obsTelemetryRow: {
    flexDirection: 'column',
    gap: 2,
  },
  obsTelemetryLabelGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  obsTelemetryLabel: {
    ...typography.caption,
    fontSize: 11,
    fontWeight: '500',
  },
  obsTelemetryValue: {
    ...typography.caption,
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 17,
  },
  sourceLink: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    alignSelf: 'flex-start',
    paddingVertical: 4,
  },
  sourceLinkText: {
    ...typography.caption,
    fontSize: 12,
    fontWeight: '600',
  },
  actionRecord: {
    padding: spacing.sm,
    borderRadius: radii.xs,
  },
  actionKey: {
    ...typography.caption,
    fontSize: 11,
    fontWeight: '600',
  },
  actionVal: {
    ...typography.caption,
    fontSize: 12,
    lineHeight: 16,
    marginTop: 2,
  },
  emptySection: {
    borderRadius: radii.card,
    padding: spacing.lg,
    marginHorizontal: spacing.screenPadding,
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  emptySectionText: {
    ...typography.caption,
    fontSize: 13,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl,
    gap: spacing.md,
  },
  errorTitle: {
    ...typography.title,
  },
  errorDesc: {
    ...typography.body,
    textAlign: 'center',
  },
  primaryBtn: {
    height: touchTargets.min,
    paddingHorizontal: spacing.xl,
    borderRadius: radii.button,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: spacing.md,
  },
  primaryBtnText: {
    ...typography.bodyMedium,
    fontWeight: '600',
  },
  orchestrationBanner: {
    borderRadius: radii.card,
    padding: spacing.cardPadding,
    marginHorizontal: spacing.screenPadding,
    marginBottom: spacing.md,
    gap: spacing.sm,
  },
  orchestrationHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
  },
  orchestrationIcon: {
    width: 38,
    height: 38,
    borderRadius: radii.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  orchestrationInfo: {
    flex: 1,
    gap: 2,
  },
  orchestrationTitle: {
    ...typography.bodyMedium,
    fontSize: 14,
    fontWeight: '700',
  },
  orchestrationDesc: {
    ...typography.caption,
    fontSize: 12,
    lineHeight: 16,
  },
  orchestrationBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: spacing.sm + 2,
    borderRadius: radii.button,
  },
  orchestrationBtnText: {
    ...typography.bodyMedium,
    fontSize: 13,
    fontWeight: '700',
  },
});
