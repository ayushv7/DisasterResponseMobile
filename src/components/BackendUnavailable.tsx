/**
 * Section state for screens that show live backend data when it can't be
 * loaded: backend down/unset (Retry or Set backend URL) or no backend sign-in
 * (Sign in). Always offers "Use sample data instead"; the app never switches
 * by itself.
 */
import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { router } from 'expo-router';

import { getBaseUrl, liveProblem, refreshHealth, setDataMode, useDataSource } from '@/services/api';
import { radii, spacing, textScale, touchTargets, typography, useTheme } from '@/theme';

const TITLES = {
  'db-down': 'Backend database down',
  unreachable: 'Backend unreachable',
  timeout: 'Backend not responding',
  'no-url': 'No backend URL set',
} as const;

export function BackendUnavailable({ onRetry }: { onRetry: () => void }) {
  const { colors } = useTheme();
  const source = useDataSource();
  const { health } = source;
  const key = health in TITLES ? (health as keyof typeof TITLES) : 'unreachable';
  const noUrl = key === 'no-url';

  if (liveProblem(source) === 'sign-in') {
    return (
      <View style={[styles.card, { backgroundColor: colors.surface }]} accessibilityLiveRegion="polite">
        <Feather name="lock" size={28} color={colors.textSecondary} />
        <Text style={[styles.title, { color: colors.textPrimary }]}>Sign in required</Text>
        <Text style={[styles.body, { color: colors.textSecondary }]}>
          {source.auth === 'expired'
            ? 'Your backend session ended. Sign in again with your backend account.'
            : 'Live data needs a backend account (NGO or authority). Sign in, or use sample data.'}
        </Text>
        <Pressable
          onPress={() => router.push('/login')}
          style={[styles.button, { backgroundColor: colors.actionPrimary }]}
          accessibilityRole="button">
          <Text style={[styles.buttonText, { color: colors.onActionPrimary }]}>Sign in</Text>
        </Pressable>
        <Pressable
          onPress={() => setDataMode('sample')}
          style={[styles.button, { backgroundColor: colors.surfaceMuted }]}
          accessibilityRole="button">
          <Text style={[styles.buttonText, { color: colors.textPrimary }]}>Use sample data instead</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View style={[styles.card, { backgroundColor: colors.surface }]} accessibilityLiveRegion="polite">
      <Feather name={noUrl ? 'link' : 'wifi-off'} size={28} color={colors.textSecondary} />
      <Text style={[styles.title, { color: colors.textPrimary }]}>{TITLES[key]}</Text>
      <Text style={[styles.body, { color: colors.textSecondary }]}>
        {noUrl
          ? 'Live data needs a backend address. Set it in Settings, or use sample data.'
          : `Could not get live data from ${getBaseUrl()}.`}
      </Text>
      {noUrl ? (
        <Pressable
          onPress={() => router.push('/settings')}
          style={[styles.button, { backgroundColor: colors.actionPrimary }]}
          accessibilityRole="button">
          <Text style={[styles.buttonText, { color: colors.onActionPrimary }]}>Set backend URL</Text>
        </Pressable>
      ) : (
        <Pressable
          onPress={() => {
            refreshHealth();
            onRetry();
          }}
          style={[styles.button, { backgroundColor: colors.actionPrimary }]}
          accessibilityRole="button">
          <Text style={[styles.buttonText, { color: colors.onActionPrimary }]}>Retry</Text>
        </Pressable>
      )}
      <Pressable
        onPress={() => setDataMode('sample')}
        style={[styles.button, { backgroundColor: colors.surfaceMuted }]}
        accessibilityRole="button">
        <Text style={[styles.buttonText, { color: colors.textPrimary }]}>Use sample data instead</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    margin: spacing.screenPadding,
    padding: spacing.xl,
    borderRadius: radii.card,
    alignItems: 'center',
    gap: spacing.sm,
  },
  title: { ...typography.title, ...textScale.subtitle, fontWeight: '700', textAlign: 'center' },
  body: { ...typography.body, ...textScale.body, textAlign: 'center' },
  button: {
    alignSelf: 'stretch',
    minHeight: touchTargets.min,
    borderRadius: radii.button,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonText: { ...typography.bodyMedium, ...textScale.body, fontWeight: '700' },
});
