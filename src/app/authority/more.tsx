import React from 'react';

import { AccountMoreScreen } from '@/components/AccountMoreScreen';
import { AuthorityTabBar } from '@/components/AuthorityTabBar';

export default function AuthorityMoreScreen() {
  return <AccountMoreScreen tabBar={<AuthorityTabBar activeTab="more" />} />;
}
