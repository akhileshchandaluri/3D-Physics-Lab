import { Box, useTheme } from '@mui/material';
import { motion } from 'framer-motion';
import { usePrefersReducedMotion } from '../../hooks/usePrefersReducedMotion';

export function AmbientEnvironment() {
  const theme = useTheme();
  const isDarkMode = theme.palette.mode === 'dark';
  const prefersReducedMotion = usePrefersReducedMotion();

  // Color tokens depending on the active theme mode
  const orbColors = isDarkMode
    ? {
        orb1: 'rgba(99, 102, 241, 0.12)', // indigo
        orb2: 'rgba(139, 92, 246, 0.1)',   // purple
        orb3: 'rgba(6, 182, 212, 0.08)',   // cyan
      }
    : {
        orb1: 'rgba(99, 102, 241, 0.04)',
        orb2: 'rgba(56, 189, 248, 0.03)',  // sky
        orb3: 'rgba(6, 182, 212, 0.03)',
      };

  const getAnimationProps = (delay: number, duration: number, xBounds: [number, number], yBounds: [number, number]) => {
    if (prefersReducedMotion) {
      return {};
    }
    return {
      animate: {
        x: [0, xBounds[0], xBounds[1], 0],
        y: [0, yBounds[0], yBounds[1], 0],
        scale: [1, 1.1, 0.95, 1],
      },
      transition: {
        duration,
        repeat: Infinity,
        ease: 'easeInOut' as const,
        delay,
      },
    };
  };

  return (
    <Box
      sx={{
        position: 'fixed',
        inset: 0,
        zIndex: -2,
        overflow: 'hidden',
        pointerEvents: 'none',
        background: 'transparent',
      }}
    >
      {/* Glow Orb 1 */}
      <motion.div
        {...getAnimationProps(0, 25, [-60, 60], [-40, 80])}
        style={{
          position: 'absolute',
          top: '-10%',
          left: '-10%',
          width: '600px',
          height: '600px',
          borderRadius: '50%',
          background: `radial-gradient(circle, ${orbColors.orb1} 0%, transparent 70%)`,
          filter: 'blur(100px)',
        }}
      />

      {/* Glow Orb 2 */}
      <motion.div
        {...getAnimationProps(3, 30, [80, -60], [60, -80])}
        style={{
          position: 'absolute',
          bottom: '-15%',
          right: '-10%',
          width: '500px',
          height: '500px',
          borderRadius: '50%',
          background: `radial-gradient(circle, ${orbColors.orb2} 0%, transparent 70%)`,
          filter: 'blur(100px)',
        }}
      />

      {/* Glow Orb 3 */}
      <motion.div
        {...getAnimationProps(6, 28, [-100, 100], [80, -80])}
        style={{
          position: 'absolute',
          top: '40%',
          left: '50%',
          width: '400px',
          height: '400px',
          borderRadius: '50%',
          background: `radial-gradient(circle, ${orbColors.orb3} 0%, transparent 70%)`,
          filter: 'blur(100px)',
        }}
      />
    </Box>
  );
}
