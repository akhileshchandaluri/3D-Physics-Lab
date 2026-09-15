import { useState, useEffect, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth, AuthApiError } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import './AuthPages.css';

export function SignupPage() {
  const { signup, isAuthenticated } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
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

  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};

    if (!name.trim()) {
      errors.name = 'Full name is required';
    } else if (name.trim().length < 2) {
      errors.name = 'Name must be between 2 and 100 characters';
    }

    if (!email.trim()) {
      errors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      errors.email = 'Enter a valid email address.';
    }

    if (!password) {
      errors.password = 'Password is required';
    } else if (password.length < 8) {
      errors.password = 'Password must be at least 8 characters.';
    }

    if (!confirm) {
      errors.confirm = 'Please confirm your password.';
    } else if (password !== confirm) {
      errors.confirm = 'Passwords do not match.';
    }

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSignupSubmit = async (e?: FormEvent) => {
    if (e) e.preventDefault();
    setGeneralError('');
    setIsNetworkError(false);

    if (!validateForm()) {
      setPassword('');
      setConfirm('');
      return;
    }

    setLoading(true);
    try {
      await signup(name.trim(), email.trim(), password);
      navigate('/dashboard');
    } catch (err: unknown) {
      // Clear sensitive password fields; preserve non-sensitive name & email
      setPassword('');
      setConfirm('');

      if (err instanceof AuthApiError) {
        if (err.code === 'VALIDATION_ERROR' && err.details) {
          setFieldErrors(err.details);
          setGeneralError('Please correct the highlighted fields.');
        } else if (err.code === 'CONFLICT') {
          const conflictMsg = 'An account with this email already exists. Log in or use another email.';
          setGeneralError(conflictMsg);
          setFieldErrors((prev) => ({ ...prev, email: conflictMsg }));
        } else if (err.code === 'NETWORK_ERROR') {
          setGeneralError(err.message);
          setIsNetworkError(true);
        } else {
          setGeneralError(err.message || 'Signup failed. Please try again.');
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
        {/* left: branding */}
        <div className="auth-brand-panel">
          <div className="auth-brand-content">
            <Link to="/" className="auth-logo">
              <div className="auth-logo-icon">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="1"/><path d="M20.2 20.2c2.04-2.03.02-7.36-4.5-11.9-4.54-4.52-9.87-6.54-11.9-4.5-2.04 2.03-.02 7.36 4.5 11.9 4.54 4.52 9.87 6.54 11.9 4.5Z"/><path d="M15.7 15.7c4.52-4.54 6.54-9.87 4.5-11.9-2.03-2.04-7.36-.02-11.9 4.5-4.52 4.54-6.54 9.87-4.5 11.9 2.03 2.04 7.36.02 11.9-4.5Z"/></svg>
              </div>
              <span>PhySim Lab</span>
            </Link>

            <h2 className="auth-brand-title">Start your lab journey.</h2>
            <p className="auth-brand-desc">
              Create your account and dive into immersive physics simulations designed to accelerate your understanding.
            </p>

            <div className="auth-brand-features">
              <div className="auth-feature-item">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
                <span>Free access to 8 canonical simulations</span>
              </div>
              <div className="auth-feature-item">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
                <span>Save experiment checkpoints and share setups</span>
              </div>
              <div className="auth-feature-item">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
                <span>Enroll in classrooms & submit lab assignments</span>
              </div>
            </div>

            <div className="auth-notice-box" style={{ marginTop: '32px' }}>
              <div style={{ fontWeight: 600, color: 'var(--text-primary)', marginBottom: '4px' }}>
                🎓 Educator Account Notice
              </div>
              <div>
                To maintain course and grade integrity, teacher accounts are not self-assigned. Register with your institutional email, and your administrator will verify and promote your account to Teacher in the Admin Console.
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

            {generalError && (
              <div className="auth-error" role="alert">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>
                <span>{generalError}</span>
                {isNetworkError && (
                  <button type="button" className="auth-retry-btn" onClick={() => handleSignupSubmit()}>
                    Retry
                  </button>
                )}
              </div>
            )}

            <form onSubmit={handleSignupSubmit} className="auth-form" id="signup-form" noValidate>
              <div className="field-group">
                <label htmlFor="signup-name">Full Name</label>
                <div className="input-wrapper">
                  <svg className="input-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                  <input
                    id="signup-name"
                    type="text"
                    placeholder="John Doe"
                    value={name}
                    onChange={(e) => {
                      setName(e.target.value);
                      if (fieldErrors.name) setFieldErrors((prev) => ({ ...prev, name: '' }));
                    }}
                    autoComplete="name"
                    className={fieldErrors.name ? 'input-error' : ''}
                    required
                  />
                </div>
                {fieldErrors.name && (
                  <div className="field-error-text" role="alert">{fieldErrors.name}</div>
                )}
              </div>

              <div className="field-group">
                <label htmlFor="signup-email">Email Address</label>
                <div className="input-wrapper">
                  <svg className="input-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect width="20" height="16" x="2" y="4" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/></svg>
                  <input
                    id="signup-email"
                    type="email"
                    placeholder="you@example.com"
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

              <div className="field-row">
                <div className="field-group">
                  <label htmlFor="signup-password">Password</label>
                  <div className="input-wrapper">
                    <svg className="input-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect width="18" height="11" x="3" y="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
                    <input
                      id="signup-password"
                      type={showPassword ? 'text' : 'password'}
                      placeholder="Min. 8 characters"
                      value={password}
                      onChange={(e) => {
                        setPassword(e.target.value);
                        if (fieldErrors.password) setFieldErrors((prev) => ({ ...prev, password: '' }));
                      }}
                      autoComplete="new-password"
                      className={fieldErrors.password ? 'input-error' : ''}
                      required
                    />
                  </div>
                  {fieldErrors.password && (
                    <div className="field-error-text" role="alert">{fieldErrors.password}</div>
                  )}
                </div>

                <div className="field-group">
                  <label htmlFor="signup-confirm">Confirm Password</label>
                  <div className="input-wrapper">
                    <svg className="input-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect width="18" height="11" x="3" y="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
                    <input
                      id="signup-confirm"
                      type={showPassword ? 'text' : 'password'}
                      placeholder="Re-enter password"
                      value={confirm}
                      onChange={(e) => {
                        setConfirm(e.target.value);
                        if (fieldErrors.confirm) setFieldErrors((prev) => ({ ...prev, confirm: '' }));
                      }}
                      autoComplete="new-password"
                      className={fieldErrors.confirm ? 'input-error' : ''}
                      required
                    />
                  </div>
                  {fieldErrors.confirm && (
                    <div className="field-error-text" role="alert">{fieldErrors.confirm}</div>
                  )}
                </div>
              </div>

              <div className="field-group">
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    id="show-password-toggle"
                    checked={showPassword}
                    onChange={() => setShowPassword(!showPassword)}
                  />
                  <span>Show passwords</span>
                </label>
              </div>

              <button
                type="submit"
                className="auth-submit"
                id="signup-submit-btn"
                disabled={loading}
              >
                {loading ? (
                  <span className="spinner" />
                ) : (
                  <>
                    Create Account
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
              id="google-signup-btn"
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

            <div className="auth-notice-box" style={{ marginTop: '20px' }}>
              <span>Faculty or Teacher?</span>
              <div style={{ fontSize: '12px', marginTop: '2px' }}>
                If you already have a teacher account, <Link to="/login?role=teacher" style={{ color: 'var(--primary-600)', fontWeight: 600 }}>Log In here</Link>. For new teacher onboarding, contact your institution administrator.
              </div>
            </div>

            <p className="auth-switch" style={{ marginTop: '20px' }}>
              Already have an account? <Link to="/login">Log In</Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
