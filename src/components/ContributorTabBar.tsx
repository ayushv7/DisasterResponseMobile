import React from 'react';

import { RoleTab, RoleTabBar } from '@/components/RoleTabBar';

export const CONTRIBUTOR_TABS: RoleTab[] = [
  { key: 'resources', label: 'Resources', icon: 'package', route: '/contributor/resources' },
  { key: 'more', label: 'Account', icon: 'user', route: '/contributor/more' },
];

export function ContributorTabBar({ activeTab }: { activeTab: string }) {
  return <RoleTabBar tabs={CONTRIBUTOR_TABS} activeTab={activeTab} />;
}
