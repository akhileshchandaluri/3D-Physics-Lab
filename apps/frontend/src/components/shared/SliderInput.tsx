import { Box, Slider, Typography } from '@mui/material';

interface SliderInputProps {
  label: string;
  min: number;
  max: number;
  step: number;
  value: number;
  unit: string;
  onChange: (value: number) => void;
}

export function SliderInput({
  label, min, max, step, value, unit, onChange
}: SliderInputProps) {
  return (
    <Box sx={{
      display: 'flex',
      alignItems: 'center',
      gap: 2.5,
      mb: 1.5,
      width: '100%'
    }}>
      <Typography sx={{
        fontSize: '0.85rem',
        color: 'text.secondary',
        minWidth: 100,
        fontWeight: 600,
        letterSpacing: '0.01em',
      }}>
        {label}
      </Typography>
      <Slider
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(_, val) => onChange(val as number)}
        size="small"
        sx={{
          flex: 1,
          height: 6,
          color: 'primary.main',
          '& .MuiSlider-track': {
            border: 'none',
            background: 'linear-gradient(90deg, #6366f1 0%, #a855f7 100%)',
            boxShadow: '0 0 10px rgba(99, 102, 241, 0.45)',
          },
          '& .MuiSlider-rail': {
            opacity: 0.22,
            backgroundColor: 'divider',
          },
          '& .MuiSlider-thumb': {
            height: 16,
            width: 16,
            backgroundColor: 'background.paper',
            border: '3px solid currentColor',
            boxShadow: (theme) => theme.palette.mode === 'dark'
              ? '0 0 5px rgba(0,0,0,0.5)'
              : '0 0 5px rgba(0,0,0,0.1)',
            transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
            '&:hover, &.Mui-focusVisible': {
              boxShadow: '0px 0px 0px 8px rgba(99, 102, 241, 0.16)',
              scale: 1.15,
            },
            '&.Mui-active': {
              boxShadow: '0px 0px 0px 14px rgba(99, 102, 241, 0.22)',
              scale: 1.25,
            },
          },
        }}
      />
      <Typography sx={{
        fontSize: '0.85rem',
        fontWeight: 700,
        minWidth: 80,
        textAlign: 'right',
        color: 'text.primary',
        fontFamily: "'Roboto Mono', monospace"
      }}>
        {value} {unit}
      </Typography>
    </Box>
  );
}