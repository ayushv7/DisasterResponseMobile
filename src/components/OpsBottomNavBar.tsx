/**
 * OpsBottomNavBar — tabs for the ops screens.
 * NGO: Ops · Incidents · Tasks · Verify · NGO (back to the workspace).
 * Field worker: Tasks · Profile. Rendered by the shared RoleTabBar.
 */

import React from 'react';
import { Feather } from '@expo/vector-icons';
import { Href } from 'expo-router';

import { RoleTabBar } from '@/components/RoleTabBar';
import { useSession } from '@/session/session-context';

export type OpsTabKey = 'operations' | 'incidents' | 'tasks' | 'replanning' | 'more' | 'ngo';

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

/** Field workers only see their tasks and profile. */
const FIELD_WORKER_TABS: OpsTabKey[] = ['tasks', 'more'];

/** NGO users: scoped ops screens plus a way back to the NGO workspace. */
const NGO_OPS_TABS: OpsTabDef[] = [
  ...OPS_TABS.filter((tab) => tab.key !== 'more').map((tab) =>
    tab.key === 'replanning' ? { ...tab, label: 'Verify' } : tab
  ),
  {
    key: 'ngo',
    label: 'NGO',
    icon: 'shield',
    route: '/ngo/inbox',
    accessibilityLabel: 'Back to the NGO workspace',
  },
];

interface OpsBottomNavBarProps {
  activeTab: OpsTabKey;
}

/** Ops tabs by role (field worker, NGO, coordinator); rendered by the shared RoleTabBar. */
export function OpsBottomNavBar({ activeTab }: OpsBottomNavBarProps) {
  const { role } = useSession();
  const tabs =
    role === 'field_worker'
      ? OPS_TABS.filter((tab) => FIELD_WORKER_TABS.includes(tab.key)).map((tab) =>
          tab.key === 'more' ? { ...tab, label: 'Profile' } : tab
        )
      : role === 'ngo'
        ? NGO_OPS_TABS
        : OPS_TABS;
  return <RoleTabBar tabs={tabs.map((t) => ({ ...t, route: t.route as Href }))} activeTab={activeTab} />;
}
