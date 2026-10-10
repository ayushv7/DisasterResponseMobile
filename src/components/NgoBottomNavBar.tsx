/**
 * NgoBottomNavBar — NGO workspace tabs: Ops · Inbox · Publish · Evidence ·
 * Organization. Rendered by the shared RoleTabBar.
 */

import React from 'react';
import { Feather } from '@expo/vector-icons';
import { Href } from 'expo-router';

import { RoleTabBar } from '@/components/RoleTabBar';

export type NgoTabKey = 'ops' | 'feed' | 'inbox' | 'contributions' | 'organization';

interface NgoTabDef {
  key: NgoTabKey;
  label: string;
  icon: keyof typeof Feather.glyphMap;
  route: string;
  accessibilityLabel: string;
}

const NGO_TABS: NgoTabDef[] = [
  {
    key: 'ops',
    label: 'Ops',
    icon: 'activity',
    route: '/ops/home',
    accessibilityLabel: 'Incidents near your NGO, plans, tasks and verification',
  },
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

/** NGO workspace tabs; rendered by the shared RoleTabBar. */
export function NgoBottomNavBar({ activeTab }: NgoBottomNavBarProps) {
  return <RoleTabBar tabs={NGO_TABS.map((t) => ({ ...t, route: t.route as Href }))} activeTab={activeTab} />;
}
