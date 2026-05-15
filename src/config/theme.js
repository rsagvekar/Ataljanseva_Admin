import { Dimensions, Platform } from 'react-native';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

// ── Breakpoints ────────────────────────────────────────────────────────────────
export const BREAKPOINTS = {
  phone:      0,
  tablet:     600,
  largeTablet: 900,   // Samsung Z Fold expanded, iPad Pro, large tablets
};

export const isPhone      = (w = SCREEN_WIDTH) => w < BREAKPOINTS.tablet;
export const isTablet     = (w = SCREEN_WIDTH) => w >= BREAKPOINTS.tablet && w < BREAKPOINTS.largeTablet;
export const isLargeTablet= (w = SCREEN_WIDTH) => w >= BREAKPOINTS.largeTablet;

// ── Colors ─────────────────────────────────────────────────────────────────────
export const COLORS = {
  primary:       '#FF6B00',
  primaryLight:  '#FFF4EC',
  primaryDark:   '#D45A00',

  secondary:      '#1a1a2e',
  secondaryLight: '#2d2d4e',

  success:      '#059669',
  successLight: '#d1fae5',
  successDark:  '#065f46',

  warning:      '#D97706',
  warningLight: '#fef3c7',
  warningDark:  '#92400e',

  danger:      '#DC2626',
  dangerLight: '#fee2e2',
  dangerDark:  '#991b1b',

  info:      '#2563EB',
  infoLight: '#dbeafe',
  infoDark:  '#1e40af',

  purple:      '#7C3AED',
  purpleLight: '#ede9fe',

  gray50:  '#f9fafb',
  gray100: '#f3f4f6',
  gray200: '#e5e7eb',
  gray300: '#d1d5db',
  gray400: '#9ca3af',
  gray500: '#6b7280',
  gray600: '#4b5563',
  gray700: '#374151',
  gray800: '#1f2937',
  gray900: '#111827',

  white:      '#ffffff',
  black:      '#000000',
  background: '#f5f5f0',
  surface:    '#ffffff',
  border:     '#e5e7eb',
  borderLight:'#f0e8e0',

  // Status colours
  statusPending:        '#D97706',
  statusPendingBg:      '#fef3c7',
  statusInProgress:     '#2563EB',
  statusInProgressBg:   '#dbeafe',
  statusResolved:       '#059669',
  statusResolvedBg:     '#d1fae5',
  statusActive:         '#059669',
  statusActiveBg:       '#d1fae5',
  statusInactive:       '#6b7280',
  statusInactiveBg:     '#f3f4f6',
};

// ── Typography ─────────────────────────────────────────────────────────────────
export const TYPOGRAPHY = {
  h1:       { fontSize: 28, fontWeight: '700', letterSpacing: -0.5 },
  h2:       { fontSize: 22, fontWeight: '700', letterSpacing: -0.3 },
  h3:       { fontSize: 18, fontWeight: '600' },
  h4:       { fontSize: 16, fontWeight: '600' },
  h5:       { fontSize: 14, fontWeight: '600' },
  body:     { fontSize: 15, fontWeight: '400', lineHeight: 22 },
  bodySm:   { fontSize: 13, fontWeight: '400', lineHeight: 19 },
  label:    { fontSize: 14, fontWeight: '600' },
  labelSm:  { fontSize: 12, fontWeight: '600' },
  caption:  { fontSize: 12, fontWeight: '400', lineHeight: 16 },
  tiny:     { fontSize: 10, fontWeight: '400' },
};

// ── Spacing ────────────────────────────────────────────────────────────────────
export const SPACING = {
  xs:  4,
  sm:  8,
  md:  12,
  lg:  16,
  xl:  24,
  xxl: 32,
};

// ── Border radius ──────────────────────────────────────────────────────────────
export const RADIUS = {
  sm:   4,
  md:   8,
  lg:   12,
  xl:   16,
  xxl:  24,
  full: 999,
};

// ── Shadows ────────────────────────────────────────────────────────────────────
export const SHADOWS = {
  sm: Platform.select({
    ios: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.05,
      shadowRadius: 2,
    },
    android: { elevation: 2 },
  }),
  md: Platform.select({
    ios: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.08,
      shadowRadius: 6,
    },
    android: { elevation: 4 },
  }),
  lg: Platform.select({
    ios: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.12,
      shadowRadius: 12,
    },
    android: { elevation: 8 },
  }),
};

// ── Responsive helpers ─────────────────────────────────────────────────────────
export const responsivePadding = (w = SCREEN_WIDTH) => {
  if (w >= BREAKPOINTS.largeTablet) return 24;
  if (w >= BREAKPOINTS.tablet)      return 20;
  return 16;
};

export const statColumns = (w = SCREEN_WIDTH) => {
  if (w >= BREAKPOINTS.largeTablet) return 4;
  if (w >= BREAKPOINTS.tablet)      return 3;
  return 2;
};

export const HEADER_HEIGHT = Platform.OS === 'android' ? 56 : 44;
