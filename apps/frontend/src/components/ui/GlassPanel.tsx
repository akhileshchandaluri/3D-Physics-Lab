import type { ReactNode } from 'react';
import { Box } from '@mui/material';
import type { BoxProps } from '@mui/material';
import { styled } from '@mui/material/styles';

const StyledGlass = styled(Box)(({ theme }) => ({
  backdropFilter: 'blur(16px)',
  borderRadius: 16,
  border: theme.palette.mode === 'dark' 
    ? '1px solid rgba(255, 255, 255, 0.08)' 
    : '1px solid rgba(0, 0, 0, 0.06)',
  backgroundColor: theme.palette.mode === 'dark' 
    ? 'rgba(10, 10, 26, 0.6)' 
    : 'rgba(255, 255, 255, 0.65)',
  boxShadow: theme.palette.mode === 'dark'
    ? '0 8px 32px 0 rgba(0, 0, 0, 0.2)'
    : '0 8px 32px 0 rgba(31, 38, 135, 0.04)',
}));

interface GlassPanelProps extends BoxProps {
  children: ReactNode;
}

export function GlassPanel({ children, ...props }: GlassPanelProps) {
  return <StyledGlass {...props}>{children}</StyledGlass>;
}
