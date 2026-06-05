import { useEffect, useState, useRef } from 'react';
import { Box, Typography, Paper, useTheme } from '@mui/material';
import { Science, Thermostat, Timer } from '@mui/icons-material';

interface AnimatedNumberProps {
  value: number;
  precision?: number;
}

export function AnimatedNumber({ value, precision = 2 }: AnimatedNumberProps) {
  const [displayVal, setDisplayVal] = useState(value);
  const startValRef = useRef(value);
  const endValRef = useRef(value);
  const startTimeRef = useRef<number | null>(null);

  useEffect(() => {
    startValRef.current = displayVal;
    endValRef.current = value;
    startTimeRef.current = null;

    let animId: number;

    const step = (timestamp: number) => {
      if (!startTimeRef.current) startTimeRef.current = timestamp;
      const elapsed = timestamp - startTimeRef.current;
      const duration = 400; // 400ms scroll duration

      const progress = Math.min(elapsed / duration, 1);
      // Easing out cubic: 1 - Math.pow(1 - progress, 3)
      const easeProgress = 1 - Math.pow(1 - progress, 3);

      const currentVal = startValRef.current + (endValRef.current - startValRef.current) * easeProgress;
      setDisplayVal(currentVal);

      if (progress < 1) {
        animId = requestAnimationFrame(step);
      }
    };

    animId = requestAnimationFrame(step);
    return () => cancelAnimationFrame(animId);
  }, [value]);

  return <span>{displayVal.toFixed(precision)}</span>;
}

export function ScientificHUD() {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';
  const [fps, setFps] = useState(60);

  // Compute live FPS
  useEffect(() => {
    let lastTime = performance.now();
    let frames = 0;
    let animId: number;

    const countFps = () => {
      frames++;
      const now = performance.now();
      if (now >= lastTime + 1000) {
        setFps(Math.round((frames * 1000) / (now - lastTime)));
        frames = 0;
        lastTime = now;
      }
      animId = requestAnimationFrame(countFps);
    };

    animId = requestAnimationFrame(countFps);
    return () => cancelAnimationFrame(animId);
  }, []);

  return (
    <Paper
      elevation={0}
      sx={{
        p: 1.5,
        px: 2.5,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: 3,
        border: `1px solid ${theme.palette.divider}`,
        borderRadius: 3,
        backgroundColor: isDark ? 'rgba(10, 10, 26, 0.4)' : 'rgba(255, 255, 255, 0.65)',
        backdropFilter: 'blur(10px)',
        mb: 3,
      }}
    >
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
        <Science sx={{ color: 'primary.main', fontSize: 20 }} />
        <Box>
          <Typography
            variant="caption"
            sx={{
              fontFamily: "'Space Grotesk', sans-serif",
              fontWeight: 700,
              letterSpacing: '0.05em',
              textTransform: 'uppercase',
              color: 'text.secondary',
            }}
          >
            Virtual Physics Lab Telemetry
          </Typography>
        </Box>
      </Box>

      <Box sx={{ display: 'flex', gap: 3, flexWrap: 'wrap' }}>
        {/* Status indicator */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <div
            style={{
              width: 6,
              height: 6,
              borderRadius: '50%',
              backgroundColor: '#10b981',
              boxShadow: '0 0 8px #10b981',
            }}
          />
          <Typography variant="caption" sx={{ fontFamily: 'Roboto Mono', color: 'text.secondary', fontWeight: 500 }}>
            ENGINE: ACTIVE
          </Typography>
        </Box>

        {/* FPS Indicator */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Timer sx={{ fontSize: 14, color: 'text.secondary' }} />
          <Typography variant="caption" sx={{ fontFamily: 'Roboto Mono', color: 'text.secondary', fontWeight: 500 }}>
            RATE: {fps} FPS
          </Typography>
        </Box>

        {/* Precision indicator */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Thermostat sx={{ fontSize: 14, color: 'text.secondary' }} />
          <Typography variant="caption" sx={{ fontFamily: 'Roboto Mono', color: 'text.secondary', fontWeight: 500 }}>
            PRECISION: F64
          </Typography>
        </Box>
      </Box>
    </Paper>
  );
}
