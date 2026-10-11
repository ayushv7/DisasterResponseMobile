/**
 * SAMPLE AREAS AND AREA ALERTS — Simulated, not live flood information.
 * Area centres are approximate district centres used only to resolve a coarse
 * position to an area in mock mode.
 */
import { AlertArea, MyAlert } from '@/types/my-alert';

export const SAMPLE_ALERT_AREAS: (AlertArea & { lat: number; lng: number })[] = [
  { id: 'area-majuli', name: 'Majuli', district: 'Majuli', state: 'Assam', lat: 26.95, lng: 94.17 },
  { id: 'area-jorhat', name: 'Jorhat', district: 'Jorhat', state: 'Assam', lat: 26.75, lng: 94.2 },
  { id: 'area-east-delhi', name: 'East Delhi', district: 'East Delhi', state: 'Delhi NCT', lat: 28.62, lng: 77.29 },
  { id: 'area-rudraprayag', name: 'Rudraprayag', district: 'Rudraprayag', state: 'Uttarakhand', lat: 30.28, lng: 78.98 },
  { id: 'area-trichy', name: 'Tiruchirappalli', district: 'Tiruchirappalli', state: 'Tamil Nadu', lat: 10.8, lng: 78.69 },
];

/**
 * Alert templates per area. In mock mode an alert is only published when an
 * NGO serving that state is allotted (see publishedAlertsForArea in cascades).
 * Times are offsets in hours from now.
 */
export const SAMPLE_AREA_ALERTS: (Omit<MyAlert, 'issuedAt' | 'updatedAt' | 'expiresAt' | 'issuedBy' | 'areaName'> & {
  issuedHoursAgo: number;
  updatedHoursAgo: number;
  expiresInHours?: number;
  authority: string;
})[] = [
  {
    id: 'alert-majuli-1',
    areaId: 'area-majuli',
    level: 'EVACUATE',
    headline: 'Brahmaputra above danger mark. Leave low-lying areas now.',
    issuedHoursAgo: 3,
    updatedHoursAgo: 1,
    expiresInHours: 21,
    whatToDo: [
      'Move to the shelter or higher ground now with family, elders and pets.',
      'Take medicines, ID papers, a phone charger and drinking water.',
      'Switch off electricity and gas at the main before leaving.',
      'Follow the marked route; ask volunteers in orange vests for help.',
    ],
    doNot: [
      'Do not walk or drive through flowing water.',
      'Do not return home until the alert is lifted.',
      'Do not touch fallen power lines.',
    ],
    shelter: {
      name: 'Kamalabari Higher Secondary School (relief camp)',
      address: 'Kamalabari, Majuli, Assam',
      routeNote: 'Use the raised road via Garamur; the ghat road is closed.',
    },
    helplines: [
      { label: 'Emergency', number: '112' },
      { label: 'District control room (sample)', number: '1070' },
    ],
    authority: 'District Disaster Management Authority, Majuli (sample)',
    eventId: 'fl-2026-081',
  },
  {
    id: 'alert-jorhat-1',
    areaId: 'area-jorhat',
    level: 'ADVISORY',
    headline: 'River levels rising upstream. Stay alert and keep a go-bag ready.',
    issuedHoursAgo: 5,
    updatedHoursAgo: 2,
    expiresInHours: 24,
    whatToDo: [
      'Keep a go-bag ready: medicines, ID papers, water, torch.',
      'Charge your phone and note the helpline numbers.',
      'Check this screen again for updates.',
    ],
    doNot: ['Do not go near the riverbank to watch the water.'],
    helplines: [{ label: 'Emergency', number: '112' }],
    authority: 'District Disaster Management Authority, Jorhat (sample)',
  },
  {
    id: 'alert-east-delhi-1',
    areaId: 'area-east-delhi',
    level: 'WARNING',
    headline: 'Yamuna rising near the Old Railway Bridge. Be ready to move.',
    issuedHoursAgo: 4,
    updatedHoursAgo: 1,
    expiresInHours: 12,
    whatToDo: [
      'Move valuables and documents to an upper floor.',
      'Be ready to leave if the level is upgraded to Evacuate.',
    ],
    doNot: ['Do not camp or park vehicles on the floodplain.'],
    helplines: [{ label: 'Emergency', number: '112' }],
    authority: 'Delhi Disaster Management Authority (sample)',
    eventId: 'fl-2026-082',
  },
];
