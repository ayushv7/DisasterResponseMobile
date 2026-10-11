/**
 * Settings → "Demo / data source". Pick the live backend or sample data at
 * runtime, and set the backend URL (saved; overrides EXPO_PUBLIC_API_BASE_URL)
 * so a release APK can point at a backend without rebuilding. Available in
 * release builds on purpose.
 */
import React, { useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';

import { AuthField } from '@/components/AuthForm';
import {
  checkHealth,
  DataMode,
  getBaseUrl,
  HealthState,
  normalizeUrl,
  setDataMode,
  setSavedUrl,
  useDataSource,
} from '@/services/api';
import { radii, spacing, textScale, touchTargets, typography, useTheme } from '@/theme';

const ENV_URL = (process.env.EXPO_PUBLIC_API_BASE_URL ?? '').trim();

const MODES: { key: DataMode; label: string }[] = [
  { key: 'live', label: 'Live backend' },
  { key: 'sample', label: 'Sample data (simulated)' },
];

const RESULT_TEXT: Record<Exclude<HealthState, 'unknown' | 'checking'>, string> = {
  ok: 'Connected: backend ready.',
  'db-down': 'Reachable, but its database is down.',
  unreachable: 'Unreachable. Check the URL and Wi-Fi, and that the backend listens on 0.0.0.0.',
  timeout: 'No response within 5 seconds (timeout).',
};

export function DataSourceSettings() {
  const { colors } = useTheme();
  const { mode, savedUrl, health } = useDataSource();
  const [url, setUrl] = useState(savedUrl || ENV_URL);
  const [testing, setTesting] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [urlError, setUrlError] = useState<string | null>(null);

  const cleaned = normalizeUrl(url);
  const activeUrl = getBaseUrl();

  const test = async () => {
    if (!cleaned) {
      setUrlError('Enter an http:// or https:// address.');
      return;
    }
    setUrlError(null);
    setTesting(true);
    setResult(null);
    setResult(RESULT_TEXT[await checkHealth(cleaned)]);
    setTesting(false);
  };

  const save = () => {
    if (!cleaned) {
      setUrlError('Enter an http:// or https:// address.');
      return;
    }
    setUrlError(null);
    setUrl(cleaned);
    setSavedUrl(cleaned);
  };

  const status =
    mode === 'sample'
      ? 'Using sample data. Every action is simulated.'
      : !activeUrl
        ? 'Live selected, but no backend URL is set. Using sample data.'
        : health === 'ok'
          ? `Using the live backend at ${activeUrl} (incidents and observations; the rest is still sample data).`
          : health === 'checking' || health === 'unknown'
            ? `Checking ${activeUrl}…`
            : `Live selected, but the backend at ${activeUrl} is not available. Use Retry in the banner.`;

  return (
    <View style={styles.wrap}>
      <View style={[styles.segment, { backgroundColor: colors.surfaceMuted }]} accessibilityRole="radiogroup">
        {MODES.map((m) => {
          const active = m.key === mode;
          return (
            <Pressable
              key={m.key}
              onPress={() => !active && setDataMode(m.key)}
              style={[styles.option, active && { backgroundColor: colors.surface }]}
              accessibilityRole="radio"
              accessibilityState={{ selected: active }}>
              <Text style={[styles.optionText, { color: active ? colors.textPrimary : colors.textSecondary }]}>
                {m.label}
              </Text>
            </Pressable>
          );
        })}
      </View>
      <Text style={[styles.caption, { color: colors.textSecondary }]}>{status}</Text>

      <AuthField
        label="Backend URL"
        placeholder="http://192.168.1.20:8000"
        autoCapitalize="none"
        autoCorrect={false}
        keyboardType="url"
        value={url}
        onChangeText={(t) => {
          setUrl(t);
          setResult(null);
        }}
      />
      {urlError && <Text style={[styles.caption, { color: colors.statusActive }]}>{urlError}</Text>}
      <Text style={[styles.caption, { color: colors.textTertiary }]}>
        {savedUrl
          ? `Saved; overrides the build value${ENV_URL ? ` (${ENV_URL})` : ''}.`
          : ENV_URL
            ? `From the build (EXPO_PUBLIC_API_BASE_URL). Save to override.`
            : 'No URL in this build. Save one to use the live backend.'}
      </Text>

      <View style={styles.row}>
        <Pressable
          onPress={test}
          disabled={testing}
          style={[styles.button, { backgroundColor: colors.surfaceMuted, opacity: testing ? 0.6 : 1 }]}
          accessibilityRole="button">
          {testing ? (
            <ActivityIndicator size="small" color={colors.textPrimary} />
          ) : (
            <Text style={[styles.optionText, { color: colors.textPrimary }]}>Test connection</Text>
          )}
        </Pressable>
        <Pressable
          onPress={save}
          disabled={!cleaned || cleaned === savedUrl}
          style={[
            styles.button,
            { backgroundColor: colors.actionPrimary, opacity: !cleaned || cleaned === savedUrl ? 0.5 : 1 },
          ]}
          accessibilityRole="button"
          accessibilityState={{ disabled: !cleaned || cleaned === savedUrl }}>
          <Text style={[styles.optionText, { color: colors.onActionPrimary }]}>Save URL</Text>
        </Pressable>
      </View>
      {result && (
        <Text style={[styles.caption, { color: colors.textPrimary }]} accessibilityLiveRegion="polite">
          {result}
        </Text>
      )}
      {savedUrl !== '' && (
        <Pressable
          onPress={() => {
            setSavedUrl('');
            setUrl(ENV_URL);
          }}
          style={styles.link}
          accessibilityRole="button">
          <Text style={[styles.caption, { color: colors.brandPrimary }]}>Use the build value instead</Text>
        </Pressable>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: spacing.sm },
  segment: { flexDirection: 'row', borderRadius: radii.button, padding: spacing.xxs },
  option: {
    flex: 1,
    minHeight: touchTargets.min,
    borderRadius: radii.button,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.sm,
  },
  optionText: { ...typography.bodyMedium, ...textScale.body, fontWeight: '600', textAlign: 'center' },
  row: { flexDirection: 'row', gap: spacing.sm },
  button: {
    flex: 1,
    minHeight: touchTargets.min,
    borderRadius: radii.button,
    alignItems: 'center',
    justifyContent: 'center',
  },
  caption: { ...typography.caption, ...textScale.caption },
  link: { minHeight: touchTargets.min, justifyContent: 'center' },
});
