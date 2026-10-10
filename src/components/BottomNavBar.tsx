import React from 'react';
import { Feather } from '@expo/vector-icons';
import { Href } from 'expo-router';

import { RoleTabBar } from '@/components/RoleTabBar';

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

/** Public tabs; rendered by the shared RoleTabBar. */
export function BottomNavBar({ activeTab }: BottomNavBarProps) {
  return (
    <RoleTabBar
      tabs={VISIBLE_TABS.map((t) => ({ ...t, route: t.route as Href }))}
      activeTab={activeTab}
      teal={false}
    />
  );
}
