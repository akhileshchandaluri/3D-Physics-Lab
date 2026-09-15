import { useState, useEffect, useRef, useCallback } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { useOhmsLaw } from '../../hooks/useOhmsLaw';
import { ExperimentLayout } from '../../components/shared/ExperimentLayout';
import { SliderInput } from '../../components/shared/SliderInput';
import { ResultCard } from '../../components/shared/ResultCard';
import { FormulaBar } from '../../components/shared/FormulaBar';
import { CircuitDiagram } from './CircuitDiagram';
import { IVChart } from './IVChart';

const AtomIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="1"/><path d="M20.2 20.2c2.04-2.03.02-7.36-4.5-11.9-4.54-4.52-9.87-6.54-11.9-4.5-2.04 2.03-.02 7.36 4.5 11.9 4.54 4.52 9.87 6.54 11.9 4.5Z"/><path d="M15.7 15.7c4.52-4.54 6.54-9.87 4.5-11.9-2.03-2.04-7.36-.02-11.9 4.5-4.52 4.54-6.54 9.87-4.5 11.9 2.03 2.04 7.36.02 11.9-4.5Z"/></svg>
);

interface OhmsLawProps {
  initialParameters?: {
    voltage?: number;
    resistance?: number;
    temperature?: number;
  };
  isReadOnly?: boolean;
}

