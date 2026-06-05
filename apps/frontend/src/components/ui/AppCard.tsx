import type { ReactNode } from 'react';
import { Card } from '@mui/material';
import type { CardProps } from '@mui/material';

interface AppCardProps extends CardProps {
  children: ReactNode;
  hoverEffect?: boolean;
}

export function AppCard({ children, hoverEffect = true, sx, ...props }: AppCardProps) {
  return (
    <Card 
      sx={{
        transition: 'all 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
        '&:hover': hoverEffect ? {
          transform: 'translateY(-4px)',
          boxShadow: (theme) => theme.palette.mode === 'dark' 
            ? '0 12px 24px -10px rgba(99, 102, 241, 0.4)' 
            : '0 12px 24px -10px rgba(0, 0, 0, 0.12)',
        } : undefined,
        ...sx
      }}
      {...props}
    >
      {children}
    </Card>
  );
}
