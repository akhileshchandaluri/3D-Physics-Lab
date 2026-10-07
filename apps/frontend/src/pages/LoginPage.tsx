import { useState, useEffect, type FormEvent } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth, AuthApiError } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import './AuthPages.css';

type MfaState = {
  challengeToken: string;
  setupRequired: boolean;
  totpEnabled: boolean;
  webauthnEnabled: boolean;
  email: string;
  name: string;
};

export function LoginPage() {
  const { login, completeMfaLogin, isAuthenticated } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [generalError, setGeneralError] = useState('');
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [isNetworkError, setIsNetworkError] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  const [mfa, setMfa] = useState<MfaState | null>(null);
  const [mfaCode, setMfaCode] = useState('');
  const [otpauthUrl, setOtpauthUrl] = useState<string | null>(null);
  const [totpSecret, setTotpSecret] = useState<string | null>(null);
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);
  /** When setup is required: chooser first, then authenticator details. */
  const [setupStep, setSetupStep] = useState<'chooser' | 'authenticator' | null>(null);

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

  const beginTotpSetup = async (challengeToken: string) => {
    const res = await fetch('/api/v1/auth/mfa/totp/setup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ challengeToken }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => null);
      throw new Error(err?.error?.message || err?.message || 'Could not start authenticator setup.');
    }
    const data = await res.json();
    setOtpauthUrl(data.otpauthUrl);
    setTotpSecret(data.secret);
    setQrDataUrl(data.qrDataUrl ?? null);
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
      const result = await login(email.trim(), password);
      setPassword('');
      if (result.kind === 'mfa') {
        const next: MfaState = {
          challengeToken: result.challengeToken,
          setupRequired: result.setupRequired,
          totpEnabled: result.totpEnabled,
          webauthnEnabled: result.webauthnEnabled,
          email: result.email,
          name: result.name,
        };
        setMfa(next);
        setSetupStep(result.setupRequired ? 'chooser' : null);
        setOtpauthUrl(null);
        setTotpSecret(null);
        setQrDataUrl(null);
        setMfaCode('');
      } else {
        navigate('/dashboard');
      }
    } catch (err: unknown) {
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
        setGeneralError(err instanceof Error ? err.message : 'An unexpected error occurred. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const resetMfaUi = () => {
    setMfa(null);
    setMfaCode('');
    setOtpauthUrl(null);
    setTotpSecret(null);
    setQrDataUrl(null);
    setSetupStep(null);
    setGeneralError('');
  };

  const handleChooseAuthenticator = async () => {
    if (!mfa) return;
    setLoading(true);
    setGeneralError('');
    try {
      await beginTotpSetup(mfa.challengeToken);
      setSetupStep('authenticator');
    } catch (err: unknown) {
      setGeneralError(err instanceof Error ? err.message : 'Could not start authenticator setup.');
    } finally {
      setLoading(false);
    }
  };

  const handleSkipMfaSetup = async () => {
    if (!mfa) return;
    setLoading(true);
    setGeneralError('');
    try {
      await completeMfaLogin('/api/v1/auth/mfa/skip', {
        challengeToken: mfa.challengeToken,
      });
      navigate('/dashboard');
    } catch (err: unknown) {
      if (err instanceof AuthApiError) {
        setGeneralError(err.message || 'Could not skip setup.');
      } else {
        setGeneralError(err instanceof Error ? err.message : 'Could not skip setup.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleTotpSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!mfa) return;
    setLoading(true);
    setGeneralError('');
    try {
      const endpoint = mfa.totpEnabled && !mfa.setupRequired
        ? '/api/v1/auth/mfa/totp/verify'
        : '/api/v1/auth/mfa/totp/confirm';
      await completeMfaLogin(endpoint, {
        challengeToken: mfa.challengeToken,
        code: mfaCode.trim(),
      });
      navigate('/dashboard');
    } catch (err: unknown) {
      setMfaCode('');
      if (err instanceof AuthApiError) {
        setGeneralError(err.message || 'That code did not work.');
      } else {
        setGeneralError(err instanceof Error ? err.message : 'That code did not work.');
      }
    } finally {
      setLoading(false);
    }
  };

  const bufferToBase64Url = (buffer: ArrayBuffer) => {
    const bytes = new Uint8Array(buffer);
    let binary = '';
    bytes.forEach((b) => {
      binary += String.fromCharCode(b);
    });
    return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '');
  };

  const base64UrlToBuffer = (value: string) => {
    const padded = value.replace(/-/g, '+').replace(/_/g, '/');
    const pad = padded.length % 4 === 0 ? '' : '='.repeat(4 - (padded.length % 4));
    const binary = atob(padded + pad);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i += 1) bytes[i] = binary.charCodeAt(i);
    return bytes.buffer;
  };

  const handleWebAuthn = async () => {
    if (!mfa || !window.PublicKeyCredential) {
      setGeneralError('This browser cannot use a device check.');
      return;
    }
    setLoading(true);
    setGeneralError('');
    try {
      const setup = mfa.setupRequired || !mfa.webauthnEnabled;
      const optionsRes = await fetch(
        setup ? '/api/v1/auth/mfa/webauthn/register/options' : '/api/v1/auth/mfa/webauthn/authenticate/options',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ challengeToken: mfa.challengeToken }),
        },
      );
      if (!optionsRes.ok) {
        const err = await optionsRes.json().catch(() => null);
        throw new Error(err?.error?.message || err?.message || 'Could not start the device check.');
      }
      const options = await optionsRes.json();

      if (setup) {
        const publicKey = {
          ...options.publicKey,
          challenge: base64UrlToBuffer(options.publicKey.challenge),
          user: {
            ...options.publicKey.user,
            id: base64UrlToBuffer(options.publicKey.user.id),
          },
          excludeCredentials: (options.publicKey.excludeCredentials || []).map((c: { id: string; type: PublicKeyCredentialType; transports?: AuthenticatorTransport[] }) => ({
            ...c,
            id: base64UrlToBuffer(c.id),
          })),
        };
        const credential = (await navigator.credentials.create({ publicKey })) as PublicKeyCredential | null;
        if (!credential) throw new Error('The device check was cancelled.');
        const attestation = credential.response as AuthenticatorAttestationResponse;
        const transports =
          typeof attestation.getTransports === 'function' ? attestation.getTransports() : undefined;
        await completeMfaLogin('/api/v1/auth/mfa/webauthn/register/verify', {
          challengeToken: mfa.challengeToken,
          id: credential.id,
          rawId: bufferToBase64Url(credential.rawId),
          type: credential.type,
          clientExtensionResults: credential.getClientExtensionResults?.() ?? {},
          response: {
            clientDataJSON: bufferToBase64Url(attestation.clientDataJSON),
            attestationObject: bufferToBase64Url(attestation.attestationObject),
            ...(transports ? { transports } : {}),
          },
        });
      } else {
        const publicKey = {
          ...options.publicKey,
          challenge: base64UrlToBuffer(options.publicKey.challenge),
          allowCredentials: (options.publicKey.allowCredentials || []).map((c: { id: string; type: PublicKeyCredentialType; transports?: AuthenticatorTransport[] }) => ({
            ...c,
            id: base64UrlToBuffer(c.id),
          })),
        };
        const credential = (await navigator.credentials.get({ publicKey })) as PublicKeyCredential | null;
        if (!credential) throw new Error('The device check was cancelled.');
        const assertion = credential.response as AuthenticatorAssertionResponse;
        await completeMfaLogin('/api/v1/auth/mfa/webauthn/authenticate/verify', {
          challengeToken: mfa.challengeToken,
          id: credential.id,
          rawId: bufferToBase64Url(credential.rawId),
          type: credential.type,
          clientExtensionResults: credential.getClientExtensionResults?.() ?? {},
          response: {
            clientDataJSON: bufferToBase64Url(assertion.clientDataJSON),
            authenticatorData: bufferToBase64Url(assertion.authenticatorData),
            signature: bufferToBase64Url(assertion.signature),
            userHandle: assertion.userHandle ? bufferToBase64Url(assertion.userHandle) : null,
          },
        });
      }
      navigate('/dashboard');
    } catch (err: unknown) {
      if (err instanceof AuthApiError) {
        setGeneralError(err.message);
      } else {
        setGeneralError(err instanceof Error ? err.message : 'The device check failed.');
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
        <div className="auth-form-panel">
          <div className="auth-card-bar">PhySim Lab</div>
          <div className="auth-form-content">
            {!mfa ? (
              <>
                <div className="auth-form-header">
                  <h1>Log in</h1>
                  <p>Use the account from class.</p>
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
                    <label htmlFor="login-email">Email Address</label>
                    <div className="input-wrapper">
                      <svg className="input-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect width="20" height="16" x="2" y="4" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/></svg>
                      <input
                        id="login-email"
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

                  <button type="submit" className="auth-submit" id="login-submit-btn" disabled={loading}>
                    {loading ? <span className="spinner" /> : 'Log in'}
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
                  Need an account? Ask your lab administrator.
                </p>
              </>
            ) : mfa.setupRequired && setupStep === 'chooser' ? (
              <>
                <div className="auth-form-header">
                  <h1>Add a second sign-in method</h1>
                  <p>
                    Protect {mfa.email} with an authenticator app or this browser. You only need to set up one.
                  </p>
                </div>

                {generalError && (
                  <div className="auth-error" role="alert">
                    <span>{generalError}</span>
                  </div>
                )}

                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <button
                    type="button"
                    className="auth-submit"
                    disabled={loading}
                    onClick={() => void handleChooseAuthenticator()}
                  >
                    {loading ? <span className="spinner" /> : 'Authenticator app'}
                  </button>
                  <button
                    type="button"
                    className="auth-social-btn"
                    disabled={loading}
                    onClick={() => void handleWebAuthn()}
                  >
                    This browser or a security key
                  </button>
                </div>

                <p className="auth-switch" style={{ marginTop: '20px', textAlign: 'center' }}>
                  <button
                    type="button"
                    disabled={loading}
                    onClick={() => void handleSkipMfaSetup()}
                    style={{ background: 'none', border: 0, color: 'var(--text-secondary)', fontWeight: 600, cursor: 'pointer', textDecoration: 'underline' }}
                  >
                    Skip for now
                  </button>
                </p>

                <p className="auth-switch" style={{ marginTop: '12px' }}>
                  <button
                    type="button"
                    onClick={resetMfaUi}
                    style={{ background: 'none', border: 0, color: 'var(--primary-600)', fontWeight: 600, cursor: 'pointer' }}
                  >
                    Back to password
                  </button>
                </p>
              </>
            ) : (
              <>
                <div className="auth-form-header">
                  <h1>{mfa.setupRequired ? 'Set up authenticator' : 'Confirm it is you'}</h1>
                  <p>
                    {mfa.setupRequired
                      ? 'Scan the QR code with Google Authenticator or another TOTP app, then enter the six-digit code.'
                      : 'Enter the code from your authenticator app, or use this browser.'}
                  </p>
                </div>

                {generalError && (
                  <div className="auth-error" role="alert">
                    <span>{generalError}</span>
                  </div>
                )}

                {(mfa.setupRequired || !mfa.totpEnabled) && (
                  <div className="auth-notice-box" style={{ marginBottom: '16px' }}>
                    <div style={{ fontWeight: 600, marginBottom: '8px' }}>Authenticator app</div>
                    {qrDataUrl ? (
                      <img src={qrDataUrl} alt="Authenticator QR code" style={{ width: 160, height: 160, display: 'block', marginBottom: 8 }} />
                    ) : null}
                    {totpSecret ? (
                      <p style={{ fontSize: '13px', margin: '0 0 6px' }}>
                        Or enter this key by hand: <strong>{totpSecret}</strong>
                      </p>
                    ) : null}
                    {otpauthUrl ? (
                      <p style={{ fontSize: '12px', margin: 0, wordBreak: 'break-all' }}>{otpauthUrl}</p>
                    ) : null}
                  </div>
                )}

                <form onSubmit={handleTotpSubmit} className="auth-form">
                  <div className="field-group">
                    <label htmlFor="mfa-code">Six-digit code</label>
                    <div className="input-wrapper">
                      <input
                        id="mfa-code"
                        type="text"
                        inputMode="numeric"
                        autoComplete="one-time-code"
                        placeholder="123456"
                        value={mfaCode}
                        onChange={(e) => setMfaCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                        required
                        style={{ paddingLeft: 14 }}
                      />
                    </div>
                  </div>
                  <button type="submit" className="auth-submit" disabled={loading || mfaCode.length !== 6}>
                    {loading ? <span className="spinner" /> : (mfa.totpEnabled && !mfa.setupRequired ? 'Confirm code' : 'Save app and continue')}
                  </button>
                </form>

                {!mfa.setupRequired && (
                  <>
                    <div className="auth-divider">
                      <span>or</span>
                    </div>
                    <button type="button" className="auth-social-btn" onClick={() => void handleWebAuthn()} disabled={loading}>
                      Use this browser or a security key
                    </button>
                  </>
                )}

                <p className="auth-switch" style={{ marginTop: '20px' }}>
                  {mfa.setupRequired ? (
                    <button
                      type="button"
                      onClick={() => {
                        setSetupStep('chooser');
                        setMfaCode('');
                        setOtpauthUrl(null);
                        setTotpSecret(null);
                        setQrDataUrl(null);
                        setGeneralError('');
                      }}
                      style={{ background: 'none', border: 0, color: 'var(--primary-600)', fontWeight: 600, cursor: 'pointer' }}
                    >
                      Back to method choice
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={resetMfaUi}
                      style={{ background: 'none', border: 0, color: 'var(--primary-600)', fontWeight: 600, cursor: 'pointer' }}
                    >
                      Back to password
                    </button>
                  )}
                </p>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
