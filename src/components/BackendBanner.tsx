import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { api, IS_MOCK_API, IS_MOCK_SLICE, REAL_SLICES } from '@/services/api';
import { useTheme } from '@/theme';
import { spacing } from '@/theme/spacing';
import { textScale, typography } from '@/theme/typography';

type BackendState = 'checking' | 'ready' | 'unavailable' | 'unreachable';

const STATE_TEXT: Record<BackendState, string> = {
  checking: 'checking backend…',
  ready: 'backend ready',
  unavailable: 'backend database down',
  unreachable: 'backend unreachable',
};

/**
 * The single global notice about where data comes from. Rendered once in the
 * root layout; hidden only when every data slice is real. Says which slices
 * are real and, if health is real, whether the backend is ready right now.
 * It owns the top safe-area inset, so screens below it don't pad twice.
 */
export function BackendBanner() {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const [backend, setBackend] = useState<BackendState | null>(IS_MOCK_SLICE.health ? null : 'checking');

  useEffect(() => {
    if (IS_MOCK_SLICE.health) return;
    api
      .getHealth()
      .then((res) => setBackend(res.data.status === 'ok' ? 'ready' : 'unavailable'))
      .catch(() => setBackend('unreachable'));
  }, []);

  if (!IS_MOCK_API) return null;

  const text =
    REAL_SLICES.length === 0
      ? 'Backend not connected – sample data, actions simulated'
      : `Real: ${REAL_SLICES.join(', ')}${backend ? ` (${STATE_TEXT[backend]})` : ''} · rest sample data, simulated`;

  return (
    <View
      style={[styles.bar, { backgroundColor: colors.bannerBg, paddingTop: insets.top + spacing.xs }]}
      accessibilityRole="summary"
      accessibilityLabel={
        REAL_SLICES.length === 0
          ? 'Backend not connected. Showing sample data. Actions are simulated.'
          : `Real backend for ${REAL_SLICES.join(', ')}${backend ? `, ${STATE_TEXT[backend]}` : ''}. Everything else is sample data and simulated.`
      }>
      <Text style={[styles.text, { color: colors.bannerText }]} numberOfLines={2}>
        {text}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    paddingHorizontal: spacing.screenPadding,
    paddingBottom: spacing.xs,
  },
  text: {
    ...typography.caption,
    ...textScale.caption,
    fontWeight: '600',
    textAlign: 'center',
  },
});
