/**
 * Add resource — type, quantity and condition plus live evidence. The service
 * defines types and check-in intervals and decides freshness and eligibility.
 */
import React, { useRef, useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { router } from 'expo-router';

import { PrimaryButton } from '@/components/AuthForm';
import { isEvidenceVerified, LiveEvidence } from '@/components/LiveEvidence';
import { SampleDataBadge } from '@/components/SampleDataBadge';
import { StateView } from '@/components/StateView';
import { useApiQuery } from '@/hooks/use-api-query';
import { useToast } from '@/components/Toast';
import { useGoBack } from '@/navigation/use-go-back';
import { api } from '@/services/api';
import { prepareEvidence } from '@/services/evidence';
import { useTheme } from '@/theme';
import { radii, spacing, touchTargets } from '@/theme/spacing';
import { typography } from '@/theme/typography';
import { EvidenceDraft, RESOURCE_CONDITION_LABELS, ResourceCondition } from '@/types/contributors';

const CONDITIONS = Object.keys(RESOURCE_CONDITION_LABELS) as ResourceCondition[];

export default function AddResourceScreen() {
  const goBack = useGoBack();
  const toast = useToast();
  const { colors } = useTheme();
  const policies = useApiQuery(() => api.getResourceTypePolicies(), []);

  const [type, setType] = useState<string | undefined>();
  const [quantity, setQuantity] = useState('');
  const [condition, setCondition] = useState<ResourceCondition>('GOOD');
  const [evidence, setEvidence] = useState<EvidenceDraft>({ capturedAt: new Date().toISOString() });
  const [stage, setStage] = useState<'idle' | 'uploading' | 'submitting'>('idle');
  const inFlight = useRef(false);

  const policy = policies.data?.find((p) => p.type === type);
  const qty = Number(quantity);
  const qtyValid = Number.isInteger(qty) && qty >= 1;

  const doSubmit = async () => {
    if (inFlight.current || !type) return;
    inFlight.current = true;
    try {
      const { evidence: payload, uploadSimulated } = await prepareEvidence(evidence, setStage);
      const result = await api.registerResource({ type, quantity: qty, condition, evidence: payload });
      const r = result.data;
      toast(
        [
          result.source === 'sample' ? 'Simulated: resource registered.' : 'Resource registered.',
          r.statusReason ?? r.freshness,
          uploadSimulated ? 'Photo upload simulated.' : '',
        ]
          .filter(Boolean)
          .join(' ')
      );
      if (router.canGoBack()) router.back();
      else router.replace('/contributor/resources');
    } catch (err) {
      Alert.alert('Not registered', err instanceof Error ? err.message : 'Try again.');
    } finally {
      inFlight.current = false;
      setStage('idle');
    }
  };

  const submit = () => {
    if (!type || !qtyValid) {
      Alert.alert('Check the form', 'Choose a type and enter a whole-number quantity of at least 1.');
      return;
    }
    if (!isEvidenceVerified(evidence)) {
      Alert.alert(
        'Submit as Unverified?',
        'Without live GPS and a camera photo, your NGO must review it before it can be allocated.',
        [
          { text: 'Go back', style: 'cancel' },
          { text: 'Submit as Unverified', onPress: doSubmit },
        ]
      );
      return;
    }
    doSubmit();
  };

  const busy = stage !== 'idle';

  return (
    <SafeAreaView edges={['top', 'left', 'right']} style={[styles.safeArea, { backgroundColor: colors.background }]}>
      <View style={styles.header}>
        <Pressable onPress={goBack} style={styles.iconButton} accessibilityRole="button" accessibilityLabel="Go back">
          <Feather name="arrow-left" size={22} color={colors.textPrimary} />
        </Pressable>
        <Text numberOfLines={1} style={[styles.headerTitle, { color: colors.textPrimary }]}>Add resource</Text>
        <SampleDataBadge source={policies.source ?? undefined} />
      </View>
      <StateView state={policies.state} error={policies.error} onRetry={policies.refresh}>
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          <Text style={[styles.label, { color: colors.textSecondary }]}>Type</Text>
          <View style={styles.chips}>
            {(policies.data ?? []).map((p) => {
              const active = p.type === type;
              return (
                <Pressable
                  key={p.type}
                  onPress={() => setType(p.type)}
                  disabled={busy}
                  style={[styles.chip, { backgroundColor: active ? colors.actionPrimary : colors.surface }]}
                  accessibilityRole="radio"
                  accessibilityState={{ selected: active }}>
                  <Text style={[styles.caption, styles.bold, { color: active ? colors.onActionPrimary : colors.textPrimary }]}>
                    {p.label}
                  </Text>
                </Pressable>
              );
            })}
          </View>
          {policy && (
            <Text style={[styles.caption, { color: colors.textSecondary }]}>
              You will confirm this every {policy.checkInIntervalHours} hours.
            </Text>
          )}

          <Text style={[styles.label, { color: colors.textSecondary }]}>
            Quantity{policy ? ` (${policy.unit})` : ''}
          </Text>
          <TextInput
            value={quantity}
            onChangeText={(t) => setQuantity(t.replace(/[^0-9]/g, ''))}
            keyboardType="number-pad"
            editable={!busy}
            accessibilityLabel="Quantity"
            style={[styles.input, { color: colors.textPrimary, backgroundColor: colors.surface }]}
          />
          {quantity !== '' && !qtyValid && (
            <Text style={[styles.caption, { color: colors.statusActive }]}>Enter a whole number of at least 1.</Text>
          )}

          <Text style={[styles.label, { color: colors.textSecondary }]}>Condition</Text>
          <View style={styles.chips}>
            {CONDITIONS.map((c) => {
              const active = c === condition;
              return (
                <Pressable
                  key={c}
                  onPress={() => setCondition(c)}
                  disabled={busy}
                  style={[styles.chip, { backgroundColor: active ? colors.actionPrimary : colors.surface }]}
                  accessibilityRole="radio"
                  accessibilityState={{ selected: active }}>
                  <Text style={[styles.caption, styles.bold, { color: active ? colors.onActionPrimary : colors.textPrimary }]}>
                    {RESOURCE_CONDITION_LABELS[c]}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          <Text style={[styles.label, { color: colors.textSecondary }]}>Evidence</Text>
          <LiveEvidence value={evidence} onChange={setEvidence} disabled={busy} />

          <PrimaryButton
            label={stage === 'uploading' ? 'Uploading photo…' : stage === 'submitting' ? 'Submitting…' : 'Register resource'}
            onPress={submit}
            busy={busy}
          />
        </ScrollView>
      </StateView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.screenPadding,
    paddingTop: spacing.sm,
    paddingBottom: spacing.xs,
    gap: spacing.sm,
  },
  iconButton: { width: touchTargets.min, height: touchTargets.min, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { ...typography.title, fontSize: 20, lineHeight: 24, flex: 1 },
  content: { paddingHorizontal: spacing.screenPadding, paddingBottom: spacing.xxl, gap: spacing.sm },
  label: { ...typography.caption, fontSize: 12, fontWeight: '600', marginTop: spacing.sm },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs },
  chip: { minHeight: touchTargets.min, paddingHorizontal: spacing.md, borderRadius: radii.button, justifyContent: 'center' },
  input: { minHeight: touchTargets.min, borderRadius: radii.sm, paddingHorizontal: spacing.md, fontSize: 16 },
  bold: { fontWeight: '600' },
  caption: { ...typography.caption, fontSize: 12, lineHeight: 17 },
});
