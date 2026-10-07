import { Link } from 'react-router-dom';
import './Dashboard.css';

const CANONICAL_EXPERIMENTS = [
  { id: 'ohms-law', code: 'Session 01', title: 'Introductory Session — Ohm\'s Law', path: '/experiments/ohms-law', available: true },
  { id: 'lattice-constant', code: 'Session 02', title: 'Determination of Lattice Constant', path: '', available: false },
  { id: 'lycopodium-laser', code: 'Session 03', title: 'Determination of Particle Size of Lycopodium Powder Using Laser', path: '', available: false },
  { id: 'youngs-modulus', code: 'Session 04', title: 'Determination of Young\'s Modulus — Uniform Bending Method', path: '', available: false },
  { id: 'creep-constant', code: 'Session 05', title: 'Determination of Creep Constant', path: '/experiments/creep-constant', available: true },
  { id: 'hall-effect', code: 'Session 06', title: 'Determination of Hall Coefficient Using Hall Effect', path: '', available: false },
  { id: 'plancks-constant', code: 'Session 07', title: 'Determination of Planck\'s Constant', path: '', available: false },
  { id: 'solar-cell', code: 'Session 08', title: 'Solar Cell Characteristics', path: '', available: false },
];

export function CatalogPage() {
  return (
    <div>
      <div className="dash-welcome">
        <div>
          <h1 className="dash-title">Canonical Experiment Catalog</h1>
          <p className="dash-subtitle">Eight standard university virtual physics laboratory simulations</p>
        </div>
        <div className="dash-stats-row">
          <div className="dash-mini-stat">
            <span className="dash-mini-val">8</span>
            <span className="dash-mini-label">Canonical Labs</span>
          </div>
          <div className="dash-mini-stat">
            <span className="dash-mini-val">2</span>
            <span className="dash-mini-label">Interactive</span>
          </div>
          <div className="dash-mini-stat">
            <span className="dash-mini-val">6</span>
            <span className="dash-mini-label">Catalog Ready</span>
          </div>
        </div>
      </div>

      <div className="sessions-list">
        {CANONICAL_EXPERIMENTS.map((s, i) => (
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

export const CANONICAL_EXPERIMENT_OPTIONS = CANONICAL_EXPERIMENTS;
