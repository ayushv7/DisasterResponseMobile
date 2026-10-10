import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { EmptyState } from '@/components/EmptyState';
import { ErrorState } from '@/components/ErrorState';
import { SkeletonCard } from '@/components/SkeletonCard';
import { QueryState } from '@/hooks/use-api-query';
import { useTheme } from '@/theme';
import { spacing } from '@/theme/spacing';
import { typography } from '@/theme/typography';

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

/** Renders loading / error / empty / stale states around screen content. */
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
  stale: {
    ...typography.caption,
    paddingHorizontal: spacing.screenPadding,
    paddingBottom: spacing.sm,
  },
});
