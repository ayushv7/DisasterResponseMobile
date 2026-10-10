/**
 * NgoBottomNavBar — Dedicated Navigation for Verified NGO Workspace
 *
 * Provides dedicated 4-tab workspace navigation strictly for authorized NGOs:
 * - Event Feed (/ngo/feed)
 * - Inbox (/ngo/inbox)
 * - Contributions (/ngo/contributions)
 * - Organization (/ngo/organization)
 *
 * Isolated from the public user bottom navigation bar.
 */

import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useTheme } from '@/theme';
import { spacing, touchTargets } from '@/theme/spacing';
import { typography } from '@/theme/typography';

export type NgoTabKey = 'feed' | 'inbox' | 'contributions' | 'organization';

interface NgoTabDef {
  key: NgoTabKey;
  label: string;
  icon: keyof typeof Feather.glyphMap;
  route: string;
  accessibilityLabel: string;
}

const NGO_TABS: NgoTabDef[] = [
  {
    key: 'inbox',
    label: 'Inbox',
    icon: 'inbox',
    route: '/ngo/inbox',
    accessibilityLabel: 'Private messages from the public',
  },
  {
    key: 'contributions',
    label: 'Publish',
    icon: 'edit-3',
    route: '/ngo/contributions',
    accessibilityLabel: 'Draft and published updates',
  },
  {
    key: 'feed',
    label: 'Evidence',
    icon: 'activity',
    route: '/ngo/feed',
    accessibilityLabel: 'Incidents and source evidence',
  },
  {
    key: 'organization',
    label: 'Organization',
    icon: 'shield',
    route: '/ngo/organization',
    accessibilityLabel: 'Organization status, settings and sign out',
  },
];

interface NgoBottomNavBarProps {
  activeTab: NgoTabKey;
}

export function NgoBottomNavBar({ activeTab }: NgoBottomNavBarProps) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();

  const handleTabPress = (tab: NgoTabDef) => {
    if (tab.key === activeTab) return;
    router.navigate(tab.route as any);
  };

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: colors.background,
          paddingBottom: Math.max(insets.bottom, 8),
        },
      ]}>
      {NGO_TABS.map((tab) => {
        const isActive = tab.key === activeTab;
        return (
          <Pressable
            key={tab.key}
            onPress={() => handleTabPress(tab)}
            style={styles.tabButton}
            accessibilityRole="tab"
            accessibilityState={{ selected: isActive }}
            accessibilityLabel={tab.accessibilityLabel}>
            <Feather
              name={tab.icon}
              size={20}
              color={isActive ? colors.textPrimary : colors.textTertiary}
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
    paddingTop: spacing.xs,
  },
  tabButton: {
    flex: 1,
    height: touchTargets.min,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 3,
  },
  tabLabel: {
    ...typography.caption,
    fontSize: 11,
    lineHeight: 14,
  },
});
