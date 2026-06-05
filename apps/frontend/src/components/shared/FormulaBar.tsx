import { Paper, Box, Typography } from '@mui/material';
import 'katex/dist/katex.min.css';
import { InlineMath } from 'react-katex';

interface FormulaItem {
  label: string;
  expression: string;
}

interface FormulaBarProps {
  formulas: FormulaItem[];
}

export function FormulaBar({ formulas }: FormulaBarProps) {
  return (
    <Paper
      elevation={0}
      sx={{
        display: 'flex',
        gap: 3,
        flexWrap: 'wrap',
        p: '10px 18px',
        backgroundColor: (theme) => theme.palette.mode === 'dark'
          ? 'rgba(255, 255, 255, 0.02)'
          : 'rgba(0, 0, 0, 0.01)',
        borderRadius: 3,
        mt: 2,
        border: (theme) => `1px solid ${theme.palette.divider}`,
        alignItems: 'center'
      }}
    >
      {formulas.map((f) => (
        <Box key={f.label} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Typography 
            variant="caption" 
            sx={{ 
              color: 'text.secondary', 
              fontWeight: 600,
              fontSize: '0.8rem'
            }}
          >
            {f.label}:
          </Typography>
          <Box 
            sx={{ 
              fontFamily: "'JetBrains Mono', monospace",
              color: 'text.primary',
              fontSize: '0.9rem',
              display: 'inline-flex',
              alignItems: 'center'
            }}
          >
            <InlineMath math={f.expression} />
          </Box>
        </Box>
      ))}
    </Paper>
  );
}