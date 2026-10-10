/**
 * Resource plan (NGO) — the backend's allocation of contributor resources to
 * work orders. The NGO can ask for a replan or add a manual allocation with a
 * reason. The app never computes or patches the plan itself: it shows the
 * plan the backend returns, and shows backend validation errors as they come.
 */
import React, { useRef, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { useLocalSearchParams } from 'expo-router';

import { PrimaryButton } from '@/components/AuthForm';
import { EmptyState } from '@/components/EmptyState';
import { confirmAction } from '@/components/confirm';
import { SampleDataBadge } from '@/components/SampleDataBadge';
import { StateView } from '@/components/StateView';
import { ChipTone, StatusChip } from '@/components/StatusChip';
import { useApiQuery } from '@/hooks/use-api-query';
import { useToast } from '@/components/Toast';
import { useGoBack } from '@/navigation/use-go-back';
import { api, ApiError } from '@/services/api';
import { useTheme } from '@/theme';
import { radii, spacing, touchTargets } from '@/theme/spacing';
import { textScale, typography } from '@/theme/typography';
import { ContributorResource, PlanAllocation, PlanStatus } from '@/types/contributors';
import { InterventionRecord } from '@/types/operations';

const REASON_MIN = 10;

const PLAN_STATUS: Record<PlanStatus, { label: string; tone: ChipTone }> = {
  PROPOSED: { label: 'Awaiting your approval', tone: 'warning' },
  APPROVED: { label: 'Approved · published', tone: 'success' },
  IN_PROGRESS: { label: 'In progress', tone: 'info' },
  COMPLETED: { label: 'Completed', tone: 'success' },
};

const formatTime = (iso: string) =>
  new Date(iso).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' });

export default function ResourcePlanScreen() {
  const goBack = useGoBack();
  const { colors } = useTheme();
  const { incidentId } = useLocalSearchParams<{ incidentId?: string }>();
  const query = useApiQuery(() => api.getResourcePlan(incidentId), [incidentId], () => false);
  const plan = query.data;

  const [replanning, setReplanning] = useState(false);
  const [approving, setApproving] = useState(false);
  const [error, setError] = useState<{ code: string; message: string } | null>(null);
  const toast = useToast();
  const inFlight = useRef(false);

  // Manual allocation form (progressive disclosure)
  const [showManual, setShowManual] = useState(false);
  const [workOrders, setWorkOrders] = useState<InterventionRecord[] | null>(null);
  const [resources, setResources] = useState<ContributorResource[] | null>(null);
  const [workOrderId, setWorkOrderId] = useState<string | undefined>();
  const [resourceId, setResourceId] = useState<string | undefined>();
  const [quantity, setQuantity] = useState('1');
  const [reason, setReason] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const showError = (err: unknown) =>
    setError({
      code: err instanceof ApiError ? err.code : 'ERROR',
      message: err instanceof Error ? err.message : 'Request failed.',
    });

  const replan = async () => {
    if (!plan || inFlight.current) return;
    inFlight.current = true;
    setReplanning(true);
    setError(null);
    try {
      const result = await api.requestReplan(plan.id, plan.version);
      query.setData(result.data);
      query.refresh();
      toast(`${result.source === 'sample' ? 'Simulated: ' : ''}plan recomputed as version ${result.data.version}.`);
    } catch (err) {
      showError(err);
    } finally {
      inFlight.current = false;
      setReplanning(false);
    }
  };

  const approve = async () => {
    if (!plan || inFlight.current) return;
    inFlight.current = true;
    setApproving(true);
    setError(null);
    try {
      const result = await api.approvePlan(plan.id, plan.version);
      query.setData(result.data);
      query.refresh();
      toast(
        `${result.source === 'sample' ? 'Simulated: ' : ''}version ${result.data.version} approved. Tasks published to workers and instructions sent to contributors.`
      );
    } catch (err) {
      showError(err);
    } finally {
      inFlight.current = false;
      setApproving(false);
    }
  };

  const openManual = async () => {
    setShowManual(true);
    setError(null);
    try {
      const [orders, pool] = await Promise.all([api.getWorkOrders(), api.getAllocatableResources()]);
      setWorkOrders(orders.data.filter((w) => w.status !== 'VERIFIED_RESOLVED'));
      setResources(pool.data);
    } catch (err) {
      showError(err);
    }
  };

  const submitManual = async () => {
    if (!plan || inFlight.current || !workOrderId || !resourceId) return;
    inFlight.current = true;
    setSubmitting(true);
    setError(null);
    try {
      const result = await api.allocateManually({
        planId: plan.id,
        expectedVersion: plan.version,
        workOrderId,
        resourceId,
        quantity: Number(quantity),
        reason: reason.trim(),
      });
      query.setData(result.data);
      query.refresh();
      toast(
        `${result.source === 'sample' ? 'Simulated: ' : ''}manual allocation saved as version ${result.data.version}. Approve it to publish.`
      );
      setShowManual(false);
      setReason('');
      setResourceId(undefined);
      setWorkOrderId(undefined);
    } catch (err) {
      // Backend said no: show why, keep the form, change nothing
      showError(err);
    } finally {
      inFlight.current = false;
      setSubmitting(false);
    }
  };

  const renderAllocation = (a: PlanAllocation) => (
    <View key={a.id} style={[styles.card, { backgroundColor: colors.surface }]}>
      <View style={styles.row}>
        <Text style={[styles.body, styles.bold, styles.flex, { color: colors.textPrimary }]}>{a.workOrderLabel}</Text>
        <StatusChip label={a.source === 'MANUAL' ? 'Manual' : 'Automatic'} tone={a.source === 'MANUAL' ? 'warning' : 'info'} />
      </View>
      <Text style={[styles.body, { color: colors.textPrimary }]}>
        {a.resourceLabel} · {a.quantity}
      </Text>
      {a.reason && <Text style={[styles.caption, { color: colors.textSecondary }]}>Reason: {a.reason}</Text>}
      {a.changedBy && (
        <Text style={[styles.caption, { color: colors.textTertiary }]}>
          By {a.changedBy.name}
          {a.changedAt ? ` · ${formatTime(a.changedAt)}` : ''}
        </Text>
      )}
    </View>
  );

  const busy = replanning || submitting || approving;
  const reasonOk = reason.trim().length >= REASON_MIN;

  return (
    <SafeAreaView edges={['top', 'left', 'right']} style={[styles.safeArea, { backgroundColor: colors.background }]}>
      <View style={styles.header}>
        <Pressable onPress={goBack} style={styles.iconButton} accessibilityRole="button" accessibilityLabel="Go back">
          <Feather name="arrow-left" size={22} color={colors.textPrimary} />
        </Pressable>
        <Text numberOfLines={1} style={[styles.headerTitle, { color: colors.textPrimary }]}>Resource plan</Text>
        <SampleDataBadge source={query.source ?? undefined} />
      </View>

      <StateView state={query.state} error={query.error} onRetry={query.refresh} receivedAt={query.receivedAt}>
        {plan && (
          <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
            {/* Plan metadata */}
            <View style={[styles.card, { backgroundColor: colors.surface }]}>
              <View style={styles.row}>
                <Text style={[styles.body, styles.bold, styles.flex, { color: colors.textPrimary }]}>
                  {plan.incidentTitle ? `${plan.incidentTitle} · ` : ''}Version {plan.version}
                </Text>
                {plan.status && <StatusChip label={PLAN_STATUS[plan.status].label} tone={PLAN_STATUS[plan.status].tone} />}
              </View>
              <Text style={[styles.caption, { color: colors.textSecondary }]}>Generated {formatTime(plan.generatedAt)}</Text>
              {plan.lastChangedBy && (
                <Text style={[styles.caption, { color: colors.textSecondary }]}>
                  Last changed by {plan.lastChangedBy.name}
                  {plan.lastChangedBy.kind === 'NGO' ? ' (manual)' : ' (system)'}
                  {plan.lastChangedAt ? ` · ${formatTime(plan.lastChangedAt)}` : ''}
                </Text>
              )}
              {plan.approvedBy && plan.approvedAt && (
                <Text style={[styles.caption, { color: colors.textSecondary }]}>
                  Approved by {plan.approvedBy.name} · {formatTime(plan.approvedAt)}
                </Text>
              )}
              {plan.notes?.map((n) => (
                <Text key={n} style={[styles.caption, { color: colors.statusWatch }]}>
                  • {n}
                </Text>
              ))}
            </View>

            {plan.replanSuggested && (
              <View style={[styles.card, { backgroundColor: colors.statusWatchBg }]}>
                <Text style={[styles.body, styles.bold, { color: colors.textPrimary }]}>Replan suggested</Text>
                {plan.replanReasons?.map((reasonText) => (
                  <Text key={reasonText} style={[styles.caption, { color: colors.textPrimary }]}>
                    • {reasonText}
                  </Text>
                ))}
              </View>
            )}

            {error && (
              <View style={[styles.card, { backgroundColor: colors.statusActiveBg }]} accessibilityLiveRegion="polite">
                <Text style={[styles.body, styles.bold, { color: colors.statusActive }]}>Not applied</Text>
                <Text style={[styles.caption, { color: colors.textPrimary }]}>{error.message}</Text>
                <Text style={[styles.caption, { color: colors.textTertiary }]}>Code: {error.code}</Text>
              </View>
            )}

            {/* Actions */}
            {plan.status === 'PROPOSED' && (
              <PrimaryButton
                label="Approve and publish"
                onPress={() =>
                  confirmAction({
                    title: `Approve version ${plan.version}?`,
                    message: 'Tasks are published to workers and instructions sent to contributors.',
                    confirmLabel: 'Approve',
                    onConfirm: approve,
                  })
                }
                busy={approving}
                disabled={busy && !approving}
              />
            )}
            <Pressable
              onPress={replan}
              disabled={busy}
              style={[styles.button, { backgroundColor: colors.surfaceMuted, opacity: busy && !replanning ? 0.6 : 1 }]}
              accessibilityRole="button"
              accessibilityState={{ busy: replanning }}>
              {replanning ? (
                <ActivityIndicator size="small" color={colors.textPrimary} />
              ) : (
                <View style={styles.row}>
                  <Feather name="refresh-cw" size={16} color={colors.textPrimary} />
                  <Text style={[styles.buttonText, { color: colors.textPrimary }]}>Replan</Text>
                </View>
              )}
            </Pressable>

            {/* Manual allocation: collapsed by default */}
            <Pressable
              onPress={() => (showManual ? setShowManual(false) : openManual())}
              disabled={busy}
              style={[styles.disclosure, { backgroundColor: colors.surface }]}
              accessibilityRole="button"
              accessibilityState={{ expanded: showManual }}>
              <View style={styles.flex}>
                <Text style={[styles.body, styles.bold, { color: colors.textPrimary }]}>Allocate manually</Text>
                <Text style={[styles.caption, { color: colors.textSecondary }]}>
                  Override the plan for one resource, with a reason
                </Text>
              </View>
              <Feather name={showManual ? 'chevron-up' : 'chevron-down'} size={18} color={colors.textSecondary} />
            </Pressable>

            {showManual && (
              <View style={[styles.card, styles.form, { backgroundColor: colors.surface }]}>
                {!workOrders || !resources ? (
                  <ActivityIndicator color={colors.brandPrimary} />
                ) : (
                  <>
                    <Text style={[styles.label, { color: colors.textSecondary }]}>Work order</Text>
                    <View style={styles.chips}>
                      {workOrders.map((w) => {
                        const active = w.id === workOrderId;
                        return (
                          <Pressable
                            key={w.id}
                            onPress={() => setWorkOrderId(w.id)}
                            style={[styles.chip, { backgroundColor: active ? colors.actionPrimary : colors.surfaceMuted }]}
                            accessibilityRole="radio"
                            accessibilityState={{ selected: active }}>
                            <Text style={[styles.caption, styles.bold, { color: active ? colors.onActionPrimary : colors.textPrimary }]}>
                              {w.id} · {w.targetLocality}
                            </Text>
                          </Pressable>
                        );
                      })}
                    </View>

                    <Text style={[styles.label, { color: colors.textSecondary }]}>Resource</Text>
                    {resources.map((r) => {
                      const active = r.id === resourceId;
                      return (
                        <Pressable
                          key={r.id}
                          onPress={() => setResourceId(r.id)}
                          disabled={!r.eligibleForAllocation}
                          style={[
                            styles.option,
                            {
                              backgroundColor: active ? colors.surfaceMuted : colors.background,
                              opacity: r.eligibleForAllocation ? 1 : 0.55,
                            },
                          ]}
                          accessibilityRole="radio"
                          accessibilityState={{ selected: active, disabled: !r.eligibleForAllocation }}>
                          <Text style={[styles.body, { color: colors.textPrimary }]}>
                            {r.typeLabel} × {r.quantity} {r.unit}
                            {active ? '  ✓' : ''}
                          </Text>
                          <Text style={[styles.caption, { color: colors.textSecondary }]}>
                            {r.eligibleForAllocation ? 'Eligible' : 'Not eligible'}
                            {r.statusReason ? ` · ${r.statusReason}` : ''}
                          </Text>
                        </Pressable>
                      );
                    })}

                    <Text style={[styles.label, { color: colors.textSecondary }]}>Quantity</Text>
                    <TextInput
                      value={quantity}
                      onChangeText={(t) => setQuantity(t.replace(/[^0-9]/g, ''))}
                      keyboardType="number-pad"
                      accessibilityLabel="Quantity"
                      style={[styles.input, { color: colors.textPrimary, backgroundColor: colors.surfaceMuted }]}
                    />
                    <Text style={[styles.label, { color: colors.textSecondary }]}>Reason (required)</Text>
                    <TextInput
                      value={reason}
                      onChangeText={setReason}
                      multiline
                      placeholder="Why this differs from the automatic plan"
                      placeholderTextColor={colors.textTertiary}
                      accessibilityLabel="Reason for manual allocation"
                      style={[styles.input, styles.multiline, { color: colors.textPrimary, backgroundColor: colors.surfaceMuted }]}
                    />
                    {!reasonOk && reason.length > 0 && (
                      <Text style={[styles.caption, { color: colors.statusWatch }]}>
                        At least {REASON_MIN} characters.
                      </Text>
                    )}
                    <PrimaryButton
                      label="Submit for validation"
                      onPress={submitManual}
                      busy={submitting}
                      disabled={!workOrderId || !resourceId || !reasonOk || !Number(quantity)}
                    />
                  </>
                )}
              </View>
            )}

            <Text style={[styles.label, { color: colors.textTertiary }]}>ALLOCATIONS ({plan.allocations.length})</Text>
            {plan.allocations.length === 0 ? (
              <EmptyState title="No allocations" description="This plan version allocates no resources." />
            ) : (
              plan.allocations.map(renderAllocation)
            )}
          </ScrollView>
        )}
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
    paddingHorizontal: spacing.screenPadding,
    paddingTop: spacing.sm,
    paddingBottom: spacing.xs,
    gap: spacing.sm,
  },
  iconButton: { width: touchTargets.min, height: touchTargets.min, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { ...typography.title, ...textScale.title, flex: 1 },
  content: { paddingHorizontal: spacing.screenPadding, paddingBottom: spacing.xxl, gap: spacing.sm },
  card: { borderRadius: radii.card, padding: spacing.cardPadding, gap: spacing.xs },
  form: { gap: spacing.sm },
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, flexWrap: 'wrap' },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs },
  chip: { minHeight: touchTargets.min, paddingHorizontal: spacing.md, borderRadius: radii.button, justifyContent: 'center' },
  option: { borderRadius: radii.sm, padding: spacing.sm, minHeight: touchTargets.min, justifyContent: 'center' },
  button: { minHeight: touchTargets.min, borderRadius: radii.button, alignItems: 'center', justifyContent: 'center' },
  disclosure: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    minHeight: touchTargets.min,
    borderRadius: radii.card,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
  },
  buttonText: { ...typography.bodyMedium, fontWeight: '700', ...textScale.body },
  input: { minHeight: touchTargets.min, borderRadius: radii.sm, paddingHorizontal: spacing.md, ...textScale.body },
  multiline: { minHeight: touchTargets.min * 1.5, paddingTop: spacing.sm, textAlignVertical: 'top' },
  label: { ...typography.caption, ...textScale.caption, fontWeight: '600', marginTop: spacing.xs },
  body: { ...typography.body, ...textScale.body },
  bold: { fontWeight: '600' },
  caption: { ...typography.caption, ...textScale.caption },
});
