import type { ReactNode } from 'react';
import { Paper, Typography, Box } from '@mui/material';
import type { PaperProps } from '@mui/material';

interface ScientificPanelProps extends PaperProps {
  title?: string;
  children: ReactNode;
  headerAction?: ReactNode;
}

export function ScientificPanel({ title, children, headerAction, sx, ...props }: ScientificPanelProps) {
  return (
    <Paper 
      elevation={0}
      sx={{
        p: 2.5,
        borderRadius: 4,
        border: (theme) => theme.palette.mode === 'dark' 
          ? '1px solid rgba(255, 255, 255, 0.08)' 
          : '1px solid rgba(0, 0, 0, 0.06)',
        backgroundColor: (theme) => theme.palette.mode === 'dark' 
          ? 'rgba(20, 20, 40, 0.4)' 
          : 'rgba(255, 255, 255, 0.9)',
        boxShadow: (theme) => theme.palette.mode === 'dark'
          ? '0 4px 20px rgba(0, 0, 0, 0.2)'
          : '0 4px 20px rgba(0, 0, 0, 0.02)',
        ...sx
      }}
      {...props}
    >
      {(title || headerAction) && (
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          {title && (
            <Typography 
              variant="h6" 
              sx={{
                fontFamily: "'Space Grotesk', sans-serif",
                letterSpacing: '-0.02em',
                background: 'linear-gradient(135deg, #6366f1 0%, #a855f7 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                fontWeight: 700
              }}
            >
              {title}
            </Typography>
          )}
          {headerAction}
        </Box>
      )}
      <Box sx={{ width: '100%' }}>
        {children}
      </Box>
    </Paper>
  );
}
