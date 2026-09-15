import { useState, useEffect, type FormEvent } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth, AuthApiError } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import './AuthPages.css';

export function LoginPage() {
  const { login, isAuthenticated } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const roleParam = searchParams.get('role');
  const [selectedRole, setSelectedRole] = useState<'student' | 'teacher'>(
    roleParam === 'teacher' ? 'teacher' : 'student'
  );

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [generalError, setGeneralError] = useState('');
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [isNetworkError, setIsNetworkError] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  const handleGoogleSignIn = async () => {
    setGoogleLoading(true);
    setGeneralError('');
    try {
      const res = await fetch('/api/v1/auth/oauth/google/authorize');
      if (!res.ok) {
        throw new Error('Failed to initiate Google Sign-In.');
      }
      const data = await res.json();
      if (data.authUrl) {
        window.location.href = data.authUrl;
      } else {
        throw new Error('No authorization URL returned.');
      }
    } catch (err: unknown) {
      setGeneralError(err instanceof Error ? err.message : 'Unable to connect to Google OAuth.');
      setGoogleLoading(false);
    }
  };

  useEffect(() => {
    if (isAuthenticated) {
      navigate('/dashboard', { replace: true });
    }
  }, [isAuthenticated, navigate]);

  useEffect(() => {
    if (searchParams.get('expired') === 'true') {
      setGeneralError('Your session has expired. Please log in again.');
    }
  }, [searchParams]);

  const handleRoleChange = (role: 'student' | 'teacher') => {
    setSelectedRole(role);
    setSearchParams(role === 'teacher' ? { role: 'teacher' } : {});
    setGeneralError('');
    setFieldErrors({});
  };

  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};

    if (!email.trim()) {
      errors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      errors.email = 'Enter a valid email address.';
    }

    if (!password) {
      errors.password = 'Password is required';
    }

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleLoginSubmit = async (e?: FormEvent) => {
    if (e) e.preventDefault();
    setGeneralError('');
    setIsNetworkError(false);

    if (!validateForm()) {
      setPassword('');
      return;
    }

    setLoading(true);
    try {
      await login(email.trim(), password);
      navigate('/dashboard');
    } catch (err: unknown) {
      // Clear sensitive password; preserve email
      setPassword('');

      if (err instanceof AuthApiError) {
        if (err.code === 'VALIDATION_ERROR' && err.details) {
          setFieldErrors(err.details);
          setGeneralError('Please correct the highlighted fields.');
        } else if (err.code === 'UNAUTHORIZED' || err.status === 401) {
          setGeneralError('Email or password is incorrect.');
        } else if (err.code === 'NETWORK_ERROR') {
          setGeneralError(err.message);
          setIsNetworkError(true);
        } else {
          setGeneralError(err.message || 'Login failed. Please try again.');
        }
      } else {
        setGeneralError('An unexpected error occurred. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      {/* background effects */}
      <div className="auth-bg">
        <div className="auth-orb auth-orb-1" />
        <div className="auth-orb auth-orb-2" />
        <div className="auth-grid-bg" />
      </div>

      <button className="theme-toggle auth-theme-toggle" onClick={toggleTheme} aria-label="Toggle theme">
        {theme === 'light' ? (
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z"/></svg>
        ) : (
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="4"/><path d="M12 2v2"/><path d="M12 20v2"/><path d="m4.93 4.93 1.41 1.41"/><path d="m17.66 17.66 1.41 1.41"/><path d="M2 12h2"/><path d="M20 12h2"/><path d="m6.34 17.66-1.41 1.41"/><path d="m19.07 4.93-1.41 1.41"/></svg>
        )}
      </button>

      <div className="auth-container animate-fade-in-up">
        {/* left: branding panel */}
        <div className="auth-brand-panel">
          <div className="auth-brand-content">
            <Link to="/" className="auth-logo">
              <div className="auth-logo-icon">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="1"/><path d="M20.2 20.2c2.04-2.03.02-7.36-4.5-11.9-4.54-4.52-9.87-6.54-11.9-4.5-2.04 2.03-.02 7.36 4.5 11.9 4.54 4.52 9.87 6.54 11.9 4.5Z"/><path d="M15.7 15.7c4.52-4.54 6.54-9.87 4.5-11.9-2.03-2.04-7.36-.02-11.9 4.5-4.52 4.54-6.54 9.87-4.5 11.9 2.03 2.04 7.36.02 11.9-4.5Z"/></svg>
              </div>
              <span>PhySim Lab</span>
            </Link>

            <h2 className="auth-brand-title">
              {selectedRole === 'teacher' ? 'Educator & Faculty Portal' : 'Welcome back, explorer.'}
            </h2>
            <p className="auth-brand-desc">
              {selectedRole === 'teacher'
                ? 'Manage laboratory classrooms, review student simulation progress, and create physics coursework assignments.'
                : 'Continue your journey through interactive physics simulations. Your experiments and progress are waiting.'}
            </p>

            <div className="auth-brand-features">
              {selectedRole === 'teacher' ? (
                <>
                  <div className="auth-feature-item">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
                    <span>Classroom codes for student enrollment</span>
                  </div>
                  <div className="auth-feature-item">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
                    <span>Structured assignment creation & deadlines</span>
                  </div>
                  <div className="auth-feature-item">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
                    <span>Inspect student simulation measurements</span>
                  </div>
                </>
              ) : (
                <>
                  <div className="auth-feature-item">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
                    <span>Pick up right where you left off</span>
                  </div>
                  <div className="auth-feature-item">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
                    <span>Saved experiment snapshots and share links</span>
                  </div>
                  <div className="auth-feature-item">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
                    <span>Access all 8 canonical laboratory experiments</span>
                  </div>
                </>
              )}
            </div>

            <div className="auth-notice-box" style={{ marginTop: '32px' }}>
              <div style={{ fontWeight: 600, color: 'var(--text-primary)', marginBottom: '4px' }}>
                ℹ️ Teacher Account Provisioning
              </div>
              <div>
                Educator privileges are granted by institution administrators. If you need teacher access, register your institutional email and contact your admin to activate your teacher role.
              </div>
            </div>
          </div>
        </div>

        {/* right: form */}
        <div className="auth-form-panel">
          <div className="auth-form-content">
            {/* Role Switcher Tabs */}
            <div style={{ display: 'flex', background: 'var(--surface-primary)', padding: '4px', borderRadius: '10px', marginBottom: '24px', border: '1px solid var(--border-subtle)' }}>
              <button
                type="button"
                onClick={() => handleRoleChange('student')}
                style={{
                  flex: 1,
                  padding: '8px 12px',
                  borderRadius: '8px',
                  border: 'none',
                  background: selectedRole === 'student' ? 'var(--surface-card)' : 'transparent',
                  color: selectedRole === 'student' ? 'var(--text-primary)' : 'var(--text-muted)',
                  fontWeight: selectedRole === 'student' ? 600 : 500,
                  fontSize: '13px',
                  cursor: 'pointer',
                  boxShadow: selectedRole === 'student' ? 'var(--shadow-sm)' : 'none',
                  transition: 'all 0.2s',
                }}
              >
                Student Sign In
              </button>
              <button
                type="button"
                onClick={() => handleRoleChange('teacher')}
                style={{
                  flex: 1,
                  padding: '8px 12px',
                  borderRadius: '8px',
                  border: 'none',
                  background: selectedRole === 'teacher' ? 'var(--surface-card)' : 'transparent',
                  color: selectedRole === 'teacher' ? 'var(--text-primary)' : 'var(--text-muted)',
                  fontWeight: selectedRole === 'teacher' ? 600 : 500,
                  fontSize: '13px',
                  cursor: 'pointer',
                  boxShadow: selectedRole === 'teacher' ? 'var(--shadow-sm)' : 'none',
                  transition: 'all 0.2s',
                }}
              >
                Teacher / Faculty Sign In
              </button>
            </div>

            <div className="auth-form-header">
              <h1>{selectedRole === 'teacher' ? 'Teacher Log In' : 'Log In'}</h1>
              <p>
                {selectedRole === 'teacher'
                  ? 'Sign in with your verified faculty credentials'
                  : 'Enter your credentials to access the lab'}
              </p>
            </div>

            {generalError && (
              <div className="auth-error" role="alert">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>
                <span>{generalError}</span>
                {isNetworkError && (
                  <button type="button" className="auth-retry-btn" onClick={() => handleLoginSubmit()}>
                    Retry
                  </button>
                )}
              </div>
            )}

            <form onSubmit={handleLoginSubmit} className="auth-form" id="login-form" noValidate>
              <div className="field-group">
                <label htmlFor="login-email">
                  {selectedRole === 'teacher' ? 'Institutional Email' : 'Email Address'}
                </label>
                <div className="input-wrapper">
                  <svg className="input-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect width="20" height="16" x="2" y="4" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/></svg>
                  <input
                    id="login-email"
                    type="email"
                    placeholder={selectedRole === 'teacher' ? 'prof.sharma@physim.edu' : 'you@example.com'}
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      if (fieldErrors.email) setFieldErrors((prev) => ({ ...prev, email: '' }));
                    }}
                    autoComplete="email"
                    className={fieldErrors.email ? 'input-error' : ''}
                    required
                  />
                </div>
                {fieldErrors.email && (
                  <div className="field-error-text" role="alert">{fieldErrors.email}</div>
                )}
              </div>

              <div className="field-group">
                <div className="field-label-row">
                  <label htmlFor="login-password">Password</label>
                </div>
                <div className="input-wrapper">
                  <svg className="input-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect width="18" height="11" x="3" y="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
                  <input
                    id="login-password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value);
                      if (fieldErrors.password) setFieldErrors((prev) => ({ ...prev, password: '' }));
                    }}
                    autoComplete="current-password"
                    className={fieldErrors.password ? 'input-error' : ''}
                    required
                  />
                  <button
                    type="button"
                    className="toggle-password"
                    onClick={() => setShowPassword(!showPassword)}
                    aria-label="Toggle password visibility"
                  >
                    {showPassword ? (
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
                    ) : (
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                    )}
                  </button>
                </div>
                {fieldErrors.password && (
                  <div className="field-error-text" role="alert">{fieldErrors.password}</div>
                )}
              </div>

              <button
                type="submit"
                className="auth-submit"
                id="login-submit-btn"
                disabled={loading}
              >
                {loading ? (
                  <span className="spinner" />
                ) : (
                  <>
                    {selectedRole === 'teacher' ? 'Log In as Teacher' : 'Log In'}
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg>
                  </>
                )}
              </button>
            </form>

            <div className="auth-divider">
              <span>or</span>
            </div>

            <button
              type="button"
              className="auth-social-btn"
              id="google-login-btn"
              onClick={handleGoogleSignIn}
              disabled={loading || googleLoading}
            >
              {googleLoading ? (
                <span className="spinner" style={{ width: '18px', height: '18px' }} />
              ) : (
                <svg width="18" height="18" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
                </svg>
              )}
              <span>Continue with Google</span>
            </button>

            <p className="auth-switch" style={{ marginTop: '24px' }}>
              Don't have an account? <Link to="/signup">Sign Up</Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
