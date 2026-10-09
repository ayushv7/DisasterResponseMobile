/**
 * Disaster Response Orchestration Network — Color Tokens
 *
 * Designed with a mature, high-immersion dark theme modeled after YouTube's dark theme:
 * - Canvas Background: #0F0F0F (Neutral deep dark, zero blue/navy tint)
 * - Elevated Surfaces: #1F1F1F (Cards) and #272727 (Muted/Inputs/Chips)
 * - Text: #F1F1F1 (Primary), #AAAAAA (Secondary), #717171 (Tertiary)
 * - Accents: YouTube Blue (#3EA6FF), Alert Red (#FF4E45), Amber (#FFB300), Green (#2BA640)
 */

export type ThemeMode = 'system' | 'light' | 'dark';

export interface ThemeColors {
  background: string;
  surface: string;
  surfaceMuted: string;
  border: string;
  textPrimary: string;
  textSecondary: string;
  textTertiary: string;
  brandPrimary: string;
  primaryPressed: string;
  onPrimary: string;

  // Semantic Status: Active / Critical
  statusActive: string;
  statusActiveBg: string;

  // Semantic Status: Candidate / Watch
  statusWatch: string;
  statusWatchBg: string;

  // Semantic Status: Resolved / Safe
  statusResolved: string;
  statusResolvedBg: string;

  // Info / Sample Notice
  info: string;
  infoBg: string;

  // Chip active background & text (YouTube style)
  chipActiveBg: string;
  chipActiveText: string;

  // Elevation / Shadow
  shadowColor: string;
}

export const lightColors: ThemeColors = {
  background: '#F9F9F9',
  surface: '#FFFFFF',
  surfaceMuted: '#F0F0F0',
  border: 'transparent',
  textPrimary: '#0F0F0F',
  textSecondary: '#606060',
  textTertiary: '#909090',
  brandPrimary: '#065FD4',
  primaryPressed: '#E5E5E5',
  onPrimary: '#FFFFFF',

  statusActive: '#C62828',
  statusActiveBg: '#FDECEC',

  statusWatch: '#B26A00',
  statusWatchBg: '#FFF4E0',

  statusResolved: '#2E7D32',
  statusResolvedBg: '#E8F5E9',

  info: '#606060',
  infoBg: '#F0F0F0',

  chipActiveBg: '#0F0F0F',
  chipActiveText: '#FFFFFF',

  shadowColor: 'transparent',
};

export const darkColors: ThemeColors = {
  background: '#0F0F0F', // YouTube true dark canvas
  surface: '#1F1F1F', // YouTube card & elevated surface
  surfaceMuted: '#272727', // YouTube pill / search / chip surface
  border: 'transparent',
  textPrimary: '#F1F1F1', // YouTube primary white
  textSecondary: '#AAAAAA', // YouTube secondary neutral grey
  textTertiary: '#717171', // YouTube metadata grey
  brandPrimary: '#3EA6FF', // YouTube signature action blue
  primaryPressed: '#383838',
  onPrimary: '#0F0F0F',

  statusActive: '#FF4E45', // YouTube alert red
  statusActiveBg: '#381414',

  statusWatch: '#FFB300', // YouTube amber
  statusWatchBg: '#332508',

  statusResolved: '#2BA640', // YouTube green
  statusResolvedBg: '#0F2C17',

  info: '#AAAAAA',
  infoBg: '#272727',

  chipActiveBg: '#F1F1F1', // YouTube active pill (white pill with dark text)
  chipActiveText: '#0F0F0F',

  shadowColor: 'transparent',
};
