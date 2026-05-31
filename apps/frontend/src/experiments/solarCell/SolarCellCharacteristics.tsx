import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../../context/ThemeContext';
import { useSolarCell, type SolarObservation } from '../../hooks/useSolarCell';
import { SolarCircuitBuilder } from './SolarCircuitBuilder';
import { SolarSimulationPanel } from './SolarSimulationPanel';
import { SolarGraphs } from './SolarGraphs';
import '../ohmsLaw/OhmsLaw.css';
import '../creep/Creep.css';
import './SolarCell.css';

const SIMULATION_TAB = 8;

const sidebarTabs = [
  'Introduction',
  'Objective',
  'Apparatus',
  'Prerequisites',
  'Theory',
  'Formula',
  'Procedure',
  'Circuit Builder',
  'Simulation',
  'Observation Table',
  'Graph',
  'Precautions',
  'Conclusion',
  'Analysis',
  'Feedback',
];

function ModelGraphSection({
  description,
  imagePath,
}: {
  description: string;
  imagePath?: string;
}) {
  return (
    <div className="solar-model-graph-section">
      <h2 className="vlabs-section__title">Model Graph</h2>
      {imagePath && (
        <div className="solar-model-graph-section__figure">
          <img src={imagePath} alt="Model I-V characteristic graph" />
        </div>
      )}
      <div className="vlabs-section__body">{description}</div>
    </div>
  );
}

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

