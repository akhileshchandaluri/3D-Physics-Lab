import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../../context/ThemeContext';
import { useOhmsLaw } from '../../hooks/useOhmsLaw';
import { CircuitDiagram } from './CircuitDiagram';
import { IVChart } from './IVChart';
import './OhmsLaw.css';

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
        body: JSON.stringify({ experiment_slug: 'ohms-law', message: text }),
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
  voltage: number;
  resistance: number;
  effectiveResistance: number;
  currentMa: number;
  power: number;
  temperature: number;
}

/* ── Simulation Tab ── */
function SimulationSection({
  voltage, setVoltage,
  resistance, setResistance,
  temperature, setTemperature,
  currentMa, effectiveResistance, power,
  brightnessRatio, ivCurve,
}: any) {
  const [readings, setReadings] = useState<Reading[]>([]);

  const addReading = () => {
    setReadings(prev => [
      ...prev,
      {
        id: prev.length + 1,
        voltage,
        resistance,
        effectiveResistance,
        currentMa,
        power,
        temperature,
      },
    ]);
  };

  const clearReadings = () => setReadings([]);

  const removeReading = (id: number) => {
    setReadings(prev => {
      const filtered = prev.filter(r => r.id !== id);
      // Re-number sequentially
      return filtered.map((r, i) => ({ ...r, id: i + 1 }));
    });
  };

  return (
    <div className="exp-simulation">
      <div className="exp-simulation__header">
        <span className="exp-simulation__session">Session 02</span>
        <h2 className="exp-simulation__title">Ohm's Law Simulator</h2>
      </div>

      <div className="exp-simulation__grid">
        {/* Controls Panel */}
        <div className="exp-simulation__panel">
          <div className="exp-simulation__panel-label">Controls</div>

          <div className="vlabs-slider">
            <span className="vlabs-slider__label">Voltage</span>
            <input
              className="vlabs-slider__input"
              type="range"
              min={0} max={24} step={0.5}
              value={voltage}
              onChange={e => setVoltage(parseFloat(e.target.value))}
            />
            <span className="vlabs-slider__value">{voltage} V</span>
          </div>

          <div className="vlabs-slider">
            <span className="vlabs-slider__label">Resistance</span>
            <input
              className="vlabs-slider__input"
              type="range"
              min={10} max={1000} step={10}
              value={resistance}
              onChange={e => setResistance(parseFloat(e.target.value))}
            />
            <span className="vlabs-slider__value">{resistance} Ω</span>
          </div>

          <div className="vlabs-slider">
            <span className="vlabs-slider__label">Temperature</span>
            <input
              className="vlabs-slider__input"
              type="range"
              min={25} max={200} step={5}
              value={temperature}
              onChange={e => setTemperature(parseFloat(e.target.value))}
            />
            <span className="vlabs-slider__value">{temperature} °C</span>
          </div>

          <div style={{ marginTop: '20px' }}>
            <div className="exp-simulation__panel-label">Circuit Diagram</div>
            <CircuitDiagram
              brightnessRatio={brightnessRatio}
              voltage={voltage}
              resistance={resistance}
            />
          </div>
        </div>

        {/* Visualization Panel */}
        <div className="exp-simulation__panel">
          <div className="exp-simulation__panel-label">I-V Characteristic</div>
          <IVChart
            ivCurve={ivCurve}
            resistance={resistance}
            temperature={temperature}
          />
        </div>
      </div>

      {/* Result Cards + Record Button */}
      <div className="exp-simulation__results-row">
        <div className="exp-simulation__results">
          <div className="vlabs-result-card">
            <div className="vlabs-result-card__label">Voltage</div>
            <div className="vlabs-result-card__value">
              <span className="vlabs-result-card__number">{voltage.toFixed(1)}</span>
              <span className="vlabs-result-card__unit">V</span>
            </div>
          </div>
          <div className="vlabs-result-card vlabs-result-card--highlight">
            <div className="vlabs-result-card__label">Current</div>
            <div className="vlabs-result-card__value">
              <span className="vlabs-result-card__number">{currentMa.toFixed(2)}</span>
              <span className="vlabs-result-card__unit">mA</span>
            </div>
          </div>
          <div className="vlabs-result-card">
            <div className="vlabs-result-card__label">Resistance (eff.)</div>
            <div className="vlabs-result-card__value">
              <span className="vlabs-result-card__number">{Math.round(effectiveResistance)}</span>
              <span className="vlabs-result-card__unit">Ω</span>
            </div>
          </div>
          <div className="vlabs-result-card">
            <div className="vlabs-result-card__label">Power</div>
            <div className="vlabs-result-card__value">
              <span className="vlabs-result-card__number">{power.toFixed(3)}</span>
              <span className="vlabs-result-card__unit">W</span>
            </div>
          </div>
        </div>

        <button className="vlabs-record-btn" onClick={addReading} id="record-reading-btn">
          <span className="vlabs-record-btn__icon">+</span>
          Record Reading
        </button>
      </div>

      {/* Formula Bar */}
      <div className="vlabs-formula-bar">
        <span>
          <span className="vlabs-formula-bar__label">Current:&nbsp;</span>
          <span className="vlabs-formula-bar__expr">I = V / R</span>
        </span>
        <span>
          <span className="vlabs-formula-bar__label">Power:&nbsp;</span>
          <span className="vlabs-formula-bar__expr">P = V × I</span>
        </span>
        <span>
          <span className="vlabs-formula-bar__label">Temp correction:&nbsp;</span>
          <span className="vlabs-formula-bar__expr">R(T) = R₀(1 + α·ΔT)</span>
        </span>
      </div>

      {/* Observations Table */}
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
            <p>Adjust the sliders and click <strong>Record Reading</strong> to add an observation.</p>
          </div>
        ) : (
          <div className="vlabs-observations__table-wrap">
            <table className="vlabs-observations__table">
              <thead>
                <tr>
                  <th>S.No</th>
                  <th>Voltage (V)</th>
                  <th>Resistance (Ω)</th>
                  <th>Eff. Resistance (Ω)</th>
                  <th>Current (mA)</th>
                  <th>Power (W)</th>
                  <th>Temp (°C)</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {readings.map((r) => (
                  <tr key={r.id} className="vlabs-observations__row">
                    <td>{r.id}</td>
                    <td>{r.voltage.toFixed(1)}</td>
                    <td>{r.resistance}</td>
                    <td>{Math.round(r.effectiveResistance)}</td>
                    <td className="vlabs-observations__highlight">{r.currentMa.toFixed(2)}</td>
                    <td>{r.power.toFixed(3)}</td>
                    <td>{r.temperature}</td>
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
  );
}

/* ===== Main OhmsLaw Component ===== */
export function OhmsLaw() {
  const [activeTab, setActiveTab] = useState(0);
  const {
    voltage, setVoltage,
    resistance, setResistance,
    temperature, setTemperature,
    currentMa,
    effectiveResistance,
    power,
    brightnessRatio,
    ivCurve,
    data,
    loading,
    error,
  } = useOhmsLaw({ voltage: 12, resistance: 200, temperature: 25 });

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
        return <SectionContent title="Introduction" text={data?.overview ?? ''} />;
      case 1:
        return <SectionContent title="Objective" text={data?.aim ?? ''} />;
      case 2:
        return <SectionContent title="Theory" text={data?.theory ?? ''} />;
      case 3:
        return <SectionContent title="Formula" text={data?.formula ?? ''} />;
      case 4:
        return (
          <SimulationSection
            voltage={voltage} setVoltage={setVoltage}
            resistance={resistance} setResistance={setResistance}
            temperature={temperature} setTemperature={setTemperature}
            currentMa={currentMa}
            effectiveResistance={effectiveResistance}
            power={power}
            brightnessRatio={brightnessRatio}
            ivCurve={ivCurve}
          />
        );
      case 5:
        return <SectionContent title="Conclusion" text={data?.conclusion ?? ''} />;
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
          <span>Ohm's Law</span>
        </div>
        <h1 className="exp-header__title">Ohm's Law Virtual Lab</h1>
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

        <main className="exp-content" key={activeTab}>
          {renderContent()}
        </main>
      </div>
    </div>
  );
}
