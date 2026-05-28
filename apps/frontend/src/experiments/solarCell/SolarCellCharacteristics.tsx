import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../../context/ThemeContext';
import { useSolarCell, type SolarObservation } from '../../hooks/useSolarCell';
import { SolarCircuitBuilder } from './SolarCircuitBuilder';
import { SolarSimulationPanel } from './SolarSimulationPanel';
import { SolarGraphs } from './SolarGraphs';
import '../ohmsLaw/OhmsLaw.css';
import './SolarCell.css';

const sidebarTabs = [
  'Introduction',
  'Objective',
  'Theory',
  'Formula',
  'Circuit Builder',
  'Simulation',
  'Observation Table',
  'Graph',
  'Conclusion',
  'Feedback',
];

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
          {theme === 'light' ? '☀' : '☾'}
        </button>
        <button className="exp-navbar__link exp-navbar__link--back" onClick={() => navigate('/dashboard')}>
          ← Dashboard
        </button>
        <button className="exp-navbar__link" onClick={() => navigate('/')}>
          Home
        </button>
      </div>
    </nav>
  );
}

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
        body: JSON.stringify({ experiment_slug: 'solar-cell-characteristics', message: text }),
      });
    } catch {
      // no-op
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
        placeholder="Share your feedback about this experiment..."
      />
      <div className="vlabs-feedback__actions">
        <button className="vlabs-feedback__btn" onClick={handleSubmit} disabled={!text.trim()}>
          Submit Feedback
        </button>
        {submitted && <span className="vlabs-feedback__success">✓ Feedback submitted!</span>}
      </div>
    </div>
  );
}

