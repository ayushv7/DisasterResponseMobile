import React from 'react';

import { AccountMoreScreen } from '@/components/AccountMoreScreen';
import { OpsBottomNavBar } from '@/components/OpsBottomNavBar';

/** Ops "More" tab / field worker "Profile" tab. */
export default function OpsMoreScreen() {
  return <AccountMoreScreen tabBar={<OpsBottomNavBar activeTab="more" />} />;
}
