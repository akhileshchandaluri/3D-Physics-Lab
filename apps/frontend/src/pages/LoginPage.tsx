import { useState } from 'react';
import type { FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { 
  Box, 
  Button, 
  TextField, 
  Alert, 
  IconButton, 
  InputAdornment, 
  Typography 
} from '@mui/material';
import { 
  Visibility, 
  VisibilityOff, 
  MailOutlined, 
  LockOutlined,
  LightMode,
  DarkMode
} from '@mui/icons-material';
import { CinematicBackground, Magnetic } from '../components/ui';
import './AuthPages.css';

export function LoginPage() {
  const { login } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    if (!email || !password) {
      setError('Please fill in all fields.');
      return;
    }
    setLoading(true);
    try {
      await login(email, password);
      navigate('/dashboard');
    } catch {
      setError('Invalid credentials. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      {/* Cinematic Ambient Particle Field */}
      <CinematicBackground />

      <button className="theme-toggle auth-theme-toggle" onClick={toggleTheme} aria-label="Toggle theme">
        {theme === 'light' ? (
          <DarkMode fontSize="small" />
        ) : (
          <LightMode fontSize="small" />
        )}
      </button>

      <div className="auth-container animate-fade-in-up">
        {/* left: branding panel */}
        <div className="auth-brand-panel">
          <div className="auth-brand-content">
            <Link to="/" className="auth-logo">
              <img src="/klulogo.png" alt="KLU Logo" className="auth-logo-img" />
              <span>Virtual Labs</span>
            </Link>

            <h2 className="auth-brand-title">Welcome back, explorer.</h2>
            <p className="auth-brand-desc">
              Continue your journey through interactive physics simulations.
              Your experiments and progress are waiting.
            </p>

            <div className="auth-brand-features">
              <div className="auth-feature-item">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
                <span>Pick up right where you left off</span>
              </div>
              <div className="auth-feature-item">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
                <span>All sessions auto-saved</span>
              </div>
              <div className="auth-feature-item">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
                <span>Access all available experiments</span>
              </div>
            </div>
          </div>
        </div>

        {/* right: form */}
        <div className="auth-form-panel">
          <div className="auth-form-content">
            <div className="auth-form-header">
              <h1>Log In</h1>
              <p>Enter your credentials to access the lab</p>
            </div>

            {error && (
              <Alert severity="error" variant="filled" sx={{ mb: 3, borderRadius: 2 }}>
                {error}
              </Alert>
            )}

            <form onSubmit={handleSubmit} className="auth-form" id="login-form">
              <Box sx={{ mb: 2.5 }}>
                <TextField
                  fullWidth
                  id="login-email"
                  label="Email Address"
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  autoComplete="email"
                  required
                  slotProps={{
                    input: {
                      startAdornment: (
                        <InputAdornment position="start">
                          <MailOutlined color="action" />
                        </InputAdornment>
                      ),
                    }
                  }}
                />
              </Box>

              <Box sx={{ mb: 3 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                  <Typography variant="body2" sx={{ fontWeight: 500, color: 'text.secondary' }}>
                    Password
                  </Typography>
                  <a href="#" className="forgot-link" style={{ fontSize: '0.85rem' }}>Forgot?</a>
                </Box>
                <TextField
                  fullWidth
                  id="login-password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="current-password"
                  required
                  slotProps={{
                    input: {
                      startAdornment: (
                        <InputAdornment position="start">
                          <LockOutlined color="action" />
                        </InputAdornment>
                      ),
                      endAdornment: (
                        <InputAdornment position="end">
                          <IconButton
                            onClick={() => setShowPassword(!showPassword)}
                            edge="end"
                            aria-label="Toggle password visibility"
                          >
                            {showPassword ? <VisibilityOff /> : <Visibility />}
                          </IconButton>
                        </InputAdornment>
                      ),
                    }
                  }}
                />
              </Box>

              <Magnetic strength={0.15}>
                <Button
                  fullWidth
                  type="submit"
                  variant="contained"
                  size="large"
                  disabled={loading}
                  id="login-submit-btn"
                  sx={{ py: 1.5 }}
                >
                  {loading ? 'Logging In...' : 'Log In'}
                </Button>
              </Magnetic>
            </form>

            <div className="auth-divider">
              <span>or</span>
            </div>

            <Magnetic strength={0.15}>
              <Button
                fullWidth
                variant="outlined"
                size="large"
                id="google-login-btn"
                onClick={() => {}}
                startIcon={
                  <svg width="18" height="18" viewBox="0 0 24 24"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/></svg>
                }
                sx={{
                  color: 'text.primary',
                  borderColor: 'divider',
                  '&:hover': {
                    borderColor: 'text.primary',
                    backgroundColor: 'action.hover'
                  }
                }}
              >
                Continue with Google
              </Button>
            </Magnetic>

            <p className="auth-switch">
              Don't have an account? <Link to="/signup">Sign Up</Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
