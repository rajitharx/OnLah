// Mirrors apps/mobile/src/shared/theme/colors.ts. Components read these through
// the CSS custom properties in src/styles.css, so keep the two in sync.
export const colors = {
  background: '#0D0D0D',
  surface: '#1A1A1A',
  accent: '#F5ECD7',
  muted: '#666666',
  border: '#2A2A2A',
  crowdGreen: '#4CAF50',
  crowdAmber: '#FF9800',
  crowdRed: '#F44336',
  white: '#FFFFFF',
} as const;
