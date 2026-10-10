import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useTheme } from '@/theme';
import { spacing, touchTargets } from '@/theme/spacing';
import { typography } from '@/theme/typography';

export type TabKey = 'feed' | 'map' | 'messages' | 'profile';

interface TabDef {
  key: TabKey;
  label: string;
  icon: keyof typeof Feather.glyphMap;
  route: string;
  accessibilityLabel: string;
}

const TABS: TabDef[] = [
  {
    key: 'feed',
    label: 'Alerts',
    icon: 'shield',
    route: '/alerts',
    accessibilityLabel: 'Flood alerts feed',
  },
  {
    key: 'map',
    label: 'Map',
    icon: 'map-pin',
    route: '/map',
    accessibilityLabel: 'Flood event map',
  },
  {
    key: 'messages',
    label: 'Message NGO',
    icon: 'message-square',
    route: '/messages',
    accessibilityLabel: 'Message a verified NGO and see sent messages',
  },
  {
    key: 'profile',
    label: 'Profile',
    icon: 'user',
    route: '/profile',
    accessibilityLabel: 'User profile and settings',
  },
];

/** Map is hidden until it shows real geospatial data (route still exists). */
const HIDDEN_TABS: TabKey[] = ['map'];
const VISIBLE_TABS = TABS.filter((tab) => !HIDDEN_TABS.includes(tab.key));

interface BottomNavBarProps {
  activeTab: TabKey;
}

export function BottomNavBar({ activeTab }: BottomNavBarProps) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();

  const handleTabPress = (tab: TabDef) => {
    if (tab.key === activeTab) return;
    // Use navigate to trigger smooth slide transition defined in stack options
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
      {VISIBLE_TABS.map((tab) => {
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
