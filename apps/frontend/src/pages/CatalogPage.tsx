import { Link } from 'react-router-dom';
import { EXPERIMENT_REGISTRY } from '../experiments/registry';
import './Dashboard.css';

export function CatalogPage() {
  const totalCount = EXPERIMENT_REGISTRY.length;
  const interactiveCount = EXPERIMENT_REGISTRY.filter((s) => s.available).length;
  const catalogReadyCount = totalCount - interactiveCount;

  return (
    <div>
      <div className="dash-welcome">
        <div>
          <h1 className="dash-title">Canonical Experiment Catalog</h1>
          <p className="dash-subtitle">Standard university virtual physics laboratory simulations</p>
        </div>
        <div className="dash-stats-row">
          <div className="dash-mini-stat">
            <span className="dash-mini-val">{totalCount}</span>
            <span className="dash-mini-label">Canonical Labs</span>
          </div>
          <div className="dash-mini-stat">
            <span className="dash-mini-val">{interactiveCount}</span>
            <span className="dash-mini-label">Interactive</span>
          </div>
          <div className="dash-mini-stat">
            <span className="dash-mini-val">{catalogReadyCount}</span>
            <span className="dash-mini-label">Catalog Ready</span>
          </div>
        </div>
      </div>

      <div className="sessions-list">
        {EXPERIMENT_REGISTRY.map((s, i) => (
          <div
            key={s.id}
            className={`session-card ${s.available ? 'session-available' : 'session-locked'}`}
            style={{ animationDelay: `${i * 0.05}s` }}
          >
            <div className="session-number">
              <span>{String(i + 1).padStart(2, '0')}</span>
            </div>

            <div className="session-info">
              <span className="session-code">{s.code} • ID: {s.id}</span>
              <h3 className="session-title">{s.title}</h3>
            </div>

            <div className="session-action">
              {s.available ? (
                <span className="session-status status-live">
                  <span className="status-pulse" />
                  Live Simulation
                </span>
              ) : (
                <span className="session-status status-soon">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect width="18" height="11" x="3" y="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
                  Catalog Spec
                </span>
              )}

              {s.available ? (
                <Link to={s.path} className="session-launch-btn">
                  Launch Simulation
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg>
                </Link>
              ) : (
                <span className="session-launch-btn disabled">
                  Specification Ready
                </span>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export const CANONICAL_EXPERIMENT_OPTIONS = EXPERIMENT_REGISTRY;
