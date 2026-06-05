import type { ReactNode } from 'react';
import { ThemeProvider as MuiProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { useTheme } from './ThemeContext';
import { lightTheme, darkTheme } from '../theme';

interface MuiThemeProviderProps {
  children: ReactNode;
}

export function MuiThemeProvider({ children }: MuiThemeProviderProps) {
  const { theme } = useTheme();
  const activeTheme = theme === 'dark' ? darkTheme : lightTheme;

  return (
    <MuiProvider theme={activeTheme}>
      <CssBaseline />
      {children}
    </MuiProvider>
  );
}
