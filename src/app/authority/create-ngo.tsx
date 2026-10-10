/**
 * Add NGO — the authority creates an NGO account. The backend issues the NGO
 * code and temporary password; the app shows them once and never stores them.
 */
import React, { useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AuthField, PrimaryButton } from '@/components/AuthForm';
import { AuthorityTabBar } from '@/components/AuthorityTabBar';
import { useConfirmExitAtRoot } from '@/hooks/use-confirm-exit-at-root';
import { api } from '@/services/api';
import { useTheme } from '@/theme';
import { radii, spacing } from '@/theme/spacing';
import { typography } from '@/theme/typography';
import { NgoCredentials } from '@/types/ngo-workspace';

export default function CreateNgoScreen() {
  const { colors } = useTheme();
  useConfirmExitAtRoot();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [area, setArea] = useState('');
  const [busy, setBusy] = useState(false);
  const [issued, setIssued] = useState<(NgoCredentials & { name: string; simulated: boolean }) | null>(
    null
  );

  const submit = async () => {
    if (!name.trim() || !email.trim() || !area.trim()) {
      Alert.alert('Required fields', 'Enter the NGO name, email and area.');
      return;
    }
    try {
      setBusy(true);
      const result = await api.createNgo({ name: name.trim(), email: email.trim(), area: area.trim() });
      setIssued({
        ...result.data.credentials,
        name: result.data.ngo.name,
        simulated: result.source === 'sample',
      });
      setName('');
      setEmail('');
      setArea('');
    } catch (err: any) {
      Alert.alert('Could not create NGO', err?.message || 'Try again.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <SafeAreaView edges={['top', 'left', 'right']} style={[styles.safeArea, { backgroundColor: colors.background }]}>
      <Text style={[styles.title, { color: colors.textPrimary }]}>Add NGO</Text>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        {issued && (
          <View style={[styles.card, { backgroundColor: colors.surface }]} accessibilityLiveRegion="polite">
            <Text style={[styles.body, styles.bold, { color: colors.textPrimary }]}>
              {issued.name} created{issued.simulated ? ' (Simulated — sample values)' : ''}
            </Text>
            <Text style={[styles.caption, { color: colors.textSecondary }]}>NGO code</Text>
            <Text style={[styles.mono, { color: colors.textPrimary }]} selectable>{issued.ngoCode}</Text>
            <Text style={[styles.caption, { color: colors.textSecondary }]}>Sign-in email</Text>
            <Text style={[styles.mono, { color: colors.textPrimary }]} selectable>{issued.loginEmail}</Text>
            <Text style={[styles.caption, { color: colors.textSecondary }]}>Temporary password</Text>
            <Text style={[styles.mono, { color: colors.textPrimary }]} selectable>
              {issued.temporaryPassword}
            </Text>
            <Text style={[styles.caption, { color: colors.statusWatch }]}>
              Shown only once. Share it with the NGO securely.
            </Text>
            <PrimaryButton label="Done" onPress={() => setIssued(null)} />
          </View>
        )}
        <View style={[styles.card, { backgroundColor: colors.surface }]}>
          <AuthField label="NGO name" value={name} onChangeText={setName} />
          <AuthField
            label="Email"
            autoCapitalize="none"
            keyboardType="email-address"
            value={email}
            onChangeText={setEmail}
          />
          <AuthField label="Area served" placeholder="District, state" value={area} onChangeText={setArea} />
          <Text style={[styles.caption, { color: colors.textTertiary }]}>
            The backend uses the area to select nearby NGOs for incidents.
          </Text>
          <PrimaryButton label="Create NGO account" onPress={submit} busy={busy} />
        </View>
      </ScrollView>
      <AuthorityTabBar activeTab="create" />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  title: {
    ...typography.title,
    fontSize: 20,
    paddingHorizontal: spacing.screenPadding,
    paddingTop: spacing.md,
    paddingBottom: spacing.sm,
  },
  content: { paddingHorizontal: spacing.screenPadding, paddingBottom: spacing.xxl, gap: spacing.md },
  card: { borderRadius: radii.card, padding: spacing.cardPadding, gap: spacing.sm },
  body: { ...typography.body, fontSize: 14, lineHeight: 20 },
  bold: { fontWeight: '600' },
  caption: { ...typography.caption, fontSize: 12, lineHeight: 17 },
  mono: { fontFamily: 'monospace', fontSize: 16 },
});
