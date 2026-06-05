import { useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import {
  Box,
  Container,
  Grid,
  Typography,
  Button,
  IconButton,
  CardContent,
  Avatar,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Chip,
} from '@mui/material';
import {
  LightMode,
  DarkMode,
  ArrowForward,
  PlayArrow,
  Star,
  ExpandMore,
  Bolt,
  Science,
  BarChart,
  Memory,
  ShieldOutlined,
  PeopleOutlined,
  FormatQuote,
} from '@mui/icons-material';
import { motion } from 'framer-motion';
import {
  CinematicBackground,
  ScrollReveal,
  StaggerContainer,
  Magnetic,
  TiltCard,
} from '../components/ui';
import './LandingPage.css';

// Mini canvas waveform simulator for the scientific teaser panel
function WaveformTeaser() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;
    let t = 0;

    const tick = () => {
      t += 0.04;
      const w = (canvas.width = canvas.offsetWidth * window.devicePixelRatio);
      const h = (canvas.height = canvas.offsetHeight * window.devicePixelRatio);
      ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
      ctx.clearRect(0, 0, w, h);

      const width = canvas.offsetWidth;
      const height = canvas.offsetHeight;
      const midY = height / 2;

      // Draw primary wave
      ctx.beginPath();
      ctx.lineWidth = 2;
      ctx.strokeStyle = 'rgba(99, 102, 241, 0.85)';
      for (let x = 0; x < width; x++) {
        const y1 = Math.sin(x * 0.012 + t) * 25;
        const y2 = Math.sin(x * 0.024 - t * 0.6) * 12;
        const envelope = Math.sin((x / width) * Math.PI);
        const y = midY + (y1 + y2) * envelope;
        if (x === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.stroke();

      // Draw secondary wave
      ctx.beginPath();
      ctx.lineWidth = 1;
      ctx.strokeStyle = 'rgba(6, 182, 212, 0.4)';
      for (let x = 0; x < width; x++) {
        const y1 = Math.sin(x * 0.016 - t * 0.8) * 18;
        const y2 = Math.sin(x * 0.032 + t * 1.1) * 8;
        const envelope = Math.sin((x / width) * Math.PI);
        const y = midY + (y1 + y2) * envelope;
        if (x === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.stroke();

      animId = requestAnimationFrame(tick);
    };

    tick();
    return () => cancelAnimationFrame(animId);
  }, []);

  return <canvas ref={canvasRef} style={{ width: '100%', height: '100%', display: 'block' }} />;
}

const experiments = [
  {
    title: "Ohm's Law",
    description: "Explore voltage, current, and resistance relationships with interactive circuit simulations.",
    icon: <Bolt sx={{ fontSize: 32 }} />,
    color: '#6366f1',
    status: 'Available',
  },
  {
    title: "Simple Pendulum",
    description: "Study oscillatory motion by varying length, mass, and gravitational acceleration.",
    icon: <Science sx={{ fontSize: 32 }} />,
    color: '#8b5cf6',
    status: 'Coming Soon',
  },
  {
    title: "Projectile Motion",
    description: "Launch projectiles at different angles and velocities to analyze parabolic trajectories.",
    icon: <BarChart sx={{ fontSize: 32 }} />,
    color: '#a855f7',
    status: 'Coming Soon',
  },
  {
    title: "Snell's Law",
    description: "Visualize light refraction through different media and verify Snell's law interactively.",
    icon: <Science sx={{ fontSize: 32 }} />,
    color: '#c084fc',
    status: 'Coming Soon',
  },
  {
    title: "Newton's Cooling",
    description: "Observe how temperature changes over time and verify Newton's law of cooling.",
    icon: <Memory sx={{ fontSize: 32 }} />,
    color: '#10b981',
    status: 'Coming Soon',
  },
  {
    title: "Wave Interference",
    description: "Combine two waves and observe constructive & destructive interference patterns.",
    icon: <Science sx={{ fontSize: 32 }} />,
    color: '#f97316',
    status: 'Coming Soon',
  },
];

const features = [
  {
    icon: <Bolt sx={{ fontSize: 28 }} />,
    title: "Real-Time Simulations",
    desc: "Interactive physics engines that respond instantly to parameter changes with smooth 60fps rendering.",
  },
  {
    icon: <BarChart sx={{ fontSize: 28 }} />,
    title: "Live Data Visualization",
    desc: "Auto-generated graphs and charts that plot your experimental data in real-time as you adjust variables.",
  },
  {
    icon: <Science sx={{ fontSize: 28 }} />,
    title: "Accurate Physics Models",
    desc: "Built on validated equations and models used in academic research and standardized curricula.",
  },
  {
    icon: <Memory sx={{ fontSize: 28 }} />,
    title: "Session Progress Tracking",
    desc: "Save your experiment sessions, track observations, and export results for lab reports.",
  },
  {
    icon: <ShieldOutlined sx={{ fontSize: 28 }} />,
    title: "Safe Experimentation",
    desc: "No broken equipment, no safety hazards — explore freely without limits or consequences.",
  },
  {
    icon: <PeopleOutlined sx={{ fontSize: 28 }} />,
    title: "Collaborative Learning",
    desc: "Share experiment setups with classmates, compare results, and learn together in real-time.",
  },
];

const testimonials = [
  {
    name: "Arjun Reddy",
    role: "3rd Year, ECE",
    text: "The Ohm's Law simulation helped me visualize what I'd only seen in textbooks. My lab understanding improved dramatically.",
    rating: 5,
  },
  {
    name: "Priya Sharma",
    role: "2nd Year, CSE",
    text: "I love how I can experiment without worrying about breaking expensive lab equipment. The real-time graphs are incredibly helpful.",
    rating: 5,
  },
  {
    name: "Karthik Nair",
    role: "4th Year, Mechanical",
    text: "The projectile motion simulator made our mechanics class so much more intuitive. Wish we had this from day one!",
    rating: 5,
  },
];

const stats = [
  { value: '6+', label: 'Experiments' },
  { value: '500+', label: 'Active Users' },
  { value: '10K+', label: 'Simulations Run' },
  { value: '4.8', label: 'Avg Rating' },
];

export function LandingPage() {
  const { isAuthenticated } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const heroRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      document.documentElement.style.setProperty('--mouse-x', `${e.clientX}px`);
      document.documentElement.style.setProperty('--mouse-y', `${e.clientY}px`);
    };
    window.addEventListener('mousemove', handler);
    return () => window.removeEventListener('mousemove', handler);
  }, []);

  return (
    <Box sx={{ minHeight: '100vh', backgroundColor: 'background.default', color: 'text.primary', overflowX: 'hidden' }}>
      
      {/* Cinematic Ambient Particle Field */}
      <CinematicBackground />

      {/* Navbar */}
      <Box 
        component="nav" 
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
            <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <img src="/klulogo.png" alt="KLU Logo" style={{ height: 40 }} />
              <Typography variant="h6" sx={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700 }}>
                Virtual Labs
              </Typography>
            </Link>

            <Box sx={{ display: { xs: 'none', md: 'flex' }, gap: 4 }}>
              {['experiments', 'features', 'testimonials', 'faq'].map((link) => (
                <Typography 
                  key={link}
                  component="a" 
                  href={`#${link}`}
                  variant="body2" 
                  color="text.secondary"
                  sx={{ 
                    textDecoration: 'none', 
                    textTransform: 'capitalize',
                    transition: 'color 0.2s',
                    fontWeight: 500,
                    '&:hover': { color: 'primary.main' } 
                  }}
                >
                  {link}
                </Typography>
              ))}
            </Box>

            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <IconButton onClick={toggleTheme} color="inherit">
                {theme === 'light' ? <DarkMode /> : <LightMode />}
              </IconButton>
              <Button component={Link} to="/login" variant="text" size="medium">
                Log In
              </Button>
              <Magnetic>
                <Button component={Link} to="/signup" variant="contained" size="medium" sx={{ borderRadius: 2.5, px: 2.5 }}>
                  Get Started
                </Button>
              </Magnetic>
            </Box>
          </Box>
        </Container>
      </Box>

      {/* Hero Section */}
      <Box 
        component="section" 
        ref={heroRef}
        sx={{ 
          position: 'relative', 
          py: { xs: 8, md: 12 }, 
          display: 'flex', 
          alignItems: 'center',
          minHeight: '88vh'
        }}
      >
        <Container maxWidth="lg" sx={{ position: 'relative', zIndex: 2 }}>
          <Grid container spacing={6} sx={{ alignItems: 'center' }}>
            <Grid size={{ xs: 12, md: 7 }}>
              <Box 
                component={motion.div}
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
              >
                <Chip 
                  label="Now Live — Ohm's Law Simulation" 
                  color="primary"
                  variant="outlined"
                  sx={{ mb: 3, fontWeight: 600, px: 1, backdropFilter: 'blur(5px)' }}
                />
                
                <Typography 
                  variant="h2" 
                  component="h1" 
                  sx={{ 
                    fontFamily: "'Space Grotesk', sans-serif",
                    lineHeight: 1.1,
                    mb: 3,
                    letterSpacing: '-0.03em',
                    fontWeight: 800
                  }}
                >
                  Master Physics Through<br />
                  <Box component="span" sx={{ 
                    background: 'linear-gradient(135deg, #6366f1 0%, #a855f7 100%)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent'
                  }}>
                    Interactive Simulations
                  </Box>
                </Typography>

                <Typography variant="h6" color="text.secondary" sx={{ fontWeight: 400, mb: 5, maxWidth: 600, lineHeight: 1.6 }}>
                  Experience hands-on virtual experiments that bring textbook concepts to life.
                  Adjust parameters in real-time, visualize results instantly, and build deep
                  intuitive understanding of physics principles.
                </Typography>

                <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', mb: 6 }}>
                  <Magnetic>
                    <Button 
                      component={Link} 
                      to="/signup" 
                      variant="contained" 
                      size="large" 
                      endIcon={<ArrowForward />}
                      sx={{ px: 4, py: 1.8, borderRadius: 3 }}
                    >
                      Start Experimenting
                    </Button>
                  </Magnetic>
                  <Magnetic>
                    <Button 
                      component="a"
                      href="#experiments" 
                      variant="outlined" 
                      size="large" 
                      startIcon={<PlayArrow />}
                      sx={{ px: 4, py: 1.8, borderRadius: 3, borderColor: 'divider', color: 'text.primary', backgroundColor: 'background.paper' }}
                    >
                      Explore Labs
                    </Button>
                  </Magnetic>
                </Box>

                {/* Stats */}
                <Grid container spacing={2}>
                  {stats.map((s, idx) => (
                    <Grid size={{ xs: 6, sm: 3 }} key={idx}>
                      <Typography variant="h4" color="primary.main" sx={{ fontWeight: 800, fontFamily: 'Roboto Mono' }}>
                        {s.value}
                      </Typography>
                      <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>
                        {s.label}
                      </Typography>
                    </Grid>
                  ))}
                </Grid>
              </Box>
            </Grid>

            {/* Interactive Physics Teaser Card */}
            <Grid size={{ xs: 12, md: 5 }}>
              <Box
                component={motion.div}
                initial={{ opacity: 0, scale: 0.95, y: 30 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
                sx={{ width: '100%' }}
              >
                <TiltCard hoverEffect={true} sx={{ p: 0.5, borderRadius: 5, backgroundColor: 'rgba(20, 20, 40, 0.25)', backdropFilter: 'blur(15px)' }}>
                  <Box sx={{ p: 3, borderBottom: '1px solid', borderColor: 'divider', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <div style={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: '#10b981', boxShadow: '0 0 10px #10b981' }} />
                      <Typography variant="caption" sx={{ fontFamily: 'Roboto Mono', fontWeight: 600, color: 'text.secondary' }}>
                        WAVE OSCILLOSCOPE
                      </Typography>
                    </Box>
                    <Typography variant="caption" sx={{ fontFamily: 'Roboto Mono', color: 'primary.main', fontWeight: 700 }}>
                      MODE: ACTIVE
                    </Typography>
                  </Box>
                  <Box sx={{ height: 220, p: 2, position: 'relative' }}>
                    <WaveformTeaser />
                    <Box sx={{ position: 'absolute', bottom: 12, right: 12, p: 1, px: 2, borderRadius: 2, backgroundColor: 'rgba(10, 10, 26, 0.7)', border: '1px solid rgba(255, 255, 255, 0.1)', backdropFilter: 'blur(5px)' }}>
                      <Typography variant="caption" sx={{ fontFamily: 'JetBrains Mono', color: 'rgba(255,255,255,0.85)', fontSize: 11 }}>
                        ψ(x, t) = A e^(i(kx - ωt))
                      </Typography>
                    </Box>
                  </Box>
                  <Box sx={{ p: 3, borderTop: '1px solid', borderColor: 'divider', bgcolor: 'rgba(99, 102, 241, 0.03)' }}>
                    <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1, fontWeight: 700 }}>
                      CALCULATION CONSOLE
                    </Typography>
                    <Typography variant="body2" sx={{ fontFamily: 'Roboto Mono', color: 'text.primary', fontSize: 13 }}>
                      &gt; Loading Harmonic Packets... Done. <br />
                      &gt; Phase shift detected: dt = 0.04s <br />
                      &gt; System coherence: 99.87%
                    </Typography>
                  </Box>
                </TiltCard>
              </Box>
            </Grid>
          </Grid>
        </Container>
      </Box>

      {/* Social Proof */}
      <Box sx={{ py: 6, borderTop: '1px solid', borderBottom: '1px solid', borderColor: 'divider', bgcolor: 'action.hover' }}>
        <Container maxWidth="lg">
          <Typography variant="body2" color="text.secondary" align="center" sx={{ mb: 3, fontWeight: 600 }}>
            Trusted by students across Engineering, Sciences & Mathematics departments
          </Typography>
          <Box sx={{ display: 'flex', justifyContent: 'center', gap: 4, flexWrap: 'wrap' }}>
            {['Physics', 'Electronics', 'Mechanics', 'Optics', 'Thermodynamics'].map((d) => (
              <Chip key={d} label={d} variant="outlined" sx={{ fontWeight: 600 }} />
            ))}
          </Box>
        </Container>
      </Box>

      {/* Experiments Section */}
      <Box component="section" id="experiments" sx={{ py: 10 }}>
        <Container maxWidth="lg">
          <Box sx={{ textAlign: 'center', mb: 8 }}>
            <Chip label="Virtual Laboratory" color="primary" variant="filled" sx={{ mb: 2, fontWeight: 600 }} />
            <Typography variant="h3" sx={{ fontFamily: "'Space Grotesk', sans-serif", mb: 2, fontWeight: 700 }}>
              Explore Our Experiments
            </Typography>
            <Typography variant="body1" color="text.secondary" sx={{ maxWidth: 600, mx: 'auto' }}>
              Each experiment is carefully designed to reinforce core physics concepts with real-time interactive simulations you can control.
            </Typography>
          </Box>

          <StaggerContainer>
            <Grid container spacing={4}>
              {experiments.map((exp, idx) => (
                <Grid size={{ xs: 12, sm: 6, md: 4 }} key={idx}>
                  <ScrollReveal direction="up" delay={idx * 0.05} distance={20}>
                    <TiltCard 
                      maxRotation={6}
                      sx={{ 
                        height: '100%', 
                        borderRadius: 5,
                        backgroundColor: (theme) => theme.palette.mode === 'dark'
                          ? 'rgba(20, 20, 40, 0.35)'
                          : 'rgba(255, 255, 255, 0.8)',
                        backdropFilter: 'blur(10px)',
                      }}
                    >
                      <CardContent sx={{ p: 4, display: 'flex', flexDirection: 'column', height: '100%' }}>
                        <Box 
                          sx={{ 
                            color: exp.color, 
                            bgcolor: `${exp.color}15`, 
                            borderRadius: 3, 
                            p: 1.5, 
                            width: 'fit-content',
                            mb: 3,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                          }}
                        >
                          {exp.icon}
                        </Box>
                        <Typography variant="h5" sx={{ mb: 2, fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700 }}>
                          {exp.title}
                        </Typography>
                        <Typography variant="body2" color="text.secondary" sx={{ mb: 'auto', lineHeight: 1.6 }}>
                          {exp.description}
                        </Typography>
                        
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 4 }}>
                          <Chip 
                            label={exp.status} 
                            size="small" 
                            color={exp.status === 'Available' ? 'success' : 'default'} 
                            variant="outlined"
                            sx={{ fontWeight: 600 }}
                          />
                          {exp.status === 'Available' ? (
                            <Magnetic>
                              <Button 
                                component={Link} 
                                to={isAuthenticated ? '/dashboard' : '/login'} 
                                variant="text" 
                                endIcon={<ArrowForward />}
                                sx={{ p: 0, fontWeight: 700 }}
                              >
                                Launch
                              </Button>
                            </Magnetic>
                          ) : (
                            <Typography variant="caption" color="text.disabled" sx={{ fontWeight: 600 }}>
                              Coming Soon
                            </Typography>
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

      {/* Features Section */}
      <Box component="section" id="features" sx={{ py: 10, bgcolor: 'action.hover' }}>
        <Container maxWidth="lg">
          <Box sx={{ textAlign: 'center', mb: 8 }}>
            <Chip label="Why Virtual Labs" color="primary" variant="filled" sx={{ mb: 2, fontWeight: 600 }} />
            <Typography variant="h3" sx={{ fontFamily: "'Space Grotesk', sans-serif", mb: 2, fontWeight: 700 }}>
              Built for Real Understanding
            </Typography>
            <Typography variant="body1" color="text.secondary" sx={{ maxWidth: 600, mx: 'auto' }}>
              Go beyond memorization — our platform is engineered to help you develop deep, intuitive understanding of physical phenomena.
            </Typography>
          </Box>

          <StaggerContainer>
            <Grid container spacing={4}>
              {features.map((f, idx) => (
                <Grid size={{ xs: 12, sm: 6, md: 4 }} key={idx}>
                  <ScrollReveal direction="up" delay={idx * 0.05} distance={15}>
                    <TiltCard maxRotation={4} sx={{ p: 3, height: '100%', borderRadius: 4, bgcolor: 'background.paper' }}>
                      <CardContent sx={{ p: 0 }}>
                        <Box sx={{ color: 'primary.main', mb: 2 }}>
                          {f.icon}
                        </Box>
                        <Typography variant="h6" sx={{ mb: 1.5, fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700 }}>
                          {f.title}
                        </Typography>
                        <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.6 }}>
                          {f.desc}
                        </Typography>
                      </CardContent>
                    </TiltCard>
                  </ScrollReveal>
                </Grid>
              ))}
            </Grid>
          </StaggerContainer>
        </Container>
      </Box>

      {/* Testimonials */}
      <Box component="section" id="testimonials" sx={{ py: 10 }}>
        <Container maxWidth="lg">
          <Box sx={{ textAlign: 'center', mb: 8 }}>
            <Chip label="Student Voices" color="primary" variant="filled" sx={{ mb: 2, fontWeight: 600 }} />
            <Typography variant="h3" sx={{ fontFamily: "'Space Grotesk', sans-serif", mb: 2, fontWeight: 700 }}>
              Loved by Learners
            </Typography>
            <Typography variant="body1" color="text.secondary" sx={{ maxWidth: 600, mx: 'auto' }}>
              Hear what students have to say about their experience with Virtual Labs.
            </Typography>
          </Box>

          <StaggerContainer>
            <Grid container spacing={4}>
              {testimonials.map((t, idx) => (
                <Grid size={{ xs: 12, md: 4 }} key={idx}>
                  <ScrollReveal direction="up" delay={idx * 0.05} distance={15}>
                    <TiltCard 
                      maxRotation={5}
                      sx={{ 
                        p: 4, 
                        height: '100%', 
                        borderRadius: 4, 
                        position: 'relative'
                      }}
                    >
                      <FormatQuote sx={{ position: 'absolute', top: 16, right: 16, fontSize: 40, opacity: 0.15, color: 'primary.main' }} />
                      <CardContent sx={{ p: 0 }}>
                        <Typography variant="body1" sx={{ fontStyle: 'italic', mb: 3, lineHeight: 1.6 }}>
                          "{t.text}"
                        </Typography>
                        <Box sx={{ display: 'flex', gap: 0.5, mb: 3 }}>
                          {Array.from({ length: t.rating }).map((_, j) => (
                            <Star key={j} sx={{ color: 'warning.main', fontSize: 18 }} />
                          ))}
                        </Box>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                          <Avatar sx={{ bgcolor: 'secondary.main', fontWeight: 600 }}>
                            {t.name[0]}
                          </Avatar>
                          <Box>
                            <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                              {t.name}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              {t.role}
                            </Typography>
                          </Box>
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

      {/* FAQ */}
      <Box component="section" id="faq" sx={{ py: 10, bgcolor: 'action.hover' }}>
        <Container maxWidth="md">
          <Box sx={{ textAlign: 'center', mb: 8 }}>
            <Chip label="FAQ" color="primary" variant="filled" sx={{ mb: 2, fontWeight: 600 }} />
            <Typography variant="h3" sx={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700 }}>
              Frequently Asked Questions
            </Typography>
          </Box>

          <Box>
            {[
              { q: 'Is Virtual Labs free to use?', a: 'Yes! All basic simulations are completely free. Create an account and start experimenting immediately.' },
              { q: 'Do I need to install any software?', a: 'No installation required. Virtual Labs runs entirely in your browser on any device — desktop, tablet, or mobile.' },
              { q: 'Can I use simulation data for my lab reports?', a: 'Absolutely. You can export readings, graphs, and observations directly from each experiment session.' },
              { q: 'How accurate are the simulations?', a: 'Our models are built using validated physics equations and are reviewed by faculty. They closely mirror real-world lab behavior.' },
              { q: 'Will more experiments be added?', a: 'Yes! We regularly expand our library. Simple Pendulum, Projectile Motion, and Snell\'s Law are coming soon.' },
              { q: 'Can I reset my experiment and start over?', a: 'Of course. Each session can be reset to defaults or you can start a new session while keeping the previous one saved.' },
            ].map((faq, idx) => (
              <ScrollReveal key={idx} direction="up" delay={idx * 0.05} distance={10}>
                <Accordion sx={{ mb: 2, borderRadius: 2, border: '1px solid', borderColor: 'divider', '&:before': { display: 'none' } }} elevation={0}>
                  <AccordionSummary expandIcon={<ExpandMore />}>
                    <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                      {faq.q}
                    </Typography>
                  </AccordionSummary>
                  <AccordionDetails>
                    <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.6 }}>
                      {faq.a}
                    </Typography>
                  </AccordionDetails>
                </Accordion>
              </ScrollReveal>
            ))}
          </Box>
        </Container>
      </Box>

      {/* CTA Section */}
      <Box 
        component="section" 
        sx={{ 
          py: 12, 
          textAlign: 'center', 
          position: 'relative', 
          bgcolor: 'primary.dark',
          color: '#ffffff',
          overflow: 'hidden'
        }}
      >
        <Box className="cta-bg" sx={{ pointerEvents: 'none' }}>
          <Box className="cta-orb cta-orb-1" />
          <Box className="cta-orb cta-orb-2" />
        </Box>
        <Container maxWidth="md" sx={{ position: 'relative', zIndex: 2 }}>
          <Typography variant="h3" sx={{ mb: 3, fontFamily: "'Space Grotesk', sans-serif", fontWeight: 800 }}>
            Ready to Transform How You Learn Physics?
          </Typography>
          <Typography variant="body1" sx={{ mb: 5, opacity: 0.8, maxWidth: 600, mx: 'auto', lineHeight: 1.6 }}>
            Join hundreds of students already mastering physics concepts through interactive virtual experiments. It's free, instant, and built for you.
          </Typography>
          <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center', flexWrap: 'wrap' }}>
            <Magnetic>
              <Button component={Link} to="/signup" variant="contained" color="secondary" size="large" sx={{ px: 4, py: 1.5, borderRadius: 2.5 }}>
                Create Free Account
              </Button>
            </Magnetic>
            <Magnetic>
              <Button component={Link} to="/login" variant="outlined" color="inherit" size="large" sx={{ px: 4, py: 1.5, borderRadius: 2.5 }}>
                Log In
              </Button>
            </Magnetic>
          </Box>
        </Container>
      </Box>

      {/* Footer */}
      <Box component="footer" sx={{ py: 6, borderTop: '1px solid', borderColor: 'divider' }}>
        <Container maxWidth="lg">
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexDirection: { xs: 'column', md: 'row' }, gap: 3 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
              <img src="/klulogo.png" alt="KLU Logo" style={{ height: 36 }} />
              <Typography variant="subtitle1" sx={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700 }}>
                Virtual Labs
              </Typography>
            </Box>
            <Typography variant="body2" color="text.secondary">
              &copy; {new Date().getFullYear()} Virtual Labs. Built with ❤️ for curious learners.
            </Typography>
          </Box>
        </Container>
      </Box>

    </Box>
  );
}
