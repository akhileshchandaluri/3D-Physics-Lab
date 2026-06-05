import type { PaletteOptions } from '@mui/material/styles';

export const lightPalette: PaletteOptions = {
  mode: 'light',
  primary: {
    main: '#6366f1', // primary-500
    light: '#818cf8',
    dark: '#4f46e5',
    contrastText: '#ffffff',
  },
  secondary: {
    main: '#10b981', // accent-500
    light: '#34d399',
    dark: '#059669',
    contrastText: '#ffffff',
  },
  error: {
    main: '#dc2626',
    light: '#fca5a5',
    dark: '#991b1b',
  },
  warning: {
    main: '#f97316', // warm-500
    light: '#fb923c',
    dark: '#c2410c',
  },
  success: {
    main: '#10b981',
    light: '#34d399',
    dark: '#059669',
  },
  background: {
    default: '#f8f9fc', // surface-primary
    paper: '#ffffff', // surface-elevated
  },
  text: {
    primary: '#111827',
    secondary: '#4b5563',
    disabled: '#9ca3af',
  },
  divider: 'rgba(0, 0, 0, 0.08)',
};

export const darkPalette: PaletteOptions = {
  mode: 'dark',
  primary: {
    main: '#6366f1',
    light: '#818cf8',
    dark: '#4f46e5',
    contrastText: '#ffffff',
  },
  secondary: {
    main: '#10b981',
    light: '#34d399',
    dark: '#059669',
    contrastText: '#ffffff',
  },
  error: {
    main: '#fca5a5',
    light: '#fef2f2',
    dark: '#ef4444',
  },
  warning: {
    main: '#f97316',
    light: '#fb923c',
    dark: '#c2410c',
  },
  success: {
    main: '#10b981',
    light: '#34d399',
    dark: '#059669',
  },
  background: {
    default: '#0a0a1a', // surface-primary (dark)
    paper: '#141428', // surface-elevated (dark)
  },
  text: {
    primary: '#f1f5f9',
    secondary: '#94a3b8',
    disabled: '#64748b',
  },
  divider: 'rgba(255, 255, 255, 0.08)',
};
