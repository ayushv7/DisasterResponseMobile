import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { Href, router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useTheme } from '@/theme';
import { spacing, touchTargets } from '@/theme/spacing';
import { typography } from '@/theme/typography';

export interface RoleTab {
  key: string;
  label: string;
  icon: keyof typeof Feather.glyphMap;
  route: Href;
}

/** Bottom tab bar for a signed-in role area (same look as the ops/NGO bars). */
export function RoleTabBar({ tabs, activeTab }: { tabs: RoleTab[]; activeTab: string }) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();

  return (
    <View
      style={[
        styles.container,
        { backgroundColor: colors.background, paddingBottom: Math.max(insets.bottom, 8) },
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
            accessibilityLabel={tab.label}>
            <Feather
              name={tab.icon}
              size={20}
              color={isActive ? colors.brandTeal : colors.textTertiary}
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
    paddingTop: 8,
  },
  tabButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: touchTargets.min,
    gap: 3,
    paddingVertical: spacing.xs,
  },
  tabLabel: {
    ...typography.caption,
    fontSize: 11,
    lineHeight: 14,
  },
});
