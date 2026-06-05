import type { ReactNode } from 'react';
import { Container, Grid, Typography, Box, Paper, Divider } from '@mui/material';
import { motion } from 'framer-motion';
import { usePrefersReducedMotion } from '../../hooks/usePrefersReducedMotion';

interface ExperimentLayoutProps {
  title: string;
  sessionNumber: string;
  controls: ReactNode;
  visualization: ReactNode;
  results: ReactNode;
  formula: ReactNode;
}

export function ExperimentLayout({
  title, sessionNumber,
  controls, visualization, results, formula
}: ExperimentLayoutProps) {
  const prefersReducedMotion = usePrefersReducedMotion();

  // Animation values with type-safe spring specifier
  const transition = { 
    type: 'spring' as const, 
    stiffness: 100, 
    damping: 18, 
    mass: 1.1 
  };

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      {/* Header telemetry section */}
      <motion.div
        initial={prefersReducedMotion ? {} : { opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <Box sx={{ mb: 3 }}>
          <Typography 
            variant="caption" 
            sx={{ 
              color: 'text.secondary', 
              fontWeight: 600, 
              letterSpacing: '0.05em',
              textTransform: 'uppercase'
            }}
          >
            {sessionNumber}
          </Typography>
          <Box>
            <Typography 
              variant="h4" 
              component="h1"
              sx={{ 
                fontWeight: 700, 
                mt: 0.5,
                background: 'linear-gradient(135deg, #6366f1 0%, #a855f7 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                display: 'inline-block'
              }}
            >
              {title}
            </Typography>
          </Box>
        </Box>
      </motion.div>

      {/* Lab Workstations */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        {/* Left Side: Controls panel */}
        <Grid size={{ xs: 12, md: 5 }}>
          <motion.div
            initial={prefersReducedMotion ? {} : { opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={transition}
            style={{ height: '100%' }}
          >
            <Paper 
              elevation={0}
              sx={{
                p: 3,
                height: '100%',
                borderRadius: 4,
                border: (theme) => `1px solid ${theme.palette.divider}`,
                backgroundColor: (theme) => theme.palette.mode === 'dark' 
                  ? 'rgba(20, 20, 40, 0.4)' 
                  : 'rgba(255, 255, 255, 0.95)',
                backdropFilter: 'blur(10px)'
              }}
            >
              {controls}
            </Paper>
          </motion.div>
        </Grid>

        {/* Right Side: Simulation Stage canvas */}
        <Grid size={{ xs: 12, md: 7 }}>
          <motion.div
            initial={prefersReducedMotion ? {} : { opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={transition}
            style={{ height: '100%' }}
          >
            <Paper 
              elevation={0}
              sx={{
                p: 3,
                height: '100%',
                minHeight: 350,
                borderRadius: 4,
                border: (theme) => `1px solid ${theme.palette.divider}`,
                backgroundColor: (theme) => theme.palette.mode === 'dark' 
                  ? 'rgba(20, 20, 40, 0.4)' 
                  : 'rgba(255, 255, 255, 0.95)',
                backdropFilter: 'blur(10px)',
                display: 'flex',
                flexDirection: 'column'
              }}
            >
              {visualization}
            </Paper>
          </motion.div>
        </Grid>
      </Grid>

      {/* Metric telemetry results panel */}
      <motion.div
        initial={prefersReducedMotion ? {} : { opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ ...transition, delay: 0.1 }}
      >
        <Box sx={{ mb: 3 }}>
          <Box 
            sx={{ 
              display: 'grid', 
              width: '100%',
              gridTemplateColumns: {
                xs: 'repeat(2, 1fr)',
                sm: 'repeat(4, 1fr)'
              },
              gap: 2
            }}
          >
            {results}
          </Box>
        </Box>
      </motion.div>

      {/* Formula view block */}
      {formula && (
        <motion.div
          initial={prefersReducedMotion ? {} : { opacity: 0, filter: 'blur(8px)' }}
          animate={{ opacity: 1, filter: 'blur(0px)' }}
          transition={{ duration: 0.6, delay: 0.2 }}
        >
          <Box sx={{ mt: 3 }}>
            <Divider sx={{ mb: 3 }} />
            {formula}
          </Box>
        </motion.div>
      )}
    </Container>
  );
}