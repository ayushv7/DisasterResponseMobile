import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { router } from 'expo-router';

import { ApiSlice, IS_MOCK_API, REAL_SLICES, refreshHealth, useDataSource } from '@/services/api';
import { useTheme } from '@/theme';
import { spacing, touchTargets } from '@/theme/spacing';
import { textScale, typography } from '@/theme/typography';

const SLICE_NAMES: Record<ApiSlice, string> = {
  health: 'health',
  incidents: 'incidents',
  observations: 'observations',
  resources: 'resources',
  plans: 'plans',
  tasks: 'tasks',
  auth: 'sign-in',
  publicAlerts: 'public alerts',
  community: 'messages & NGO workspace',
};

const FAILURES = {
  'db-down': 'Backend database down',
  unreachable: 'Backend unreachable',
  timeout: 'Backend not responding (timeout)',
} as const;

/**
 * The single global notice about where data comes from. Updates immediately
 * when the data source changes. Never claims "Real" unless the last health
 * check passed; failures show with a Retry. It owns the top safe-area inset.
 */
export function BackendBanner() {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const { mode, health } = useDataSource();
  const live = mode === 'live';

  // Everything real and healthy: nothing to say
  if (live && health === 'ok' && !IS_MOCK_API) return null;

  const failure = live && (health === 'db-down' || health === 'unreachable' || health === 'timeout');
  const noUrl = live && health === 'no-url';
  const text = !live
    ? 'Sample data, simulated'
    : health === 'ok'
      ? `Live: ${REAL_SLICES.map((s) => SLICE_NAMES[s]).join(', ')} · rest simulated`
      : failure
        ? FAILURES[health]
        : noUrl
          ? 'No backend URL set'
          : 'Checking backend…';

  return (
    <View
      style={[styles.bar, { backgroundColor: colors.bannerBg, paddingTop: insets.top + spacing.xs }]}
      accessibilityRole="summary"
      accessibilityLabel={text}>
      <View style={styles.row}>
        <Text style={[styles.text, { color: colors.bannerText }]} numberOfLines={2}>
          {text}
        </Text>
        {noUrl && (
          <Pressable
            onPress={() => router.push('/settings')}
            style={styles.retry}
            hitSlop={{ top: spacing.sm, bottom: spacing.sm }}
            accessibilityRole="link"
            accessibilityLabel="Set the backend URL in Settings">
            <Text style={[styles.text, styles.retryText, { color: colors.bannerText }]}>Set URL</Text>
          </Pressable>
        )}
        {failure && (
          <Pressable
            onPress={refreshHealth}
            style={styles.retry}
            hitSlop={{ top: spacing.sm, bottom: spacing.sm }}
            accessibilityRole="button"
            accessibilityLabel="Retry backend connection">
            <Text style={[styles.text, styles.retryText, { color: colors.bannerText }]}>Retry</Text>
          </Pressable>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    paddingHorizontal: spacing.screenPadding,
    paddingBottom: spacing.xs,
  },
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing.md },
  text: {
    ...typography.caption,
    ...textScale.caption,
    fontWeight: '600',
    textAlign: 'center',
    flexShrink: 1,
  },
  retry: { minHeight: touchTargets.min - spacing.lg, justifyContent: 'center' },
  retryText: { textDecorationLine: 'underline' },
});
