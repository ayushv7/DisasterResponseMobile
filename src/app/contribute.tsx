/**
 * Apply to contribute — a signed-in citizen offers resources (boats, food,
 * generators…) to one NGO. The NGO approves; the backend then issues a
 * contributor ID and sign-in code, which the NGO passes on.
 */
import React, { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Pressable, ScrollView, StyleSheet, Switch, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { router } from 'expo-router';

import { AuthField, PrimaryButton } from '@/components/AuthForm';
import { CitizenSignInPrompt } from '@/components/CitizenSignInPrompt';
import { ErrorState } from '@/components/ErrorState';
import { SampleDataBadge } from '@/components/SampleDataBadge';
import { useGoBack } from '@/navigation/use-go-back';
import { api, DataSource } from '@/services/api';
import { useSession } from '@/session/session-context';
import { useTheme } from '@/theme';
import { radii, spacing, touchTargets } from '@/theme/spacing';
import { typography } from '@/theme/typography';
import { ContributorApplication } from '@/types/contributors';
import { VerifiedNgo } from '@/types/messaging';
import { VOLUNTEER_STATUS_LABELS } from '@/types/volunteers';

export default function ContributeScreen() {
  const goBack = useGoBack();
  const { colors } = useTheme();
  const { citizen } = useSession();

  const [application, setApplication] = useState<ContributorApplication | null>(null);
  const [source, setSource] = useState<DataSource | undefined>();
  const [ngos, setNgos] = useState<VerifiedNgo[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const [name, setName] = useState('');
  const [ngoId, setNgoId] = useState<string | undefined>();
  const [offering, setOffering] = useState('');
  const [area, setArea] = useState('');
  const [consent, setConsent] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const load = useCallback(async () => {
    if (!citizen) {
      setLoading(false);
      return;
    }
    try {
      setErrorMsg(null);
      const [mine, ngoList] = await Promise.all([api.getMyContributorApplication(), api.getVerifiedNgos()]);
      setApplication(mine.data);
      setSource(mine.source);
      setNgos(ngoList.data);
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Could not load your application.');
    } finally {
      setLoading(false);
    }
  }, [citizen]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    load();
  }, [load]);

  const submit = async () => {
    if (submitting) return;
    if (!name.trim() || !ngoId || !offering.trim() || !area.trim()) {
      Alert.alert('Required fields', 'Enter your name, choose an NGO, and say what you can contribute and where.');
      return;
    }
    if (!consent) {
      Alert.alert('Consent needed', 'Turn on consent to share these details with the NGO.');
      return;
    }
    try {
      setSubmitting(true);
      const result = await api.applyToContribute({
        name: name.trim(),
        ngoId,
        offering: offering.trim(),
        area: area.trim(),
        consent,
      });
      setApplication(result.data);
      setSource(result.source);
    } catch (err) {
      Alert.alert('Could not apply', err instanceof Error ? err.message : 'Try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <SafeAreaView edges={['top', 'left', 'right']} style={[styles.safeArea, { backgroundColor: colors.background }]}>
      <View style={styles.header}>
        <Pressable onPress={goBack} style={styles.iconButton} accessibilityRole="button" accessibilityLabel="Go back">
          <Feather name="arrow-left" size={22} color={colors.textPrimary} />
        </Pressable>
        <Text numberOfLines={1} style={[styles.headerTitle, { color: colors.textPrimary }]}>Contribute resources</Text>
        <SampleDataBadge source={source} />
      </View>

      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        {!citizen ? (
          <CitizenSignInPrompt />
        ) : loading ? (
          <ActivityIndicator color={colors.brandPrimary} />
        ) : errorMsg ? (
          <ErrorState message={errorMsg} onRetry={load} />
        ) : application ? (
          <View style={[styles.card, { backgroundColor: colors.surface }]}>
            <Text style={[styles.body, styles.bold, { color: colors.textPrimary }]}>
              {VOLUNTEER_STATUS_LABELS[application.status]}
              {source === 'sample' ? ' (Simulated)' : ''}
            </Text>
            <Text style={[styles.caption, { color: colors.textSecondary }]}>
              {application.ngoName} · {application.offering}
            </Text>
            {application.decisionReason && (
              <Text style={[styles.body, { color: colors.textPrimary }]}>Reason: {application.decisionReason}</Text>
            )}
            {application.status === 'APPROVED' && (
              <>
                <Text style={[styles.caption, { color: colors.textSecondary }]}>
                  Your NGO gives you your contributor ID and sign-in code.
                </Text>
                <PrimaryButton label="Contributor sign-in" onPress={() => router.push('/contributor-login')} />
              </>
            )}
          </View>
        ) : (
          <View style={[styles.card, styles.form, { backgroundColor: colors.surface }]}>
            <Text style={[styles.caption, { color: colors.textSecondary }]}>
              Register resources you can lend in a disaster. Once approved you confirm regularly that
              they are still available.
            </Text>
            <AuthField label="Full name" value={name} onChangeText={setName} />
            <Text style={[styles.caption, styles.bold, { color: colors.textSecondary }]}>NGO</Text>
            <View style={styles.chips}>
              {ngos.map((n) => {
                const active = n.id === ngoId;
                return (
                  <Pressable
                    key={n.id}
                    onPress={() => setNgoId(n.id)}
                    style={[styles.chip, { backgroundColor: active ? colors.actionPrimary : colors.surfaceMuted }]}
                    accessibilityRole="radio"
                    accessibilityState={{ selected: active }}>
                    <Text style={[styles.caption, styles.bold, { color: active ? colors.onActionPrimary : colors.textPrimary }]}>
                      {n.name}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
            <AuthField
              label="What you can contribute"
              placeholder="e.g. 2 motor boats, 1 generator"
              value={offering}
              onChangeText={setOffering}
            />
            <AuthField label="Area" placeholder="Town or district" value={area} onChangeText={setArea} />
            <View style={styles.row}>
              <Text style={[styles.caption, styles.flex, { color: colors.textPrimary }]}>
                I agree to share these details and my contact with this NGO.
              </Text>
              <Switch value={consent} onValueChange={setConsent} accessibilityLabel="Consent" />
            </View>
            <PrimaryButton label="Apply" onPress={submit} busy={submitting} />
          </View>
        )}
      </ScrollView>
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
  headerTitle: { ...typography.title, fontSize: 20, lineHeight: 24, flex: 1 },
  content: { paddingHorizontal: spacing.screenPadding, paddingTop: spacing.sm, paddingBottom: spacing.xxl, gap: spacing.sm },
  card: { borderRadius: radii.card, padding: spacing.cardPadding, gap: spacing.xs },
  form: { gap: spacing.md },
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs },
  chip: { minHeight: touchTargets.min, paddingHorizontal: spacing.md, borderRadius: radii.button, justifyContent: 'center' },
  body: { ...typography.body, fontSize: 14, lineHeight: 20 },
  bold: { fontWeight: '600' },
  caption: { ...typography.caption, fontSize: 12, lineHeight: 17 },
});
