/**
 * OpsBottomNavBar — Coordinator Operational Navigation Bar
 *
 * Dedicated to response coordinators and operational dispatchers:
 * 1. Operations Queue (/ops/home)
 * 2. Incidents Catalogue (/ops/incidents)
 * 3. Field Tasks Management (/ops/tasks)
 * 4. Verification & Replanning (/ops/replanning)
 * 5. More (/ops/more)
 * Field workers see Tasks + Profile only.
 */

import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useSession } from '@/session/session-context';
import { useTheme } from '@/theme';
import { spacing, touchTargets } from '@/theme/spacing';
import { typography } from '@/theme/typography';

export type OpsTabKey = 'operations' | 'incidents' | 'tasks' | 'replanning' | 'more';

interface OpsTabDef {
  key: OpsTabKey;
  label: string;
  icon: keyof typeof Feather.glyphMap;
  route: string;
  accessibilityLabel: string;
}

const OPS_TABS: OpsTabDef[] = [
  {
    key: 'operations',
    label: 'Ops',
    icon: 'activity',
    route: '/ops/home',
    accessibilityLabel: 'Operations queue and active interventions',
  },
  {
    key: 'incidents',
    label: 'Incidents',
    icon: 'alert-triangle',
    route: '/ops/incidents',
    accessibilityLabel: 'Detected incidents and source telemetry',
  },
  {
    key: 'tasks',
    label: 'Tasks',
    icon: 'check-square',
    route: '/ops/tasks',
    accessibilityLabel: 'Field worker task execution and acknowledgements',
  },
  {
    key: 'replanning',
    label: 'Replan',
    icon: 'refresh-cw',
    route: '/ops/replanning',
    accessibilityLabel: 'Verification and alternative allocation replanning',
  },
  {
    key: 'more',
    label: 'More',
    icon: 'menu',
    route: '/ops/more',
    accessibilityLabel: 'Settings and sign out',
  },
];

/** Field workers only see their tasks and profile; coordinators see all. */
const FIELD_WORKER_TABS: OpsTabKey[] = ['tasks', 'more'];

interface OpsBottomNavBarProps {
  activeTab: OpsTabKey;
}

export function OpsBottomNavBar({ activeTab }: OpsBottomNavBarProps) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const { role } = useSession();
  const tabs =
    role === 'field_worker'
      ? OPS_TABS.filter((tab) => FIELD_WORKER_TABS.includes(tab.key)).map((tab) =>
          tab.key === 'more' ? { ...tab, label: 'Profile' } : tab
        )
      : OPS_TABS;

  const handleTabPress = (tab: OpsTabDef) => {
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
      {tabs.map((tab) => {
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
    borderTopWidth: 0,
    elevation: 0,
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
