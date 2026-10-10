/**
 * Notification center (Simulated). Push delivery is not set up, so this lists
 * what a notification would have said, built from data the service already
 * returns for the signed-in role: check-ins due, plan changes, tasks assigned.
 */
import React from 'react';
import { Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { Href, router } from 'expo-router';

import { relativeTime } from '@/components/CheckInDue';
import { SampleDataBadge } from '@/components/SampleDataBadge';
import { StateView } from '@/components/StateView';
import { useApiQuery } from '@/hooks/use-api-query';
import { useGoBack } from '@/navigation/use-go-back';
import { api, ApiResult } from '@/services/api';
import { useSession } from '@/session/session-context';
import { radii, spacing, textScale, touchTargets, typography, useTheme } from '@/theme';
import { Role } from '@/types/roles';

interface NotificationItem {
  id: string;
  kind: 'CHECK_IN' | 'PLAN' | 'TASK';
  title: string;
  detail: string;
  at?: string;
  href?: Href;
  /** Operational urgency drives the dot colour (amber/red only for status). */
  urgent?: boolean;
}

const ICONS: Record<NotificationItem['kind'], keyof typeof Feather.glyphMap> = {
  CHECK_IN: 'clock',
  PLAN: 'layers',
  TASK: 'check-square',
};

/** Reads the role's data through the service and turns it into notification rows. */
async function loadNotifications(role: Role): Promise<ApiResult<NotificationItem[]>> {
  const done = (data: NotificationItem[], src: ApiResult<unknown>) => ({ ...src, data });
  if (role === 'contributor') {
    const [resources, instructions] = await Promise.all([api.getMyResources(), api.getMyInstructions()]);
    const items: NotificationItem[] = [
      ...resources.data
        .filter((r) => r.freshness === 'DUE' || r.freshness === 'STALE')
        .map((r) => ({
          id: `ci-${r.id}`,
          kind: 'CHECK_IN' as const,
          title: r.freshness === 'STALE' ? `Check-in missed: ${r.typeLabel}` : `Check-in due: ${r.typeLabel}`,
          detail: r.statusReason ?? 'Confirm this resource is still available.',
          at: r.checkInDueAt,
          href: { pathname: '/contributor/check-in/[id]', params: { id: r.id } } as Href,
          urgent: r.freshness === 'STALE',
        })),
      ...instructions.data.map((i) => ({
        id: `in-${i.id}`,
        kind: 'PLAN' as const,
        title: `New instruction from ${i.ngoName}`,
        detail: i.what,
        at: i.issuedAt,
        href: '/contributor/resources' as Href,
      })),
    ];
    return done(items, resources);
  }
  if (role === 'field_worker') {
    const tasks = await api.getMyTasks();
    return done(
      tasks.data
        .filter((t) => t.status === 'AWAITING_ACK' || t.publishedAt)
        .map((t) => ({
          id: `task-${t.id}`,
          kind: 'TASK' as const,
          title: t.status === 'AWAITING_ACK' ? `Task assigned: ${t.id}` : `Task updated: ${t.id}`,
          detail: `${t.targetLocality} · ${t.instructions}`,
          at: t.publishedAt ?? t.assignedAt,
          href: '/ops/tasks' as Href,
          urgent: t.status === 'AWAITING_ACK',
        })),
      tasks
    );
  }
  if (role === 'ngo') {
    const [plans, orders] = await Promise.all([api.getResourcePlans(), api.getWorkOrders()]);
    const items: NotificationItem[] = [
      ...plans.data
        .filter((p) => p.replanSuggested || p.status === 'PROPOSED')
        .map((p) => ({
          id: `plan-${p.id}-${p.version}`,
          kind: 'PLAN' as const,
          title: p.replanSuggested
            ? `Replan suggested: ${p.incidentTitle ?? 'plan'}`
            : `Plan v${p.version} awaiting approval`,
          detail: p.replanReasons?.join(' ') ?? `Changed by ${p.lastChangedBy?.name ?? 'the system'}.`,
          at: p.lastChangedAt ?? p.generatedAt,
          href: { pathname: '/ops/plan', params: { incidentId: p.incidentId ?? '' } } as Href,
          urgent: p.replanSuggested,
        })),
      ...orders.data
        .filter((o) => o.status === 'BLOCKED' || o.status === 'FAILED')
        .map((o) => ({
          id: `prob-${o.id}`,
          kind: 'TASK' as const,
          title: `Problem reported: ${o.id}`,
          detail: o.blockerReport?.reason ?? o.targetLocality,
          at: o.blockerReport?.reportedAt,
          href: '/ops/replanning' as Href,
          urgent: true,
        })),
    ];
    return done(items, plans);
  }
  return { data: [], source: api.mode === 'mock' ? 'sample' : 'live', receivedAt: new Date().toISOString() };
}

export default function NotificationsScreen() {
  const goBack = useGoBack();
  const { colors } = useTheme();
  const { role } = useSession();
  const query = useApiQuery(() => loadNotifications(role), [role]);

  return (
    <SafeAreaView edges={['top', 'left', 'right']} style={[styles.safeArea, { backgroundColor: colors.background }]}>
      <View style={styles.header}>
        <Pressable onPress={goBack} style={styles.iconButton} accessibilityRole="button" accessibilityLabel="Go back">
          <Feather name="arrow-left" size={22} color={colors.textPrimary} />
        </Pressable>
        <Text numberOfLines={1} style={[styles.headerTitle, { color: colors.textPrimary }]}>
          Notifications
        </Text>
        <SampleDataBadge source={query.source ?? undefined} />
      </View>
      <Text style={[styles.caption, styles.note, { color: colors.textTertiary }]}>
        Simulated: push notifications are not set up. This lists what you would have been notified about.
      </Text>
      <StateView
        state={query.state}
        error={query.error}
        onRetry={query.refresh}
        receivedAt={query.receivedAt}
        emptyTitle="Nothing new"
        emptyDescription="Check-ins due, plan changes and new tasks appear here.">
        <ScrollView
          contentContainerStyle={styles.content}
          refreshControl={<RefreshControl refreshing={query.refreshing} onRefresh={query.refresh} />}>
          {(query.data ?? []).map((n) => (
            <Pressable
              key={n.id}
              onPress={() => n.href && router.push(n.href)}
              disabled={!n.href}
              style={[styles.row, { backgroundColor: colors.surface }]}
              android_ripple={{ color: colors.surfaceMuted }}
              accessibilityRole={n.href ? 'button' : undefined}
              accessibilityLabel={`${n.title}. ${n.detail}`}>
              <View style={[styles.iconBox, { backgroundColor: colors.surfaceMuted }]}>
                <Feather name={ICONS[n.kind]} size={18} color={colors.textSecondary} />
                {n.urgent && <View style={[styles.dot, { backgroundColor: colors.statusWatch }]} />}
              </View>
              <View style={styles.flex}>
                <Text style={[styles.body, styles.bold, { color: colors.textPrimary }]} numberOfLines={2}>
                  {n.title}
                </Text>
                <Text style={[styles.caption, { color: colors.textSecondary }]} numberOfLines={2}>
                  {n.detail}
                </Text>
                {n.at && (
                  <Text style={[styles.caption, { color: colors.textTertiary }]}>{relativeTime(n.at, Date.parse(query.receivedAt ?? n.at))}</Text>
                )}
              </View>
            </Pressable>
          ))}
        </ScrollView>
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
    gap: spacing.sm,
    paddingHorizontal: spacing.screenPadding,
    paddingTop: spacing.sm,
    paddingBottom: spacing.xs,
  },
  iconButton: { width: touchTargets.min, height: touchTargets.min, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { ...typography.title, ...textScale.title, flexShrink: 1, flex: 1 },
  note: { paddingHorizontal: spacing.screenPadding, paddingBottom: spacing.sm },
  content: { paddingHorizontal: spacing.screenPadding, paddingBottom: spacing.xxl, gap: spacing.sm },
  row: {
    flexDirection: 'row',
    gap: spacing.md,
    padding: spacing.md,
    borderRadius: radii.card,
    minHeight: touchTargets.min,
  },
  iconBox: {
    width: touchTargets.min - spacing.sm,
    height: touchTargets.min - spacing.sm,
    borderRadius: radii.chip,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dot: { position: 'absolute', top: 0, right: 0, width: spacing.sm, height: spacing.sm, borderRadius: radii.chip },
  body: { ...typography.body, ...textScale.body },
  bold: { fontWeight: '600' },
  caption: { ...typography.caption, ...textScale.caption },
});
