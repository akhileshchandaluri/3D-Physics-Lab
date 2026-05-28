import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import './Dashboard.css';

const sessions = [
  { id: 1, code: 'Session 01', title: 'Introductory Session — Ohm\'s Law', path: '/experiments/ohms-law', available: true },
  { id: 2, code: 'Session 02', title: 'Determination of Lattice Constant', path: '', available: false },
  { id: 3, code: 'Session 03', title: 'Determination of Particle Size of Lycopodium Powder Using Laser', path: '', available: false },
  { id: 4, code: 'Session 04', title: 'Determination of Young\'s Modulus — Uniform Bending Method', path: '', available: false },
  { id: 5, code: 'Session 05', title: 'Determination of Creep Constant', path: '/experiments/creep', available: true },
  { id: 6, code: 'Session 06', title: 'Determination of Hall Coefficient Using Hall Effect', path: '', available: false },
  { id: 7, code: 'Session 07', title: 'Determination of Planck\'s Constant', path: '', available: false },
  { id: 8, code: 'Session 08', title: 'Solar Cell Characteristics', path: '', available: false },
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
    <div className="dashboard">
      {/* Background */}
      <div className="dash-bg">
        <div className="dash-orb dash-orb-1" />
        <div className="dash-orb dash-orb-2" />
      </div>

      {/* Top bar */}
      <header className="dash-header">
        <div className="dash-header-inner">
          <Link to="/" className="dash-brand">
            <img src="/klulogo.png" alt="KLU Logo" className="brand-logo-img" />
            <span>Virtual Labs</span>
          </Link>
          <div className="dash-user-area">
            <div className="dash-avatar">{user?.name?.[0]?.toUpperCase() ?? 'U'}</div>
            <div className="dash-user-info">
              <span className="dash-user-name">{user?.name ?? 'Student'}</span>
              <span className="dash-user-email">{user?.email ?? ''}</span>
            </div>
            <button className="theme-toggle" onClick={toggleTheme} aria-label="Toggle theme">
              {theme === 'light' ? (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z"/></svg>
              ) : (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="4"/><path d="M12 2v2"/><path d="M12 20v2"/><path d="m4.93 4.93 1.41 1.41"/><path d="m17.66 17.66 1.41 1.41"/><path d="M2 12h2"/><path d="M20 12h2"/><path d="m6.34 17.66-1.41 1.41"/><path d="m19.07 4.93-1.41 1.41"/></svg>
              )}
            </button>
            <button className="dash-logout" onClick={handleLogout}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
              Log Out
            </button>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="dash-main">
        <div className="dash-main-inner">
          {/* Welcome */}
          <div className="dash-welcome">
            <div>
              <h1 className="dash-title">Lab Sessions</h1>
              <p className="dash-subtitle">Select an experiment to begin your virtual lab session</p>
            </div>
            <div className="dash-stats-row">
              <div className="dash-mini-stat">
                <span className="dash-mini-val">11</span>
                <span className="dash-mini-label">Total Sessions</span>
              </div>
              <div className="dash-mini-stat">
                <span className="dash-mini-val">2</span>
                <span className="dash-mini-label">Available</span>
              </div>
              <div className="dash-mini-stat">
                <span className="dash-mini-val">9</span>
                <span className="dash-mini-label">Coming Soon</span>
              </div>
            </div>
          </div>

          {/* Sessions list */}
          <div className="sessions-list">
            {sessions.map((s, i) => (
              <div
                key={s.id}
                className={`session-card ${s.available ? 'session-available' : 'session-locked'}`}
                style={{ animationDelay: `${i * 0.05}s` }}
              >
                <div className="session-number">
                  <span>{String(s.id).padStart(2, '0')}</span>
                </div>

                <div className="session-info">
                  <span className="session-code">{s.code}</span>
                  <h3 className="session-title">{s.title}</h3>
                </div>

                <div className="session-action">
                  {s.available ? (
                    <span className="session-status status-live">
                      <span className="status-pulse" />
                      Live
                    </span>
                  ) : (
                    <span className="session-status status-soon">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect width="18" height="11" x="3" y="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
                      Coming Soon
                    </span>
                  )}

                  {s.available ? (
                    <Link to={s.path} className="session-launch-btn">
                      Launch Simulation
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg>
                    </Link>
                  ) : (
                    <span className="session-launch-btn disabled">
                      Not Available Yet
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}
