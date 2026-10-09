import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useTheme } from '@/theme';
import { spacing, touchTargets } from '@/theme/spacing';
import { typography } from '@/theme/typography';

export type TabKey = 'alerts' | 'settings';

interface BottomNavBarProps {
  activeTab: TabKey;
}

export function BottomNavBar({ activeTab }: BottomNavBarProps) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();

  const handleTabPress = (tab: TabKey) => {
    if (tab === activeTab) return;
    if (tab === 'alerts') {
      router.replace('/');
    } else if (tab === 'settings') {
      router.push('/settings');
    }
  };

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: colors.background, // seamlessly anchors into true-dark canvas
          paddingBottom: Math.max(insets.bottom, 8),
        },
      ]}>
      {/* Tab 1: Alerts */}
      <Pressable
        onPress={() => handleTabPress('alerts')}
        style={styles.tabButton}
        accessibilityRole="tab"
        accessibilityState={{ selected: activeTab === 'alerts' }}
        accessibilityLabel="Flood alerts feed tab">
        <Feather
          name="shield"
          size={20}
          color={activeTab === 'alerts' ? colors.textPrimary : colors.textTertiary}
        />
        <Text
          style={[
            styles.tabLabel,
            {
              color: activeTab === 'alerts' ? colors.textPrimary : colors.textTertiary,
              fontWeight: activeTab === 'alerts' ? '700' : '500',
            },
          ]}>
          Alerts
        </Text>
      </Pressable>

      {/* Tab 2: Settings */}
      <Pressable
        onPress={() => handleTabPress('settings')}
        style={styles.tabButton}
        accessibilityRole="tab"
        accessibilityState={{ selected: activeTab === 'settings' }}
        accessibilityLabel="Application settings tab">
        <Feather
          name="settings"
          size={20}
          color={activeTab === 'settings' ? colors.textPrimary : colors.textTertiary}
        />
        <Text
          style={[
            styles.tabLabel,
            {
              color: activeTab === 'settings' ? colors.textPrimary : colors.textTertiary,
              fontWeight: activeTab === 'settings' ? '700' : '500',
            },
          ]}>
          Settings
        </Text>
      </Pressable>
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
