import React from 'react';

import { RoleTab, RoleTabBar } from '@/components/RoleTabBar';

export const AUTHORITY_TABS: RoleTab[] = [
  { key: 'ngos', label: 'NGOs', icon: 'check-circle', route: '/authority/ngos' },
  { key: 'create', label: 'Add NGO', icon: 'plus-circle', route: '/authority/create-ngo' },
  { key: 'takedown', label: 'Takedown', icon: 'eye-off', route: '/authority/takedown' },
  { key: 'more', label: 'More', icon: 'menu', route: '/authority/more' },
];

export function AuthorityTabBar({ activeTab }: { activeTab: string }) {
  return <RoleTabBar tabs={AUTHORITY_TABS} activeTab={activeTab} />;
}
