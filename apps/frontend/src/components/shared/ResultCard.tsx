import { Card, CardContent, Typography, Box } from '@mui/material';
import { motion } from 'framer-motion';
import { AnimatedNumber } from '../ui/ScientificHUD';

interface ResultCardProps {
  label: string;
  value: string | number;
  unit: string;
  highlight?: boolean;
}

const MotionCard = motion(Card);

export function ResultCard({
  label, value, unit, highlight = false
}: ResultCardProps) {
  // Parse numeric values to enable counting animation
  const numValue = typeof value === 'number' ? value : parseFloat(String(value));
  const isNumeric = !isNaN(numValue);

  // Dynamic precision calculation based on original input format
  const getPrecision = () => {
    const valString = String(value);
    if (!valString.includes('.')) return 0;
    const decimalCount = valString.split('.')[1]?.length ?? 0;
    return Math.min(decimalCount, 3); // cap decimal accuracy to 3 digits maximum
  };

  return (
    <MotionCard 
      elevation={0}
      // Re-trigger visual pulse when value changes
      key={label + '_' + value}
      initial={{ scale: 0.97, filter: 'brightness(1.1)' }}
      animate={{ scale: 1, filter: 'brightness(1)' }}
      transition={{ type: 'spring', stiffness: 400, damping: 18 }}
      sx={{
        borderRadius: 3,
        border: (theme) => highlight 
          ? `2px solid ${theme.palette.primary.main}` 
          : `1px solid ${theme.palette.divider}`,
        backgroundColor: (theme) => theme.palette.mode === 'dark'
          ? 'rgba(255, 255, 255, 0.02)'
          : 'rgba(0, 0, 0, 0.01)',
        transition: 'border-color 0.2s ease, box-shadow 0.2s ease',
        '&:hover': {
          transform: 'translateY(-2px)',
          borderColor: 'primary.main',
          boxShadow: (theme) => theme.palette.mode === 'dark'
            ? '0 8px 20px rgba(99, 102, 241, 0.2)'
            : '0 8px 20px rgba(99, 102, 241, 0.06)',
        }
      }}
    >
      <CardContent sx={{ p: '12px 16px !important' }}>
        <Typography 
          variant="caption" 
          sx={{ 
            color: 'text.secondary', 
            fontWeight: 600,
            display: 'block',
            mb: 0.5,
            letterSpacing: '0.02em',
            textTransform: 'uppercase',
            fontSize: 10
          }}
        >
          {label}
        </Typography>
        <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 0.5 }}>
          <Typography 
            variant="h5" 
            sx={{ 
              fontWeight: 700, 
              color: highlight ? 'primary.main' : 'text.primary',
              fontFamily: "'Roboto Mono', monospace"
            }}
          >
            {isNumeric ? (
              <AnimatedNumber value={numValue} precision={getPrecision()} />
            ) : (
              value
            )}
          </Typography>
          <Typography 
            variant="caption" 
            sx={{ 
              color: 'text.secondary',
              fontWeight: 600
            }}
          >
            {unit}
          </Typography>
        </Box>
      </CardContent>
    </MotionCard>
  );
}