import { createTheme } from '@mui/material/styles';
import { lightPalette, darkPalette } from './palette';
import { typography } from './typography';
import { lightShadows, darkShadows } from './shadows';
import type { CustomShadows } from './shadows';
import { getComponentOverrides } from './components';

declare module '@mui/material/styles' {
  interface Theme {
    customShadows: CustomShadows;
  }
  interface ThemeOptions {
    customShadows?: CustomShadows;
  }
}

export const lightTheme = createTheme({
  palette: lightPalette,
  typography,
  components: getComponentOverrides('light'),
  customShadows: lightShadows,
});

export const darkTheme = createTheme({
  palette: darkPalette,
  typography,
  components: getComponentOverrides('dark'),
  customShadows: darkShadows,
});
