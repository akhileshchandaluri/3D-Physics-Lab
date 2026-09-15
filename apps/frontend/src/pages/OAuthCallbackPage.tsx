import { useEffect, useState, useRef } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './AuthPages.css';

interface LinkingData {
  email: string;
  linkToken: string;
}

export function OAuthCallbackPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { refreshSession } = useAuth();

  const [status, setStatus] = useState<'loading' | 'linking' | 'error'>('loading');
  const [errorMessage, setErrorMessage] = useState('');
  const [linkingData, setLinkingData] = useState<LinkingData | null>(null);

  // Link form state
  const [password, setPassword] = useState('');
  const [linkLoading, setLinkLoading] = useState(false);
  const [linkError, setLinkError] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // Prevent double execution in React StrictMode
  const executedRef = useRef(false);

  useEffect(() => {
    if (executedRef.current) return;
    executedRef.current = true;

    const errorParam = searchParams.get('error');
    const errorDesc = searchParams.get('error_description');
    const code = searchParams.get('code');
    const state = searchParams.get('state');

    if (errorParam) {
      setStatus('error');
      if (errorParam === 'access_denied') {
        setErrorMessage('Google Sign-In was cancelled or access was denied.');
      } else {
        setErrorMessage(errorDesc || 'Google Sign-In encountered an error: ' + errorParam);
      }
      return;
    }

    if (!code || !state) {
      setStatus('error');
      setErrorMessage('Missing authorization code or state from Google.');
      return;
    }

    async function processCallback() {
      try {
        const res = await fetch('/api/v1/auth/oauth/google/callback', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({ code, state }),
        });

        if (res.ok) {
          await refreshSession();
          navigate('/dashboard', { replace: true });
          return;
        }

        const data = await res.json().catch(() => null);

        if (res.status === 409 && data?.error === 'ACCOUNT_LINKING_REQUIRED') {
          setLinkingData({
            email: data.email,
            linkToken: data.linkToken,
          });
          setStatus('linking');
          return;
        }

        setStatus('error');
        if (res.status === 403) {
          setErrorMessage('This account has been deactivated. Please contact an administrator.');
        } else {
          setErrorMessage(data?.message || 'Authentication with Google failed. Please try again.');
        }
      } catch (err: unknown) {
        setStatus('error');
        setErrorMessage('Network error during Google authentication. Please check your connection.');
      }
    }

    processCallback();
  }, [searchParams, refreshSession, navigate]);

  const handleLinkSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password) {
      setLinkError('Password is required to link accounts.');
      return;
    }
    if (!linkingData) return;

    setLinkLoading(true);
    setLinkError('');

    try {
      const res = await fetch('/api/v1/auth/oauth/google/link', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          linkToken: linkingData.linkToken,
          password,
        }),
      });

      if (res.ok) {
        await refreshSession();
        navigate('/dashboard', { replace: true });
        return;
      }

      const data = await res.json().catch(() => null);
      if (res.status === 401) {
        setLinkError('Incorrect password. Please enter the password for your existing account.');
      } else {
        setLinkError(data?.message || 'Failed to link account. Please try again.');
      }
    } catch {
      setLinkError('Network error. Please try again.');
    } finally {
      setLinkLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-bg">
        <div className="auth-orb auth-orb-1" />
        <div className="auth-orb auth-orb-2" />
        <div className="auth-grid-bg" />
      </div>

      <div className="auth-container animate-fade-in-up" style={{ maxWidth: '520px', minHeight: 'auto', padding: '40px' }}>
        {status === 'loading' && (
          <div style={{ textAlign: 'center', width: '100%', padding: '40px 20px' }}>
            <div className="spinner" style={{ width: '40px', height: '40px', margin: '0 auto 24px', borderWidth: '3px' }} />
            <h2 style={{ fontSize: '20px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '8px' }}>
              Authenticating with Google...
            </h2>
            <p style={{ color: 'var(--text-muted)', fontSize: '14px' }}>
              Verifying your OpenID Connect credentials and creating your secure session.
            </p>
          </div>
        )}

        {status === 'error' && (
          <div style={{ textAlign: 'center', width: '100%', padding: '20px 0' }}>
            <div style={{
              width: '56px',
              height: '56px',
              borderRadius: '50%',
              background: 'rgba(239, 68, 68, 0.15)',
              color: '#ef4444',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 20px'
            }}>
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10"/>
                <line x1="15" y1="9" x2="9" y2="15"/>
                <line x1="9" y1="9" x2="15" y2="15"/>
              </svg>
            </div>
            <h2 style={{ fontSize: '20px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '12px' }}>
              Sign-In Failed
            </h2>
            <div className="auth-error" style={{ marginBottom: '24px', textAlign: 'left' }}>
              <span>{errorMessage}</span>
            </div>
            <Link to="/login" className="auth-submit" style={{ textDecoration: 'none', display: 'inline-flex' }}>
              Return to Sign In
            </Link>
          </div>
        )}

        {status === 'linking' && linkingData && (
          <div style={{ width: '100%' }}>
            <div style={{
              width: '52px',
              height: '52px',
              borderRadius: '50%',
              background: 'rgba(99, 102, 241, 0.15)',
              color: 'var(--primary-500)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 16px'
            }}>
              <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/>
                <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/>
              </svg>
            </div>

            <div className="auth-form-header" style={{ textAlign: 'center', marginBottom: '20px' }}>
              <h1 style={{ fontSize: '22px' }}>Link Existing Account</h1>
              <p style={{ marginTop: '6px' }}>
                An account with email <strong style={{ color: 'var(--text-primary)' }}>{linkingData.email}</strong> already exists.
              </p>
              <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginTop: '4px' }}>
                To connect your Google identity securely, enter your existing Physim password.
              </p>
            </div>

            {linkError && (
              <div className="auth-error" role="alert" style={{ marginBottom: '16px' }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>
                <span>{linkError}</span>
              </div>
            )}

            <form onSubmit={handleLinkSubmit} className="auth-form" noValidate>
              <div className="field-group">
                <label htmlFor="link-password">Current Password</label>
                <div className="input-wrapper">
                  <svg className="input-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect width="18" height="11" x="3" y="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
                  <input
                    id="link-password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Enter your Physim password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    autoFocus
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
              </div>

              <button
                type="submit"
                className="auth-submit"
                disabled={linkLoading}
                style={{ marginTop: '12px' }}
              >
                {linkLoading ? <span className="spinner" /> : 'Confirm and Link Account'}
              </button>

              <div style={{ textAlign: 'center', marginTop: '16px' }}>
                <Link to="/login" style={{ color: 'var(--text-muted)', fontSize: '13px', textDecoration: 'none' }}>
                  Cancel and Return to Sign In
                </Link>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}