export function SolarCellCharacteristics() {
  const [activeTab, setActiveTab] = useState(0);
  const [circuitValid, setCircuitValid] = useState(false);
  const [circuitMessage, setCircuitMessage] = useState('Build the circuit to continue.');
  const [readings, setReadings] = useState<SolarObservation[]>([]);
  const {
    lightIntensity,
    setLightIntensity,
    rheostatResistance,
    setRheostatResistance,
    loadResistance,
    setLoadResistance,
    isExperimentStarted,
    startExperiment,
    simulationResult,
    data,
    loading,
    error,
  } = useSolarCell();

  const addReading = () => {
    if (!isExperimentStarted) return;
    setReadings((prev) => [
      ...prev,
      {
        id: prev.length + 1,
        trial: prev.length + 1,
        lightIntensity,
        resistance: rheostatResistance + loadResistance,
        voltage: simulationResult.voltage,
        current: simulationResult.current,
        power: simulationResult.power,
      },
    ]);
  };

  const removeReading = (id: number) => {
    setReadings((prev) => prev.filter((r) => r.id !== id).map((r, idx) => ({ ...r, id: idx + 1, trial: idx + 1 })));
  };

  if (loading) {
    return (
      <div style={{ height: '100vh', background: '#fff', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <ExperimentNavbar />
        <div className="exp-loading">
          <div className="exp-loading__spinner" />
          Loading experiment...
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
          <div className="exp-simulation">
            <h2 className="exp-simulation__title">Guided Circuit Builder</h2>
            <SolarCircuitBuilder
              onValidityChange={(valid, message) => {
                setCircuitValid(valid);
                setCircuitMessage(message);
              }}
            />
            <div className="solar-builder-actions">
              <span className={`solar-status${circuitValid ? ' valid' : ''}`}>{circuitMessage}</span>
              <button
                className="vlabs-run-btn"
                disabled={!circuitValid}
                onClick={async () => {
                  await startExperiment();
                  setActiveTab(5);
                }}
              >
                Start Experiment
              </button>
            </div>
          </div>
        );
      case 5:
        return (
          <div className="exp-simulation">
            <h2 className="exp-simulation__title">Simulation</h2>
            {!isExperimentStarted && (
              <div className="solar-warning">Complete the circuit in the Circuit Builder tab to enable simulation.</div>
            )}
            <div className="exp-simulation__grid">
              <div className="exp-simulation__panel">
                <div className="exp-simulation__panel-label">Controls</div>
                <div className="vlabs-slider">
                  <span className="vlabs-slider__label">Light Intensity</span>
                  <input
                    className="vlabs-slider__input"
                    type="range"
                    min={20}
                    max={150}
                    step={1}
                    value={lightIntensity}
                    disabled={!isExperimentStarted}
                    onChange={(e) => setLightIntensity(Number(e.target.value))}
                  />
                  <span className="vlabs-slider__value">{lightIntensity}%</span>
                </div>
                <div className="vlabs-slider">
                  <span className="vlabs-slider__label">Rheostat</span>
                  <input
                    className="vlabs-slider__input"
                    type="range"
                    min={1}
                    max={120}
                    step={1}
                    value={rheostatResistance}
                    disabled={!isExperimentStarted}
                    onChange={(e) => setRheostatResistance(Number(e.target.value))}
                  />
                  <span className="vlabs-slider__value">{rheostatResistance} Ω</span>
                </div>
                <div className="vlabs-slider">
                  <span className="vlabs-slider__label">Load Resistance</span>
                  <input
                    className="vlabs-slider__input"
                    type="range"
                    min={1}
                    max={200}
                    step={1}
                    value={loadResistance}
                    disabled={!isExperimentStarted}
                    onChange={(e) => setLoadResistance(Number(e.target.value))}
                  />
                  <span className="vlabs-slider__value">{loadResistance} Ω</span>
                </div>
                <button className="vlabs-record-btn" onClick={addReading} disabled={!isExperimentStarted}>
                  <span className="vlabs-record-btn__icon">+</span>
                  Record Reading
                </button>
              </div>
              <div className="exp-simulation__panel">
                <SolarSimulationPanel
                  voltage={simulationResult.voltage}
                  current={simulationResult.current}
                  power={simulationResult.power}
                  lightIntensity={lightIntensity}
                  isRunning={isExperimentStarted}
                />
              </div>
            </div>
          </div>
        );
      case 6:
        return (
          <div className="vlabs-observations">
            <div className="vlabs-observations__header">
              <h3 className="vlabs-observations__title">Observation Table</h3>
              {readings.length > 0 && (
                <button className="vlabs-observations__clear" onClick={() => setReadings([])}>
                  Clear All
                </button>
              )}
            </div>
            {readings.length === 0 ? (
              <div className="vlabs-observations__empty">
                <span className="vlabs-observations__empty-icon">📋</span>
                <p>No readings recorded yet.</p>
              </div>
            ) : (
              <div className="vlabs-observations__table-wrap">
                <table className="vlabs-observations__table">
                  <thead>
                    <tr>
                      <th>Trial</th>
                      <th>Light Intensity</th>
                      <th>Resistance</th>
                      <th>Voltage</th>
                      <th>Current</th>
                      <th>Power</th>
                      <th />
                    </tr>
                  </thead>
                  <tbody>
                    {readings.map((reading) => (
                      <tr key={reading.id}>
                        <td>{reading.trial}</td>
                        <td>{reading.lightIntensity}%</td>
                        <td>{reading.resistance.toFixed(1)} Ω</td>
                        <td>{reading.voltage.toFixed(3)} V</td>
                        <td>{reading.current.toFixed(3)} A</td>
                        <td>{reading.power.toFixed(3)} W</td>
                        <td>
                          <button className="vlabs-observations__remove" onClick={() => removeReading(reading.id)}>
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
        );
      case 7:
        return (
          <div className="exp-simulation">
            <SolarGraphs
              simulationResult={simulationResult}
              livePointVoltage={simulationResult.voltage}
              livePointCurrent={simulationResult.current}
            />
          </div>
        );
      case 8:
        return <SectionContent title="Conclusion" text={data?.conclusion ?? ''} />;
      case 9:
        return <FeedbackSection />;
      default:
        return null;
    }
  };

  return (
    <div style={{ height: '100vh', background: '#fff', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      <ExperimentNavbar />
      <div className="exp-header">
        <div className="exp-header__breadcrumb">
          <a href="/dashboard">Physical Sciences</a>
          <span className="exp-header__breadcrumb-sep">›</span>
          <span>Solar Cell Characteristics</span>
        </div>
        <h1 className="exp-header__title">Solar Cell Characteristics Virtual Lab</h1>
      </div>

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
