import type { CSSProperties } from 'react';
import { Link, NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import './Dashboard.css';

const AtomIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="1"/><path d="M20.2 20.2c2.04-2.03.02-7.36-4.5-11.9-4.54-4.52-9.87-6.54-11.9-4.5-2.04 2.03-.02 7.36 4.5 11.9 4.54 4.52 9.87 6.54 11.9 4.5Z"/><path d="M15.7 15.7c4.52-4.54 6.54-9.87 4.5-11.9-2.03-2.04-7.36-.02-11.9 4.5-4.52 4.54-6.54 9.87-4.5 11.9 2.03 2.04 7.36.02 11.9-4.5Z"/></svg>
);

const navStyle = ({ isActive }: { isActive: boolean }): CSSProperties => ({
  padding: '8px 16px',
  borderRadius: '8px',
  border: 'none',
  background: isActive ? 'var(--gradient-primary)' : 'transparent',
  color: '#fff',
  fontWeight: 600,
  fontSize: '13px',
  cursor: 'pointer',
  textDecoration: 'none',
  display: 'inline-block',
});

export function DashboardLayout() {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const isAdmin = user?.role === 'ADMIN';

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <div className="dashboard">
      <div className="dash-bg">
        <div className="dash-orb dash-orb-1" />
        <div className="dash-orb dash-orb-2" />
      </div>

      <header className="dash-header">
        <div className="dash-header-inner">
          <Link to="/dashboard" className="dash-brand">
            <div className="dash-brand-icon"><AtomIcon /></div>
            <span>PhySim Lab</span>
          </Link>

          <nav style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            <NavLink to="/dashboard" end style={navStyle}>
              Experiments Catalog
            </NavLink>
            <NavLink to="/dashboard/saved" style={navStyle}>
              Saved Experiments
            </NavLink>
            <NavLink to="/dashboard/classrooms" style={navStyle}>
              Classroom & Assignments
            </NavLink>
            {isAdmin && (
              <NavLink to="/dashboard/admin" style={navStyle}>
                Admin Console
              </NavLink>
            )}
          </nav>

          <div className="dash-user-area">
            <div className="dash-avatar">{user?.name?.[0]?.toUpperCase() ?? 'U'}</div>
            <div className="dash-user-info">
              <span className="dash-user-name">{user?.name ?? 'Student'}</span>
              <span className="dash-user-email">
                {user?.email ?? ''} • <strong style={{ color: 'var(--primary-600)' }}>{user?.role}</strong>
              </span>
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

      <main className="dash-main">
        <div className="dash-main-inner">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
