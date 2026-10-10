/**
 * Apply to volunteer — signed-in citizens apply to help an NGO. The NGO
 * approves or rejects; eligibility is checked by the backend. Shows the
 * current status and the NGO's reason.
 */
import React, { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Pressable, ScrollView, StyleSheet, Switch, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';

import { AuthField, PrimaryButton } from '@/components/AuthForm';
import { CitizenSignInPrompt } from '@/components/CitizenSignInPrompt';
import { ErrorState } from '@/components/ErrorState';
import { useGoBack } from '@/navigation/use-go-back';
import { api } from '@/services/api';
import { useSession } from '@/session/session-context';
import { useTheme } from '@/theme';
import { radii, spacing, touchTargets } from '@/theme/spacing';
import { typography } from '@/theme/typography';
import { VerifiedNgo } from '@/types/messaging';
import { VOLUNTEER_STATUS_LABELS, VolunteerApplication } from '@/types/volunteers';

export default function VolunteerScreen() {
  const goBack = useGoBack();
  const { colors } = useTheme();
  const { citizen } = useSession();

  const [application, setApplication] = useState<VolunteerApplication | null>(null);
  const [simulated, setSimulated] = useState(false);
  const [ngos, setNgos] = useState<VerifiedNgo[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const [name, setName] = useState('');
  const [skills, setSkills] = useState('');
  const [availability, setAvailability] = useState('');
  const [ngoId, setNgoId] = useState<string | undefined>();
  const [consent, setConsent] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const load = useCallback(async () => {
    if (!citizen) {
      setLoading(false);
      return;
    }
    try {
      setErrorMsg(null);
      const [mine, ngoList] = await Promise.all([api.getMyVolunteerApplication(), api.getVerifiedNgos()]);
      setApplication(mine.data);
      setSimulated(mine.source === 'sample');
      setNgos(ngoList.data);
    } catch (err: any) {
      setErrorMsg(err?.message || 'Could not load your application.');
    } finally {
      setLoading(false);
    }
  }, [citizen]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    load();
  }, [load]);

  const submit = async () => {
    if (!name.trim() || !skills.trim() || !availability.trim()) {
      Alert.alert('Required fields', 'Enter your name, skills and availability.');
      return;
    }
    if (!consent) {
      Alert.alert('Consent needed', 'Tick the consent box to share these details with the NGO.');
      return;
    }
    try {
      setSubmitting(true);
      const result = await api.applyToVolunteer({
        name: name.trim(),
        skills: skills.split(',').map((s) => s.trim()).filter(Boolean),
        availability: availability.trim(),
        ngoId,
        consent,
      });
      setApplication(result.data);
      setSimulated(result.source === 'sample');
    } catch (err: any) {
      Alert.alert('Could not apply', err?.message || 'Try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const statusColor = (s: VolunteerApplication['status']) =>
    s === 'APPROVED' ? colors.statusResolved : s === 'PENDING' ? colors.statusWatch : colors.statusActive;

  return (
    <SafeAreaView edges={['top', 'left', 'right']} style={[styles.safeArea, { backgroundColor: colors.background }]}>
      <View style={styles.header}>
        <Pressable onPress={goBack} style={styles.iconButton} accessibilityRole="button" accessibilityLabel="Go back">
          <Feather name="arrow-left" size={22} color={colors.textPrimary} />
        </Pressable>
        <Text numberOfLines={1} style={[styles.headerTitle, { color: colors.textPrimary }]}>Volunteer</Text>
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
            <View style={styles.row}>
              <View style={[styles.dot, { backgroundColor: statusColor(application.status) }]} />
              <Text style={[styles.body, styles.bold, { color: colors.textPrimary }]}>
                {VOLUNTEER_STATUS_LABELS[application.status]}
                {simulated ? ' (Simulated)' : ''}
              </Text>
            </View>
            <Text style={[styles.caption, { color: colors.textSecondary }]}>
              {application.ngoName ?? 'Any verified NGO'} · {application.skills.join(', ')}
            </Text>
            {application.decisionReason && (
              <Text style={[styles.body, { color: colors.textPrimary }]}>
                Reason: {application.decisionReason}
              </Text>
            )}
            {application.status === 'PENDING' && (
              <Text style={[styles.caption, { color: colors.textSecondary }]}>
                The NGO reviews your application. Eligibility is checked by the system, not by this app.
              </Text>
            )}
            {simulated && (
              <Text style={[styles.caption, { color: colors.textTertiary }]}>
                Simulated: saved on this device only. No NGO received it.
              </Text>
            )}
          </View>
        ) : (
          <View style={[styles.card, styles.form, { backgroundColor: colors.surface }]}>
            <Text style={[styles.caption, { color: colors.textSecondary }]}>
              Apply to help a verified NGO in the field. The NGO decides; you can be assigned tasks
              only after approval.
            </Text>
            <AuthField label="Full name" value={name} onChangeText={setName} />
            <AuthField
              label="Skills (comma separated)"
              placeholder="Swimming, First aid, Driving"
              value={skills}
              onChangeText={setSkills}
            />
            <AuthField
              label="Availability"
              placeholder="e.g. Weekends, evenings"
              value={availability}
              onChangeText={setAvailability}
            />
            <Text style={[styles.caption, styles.bold, { color: colors.textSecondary }]}>NGO (optional)</Text>
            <View style={styles.chips}>
              {ngos.map((n) => {
                const active = n.id === ngoId;
                return (
                  <Pressable
                    key={n.id}
                    onPress={() => setNgoId(active ? undefined : n.id)}
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
            <View style={styles.row}>
              <Text style={[styles.caption, styles.flex, { color: colors.textPrimary }]}>
                I agree to share these details and my contact with the NGO, and to be contacted about
                volunteering.
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
  headerTitle: { ...typography.title, fontSize: 20, lineHeight: 24 },
  content: { paddingHorizontal: spacing.screenPadding, paddingTop: spacing.sm, paddingBottom: spacing.xxl, gap: spacing.sm },
  card: { borderRadius: radii.card, padding: spacing.cardPadding, gap: spacing.xs },
  form: { gap: spacing.md },
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  dot: { width: 8, height: 8, borderRadius: 4 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs },
  chip: { minHeight: touchTargets.min, paddingHorizontal: spacing.md, borderRadius: radii.button, justifyContent: 'center' },
  body: { ...typography.body, fontSize: 14, lineHeight: 20 },
  bold: { fontWeight: '600' },
  caption: { ...typography.caption, fontSize: 12, lineHeight: 17 },
});
