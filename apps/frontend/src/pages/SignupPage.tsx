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
  Checkbox,
  FormControlLabel
} from '@mui/material';
import { 
  MailOutlined, 
  LockOutlined,
  PersonOutlined,
  LightMode,
  DarkMode
} from '@mui/icons-material';
import { CinematicBackground, Magnetic } from '../components/ui';
import './AuthPages.css';

export function SignupPage() {
  const { signup } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');

    if (!name || !email || !password || !confirm) {
      setError('Please fill in all fields.');
      return;
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }
    if (password !== confirm) {
      setError('Passwords do not match.');
      return;
    }

    setLoading(true);
    try {
      await signup(name, email, password);
      navigate('/dashboard');
    } catch {
      setError('Signup failed. Please try again.');
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
        {/* left: branding */}
        <div className="auth-brand-panel">
          <div className="auth-brand-content">
            <Link to="/" className="auth-logo">
              <img src="/klulogo.png" alt="KLU Logo" className="auth-logo-img" />
              <span>Virtual Labs</span>
            </Link>

            <h2 className="auth-brand-title">Start your lab journey.</h2>
            <p className="auth-brand-desc">
              Create your free account and dive into immersive physics
              simulations designed to accelerate your understanding.
            </p>

            <div className="auth-brand-features">
              <div className="auth-feature-item">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
                <span>Completely free to get started</span>
              </div>
              <div className="auth-feature-item">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
                <span>Save & export your experiment data</span>
              </div>
              <div className="auth-feature-item">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
                <span>Access to all simulations & updates</span>
              </div>
            </div>
          </div>
        </div>

        {/* right: form */}
        <div className="auth-form-panel">
          <div className="auth-form-content">
            <div className="auth-form-header">
              <h1>Create Account</h1>
              <p>Sign up to start experimenting</p>
            </div>

            {error && (
              <Alert severity="error" variant="filled" sx={{ mb: 3, borderRadius: 2 }}>
                {error}
              </Alert>
            )}

            <form onSubmit={handleSubmit} className="auth-form" id="signup-form">
              <Box sx={{ mb: 2 }}>
                <TextField
                  fullWidth
                  id="signup-name"
                  label="Full Name"
                  placeholder="John Doe"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  autoComplete="name"
                  required
                  slotProps={{
                    input: {
                      startAdornment: (
                        <PersonOutlined color="action" style={{ marginRight: 8 }} />
                      ),
                    }
                  }}
                />
              </Box>

              <Box sx={{ mb: 2 }}>
                <TextField
                  fullWidth
                  id="signup-email"
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
                        <MailOutlined color="action" style={{ marginRight: 8 }} />
                      ),
                    }
                  }}
                />
              </Box>

              <Box sx={{ display: 'flex', gap: 2, mb: 2, flexDirection: { xs: 'column', sm: 'row' } }}>
                <TextField
                  fullWidth
                  id="signup-password"
                  label="Password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Min. 6 chars"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="new-password"
                  required
                  slotProps={{
                    input: {
                      startAdornment: (
                        <LockOutlined color="action" style={{ marginRight: 8 }} />
                      ),
                    }
                  }}
                />
                <TextField
                  fullWidth
                  id="signup-confirm"
                  label="Confirm Password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Re-enter password"
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                  autoComplete="new-password"
                  required
                  slotProps={{
                    input: {
                      startAdornment: (
                        <LockOutlined color="action" style={{ marginRight: 8 }} />
                      ),
                    }
                  }}
                />
              </Box>

              <Box sx={{ mb: 2 }}>
                <FormControlLabel
                  control={
                    <Checkbox
                      id="show-password-toggle"
                      checked={showPassword}
                      onChange={() => setShowPassword(!showPassword)}
                    />
                  }
                  label="Show passwords"
                />
              </Box>

              <Magnetic strength={0.15}>
                <Button
                  fullWidth
                  type="submit"
                  variant="contained"
                  size="large"
                  disabled={loading}
                  id="signup-submit-btn"
                  sx={{ py: 1.5 }}
                >
                  {loading ? 'Creating...' : 'Create Account'}
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
                id="google-signup-btn"
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
              Already have an account? <Link to="/login">Log In</Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
