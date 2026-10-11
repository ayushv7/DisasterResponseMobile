/**
 * Public home: alerts for the visitor's own area only. A calm state when
 * there is no alert, otherwise the area alert with what to do. The area comes
 * from a coarse location (with permission) or a picked area; other areas'
 * incidents, raw observations and counts are never shown here.
 */
import React, { useState } from 'react';
import { Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { router } from 'expo-router';

import { AreaAlertCard } from '@/components/AreaAlertCard';
import { BottomNavBar } from '@/components/BottomNavBar';
import { ErrorState } from '@/components/ErrorState';
import { PickerSheet } from '@/components/PickerSheet';
import { SampleDataBadge } from '@/components/SampleDataBadge';
import { OfflineNotice, StateView } from '@/components/StateView';
import { useApiQuery } from '@/hooks/use-api-query';
import { useMyArea } from '@/hooks/use-my-area';
import { api } from '@/services/api';
import { radii, spacing, textScale, touchTargets, typography, useTheme } from '@/theme';
import { AlertArea } from '@/types/my-alert';

const LOCATE_MESSAGES = {
  denied: 'Location is off for this app. Pick your area instead.',
  'services-off': 'Location services are off on this phone. Pick your area instead.',
  'no-fix': 'Could not get your location. Pick your area instead.',
  'no-area': 'Your location is outside the areas we cover. Pick your area.',
} as const;

export default function MyAreaScreen() {
  const { colors } = useTheme();
  const { ready, areaId, cached, loading, error, chooseArea, refresh, locate } = useMyArea();
  const [pickerOpen, setPickerOpen] = useState(false);
  const [areas, setAreas] = useState<AlertArea[] | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [locating, setLocating] = useState(false);

  const result = cached?.result;
  const area = result?.area ?? null;
  const alerts = result?.alerts ?? [];
  const eventId = alerts.find((a) => a.eventId)?.eventId;

  // NGO updates for this area only (through the alert it maps to)
  const updates = useApiQuery(
    () =>
      eventId
        ? api.getUpdatesForEvent(eventId)
        : Promise.resolve({ data: [], source: cached?.source ?? 'sample', receivedAt: new Date().toISOString() }),
    [eventId]
  );

  const openPicker = async () => {
    setPickerOpen(true);
    if (!areas) {
      try {
        setAreas((await api.getAlertAreas()).data);
      } catch {
        setPickerOpen(false);
        setNotice('Could not load the area list. Try again.');
      }
    }
  };

  const findMyArea = async () => {
    setLocating(true);
    setNotice(null);
    const outcome = await locate();
    setLocating(false);
    if (!outcome.ok) {
      setNotice(LOCATE_MESSAGES[outcome.reason]);
      openPicker();
    }
  };

  const pick = async (id: string) => {
    setPickerOpen(false);
    setNotice(null);
    await chooseArea(id);
  };

  const messageNgo = () =>
    router.push(eventId ? { pathname: '/message/compose', params: { eventId } } : '/message/compose');

  const hasArea = !!areaId || !!area;

  return (
    <SafeAreaView edges={['top', 'left', 'right']} style={[styles.safeArea, { backgroundColor: colors.background }]}>
      <View style={styles.header}>
        <Text numberOfLines={1} style={[styles.title, { color: colors.textPrimary }]}>
          My area
        </Text>
        <SampleDataBadge source={cached?.source} />
      </View>

      <StateView state={ready ? 'ready' : 'loading'} onRetry={refresh}>
        <ScrollView
          contentContainerStyle={styles.content}
          refreshControl={<RefreshControl refreshing={loading} onRefresh={refresh} />}>
          {notice && <Text style={[styles.body, { color: colors.textSecondary }]}>{notice}</Text>}

          {!hasArea ? (
            // First run: find the area
            <View style={[styles.card, { backgroundColor: colors.surface }]}>
              <Text style={[styles.headline, { color: colors.textPrimary }]}>Alerts for your area</Text>
              <Text style={[styles.body, { color: colors.textSecondary }]}>
                See flood alerts and what to do where you are. Only a rough location (about 1 km) is used to
                find your area, and it is not stored.
              </Text>
              <Pressable
                onPress={findMyArea}
                disabled={locating}
                style={[styles.primary, { backgroundColor: colors.actionPrimary, opacity: locating ? 0.6 : 1 }]}
                accessibilityRole="button">
                <Feather name="navigation" size={16} color={colors.onActionPrimary} />
                <Text style={[styles.buttonText, { color: colors.onActionPrimary }]}>
                  {locating ? 'Finding your area…' : 'Use my location'}
                </Text>
              </Pressable>
              <Pressable
                onPress={openPicker}
                style={[styles.primary, { backgroundColor: colors.surfaceMuted }]}
                accessibilityRole="button">
                <Text style={[styles.buttonText, { color: colors.textPrimary }]}>Choose area</Text>
              </Pressable>
            </View>
          ) : error && !result ? (
            <ErrorState message={error} onRetry={refresh} />
          ) : (
            <>
              {error && <OfflineNotice receivedAt={cached?.receivedAt} onRetry={refresh} />}

              {area && alerts.length === 0 ? (
                <View style={[styles.card, styles.calm, { backgroundColor: colors.surface }]}>
                  <Feather name="check-circle" size={28} color={colors.statusResolved} />
                  <Text style={[styles.headline, styles.center, { color: colors.textPrimary }]}>
                    No flood alerts for {area.name}
                  </Text>
                  <Text style={[styles.body, styles.center, { color: colors.textSecondary }]}>
                    Nothing to do right now. Pull down to check again.
                  </Text>
                  {cached && (
                    <Text style={[styles.caption, { color: colors.textTertiary }]}>
                      Last checked {new Date(cached.receivedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </Text>
                  )}
                </View>
              ) : (
                alerts.map((a) => <AreaAlertCard key={a.id} alert={a} />)
              )}

              {/* Actions */}
              <Pressable
                onPress={messageNgo}
                style={({ pressed }) => [
                  styles.primary,
                  { backgroundColor: pressed ? colors.actionPrimaryPressed : colors.actionPrimary },
                ]}
                accessibilityRole="button">
                <Feather name="send" size={16} color={colors.onActionPrimary} />
                <Text style={[styles.buttonText, { color: colors.onActionPrimary }]}>Message an NGO</Text>
              </Pressable>
              <Pressable
                onPress={openPicker}
                style={[styles.primary, { backgroundColor: colors.surfaceMuted }]}
                accessibilityRole="button"
                accessibilityLabel={`Change area. Current: ${area?.name ?? 'unknown'}`}>
                <Feather name="map-pin" size={16} color={colors.textPrimary} />
                <Text style={[styles.buttonText, { color: colors.textPrimary }]}>Change area</Text>
              </Pressable>

              {/* NGO-published updates for this area */}
              {(updates.data ?? []).length > 0 && (
                <>
                  <Text style={[styles.overline, { color: colors.textTertiary }]}>
                    UPDATES FROM NGOS IN YOUR AREA{updates.source === 'sample' ? ' · SIMULATED' : ''}
                  </Text>
                  {updates.data!.map((u) => (
                    <View key={u.id} style={[styles.card, { backgroundColor: colors.surface }]}>
                      <Text style={[styles.body, styles.bold, { color: colors.textPrimary }]}>{u.ngoName}</Text>
                      <Text style={[styles.body, { color: colors.textPrimary }]}>{u.summary}</Text>
                      {u.needs && (
                        <Text style={[styles.caption, { color: colors.textSecondary }]}>Needs: {u.needs}</Text>
                      )}
                    </View>
                  ))}
                </>
              )}

              <Text style={[styles.caption, { color: colors.textTertiary }]}>
                Alerts on this phone: Simulated. Push notifications are not set up yet, so open this screen to
                check.
              </Text>
            </>
          )}
        </ScrollView>
      </StateView>

      <PickerSheet
        visible={pickerOpen}
        title="Choose your area"
        note="Alerts and NGO updates are shown for this area only."
        items={(areas ?? []).map((a) => ({ id: a.id, title: a.name, subtitle: `${a.district}, ${a.state}` }))}
        loading={areas === null}
        emptyText="No areas available."
        onPick={pick}
        onClose={() => setPickerOpen(false)}
      />
      <BottomNavBar activeTab="feed" />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.screenPadding,
    paddingTop: spacing.md,
    paddingBottom: spacing.sm,
  },
  title: { ...typography.title, ...textScale.title, flex: 1, flexShrink: 1 },
  content: { paddingHorizontal: spacing.screenPadding, paddingBottom: spacing.xxl, gap: spacing.md },
  card: { borderRadius: radii.card, padding: spacing.cardPadding, gap: spacing.sm },
  calm: { alignItems: 'center', paddingVertical: spacing.xxl },
  center: { textAlign: 'center' },
  headline: { ...typography.title, ...textScale.subtitle, fontWeight: '700' },
  primary: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    minHeight: touchTargets.min,
    borderRadius: radii.button,
  },
  buttonText: { ...typography.bodyMedium, ...textScale.body, fontWeight: '700' },
  overline: { ...typography.overline, ...textScale.caption, fontWeight: '700', marginTop: spacing.sm },
  body: { ...typography.body, ...textScale.body },
  bold: { fontWeight: '600' },
  caption: { ...typography.caption, ...textScale.caption },
});
