import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { Href, router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useTheme } from '@/theme';
import { spacing, touchTargets } from '@/theme/spacing';
import { textScale, typography } from '@/theme/typography';

export interface RoleTab {
  key: string;
  label: string;
  icon: keyof typeof Feather.glyphMap;
  route: Href;
  /** Screen-reader label; defaults to `label`. */
  accessibilityLabel?: string;
}

/**
 * The single bottom tab bar used by every area (public, NGO, ops, authority,
 * contributor). `teal` colours the active icon with the operational accent.
 */
export function RoleTabBar({
  tabs,
  activeTab,
  teal = true,
}: {
  tabs: RoleTab[];
  activeTab: string;
  teal?: boolean;
}) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();

  return (
    <View
      style={[
        styles.container,
        { backgroundColor: colors.background, paddingBottom: Math.max(insets.bottom, spacing.sm) },
      ]}>
      {tabs.map((tab) => {
        const isActive = tab.key === activeTab;
        return (
          <Pressable
            key={tab.key}
            onPress={() => !isActive && router.navigate(tab.route)}
            style={styles.tabButton}
            accessibilityRole="tab"
            accessibilityState={{ selected: isActive }}
            accessibilityLabel={tab.accessibilityLabel ?? tab.label}>
            <Feather
              name={tab.icon}
              size={20}
              color={isActive ? (teal ? colors.brandTeal : colors.textPrimary) : colors.textTertiary}
            />
            <Text
              style={[
                styles.tabLabel,
                {
                  color: isActive ? colors.textPrimary : colors.textTertiary,
                  fontWeight: isActive ? '700' : '500',
                },
              ]}>
              {tab.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingTop: spacing.sm,
  },
  tabButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: touchTargets.min,
    gap: spacing.xs,
    paddingVertical: spacing.xs,
  },
  tabLabel: {
    ...typography.caption,
    ...textScale.caption,
  },
});