function SimulationSection({
  isExperimentStarted,
  lightIntensity,
  setLightIntensity,
  loadResistance,
  setLoadResistance,
  keyClosed,
  setKeyClosed,
  simulationResult,
  readings,
  addReading,
  removeReading,
  clearReadings,
  simulationComplete,
  onCompleteSimulation,
  openSectionsPanel,
  goToNextSection,
}: {
  isExperimentStarted: boolean;
  lightIntensity: number;
  setLightIntensity: (v: number) => void;
  loadResistance: number;
  setLoadResistance: (v: number) => void;
  keyClosed: boolean;
  setKeyClosed: (v: boolean) => void;
  simulationResult: ReturnType<typeof useSolarCell>['simulationResult'];
  readings: SolarObservation[];
  addReading: () => void;
  removeReading: (id: number) => void;
  clearReadings: () => void;
  simulationComplete: boolean;
  onCompleteSimulation: () => void;
  openSectionsPanel: () => void;
  goToNextSection: () => void;
}) {
  return (
    <div className="creep-sim-layout">
      <div className="creep-canvas-area">
        <div className="creep-nav-actions">
          <button className="creep-nav-btn" onClick={openSectionsPanel}>
            Open Sections
          </button>
          <button className="creep-nav-btn creep-nav-btn--primary" onClick={goToNextSection}>
            Next Page
          </button>
        </div>

        {!isExperimentStarted && (
          <div className="solar-canvas-placeholder">
            Complete the circuit in Circuit Builder, then start the experiment.
          </div>
        )}

        <SolarSimulationPanel
          voltage={simulationResult.voltage}
          current={simulationResult.current}
          power={simulationResult.power}
          lightIntensity={lightIntensity}
          isRunning={isExperimentStarted}
          fullscreen
        />
      </div>

      <div className="creep-side-panel">
        <div className="creep-panel-scroll">
          {!isExperimentStarted && (
            <div className="solar-warning">Complete the circuit in the Circuit Builder tab to enable simulation.</div>
          )}

          <div className="creep-panel-section">
            <div className="exp-simulation__panel-label">Parameters</div>
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
              <span className="vlabs-slider__label">Load (LOAD)</span>
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
            <div className="solar-key-toggle">
              <span className="vlabs-slider__label">Key (K)</span>
              <button
                type="button"
                className={`solar-key-btn${keyClosed ? ' solar-key-btn--closed' : ''}`}
                disabled={!isExperimentStarted}
                onClick={() => setKeyClosed(!keyClosed)}
              >
                {keyClosed ? 'Closed' : 'Open'}
              </button>
            </div>
          </div>

          <div className="creep-panel-section">
            <div className="exp-simulation__panel-label">Live Readings</div>
            <div className="creep-result-grid">
              <div className="creep-result-item">
                <span className="creep-result-label">Voltage</span>
                <span className="creep-result-value">{simulationResult.voltage.toFixed(3)} V</span>
              </div>
              <div className="creep-result-item">
                <span className="creep-result-label">Current</span>
                <span className="creep-result-value">{simulationResult.current.toFixed(3)} A</span>
              </div>
              <div className="creep-result-item">
                <span className="creep-result-label">Power</span>
                <span className="creep-result-value">{simulationResult.power.toFixed(3)} W</span>
              </div>
              <div className="creep-result-item">
                <span className="creep-result-label">Efficiency</span>
                <span className="creep-result-value">{(simulationResult.efficiency * 100).toFixed(1)}%</span>
              </div>
            </div>
            <button
              className="vlabs-record-btn"
              onClick={addReading}
              disabled={!isExperimentStarted}
              style={{ marginTop: '12px', width: '100%' }}
            >
              <span className="vlabs-record-btn__icon">+</span>
              Record Reading
            </button>
            <button
              type="button"
              className="vlabs-run-btn solar-complete-btn"
              disabled={!isExperimentStarted || readings.length < 3 || simulationComplete}
              onClick={onCompleteSimulation}
              style={{ marginTop: '8px', width: '100%' }}
            >
              {simulationComplete ? 'Simulation Complete' : 'Complete Simulation'}
            </button>
          </div>

          {isExperimentStarted && (
            <div className="creep-panel-section">
              <div className="exp-simulation__panel-label">Graphs</div>
              <SolarGraphs readings={readings} showData={simulationComplete} compact />
            </div>
          )}

          <div className="creep-panel-section">
            <div className="exp-simulation__panel-label">Formulas</div>
            <div className="vlabs-formula-bar" style={{ flexDirection: 'column', gap: '8px' }}>
              <span>
                <span className="vlabs-formula-bar__label">Current:&nbsp;</span>
                <span className="vlabs-formula-bar__expr">I = V / R</span>
              </span>
              <span>
                <span className="vlabs-formula-bar__label">Power:&nbsp;</span>
                <span className="vlabs-formula-bar__expr">P = VI</span>
              </span>
            </div>
          </div>

          <div className="creep-panel-section">
            <div className="vlabs-observations">
              <div className="vlabs-observations__header">
                <h3 className="vlabs-observations__title">
                  Observation Table
                  {readings.length > 0 && (
                    <span className="vlabs-observations__count">
                      {readings.length} reading{readings.length !== 1 ? 's' : ''}
                    </span>
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
                  <p>Adjust controls and click <strong>Record Reading</strong>.</p>
                </div>
              ) : (
                <div className="vlabs-observations__table-wrap">
                  <table className="vlabs-observations__table">
                    <thead>
                      <tr>
                        <th>Trial</th>
                        <th>Light</th>
                        <th>R</th>
                        <th>V</th>
                        <th>I</th>
                        <th>P</th>
                        <th />
                      </tr>
                    </thead>
                    <tbody>
                      {readings.map((reading) => (
                        <tr key={reading.id} className="vlabs-observations__row">
                          <td>{reading.trial}</td>
                          <td>{reading.lightIntensity}%</td>
                          <td>{reading.resistance.toFixed(1)}</td>
                          <td>{reading.voltage.toFixed(3)}</td>
                          <td>{reading.current.toFixed(3)}</td>
                          <td>{reading.power.toFixed(3)}</td>
                          <td>
                            <button
                              className="vlabs-observations__remove"
                              onClick={() => removeReading(reading.id)}
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

export function SolarCellCharacteristics() {
  const [activeTab, setActiveTab] = useState(0);
  const [showSidebarInSimulation, setShowSidebarInSimulation] = useState(false);
  const [circuitValid, setCircuitValid] = useState(false);
  const [circuitMessage, setCircuitMessage] = useState('Build the circuit to continue.');
  const [readings, setReadings] = useState<SolarObservation[]>([]);
  const [simulationComplete, setSimulationComplete] = useState(false);
  const {
    lightIntensity,
    setLightIntensity,
    loadResistance,
    setLoadResistance,
    keyClosed,
    setKeyClosed,
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
        resistance: loadResistance,
        voltage: simulationResult.voltage,
        current: simulationResult.current,
        power: simulationResult.power,
      },
    ]);
  };

  const removeReading = (id: number) => {
    setSimulationComplete(false);
    setReadings((prev) => prev.filter((r) => r.id !== id).map((r, idx) => ({ ...r, id: idx + 1, trial: idx + 1 })));
  };

  const clearReadings = () => {
    setSimulationComplete(false);
    setReadings([]);
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
    if (!data) return null;

    switch (activeTab) {
      case 0:
        return <SectionContent title="Introduction" text={data.overview ?? ''} />;
      case 1:
        return <SectionContent title="Objective" text={data.aim ?? ''} />;
      case 2:
        return <SectionContent title="Apparatus" text={data.apparatus ?? ''} />;
      case 3:
        return <SectionContent title="Prerequisites" text={data.prerequisites ?? ''} />;
      case 4:
        return <SectionContent title="Theory" text={data.theory ?? ''} />;
      case 5:
        return <SectionContent title="Formula" text={data.formula ?? ''} />;
      case 6:
        return <SectionContent title="Procedure (In-Lab)" text={data.procedure_text ?? ''} />;
      case 7:
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
                  setSimulationComplete(false);
                  setReadings([]);
                  await startExperiment();
                  setActiveTab(SIMULATION_TAB);
                }}
              >
                Start Experiment
              </button>
            </div>
          </div>
        );
      case 8:
        return (
          <SimulationSection
            isExperimentStarted={isExperimentStarted}
            lightIntensity={lightIntensity}
            setLightIntensity={setLightIntensity}
            loadResistance={loadResistance}
            setLoadResistance={setLoadResistance}
            keyClosed={keyClosed}
            setKeyClosed={setKeyClosed}
            simulationResult={simulationResult}
            readings={readings}
            addReading={addReading}
            removeReading={removeReading}
            clearReadings={clearReadings}
            simulationComplete={simulationComplete}
            onCompleteSimulation={() => setSimulationComplete(true)}
            openSectionsPanel={() => setShowSidebarInSimulation(true)}
            goToNextSection={() => {
              setShowSidebarInSimulation(false);
              setActiveTab(9);
            }}
          />
        );
      case 9:
        return (
          <div className="vlabs-observations">
            <div className="vlabs-observations__header">
              <h3 className="vlabs-observations__title">Observation Table</h3>
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
              </div>
            ) : (
              <div className="vlabs-observations__table-wrap">
                <table className="vlabs-observations__table">
                  <thead>
                    <tr>
                      <th>S.No</th>
                      <th>Load, R (Ω)</th>
                      <th>Voltage V (V)</th>
                      <th>Current I (A)</th>
                      <th>Power P=VI (W)</th>
                      <th />
                    </tr>
                  </thead>
                  <tbody>
                    {readings.map((reading) => (
                      <tr key={reading.id}>
                        <td>{reading.trial}</td>
                        <td>{reading.resistance.toFixed(1)}</td>
                        <td>{reading.voltage.toFixed(3)}</td>
                        <td>{reading.current.toFixed(3)}</td>
                        <td>{reading.power.toFixed(3)}</td>
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
      case 10:
        return (
          <div className="exp-simulation solar-graph-tab">
            <ModelGraphSection
              description={data.model_graph ?? ''}
              imagePath={data.model_graph_image}
            />
            <div className="solar-graph-tab__live">
              <h3 className="exp-simulation__panel-label">Measured I–V and P–V</h3>
              {!simulationComplete && (
                <p className="solar-graph-tab__hint">
                  Record readings in Simulation, then click <strong>Complete Simulation</strong> to plot your curve.
                </p>
              )}
              <SolarGraphs readings={readings} showData={simulationComplete} />
            </div>
          </div>
        );
      case 11:
        return <SectionContent title="Precautions" text={data.precautions ?? ''} />;
      case 12:
        return <SectionContent title="Conclusion" text={data.conclusion ?? ''} />;
      case 13:
        return <SectionContent title="Analysis & Result" text={data.analysis ?? ''} />;
      case 14:
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
          <span>{data?.name ?? 'Solar Cell'}</span>
        </div>
        <h1 className="exp-header__title">{data?.name ?? 'Solar Cell'} Virtual Lab</h1>
      </div>

      <div className={`exp-body${activeTab === SIMULATION_TAB ? ' exp-body--simulation' : ''}`}>
        {(activeTab !== SIMULATION_TAB || showSidebarInSimulation) && (
          <aside className="exp-sidebar">
            {activeTab === SIMULATION_TAB && (
              <button
                className="exp-sidebar__close-btn"
                onClick={() => setShowSidebarInSimulation(false)}
              >
                Hide Sections
              </button>
            )}
            <nav className="exp-sidebar__nav">
              {sidebarTabs.map((tab, i) => (
                <button
                  key={tab}
                  className={`exp-sidebar__item${activeTab === i ? ' exp-sidebar__item--active' : ''}`}
                  onClick={() => {
                    setActiveTab(i);
                    if (i !== SIMULATION_TAB) setShowSidebarInSimulation(false);
                  }}
                >
                  {tab}
                </button>
              ))}
            </nav>
          </aside>
        )}
        <main
          className={`exp-content${activeTab === SIMULATION_TAB ? ' exp-content--simulation' : ''}`}
          key={activeTab}
        >
          {renderContent()}
        </main>
      </div>
    </div>
  );
}
