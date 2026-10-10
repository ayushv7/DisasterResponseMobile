/**
 * Alert areas — the signed-in citizen picks areas to get alerts for and
 * whether they want push notifications. This only saves the preference:
 * push delivery depends on the backend and is not claimed to work.
 */
import React, { useMemo, useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Switch, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';

import { AuthField, PrimaryButton } from '@/components/AuthForm';
import { CitizenSignInPrompt } from '@/components/CitizenSignInPrompt';
import { SAMPLE_FLOOD_EVENTS } from '@/fixtures/sample-events';
import { useGoBack } from '@/navigation/use-go-back';
import { api, IS_MOCK_API } from '@/services/api';
import { useSession } from '@/session/session-context';
import { useTheme } from '@/theme';
import { radii, spacing, touchTargets } from '@/theme/spacing';
import { typography } from '@/theme/typography';

export default function NotificationAreasScreen() {
  const goBack = useGoBack();
  const { colors } = useTheme();
  const { citizen, setCitizen } = useSession();

  const [areas, setAreas] = useState<string[]>(citizen?.notificationAreas ?? []);
  const [pushEnabled, setPushEnabled] = useState(citizen?.pushEnabled ?? false);
  const [customArea, setCustomArea] = useState('');
  const [saving, setSaving] = useState(false);
  const [savedNote, setSavedNote] = useState<string | null>(null);

  /** Suggestions from regions in the current alerts, plus anything already chosen. */
  const suggestions = useMemo(
    () => [...new Set([...SAMPLE_FLOOD_EVENTS.map((e) => e.stateOrRegion), ...areas])],
    [areas]
  );

  const toggle = (area: string) =>
    setAreas((prev) => (prev.includes(area) ? prev.filter((a) => a !== area) : [...prev, area]));

  const addCustom = () => {
    const area = customArea.trim();
    if (area && !areas.includes(area)) setAreas((prev) => [...prev, area]);
    setCustomArea('');
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      const result = await api.setNotificationAreas({ areas, pushEnabled });
      setCitizen(result.data);
      setSavedNote(
        result.source === 'sample'
          ? 'Simulated: saved on this device only. No alerts will be sent.'
          : 'Saved.'
      );
    } catch (err: any) {
      Alert.alert('Could not save', err?.message || 'Try again.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <SafeAreaView
      edges={['top', 'left', 'right']}
      style={[styles.safeArea, { backgroundColor: colors.background }]}>
      <View style={styles.header}>
        <Pressable
          onPress={goBack}
          style={styles.iconButton}
          accessibilityRole="button"
          accessibilityLabel="Go back">
          <Feather name="arrow-left" size={22} color={colors.textPrimary} />
        </Pressable>
        <Text numberOfLines={1} style={[styles.headerTitle, { color: colors.textPrimary }]}>Alert areas</Text>
      </View>

      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        {!citizen ? (
          <CitizenSignInPrompt />
        ) : (
          <>
            <Text style={[styles.overline, { color: colors.textTertiary }]}>
              AREAS{IS_MOCK_API ? ' · FROM SAMPLE ALERTS' : ''}
            </Text>
            <View style={styles.chips}>
              {suggestions.map((area) => {
                const active = areas.includes(area);
                return (
                  <Pressable
                    key={area}
                    onPress={() => toggle(area)}
                    style={[
                      styles.chip,
                      { backgroundColor: active ? colors.actionPrimary : colors.surface },
                    ]}
                    accessibilityRole="checkbox"
                    accessibilityState={{ checked: active }}>
                    <Text
                      style={[
                        styles.caption,
                        styles.bold,
                        { color: active ? colors.onActionPrimary : colors.textPrimary },
                      ]}>
                      {area}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
            <AuthField
              label="Add another area"
              placeholder="District or town"
              value={customArea}
              onChangeText={setCustomArea}
              onSubmitEditing={addCustom}
              returnKeyType="done"
            />

            <View style={[styles.card, { backgroundColor: colors.surface }]}>
              <View style={styles.row}>
                <Text style={[styles.body, styles.flex, { color: colors.textPrimary }]}>
                  Push notifications
                </Text>
                <Switch
                  value={pushEnabled}
                  onValueChange={setPushEnabled}
                  accessibilityLabel="Push notifications"
                />
              </View>
              <Text style={[styles.caption, { color: colors.textSecondary }]}>
                Push alerts are not available yet. This only saves your choice for when they are.
                Check the Alerts tab for current information.
              </Text>
            </View>

            <PrimaryButton label="Save" onPress={handleSave} busy={saving} />
            {savedNote && (
              <Text
                style={[styles.caption, { color: colors.textSecondary }]}
                accessibilityLiveRegion="polite">
                {savedNote}
              </Text>
            )}
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  flex: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.screenPadding,
    paddingTop: spacing.sm,
    paddingBottom: spacing.xs,
    gap: spacing.sm,
  },
  iconButton: {
    width: touchTargets.min,
    height: touchTargets.min,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    ...typography.title,
    fontSize: 20,
    lineHeight: 24,
    flexShrink: 1,
  },
  content: {
    paddingHorizontal: spacing.screenPadding,
    paddingTop: spacing.sm,
    paddingBottom: spacing.xxl,
    gap: spacing.md,
  },
  overline: {
    ...typography.overline,
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  chips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
  },
  chip: {
    minHeight: touchTargets.min,
    paddingHorizontal: spacing.md,
    borderRadius: radii.button,
    justifyContent: 'center',
  },
  card: {
    borderRadius: radii.card,
    padding: spacing.cardPadding,
    gap: spacing.xs,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  body: {
    ...typography.body,
    fontSize: 14,
    lineHeight: 20,
  },
  bold: {
    fontWeight: '600',
  },
  caption: {
    ...typography.caption,
    fontSize: 12,
    lineHeight: 17,
  },
});
