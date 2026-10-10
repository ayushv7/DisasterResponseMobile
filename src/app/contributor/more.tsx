import React from 'react';

import { AccountMoreScreen } from '@/components/AccountMoreScreen';
import { ContributorTabBar } from '@/components/ContributorTabBar';

export default function ContributorAccountScreen() {
  return <AccountMoreScreen tabBar={<ContributorTabBar activeTab="more" />} />;
}
