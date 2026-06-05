import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { 
  Box, 
  Container, 
  Typography, 
  Button, 
  Avatar, 
  Grid, 
  CardContent, 
  IconButton,
  Chip
} from '@mui/material';
import { 
  LightMode, 
  DarkMode, 
  Logout, 
  LockOutlined, 
  Launch 
} from '@mui/icons-material';
import { motion } from 'framer-motion';
import { 
  ScientificHUD, 
  TiltCard, 
  ScrollReveal, 
  StaggerContainer, 
  Magnetic 
} from '../components/ui';
import './Dashboard.css';

// Small inline wave previews for available experiments on the dashboard
function MiniExperimentPreview({ id }: { id: number }) {
  if (id === 1) { // Ohm's Law
    return (
      <Box sx={{ height: 44, display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', border: '1px dashed rgba(99, 102, 241, 0.2)', borderRadius: 2.5, p: 0.5, mb: 2 }}>
        <svg width="100%" height="30" style={{ overflow: 'visible' }}>
          <line x1="0" y1="15" x2="100%" y2="15" stroke="rgba(99,102,241,0.15)" strokeWidth="2" strokeDasharray="5 5" />
          <motion.line
            x1="0" y1="15" x2="100%" y2="15"
            stroke="rgba(99,102,241,0.85)"
            strokeWidth="2"
            strokeDasharray="10 15"
            animate={{ strokeDashoffset: [-50, 0] }}
            transition={{ repeat: Infinity, ease: 'linear', duration: 1.5 }}
          />
        </svg>
      </Box>
    );
  }
  if (id === 5) { // Creep
    return (
      <Box sx={{ height: 44, display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', border: '1px dashed rgba(16, 185, 129, 0.2)', borderRadius: 2.5, p: 0.5, mb: 2 }}>
        <svg width="100%" height="30" viewBox="0 0 150 30" preserveAspectRatio="none">
          <motion.path
            d="M0,25 L25,18 Q40,15 80,10 L150,2"
            fill="none"
            stroke="rgba(16, 185, 129, 0.85)"
            strokeWidth="2"
            initial={{ pathLength: 0 }}
            animate={{ pathLength: [0, 1] }}
            transition={{ repeat: Infinity, duration: 2, ease: 'easeInOut', repeatDelay: 0.5 }}
          />
        </svg>
      </Box>
    );
  }
  if (id === 8) { // Solar Cell
    return (
      <Box sx={{ height: 44, display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', border: '1px dashed rgba(249, 115, 22, 0.2)', borderRadius: 2.5, p: 0.5, mb: 2 }}>
        <svg width="100%" height="30" viewBox="0 0 150 30" preserveAspectRatio="none">
          <motion.path
            d="M5,5 L100,5 Q120,5 130,25 L132,30"
            fill="none"
            stroke="rgba(249, 115, 22, 0.85)"
            strokeWidth="2"
            initial={{ pathLength: 0 }}
            animate={{ pathLength: [0, 1] }}
            transition={{ repeat: Infinity, duration: 2, ease: 'easeInOut', repeatDelay: 0.5 }}
          />
        </svg>
      </Box>
    );
  }
  return null;
}

const sessions = [
  { id: 1, code: 'Session 01', title: 'Introductory Session — Ohm\'s Law', path: '/experiments/ohms-law', available: true },
  { id: 2, code: 'Session 02', title: 'Determination of Lattice Constant', path: '', available: false },
  { id: 3, code: 'Session 03', title: 'Determination of Particle Size of Lycopodium Powder Using Laser', path: '', available: false },
  { id: 4, code: 'Session 04', title: 'Determination of Young\'s Modulus — Uniform Bending Method', path: '', available: false },
  { id: 5, code: 'Session 05', title: 'Determination of Creep Constant', path: '/experiments/creep', available: true },
  { id: 6, code: 'Session 06', title: 'Determination of Hall Coefficient Using Hall Effect', path: '', available: false },
  { id: 7, code: 'Session 07', title: 'Determination of Planck\'s Constant', path: '', available: false },
  { id: 8, code: 'Session 08', title: 'Solar Cell Fill Factor — Characteristics', path: '/experiments/solar-cell-characteristics', available: true },
  { id: 9, code: 'Session 09', title: 'Determination of Wavelength of Laser by Grating', path: '', available: false },
  { id: 10, code: 'Session 10', title: 'Determination of Acceptance Angle and Numerical Aperture Using Fiber Optic Cable', path: '', available: false },
  { id: 11, code: 'Session 11', title: 'Determination of Energy Band Gap of a Given Material', path: '', available: false },
];

export function Dashboard() {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <Box sx={{ minHeight: '100vh', backgroundColor: 'background.default', pb: 8 }}>
      {/* Top Header */}
      <Box 
        component="header" 
        sx={{ 
          borderBottom: '1px solid', 
          borderColor: 'divider',
          backgroundColor: (theme) => theme.palette.mode === 'dark' 
            ? 'rgba(10, 10, 26, 0.8)' 
            : 'rgba(255, 255, 255, 0.8)',
          backdropFilter: 'blur(20px)',
          position: 'sticky',
          top: 0,
          zIndex: 100
        }}
      >
        <Container maxWidth="lg">
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', height: 72 }}>
            <Link to="/" className="dash-brand" style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <img src="/klulogo.png" alt="KLU Logo" style={{ height: 40 }} />
              <Typography variant="h6" sx={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700 }}>
                Virtual Labs
              </Typography>
            </Link>

            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                <Avatar sx={{ bgcolor: 'primary.main', fontWeight: 600 }}>
                  {user?.name?.[0]?.toUpperCase() ?? 'U'}
                </Avatar>
                <Box sx={{ display: { xs: 'none', md: 'block' } }}>
                  <Typography variant="body2" color="text.primary" sx={{ fontWeight: 600 }}>
                    {user?.name ?? 'Student'}
                  </Typography>
                  <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                    {user?.email ?? ''}
                  </Typography>
                </Box>
              </Box>

              <IconButton onClick={toggleTheme} color="inherit">
                {theme === 'light' ? <DarkMode /> : <LightMode />}
              </IconButton>

              <Magnetic strength={0.2}>
                <Button 
                  variant="outlined" 
                  color="error" 
                  startIcon={<Logout />} 
                  onClick={handleLogout}
                  size="small"
                >
                  Log Out
                </Button>
              </Magnetic>
            </Box>
          </Box>
        </Container>
      </Box>

      {/* Main Body */}
      <Container maxWidth="lg" sx={{ mt: 5 }}>
        
        {/* Real-time Scientific HUD telemetry bar */}
        <ScientificHUD />

        {/* Welcome and stats */}
        <Box 
          sx={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: { xs: 'flex-start', md: 'center' },
            flexDirection: { xs: 'column', md: 'row' },
            gap: 3,
            mb: 5 
          }}
        >
          <Box>
            <Typography variant="h4" sx={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700 }}>
              Lab Sessions
            </Typography>
            <Typography variant="body1" color="text.secondary">
              Select an experiment to begin your virtual lab session
            </Typography>
          </Box>

          <Box sx={{ display: 'flex', gap: 2 }}>
            {[
              { val: '11', label: 'Total' },
              { val: '3', label: 'Live' },
              { val: '8', label: 'Soon' }
            ].map((stat, idx) => (
              <TiltCard 
                key={idx} 
                maxRotation={3}
                hoverEffect={true}
                sx={{ 
                  p: '8px 16px', 
                  borderRadius: 3,
                  minWidth: 90,
                  textAlign: 'center',
                  backgroundColor: 'background.paper',
                }}
              >
                <Typography variant="h6" color="primary.main" sx={{ fontWeight: 700, fontFamily: 'Roboto Mono' }}>
                  {stat.val}
                </Typography>
                <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 500 }}>
                  {stat.label}
                </Typography>
              </TiltCard>
            ))}
          </Box>
        </Box>

        {/* Experiment grid */}
        <StaggerContainer>
          <Grid container spacing={3}>
            {sessions.map((s, idx) => (
              <Grid 
                size={{ xs: 12, sm: 6, md: 4 }} 
                key={s.id}
              >
                <ScrollReveal direction="up" delay={idx * 0.04} distance={20}>
                  <TiltCard 
                    maxRotation={6}
                    hoverEffect={s.available}
                    sx={{
                      height: '100%',
                      display: 'flex',
                      flexDirection: 'column',
                      borderRadius: 4,
                      opacity: s.available ? 1 : 0.7,
                      backgroundColor: (theme) => theme.palette.mode === 'dark' 
                        ? 'rgba(20, 20, 40, 0.35)' 
                        : 'rgba(255, 255, 255, 0.85)',
                      backdropFilter: 'blur(10px)'
                    }}
                  >
                    <CardContent sx={{ p: 3, display: 'flex', flexDirection: 'column', height: '100%' }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                        <Chip 
                          label={s.code} 
                          size="small" 
                          color={s.available ? 'primary' : 'default'}
                          variant={s.available ? 'filled' : 'outlined'}
                          sx={{ fontWeight: 600, borderRadius: 2 }}
                        />
                        {s.available ? (
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                            <Box 
                              sx={{ 
                                width: 8, 
                                height: 8, 
                                borderRadius: '50%', 
                                bgcolor: 'success.main',
                                boxShadow: '0 0 8px #10b981',
                              }}
                              component={motion.div}
                              animate={{ scale: [1, 1.3, 1], opacity: [0.6, 1, 0.6] }}
                              transition={{ repeat: Infinity, duration: 1.5, ease: 'easeInOut' }}
                            />
                            <Typography variant="caption" color="success.main" sx={{ fontWeight: 600 }}>
                              Live
                            </Typography>
                          </Box>
                        ) : (
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, color: 'text.disabled' }}>
                            <LockOutlined sx={{ fontSize: 14 }} />
                            <Typography variant="caption" sx={{ fontWeight: 500 }}>
                              Locked
                            </Typography>
                          </Box>
                        )}
                      </Box>

                      <Typography 
                        variant="h6" 
                        color="text.primary" 
                        sx={{ 
                          lineHeight: 1.4, 
                          mb: s.available ? 2 : 'auto',
                          fontFamily: "'Space Grotesk', sans-serif",
                          fontWeight: 700
                        }}
                      >
                        {s.title}
                      </Typography>

                      {/* Small visual preview graph details for available experiments */}
                      <MiniExperimentPreview id={s.id} />

                      <Box sx={{ mt: 'auto' }}>
                        {s.available ? (
                          <Magnetic strength={0.15}>
                            <Button
                              component={Link}
                              to={s.path}
                              fullWidth
                              variant="contained"
                              endIcon={<Launch />}
                              sx={{ 
                                py: 1, 
                                borderRadius: 2.5
                              }}
                            >
                              Launch Simulation
                            </Button>
                          </Magnetic>
                        ) : (
                          <Button
                            fullWidth
                            disabled
                            variant="outlined"
                            sx={{ 
                              py: 1, 
                              borderRadius: 2.5
                            }}
                          >
                            Coming Soon
                          </Button>
                        )}
                      </Box>
                    </CardContent>
                  </TiltCard>
                </ScrollReveal>
              </Grid>
            ))}
          </Grid>
        </StaggerContainer>
      </Container>
    </Box>
  );
}
