import { Platform } from 'react-native';

export const Colors = {
  light: {
    text: '#2D3436',
    textSecondary: '#636E72',
    background: '#FEFEFE',
    surface: '#F8F9FA',
    tint: '#A29BFE',
    icon: '#B2BEC3',
    tabIconDefault: '#B2BEC3',
    tabIconSelected: '#A29BFE',
    primary: '#A29BFE',
    primaryLight: '#D5D0FE',
    secondary: '#81ECEC',
    secondaryLight: '#C4FAF8',
    accent: '#FDA7DF',
    accentLight: '#FDCEF1',
    success: '#55EFC4',
    warning: '#FFEAA7',
    error: '#FAB1A0',
    border: '#E9ECEF',
    messageOwn: '#D5D0FE',
    messageOther: '#F1F2F6',
    inputBackground: '#F8F9FA',
    cardBackground: '#FFFFFF',
    shadow: 'rgba(0, 0, 0, 0.05)',
  },
  dark: {
    text: '#ECEDEE',
    textSecondary: '#A4A4A8',
    background: '#151718',
    surface: '#1E2022',
    tint: '#A29BFE',
    icon: '#9BA1A6',
    tabIconDefault: '#9BA1A6',
    tabIconSelected: '#A29BFE',
    primary: '#A29BFE',
    primaryLight: '#4A4580',
    secondary: '#81ECEC',
    secondaryLight: '#2D6B6B',
    accent: '#FDA7DF',
    accentLight: '#6B3D5E',
    success: '#55EFC4',
    warning: '#FFEAA7',
    error: '#FAB1A0',
    border: '#2D3436',
    messageOwn: '#4A4580',
    messageOther: '#2D3436',
    inputBackground: '#1E2022',
    cardBackground: '#1E2022',
    shadow: 'rgba(0, 0, 0, 0.3)',
  },
};

export const Spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
};

export const BorderRadius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  full: 9999,
};

export const Fonts = Platform.select({
  ios: {
    sans: 'system-ui',
    serif: 'ui-serif',
    rounded: 'ui-rounded',
    mono: 'ui-monospace',
  },
  default: {
    sans: 'normal',
    serif: 'serif',
    rounded: 'normal',
    mono: 'monospace',
  },
  web: {
    sans: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
    serif: "Georgia, 'Times New Roman', serif",
    rounded: "'SF Pro Rounded', 'Hiragino Maru Gothic ProN', Meiryo, 'MS PGothic', sans-serif",
    mono: "SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace",
  },
});
