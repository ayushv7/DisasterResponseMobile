/**
 * Settings → "Data source". Live is the default; "Use sample data" switches
 * every slice to mock at runtime. The backend URL is saved and overrides
 * EXPO_PUBLIC_API_BASE_URL, so a release APK can point at a backend without
 * rebuilding. Available in release builds on purpose.
 */
import React, { useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Switch, Text, View } from 'react-native';

import { AuthField } from '@/components/AuthForm';
import {
  checkHealth,
  getBaseUrl,
  HealthState,
  normalizeUrl,
  setDataMode,
  setSavedUrl,
  useDataSource,
} from '@/services/api';
import { radii, spacing, textScale, touchTargets, typography, useTheme } from '@/theme';

const ENV_URL = (process.env.EXPO_PUBLIC_API_BASE_URL ?? '').trim();

const RESULT_TEXT: Record<Exclude<HealthState, 'unknown' | 'checking' | 'no-url'>, string> = {
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
      ? 'Sample data: every screen uses simulated data and actions.'
      : !activeUrl
        ? 'Live: no backend URL set. Add one below, or turn on sample data.'
        : health === 'ok'
          ? `Live: incidents and observations from ${activeUrl}; the rest is still simulated.`
          : health === 'checking' || health === 'unknown'
            ? `Live: checking ${activeUrl}…`
            : `Live: the backend at ${activeUrl} is not available. Retry, or turn on sample data.`;

  return (
    <View style={styles.wrap}>
      <View style={[styles.switchRow, { backgroundColor: colors.surface }]}>
        <Text style={[styles.optionText, styles.flex, { color: colors.textPrimary }]}>
          Use sample data (simulated)
        </Text>
        <Switch
          value={mode === 'sample'}
          onValueChange={(on) => setDataMode(on ? 'sample' : 'live')}
          accessibilityLabel="Use sample data (simulated)"
        />
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
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    minHeight: touchTargets.min,
    paddingHorizontal: spacing.lg,
    borderRadius: radii.card,
  },
  flex: { flex: 1, textAlign: 'left' },
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
