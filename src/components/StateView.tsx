import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Feather } from '@expo/vector-icons';

import { EmptyState } from '@/components/EmptyState';
import { ErrorState } from '@/components/ErrorState';
import { SkeletonCard } from '@/components/SkeletonCard';
import { QueryState } from '@/hooks/use-api-query';
import { useTheme } from '@/theme';
import { radii, spacing, touchTargets } from '@/theme/spacing';
import { textScale, typography } from '@/theme/typography';

interface StateViewProps {
  state: QueryState;
  onRetry: () => void;
  error?: string | null;
  emptyTitle?: string;
  emptyDescription?: string;
  /** ISO time the data was received; shown in the stale note. */
  receivedAt?: string | null;
  children: React.ReactNode;
}

/** "Offline, last updated 14:32" with a Retry button; earlier data stays visible below. */
export function OfflineNotice({ receivedAt, onRetry }: { receivedAt?: string | null; onRetry: () => void }) {
  const { colors } = useTheme();
  return (
    <View style={[styles.offline, { backgroundColor: colors.surfaceMuted }]} accessibilityLiveRegion="polite">
      <Feather name="wifi-off" size={16} color={colors.textSecondary} />
      <Text style={[styles.offlineText, { color: colors.textPrimary }]}>
        Offline
        {receivedAt
          ? `, last updated ${new Date(receivedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`
          : ''}
      </Text>
      <Pressable onPress={onRetry} style={styles.retry} accessibilityRole="button" accessibilityLabel="Retry">
        <Text style={[styles.offlineText, styles.bold, { color: colors.brandPrimary }]}>Retry</Text>
      </Pressable>
    </View>
  );
}

/** Renders loading / error / empty / stale / offline states around screen content. */
export function StateView({
  state,
  onRetry,
  error,
  emptyTitle,
  emptyDescription,
  receivedAt,
  children,
}: StateViewProps) {
  const { colors } = useTheme();

  if (state === 'loading') {
    return (
      <View accessibilityLabel="Loading">
        <SkeletonCard />
        <SkeletonCard />
      </View>
    );
  }
  if (state === 'error') return <ErrorState message={error ?? undefined} onRetry={onRetry} />;
  if (state === 'empty') return <EmptyState title={emptyTitle} description={emptyDescription} />;

  return (
    <>
      {state === 'offline' && <OfflineNotice receivedAt={receivedAt} onRetry={onRetry} />}
      {state === 'stale' && receivedAt && (
        <Text style={[styles.stale, { color: colors.statusWatch }]}>
          Last loaded{' '}
          {new Date(receivedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}.
          Pull to refresh.
        </Text>
      )}
      {children}
    </>
  );
}

const styles = StyleSheet.create({
  offline: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginHorizontal: spacing.screenPadding,
    marginBottom: spacing.sm,
    paddingLeft: spacing.md,
    borderRadius: radii.sm,
  },
  offlineText: { ...typography.caption, ...textScale.caption, flex: 1 },
  bold: { fontWeight: '700', flex: 0 },
  retry: { minHeight: touchTargets.min, paddingHorizontal: spacing.md, justifyContent: 'center' },
  stale: {
    ...typography.caption,
    paddingHorizontal: spacing.screenPadding,
    paddingBottom: spacing.sm,
  },
});