export function OhmsLaw({ initialParameters, isReadOnly = false }: OhmsLawProps) {
  const [searchParams] = useSearchParams();
  const savedIdParam = searchParams.get('savedId');

  const [currentSavedId, setCurrentSavedId] = useState<string | null>(savedIdParam);
  const [saveTitle, setSaveTitle] = useState("My Ohm's Law Setup");
  const [saveNotes, setSaveNotes] = useState('');
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const [saveMessage, setSaveMessage] = useState<string | null>(null);
  const [shareUrl, setShareUrl] = useState<string | null>(null);
  const [enableAutosave, setEnableAutosave] = useState(false);

  const {
    voltage, setVoltage,
    resistance, setResistance,
    temperature, setTemperature,
    currentMa,
    effectiveResistance,
    power,
    brightnessRatio,
    ivCurve,
  } = useOhmsLaw({
    voltage: initialParameters?.voltage ?? 12,
    resistance: initialParameters?.resistance ?? 200,
    temperature: initialParameters?.temperature ?? 25,
  });

  // Track the last successfully saved snapshot to avoid duplicate unchanged database writes
  const [lastSavedSnapshot, setLastSavedSnapshot] = useState<string>('');
  const lastSavedSnapshotRef = useRef<string>('');
  const saveSeqRef = useRef<number>(0);

  // Load saved state if savedId is in URL
  useEffect(() => {
    if (savedIdParam) {
      fetch(`/api/v1/experiments/${savedIdParam}`, { credentials: 'include' })
        .then(res => res.ok ? res.json() : null)
        .then(data => {
          if (data && data.state) {
            setCurrentSavedId(data.id);
            setSaveTitle(data.title || "Saved Ohm's Law Setup");
            setSaveNotes(data.notes || '');
            if (typeof data.state.voltage === 'number') setVoltage(data.state.voltage);
            if (typeof data.state.resistance === 'number') setResistance(data.state.resistance);
            if (typeof data.state.temperature === 'number') setTemperature(data.state.temperature);

            // Establish baseline snapshot
            const loadedSnapshot = JSON.stringify({
              title: data.title || "Saved Ohm's Law Setup",
              notes: data.notes || '',
              voltage: data.state.voltage,
              resistance: data.state.resistance,
              temperature: data.state.temperature,
            });
            lastSavedSnapshotRef.current = loadedSnapshot;
            setLastSavedSnapshot(loadedSnapshot);
            setSaveStatus('saved');
          }
        })
        .catch(() => {});
    }
  }, [savedIdParam, setVoltage, setResistance, setTemperature]);

  const performSave = useCallback(async (isAutosave = false) => {
    const statePayload = { voltage, resistance, temperature };
    const currentSnapshot = JSON.stringify({
      title: saveTitle.trim(),
      notes: saveNotes.trim(),
      voltage,
      resistance,
      temperature,
    });

    // Avoid duplicate unchanged writes
    if (currentSnapshot === lastSavedSnapshotRef.current) {
      if (!isAutosave) {
        setSaveStatus('saved');
        setSaveMessage('All changes saved.');
      }
      return;
    }

    const seq = ++saveSeqRef.current;
    setSaveStatus('saving');
    setSaveMessage(null);

    try {
      let res: Response;
      if (currentSavedId) {
        // Update existing saved checkpoint
        res = await fetch(`/api/v1/experiments/${currentSavedId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({
            title: saveTitle.trim(),
            notes: saveNotes.trim(),
            state: statePayload,
          }),
        });
      } else {
        // Create new checkpoint
        res = await fetch('/api/v1/experiments', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({
            experimentId: 'ohms-law',
            title: saveTitle.trim(),
            notes: saveNotes.trim(),
            state: statePayload,
          }),
        });
      }

      // Check if another save request superseded this one
      if (seq !== saveSeqRef.current) return;

      if (res.ok) {
        const data = await res.json();
        if (!currentSavedId && data.id) {
          setCurrentSavedId(data.id);
        }
        lastSavedSnapshotRef.current = currentSnapshot;
        setLastSavedSnapshot(currentSnapshot);
        setSaveStatus('saved');
        setSaveMessage(isAutosave ? 'Autosaved checkpoint.' : 'Experiment setup saved successfully!');
      } else {
        setSaveStatus('error');
        setSaveMessage('Save failed. Click Retry to save your changes.');
      }
    } catch {
      if (seq !== saveSeqRef.current) return;
      setSaveStatus('error');
      setSaveMessage('Network error while saving. Click Retry to try again.');
    }
  }, [voltage, resistance, temperature, saveTitle, saveNotes, currentSavedId]);

  // Debounced autosave checkpoint: triggers 3 seconds after user stops interacting, if autosave is enabled
  useEffect(() => {
    if (!enableAutosave || isReadOnly) return;

    const currentSnapshot = JSON.stringify({
      title: saveTitle.trim(),
      notes: saveNotes.trim(),
      voltage,
      resistance,
      temperature,
    });

    if (currentSnapshot === lastSavedSnapshotRef.current) return;

    const timer = setTimeout(() => {
      performSave(true);
    }, 3000);

    return () => clearTimeout(timer);
  }, [enableAutosave, isReadOnly, voltage, resistance, temperature, saveTitle, saveNotes, performSave]);

  const handleCreateShare = async () => {
    if (!currentSavedId) {
      setSaveMessage('Please save your experiment first before creating a share link.');
      return;
    }
    try {
      const res = await fetch(`/api/v1/experiments/${currentSavedId}/share`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({}),
      });
      if (res.ok) {
        const data = await res.json();
        const fullUrl = `${window.location.origin}/share/${data.token}`;
        setShareUrl(fullUrl);
        navigator.clipboard?.writeText(fullUrl).catch(() => {});
        setSaveMessage('Share link created and copied to clipboard!');
      } else {
        setSaveMessage('Failed to create share link.');
      }
    } catch {
      setSaveMessage('Network error while creating share link.');
    }
  };

  const isCurrentStateDirty = lastSavedSnapshot !== '' &&
    JSON.stringify({
      title: saveTitle.trim(),
      notes: saveNotes.trim(),
      voltage,
      resistance,
      temperature,
    }) !== lastSavedSnapshot;

  return (
    <div style={{ maxWidth: '1100px', margin: '0 auto', padding: '16px' }}>
      {/* Top Header Bar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '12px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <Link to="/dashboard" style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', textDecoration: 'none', color: 'var(--text-primary)', fontWeight: 700, fontSize: '16px' }}>
            <div style={{ width: '28px', height: '28px', borderRadius: '6px', background: 'var(--gradient-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff' }}>
              <AtomIcon />
            </div>
            <span>PhySim Lab</span>
          </Link>
          <Link to="/dashboard" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '13px', fontWeight: 600, color: 'var(--text-secondary)', textDecoration: 'none' }}>
            ← Back to Dashboard
          </Link>
        </div>

        {!isReadOnly && (
          <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: 'var(--text-secondary)', cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={enableAutosave}
                onChange={(e) => setEnableAutosave(e.target.checked)}
              />
              <span>Autosave</span>
            </label>

            <input
              type="text"
              value={saveTitle}
              onChange={(e) => setSaveTitle(e.target.value)}
              placeholder="Experiment Title"
              style={{ padding: '6px 12px', borderRadius: '6px', border: '1px solid var(--border-subtle)', background: 'var(--surface-card)', color: 'var(--text-primary)', fontSize: '13px', width: '180px' }}
            />

            <button
              onClick={() => performSave(false)}
              disabled={saveStatus === 'saving'}
              id="save-experiment-btn"
              style={{
                padding: '7px 16px',
                background: saveStatus === 'error' ? '#ef4444' : 'var(--gradient-primary)',
                color: '#fff',
                border: 'none',
                borderRadius: '6px',
                fontSize: '13px',
                fontWeight: 600,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
              }}
            >
              {saveStatus === 'saving' ? (
                <>
                  <span className="spinner" style={{ width: '14px', height: '14px' }} />
                  Saving...
                </>
              ) : saveStatus === 'error' ? (
                'Retry Save'
              ) : currentSavedId ? (
                'Update Save'
              ) : (
                'Save Setup'
              )}
            </button>

            {/* Status indicator badge */}
            <div style={{ fontSize: '12px', fontWeight: 600 }}>
              {saveStatus === 'saving' && <span style={{ color: 'var(--text-muted)' }}>Saving... ⏳</span>}
              {saveStatus === 'saved' && <span style={{ color: '#10b981' }}>Saved ✓</span>}
              {saveStatus === 'error' && <span style={{ color: '#ef4444' }}>Save failed ⚠️</span>}
              {saveStatus === 'idle' && isCurrentStateDirty && <span style={{ color: 'var(--primary-600)' }}>Unsaved changes •</span>}
            </div>

            <button
              onClick={handleCreateShare}
              style={{ padding: '7px 16px', background: 'var(--toggle-bg)', color: 'var(--text-primary)', border: '1px solid var(--border-subtle)', borderRadius: '6px', fontSize: '13px', fontWeight: 600, cursor: 'pointer' }}
            >
              🔗 Share
            </button>
          </div>
        )}
      </div>

      {saveMessage && (
        <div style={{
          padding: '10px 16px',
          marginBottom: '16px',
          borderRadius: '8px',
          background: saveStatus === 'error' ? 'rgba(239, 68, 68, 0.1)' : 'var(--surface-card)',
          border: `1px solid ${saveStatus === 'error' ? 'rgba(239, 68, 68, 0.3)' : 'var(--border-accent)'}`,
          color: saveStatus === 'error' ? '#ef4444' : 'var(--primary-600)',
          fontSize: '13px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}>
          <span>
            {saveMessage}{' '}
            {shareUrl && (
              <a href={shareUrl} target="_blank" rel="noreferrer" style={{ color: 'var(--accent-500)', marginLeft: '8px', wordBreak: 'break-all' }}>
                {shareUrl}
              </a>
            )}
          </span>
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            {saveStatus === 'error' && (
              <button
                onClick={() => performSave(false)}
                style={{
                  padding: '3px 8px',
                  borderRadius: '4px',
                  border: '1px solid #ef4444',
                  background: '#ef4444',
                  color: '#fff',
                  fontSize: '12px',
                  cursor: 'pointer',
                  fontWeight: 600,
                }}
              >
                Retry
              </button>
            )}
            <button onClick={() => setSaveMessage(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}>✕</button>
          </div>
        </div>
      )}

      <ExperimentLayout
        sessionNumber="Session 01"
        title="Ohm's law simulator"

        controls={
          <>
            <div style={{
              fontSize: '12px', fontWeight: 500,
              color: '#888', marginBottom: '14px'
            }}>
              Controls {isReadOnly && '(Read-Only Shared View)'}
            </div>

            <SliderInput
              label="Voltage"
              min={0} max={24} step={0.5}
              value={voltage} unit="V"
              onChange={isReadOnly ? () => {} : setVoltage}
            />
            <SliderInput
              label="Resistance"
              min={10} max={1000} step={10}
              value={resistance} unit="Ω"
              onChange={isReadOnly ? () => {} : setResistance}
            />
            <SliderInput
              label="Temperature"
              min={25} max={200} step={5}
              value={temperature} unit="°C"
              onChange={isReadOnly ? () => {} : setTemperature}
            />

            <div style={{ marginTop: '20px' }}>
              <div style={{
                fontSize: '12px', color: '#888', marginBottom: '6px'
              }}>
                Circuit diagram
              </div>
              <CircuitDiagram
                brightnessRatio={brightnessRatio}
                voltage={voltage}
                resistance={resistance}
              />
            </div>
          </>
        }

        visualization={
          <>
            <div style={{
              fontSize: '12px', fontWeight: 500,
              color: '#888', marginBottom: '14px'
            }}>
              I-V characteristic
            </div>
            <IVChart
              ivCurve={ivCurve}
              resistance={resistance}
              temperature={temperature}
            />
          </>
        }

        results={
          <>
            <ResultCard
              label="Voltage"
              value={voltage.toFixed(1)}
              unit="V"
            />
            <ResultCard
              label="Current"
              value={currentMa.toFixed(2)}
              unit="mA"
              highlight
            />
            <ResultCard
              label="Resistance (eff.)"
              value={Math.round(effectiveResistance)}
              unit="Ω"
            />
            <ResultCard
              label="Power"
              value={power.toFixed(3)}
              unit="W"
            />
          </>
        }

        formula={
          <FormulaBar formulas={[
            { label: 'Current', expression: 'I = V / R' },
            { label: 'Power', expression: 'P = V × I' },
            { label: 'Temp correction',
              expression: 'R(T) = R₀(1 + α·ΔT)' },
          ]} />
        }
      />
    </div>
  );
}