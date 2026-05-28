import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../../context/ThemeContext';
import { useCreep } from '../../hooks/useCreep';
import { CreepScene } from './CreepScene';
import { CreepChart } from './CreepChart';
import './Creep.css';

const sidebarTabs = [
  'Introduction',
  'Objective',
  'Theory',
  'Formula',
  'Simulation',
  'Conclusion',
  'Feedback',
];

/* ── Navbar ── */
function ExperimentNavbar() {
  const navigate = useNavigate();
  const { theme, toggleTheme } = useTheme();
  return (
    <nav className="exp-navbar">
      <a className="exp-navbar__logo" href="/">
        <div className="exp-navbar__logo-icon">KL</div>
        <div className="exp-navbar__logo-text">
          <span className="exp-navbar__logo-title">Virtual Labs</span>
          <span className="exp-navbar__logo-subtitle">KL University</span>
        </div>
      </a>
      <div className="exp-navbar__links">
        <button
          className="exp-navbar__link exp-navbar__theme-btn"
          onClick={toggleTheme}
          title={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
        >
          {theme === 'light' ? (
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="5" />
              <line x1="12" y1="1" x2="12" y2="3" />
              <line x1="12" y1="21" x2="12" y2="23" />
              <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
              <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
              <line x1="1" y1="12" x2="3" y2="12" />
              <line x1="21" y1="12" x2="23" y2="12" />
              <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
              <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
            </svg>
          ) : (
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
            </svg>
          )}
        </button>
        <button
          className="exp-navbar__link exp-navbar__link--back"
          onClick={() => navigate('/dashboard')}
        >
          ← Dashboard
        </button>
        <button className="exp-navbar__link" onClick={() => navigate('/')}>
          Home
        </button>
      </div>
    </nav>
  );
}

/* ── Content Sections ── */
function SectionContent({ title, text }: { title: string; text: string }) {
  return (
    <div className="vlabs-section">
      <h2 className="vlabs-section__title">{title}</h2>
      <div className="vlabs-section__body">{text}</div>
    </div>
  );
}

function FeedbackSection() {
  const [text, setText] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async () => {
    if (!text.trim()) return;
    try {
      await fetch('/api/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ experiment_slug: 'creep', message: text }),
      });
    } catch {
      // silently handle
    }
    setSubmitted(true);
    setText('');
    setTimeout(() => setSubmitted(false), 3000);
  };

  return (
    <div className="vlabs-feedback">
      <h2 className="vlabs-feedback__title">Feedback</h2>
      <textarea
        className="vlabs-feedback__textarea"
        rows={4}
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="Share your feedback about this experiment…"
      />
      <div className="vlabs-feedback__actions">
        <button
          className="vlabs-feedback__btn"
          onClick={handleSubmit}
          disabled={!text.trim()}
        >
          Submit Feedback
        </button>
        {submitted && <span className="vlabs-feedback__success">✓ Feedback submitted!</span>}
      </div>
    </div>
  );
}

/* ── Reading row type ── */
interface Reading {
  id: number;
  timeMin: number;
  timeSec: number;
  timeOneThird: number;
  instantaneousLength: number;
  elongation: number;
  deltaLOverL0: number;
  deltaLOverLt: number;
}

