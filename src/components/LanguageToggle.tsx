import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { useStrings } from '@/i18n/language-context';
import { Language } from '@/i18n/strings';
import { radii, spacing, textScale, touchTargets, typography, useTheme } from '@/theme';

const OPTIONS: { key: Language; label: string; a11y: string }[] = [
  { key: 'en', label: 'English', a11y: 'English' },
  { key: 'hi', label: 'हिन्दी', a11y: 'Hindi' },
];

/** English / Hindi switch for the main demo screens. */
export function LanguageToggle() {
  const { colors } = useTheme();
  const { language, setLanguage } = useStrings();
  return (
    <View style={[styles.wrap, { backgroundColor: colors.surfaceMuted }]} accessibilityRole="radiogroup">
      {OPTIONS.map((o) => {
        const active = o.key === language;
        return (
          <Pressable
            key={o.key}
            onPress={() => setLanguage(o.key)}
            style={[styles.option, active && { backgroundColor: colors.surface }]}
            accessibilityRole="radio"
            accessibilityState={{ selected: active }}
            accessibilityLabel={o.a11y}>
            <Text style={[styles.text, { color: active ? colors.textPrimary : colors.textSecondary }]}>{o.label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { flexDirection: 'row', borderRadius: radii.chip, padding: spacing.xxs, alignSelf: 'flex-start' },
  option: {
    minHeight: touchTargets.min,
    paddingHorizontal: spacing.lg,
    borderRadius: radii.chip,
    justifyContent: 'center',
  },
  text: { ...typography.caption, ...textScale.body, fontWeight: '600' },
});