/* ── Simulation Tab ── */
function SimulationSection({
  initialLength, setInitialLength,
  loadMass, setLoadMass,
  totalDuration, setTotalDuration,
  interval, setInterval,
  materialType, setMaterialType,
  simulationData,
  currentFrameIdx, setCurrentFrameIdx,
  isPlaying, setIsPlaying,
  hasSnapped,
  runSimulation,
}: any) {
  const [readings, setReadings] = useState<Reading[]>([]);
  const animRef = useRef<number | null>(null);

  const addReading = () => {
    if (!simulationData || !simulationData.history) return;
    const frame = simulationData.history[currentFrameIdx];
    setReadings(prev => [
      ...prev,
      {
        id: prev.length + 1,
        timeMin: frame.timeMinutes,
        timeSec: frame.timeSeconds,
        timeOneThird: frame.timeOneThird,
        instantaneousLength: frame.instantaneousLength,
        elongation: frame.elongation,
        deltaLOverL0: frame.deltaLOverL0,
        deltaLOverLt: frame.deltaLOverLt,
      },
    ]);
  };

  const clearReadings = () => setReadings([]);

  const removeReading = (id: number) => {
    setReadings(prev => {
      const filtered = prev.filter(r => r.id !== id);
      return filtered.map((r, i) => ({ ...r, id: i + 1 }));
    });
  };

  useEffect(() => {
    if (isPlaying && simulationData && !hasSnapped) {
      const maxIdx = simulationData.history.length - 1;
      const step = () => {
        setCurrentFrameIdx((prev: number) => {
          if (prev >= maxIdx) {
            setIsPlaying(false);
            return prev;
          }
          return prev + 1;
        });
      };
      animRef.current = window.setInterval(step, 200);
    }
    return () => {
      if (animRef.current) clearInterval(animRef.current);
    };
  }, [isPlaying, simulationData, hasSnapped]);

  const handlePlayPause = () => {
    if (hasSnapped) {
      setCurrentFrameIdx(0);
      setIsPlaying(true);
    } else {
      setIsPlaying(!isPlaying);
    }
  };

  const handleReset = () => {
    setIsPlaying(false);
    setCurrentFrameIdx(0);
  };

  return (
    <div className="creep-sim-layout">
      <div className="creep-canvas-area">
        <CreepScene
          materialType={materialType}
          initialLength={initialLength}
          simulationData={simulationData}
          currentFrameIdx={currentFrameIdx}
          hasSnapped={hasSnapped}
        />

        {simulationData && (
          <div className="creep-anim-bar">
            <div className="creep-anim-info">
              <span>t = {simulationData.history[currentFrameIdx].timeMinutes.toFixed(1)} min</span>
              <span>L = {simulationData.history[currentFrameIdx].instantaneousLength.toFixed(4)} cm</span>
              <span>ΔL = {simulationData.history[currentFrameIdx].elongation.toFixed(5)} cm</span>
            </div>
            <div className="creep-anim-buttons">
              <button className="vlabs-anim-btn" onClick={handleReset}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polyline points="1 4 1 10 7 10" />
                  <path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10" />
                </svg>
              </button>
              <button className="vlabs-anim-btn vlabs-anim-btn--play" onClick={handlePlayPause}>
                {isPlaying ? (
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                    <rect x="6" y="4" width="4" height="16" />
                    <rect x="14" y="4" width="4" height="16" />
                  </svg>
                ) : (
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                    <polygon points="5,3 19,12 5,21" />
                  </svg>
                )}
              </button>
            </div>
            <input
              className="vlabs-anim-slider"
              type="range"
              min={0}
              max={simulationData.history.length - 1}
              value={currentFrameIdx}
              onChange={e => {
                setIsPlaying(false);
                setCurrentFrameIdx(Number(e.target.value));
              }}
            />
          </div>
        )}
      </div>

      <div className="creep-side-panel">
        <div className="creep-panel-scroll">
          <div className="creep-panel-section">
            <div className="exp-simulation__panel-label">Parameters</div>

            <div className="vlabs-select">
              <span className="vlabs-select__label">Material</span>
              <select
                className="vlabs-select__input"
                value={materialType}
                onChange={e => setMaterialType(e.target.value)}
              >
                <option value="lead">Lead</option>
                <option value="copper">Copper</option>
                <option value="aluminum">Aluminum</option>
              </select>
            </div>

            <div className="vlabs-slider">
              <span className="vlabs-slider__label">Length</span>
              <input
                className="vlabs-slider__input"
                type="range"
                min={10} max={30} step={0.5}
                value={initialLength}
                onChange={e => setInitialLength(parseFloat(e.target.value))}
              />
              <span className="vlabs-slider__value">{initialLength} cm</span>
            </div>

            <div className="vlabs-slider">
              <span className="vlabs-slider__label">Mass</span>
              <input
                className="vlabs-slider__input"
                type="range"
                min={50} max={500} step={10}
                value={loadMass}
                onChange={e => setLoadMass(parseFloat(e.target.value))}
              />
              <span className="vlabs-slider__value">{loadMass} g</span>
            </div>

            <div className="vlabs-slider">
              <span className="vlabs-slider__label">Duration</span>
              <input
                className="vlabs-slider__input"
                type="range"
                min={10} max={120} step={5}
                value={totalDuration}
                onChange={e => setTotalDuration(parseFloat(e.target.value))}
              />
              <span className="vlabs-slider__value">{totalDuration} min</span>
            </div>

            <div className="vlabs-slider">
              <span className="vlabs-slider__label">Interval</span>
              <input
                className="vlabs-slider__input"
                type="range"
                min={1} max={10} step={1}
                value={interval}
                onChange={e => setInterval(parseFloat(e.target.value))}
              />
              <span className="vlabs-slider__value">{interval} min</span>
            </div>

            <button className="vlabs-run-btn" onClick={runSimulation}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polygon points="5,3 19,12 5,21" />
              </svg>
              Run Simulation
            </button>
          </div>

          {simulationData && (
            <div className="creep-panel-section">
              <div className="exp-simulation__panel-label">Results</div>
              <div className="creep-result-grid">
                <div className="creep-result-item">
                  <span className="creep-result-label">β</span>
                  <span className="creep-result-value">{simulationData.beta.toExponential(3)}</span>
                </div>
                <div className="creep-result-item">
                  <span className="creep-result-label">k</span>
                  <span className="creep-result-value">{simulationData.k.toExponential(3)}</span>
                </div>
              </div>
              <button className="vlabs-record-btn" onClick={addReading} style={{ marginTop: '12px', width: '100%' }}>
                <span className="vlabs-record-btn__icon">+</span>
                Record Reading
              </button>
            </div>
          )}

          {simulationData && (
            <div className="creep-panel-section">
              <div className="exp-simulation__panel-label">Graphs</div>
              <CreepChart
                simulationData={simulationData}
                materialType={materialType}
              />
            </div>
          )}

          <div className="creep-panel-section">
            <div className="exp-simulation__panel-label">Formulas</div>
            <div className="vlabs-formula-bar" style={{ flexDirection: 'column', gap: '8px' }}>
              <span>
                <span className="vlabs-formula-bar__label">Transient:&nbsp;</span>
                <span className="vlabs-formula-bar__expr">Δl_t = β·l₀·t^(1/3)</span>
              </span>
              <span>
                <span className="vlabs-formula-bar__label">Viscous:&nbsp;</span>
                <span className="vlabs-formula-bar__expr">Δl_v = k·l_t·t</span>
              </span>
            </div>
          </div>
          <div className="creep-panel-section">
            <div className="vlabs-observations">
              <div className="vlabs-observations__header">
                <h3 className="vlabs-observations__title">
                  Observation Table
                  {readings.length > 0 && (
                    <span className="vlabs-observations__count">{readings.length} reading{readings.length !== 1 ? 's' : ''}</span>
                  )}
                </h3>
                {readings.length > 0 && (
                  <button className="vlabs-observations__clear" onClick={clearReadings}>
                    Clear All
                  </button>
                )}
              </div>

              {readings.length === 0 ? (
                <div className="vlabs-observations__empty">
                  <span className="vlabs-observations__empty-icon">📋</span>
                  <p>No readings recorded yet.</p>
                  <p>Run the simulation and click <strong>Record Reading</strong> to add an observation.</p>
                </div>
              ) : (
                <div className="vlabs-observations__table-wrap">
                  <table className="vlabs-observations__table">
                    <thead>
                      <tr>
                        <th>S.No</th>
                        <th>t (min)</th>
                        <th>t (sec)</th>
                        <th>t^(1/3)</th>
                        <th>l_t (cm)</th>
                        <th>Δl (cm)</th>
                        <th>Δl/l₀</th>
                        <th>Δl/l_t</th>
                        <th></th>
                      </tr>
                    </thead>
                    <tbody>
                      {readings.map((r) => (
                        <tr key={r.id} className="vlabs-observations__row">
                          <td>{r.id}</td>
                          <td>{r.timeMin.toFixed(1)}</td>
                          <td>{r.timeSec.toFixed(0)}</td>
                          <td>{r.timeOneThird.toFixed(3)}</td>
                          <td>{r.instantaneousLength.toFixed(4)}</td>
                          <td className="vlabs-observations__highlight">{r.elongation.toFixed(5)}</td>
                          <td>{r.deltaLOverL0.toFixed(6)}</td>
                          <td>{r.deltaLOverLt.toFixed(6)}</td>
                          <td>
                            <button
                              className="vlabs-observations__remove"
                              onClick={() => removeReading(r.id)}
                              title="Remove reading"
                            >
                              ×
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ===== Main Creep Component ===== */
export function Creep() {
  const [activeTab, setActiveTab] = useState(0);
  const {
    initialLength, setInitialLength,
    loadMass, setLoadMass,
    totalDuration, setTotalDuration,
    interval, setInterval,
    materialType, setMaterialType,
    simulationData,
    currentFrameIdx, setCurrentFrameIdx,
    isPlaying, setIsPlaying,
    hasSnapped,
    runSimulation,
    data,
    loading,
    error,
  } = useCreep({
    initialLength: 15,
    loadMass: 200,
    totalDuration: 60,
    interval: 5,
    materialType: 'lead',
  });

  if (loading) {
    return (
      <div style={{ height: '100vh', background: '#fff', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <ExperimentNavbar />
        <div className="exp-loading">
          <div className="exp-loading__spinner" />
          Loading experiment…
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ height: '100vh', background: '#fff', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <ExperimentNavbar />
        <div className="exp-loading" style={{ color: '#e74c3c' }}>Error: {error}</div>
      </div>
    );
  }

  const renderContent = () => {
    switch (activeTab) {
      case 0:
        return <SectionContent title="Introduction" text={data?.overview ?? 'The creep experiment studies the time-dependent deformation of materials under constant load.'} />;
      case 1:
        return <SectionContent title="Objective" text={data?.aim ?? 'To determine the transient creep constant (β) and viscous creep constant (k) for different wire materials.'} />;
      case 2:
        return <SectionContent title="Theory" text={data?.theory ?? 'Creep is the tendency of a solid material to move slowly or deform permanently under mechanical stresses. It occurs as a result of long-term exposure to high levels of stress that are below the yield strength of the material.'} />;
      case 3:
        return <SectionContent title="Formula" text={data?.formula ?? 'Transient Creep: Δl_t = β·l₀·t^(1/3)\nViscous Creep: Δl_v = k·l_t·t\nTotal Elongation: Δl = Δl_t + Δl_v'} />;
      case 4:
        return (
          <SimulationSection
            initialLength={initialLength} setInitialLength={setInitialLength}
            loadMass={loadMass} setLoadMass={setLoadMass}
            totalDuration={totalDuration} setTotalDuration={setTotalDuration}
            interval={interval} setInterval={setInterval}
            materialType={materialType} setMaterialType={setMaterialType}
            simulationData={simulationData}
            currentFrameIdx={currentFrameIdx}
            setCurrentFrameIdx={setCurrentFrameIdx}
            isPlaying={isPlaying}
            setIsPlaying={setIsPlaying}
            hasSnapped={hasSnapped}
            runSimulation={runSimulation}
          />
        );
      case 5:
        return <SectionContent title="Conclusion" text={data?.conclusion ?? 'The creep constants β and k characterize the material\'s resistance to time-dependent deformation.'} />;
      case 6:
        return <FeedbackSection />;
      default:
        return null;
    }
  };

  return (
    <div style={{ height: '100vh', background: '#fff', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      <ExperimentNavbar />

      {/* Breadcrumb header */}
      <div className="exp-header">
        <div className="exp-header__breadcrumb">
          <a href="/dashboard">Physical Sciences</a>
          <span className="exp-header__breadcrumb-sep">›</span>
          <span>Creep Behavior</span>
        </div>
        <h1 className="exp-header__title">Creep Behavior Virtual Lab</h1>
      </div>

      {/* Body: sidebar + content */}
      <div className="exp-body">
        <aside className="exp-sidebar">
          <nav className="exp-sidebar__nav">
            {sidebarTabs.map((tab, i) => (
              <button
                key={tab}
                className={`exp-sidebar__item${activeTab === i ? ' exp-sidebar__item--active' : ''}`}
                onClick={() => setActiveTab(i)}
              >
                {tab}
              </button>
            ))}
          </nav>
        </aside>

        <main className={`exp-content${activeTab === 4 ? ' exp-content--simulation' : ''}`} key={activeTab}>
          {renderContent()}
        </main>
      </div>
    </div>
  );
}
