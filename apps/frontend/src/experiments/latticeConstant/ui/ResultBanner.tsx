import { CRYSTALS } from '../physics/bragg';

interface ResultBannerProps {
  crystalKey: string;
  meanAA: number;
  stdDevAA: number;
  regressionAA: number;
  revealedTrueValue: boolean;
  onToggleReveal: () => void;
  percentError?: number;
}

export function ResultBanner({
  crystalKey,
  meanAA,
  stdDevAA,
  regressionAA,
  revealedTrueValue,
  onToggleReveal,
  percentError,
}: ResultBannerProps) {
  const crystal = CRYSTALS[crystalKey] || CRYSTALS['nacl'];

  return (
    <div
      style={{
        display: 'flex',
        flexWrap: 'wrap',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '16px',
        padding: '16px 20px',
        background: 'var(--surface-card)',
        border: '1px solid var(--border-subtle)',
        borderRadius: '12px',
        boxShadow: '0 4px 16px rgba(0, 0, 0, 0.04)',
      }}
    >
      <div style={{ display: 'flex', gap: '24px', flexWrap: 'wrap', alignItems: 'center' }}>
        <div>
          <div style={{ fontSize: '11px', textTransform: 'uppercase', color: 'var(--text-secondary)', fontWeight: 600 }}>
            Mean Lattice Const (a)
          </div>
          <div style={{ fontSize: '18px', fontWeight: 700, color: '#8d1b2e' }}>
            {meanAA > 0 ? `${meanAA.toFixed(4)} Å` : '—'}
          </div>
        </div>

        <div>
          <div style={{ fontSize: '11px', textTransform: 'uppercase', color: 'var(--text-secondary)', fontWeight: 600 }}>
            Sample Std Dev (s)
          </div>
          <div style={{ fontSize: '18px', fontWeight: 700, color: 'var(--text-primary)' }}>
            {stdDevAA > 0 ? `±${stdDevAA.toFixed(4)} Å` : '—'}
          </div>
        </div>

        <div>
          <div style={{ fontSize: '11px', textTransform: 'uppercase', color: 'var(--text-secondary)', fontWeight: 600 }}>
            Regression-Derived (a)
          </div>
          <div style={{ fontSize: '18px', fontWeight: 700, color: 'var(--text-primary)' }}>
            {regressionAA > 0 ? `${regressionAA.toFixed(4)} Å` : '—'}
          </div>
        </div>

        {revealedTrueValue && (
          <div style={{ background: 'rgba(141, 27, 46, 0.06)', padding: '6px 12px', borderRadius: '8px', border: '1px solid rgba(141, 27, 46, 0.2)' }}>
            <div style={{ fontSize: '11px', color: '#8d1b2e', fontWeight: 600 }}>
              Hidden Truth ({crystal.name}): {crystal.trueLatticeConstantA.toFixed(4)} Å
            </div>
            {percentError !== undefined && (
              <div style={{ fontSize: '12px', fontWeight: 700, color: '#8d1b2e' }}>
                Error vs Truth: {percentError.toFixed(2)}%
              </div>
            )}
          </div>
        )}
      </div>

      <button
        type="button"
        onClick={onToggleReveal}
        style={{
          padding: '8px 14px',
          fontSize: '12px',
          fontWeight: 600,
          borderRadius: '8px',
          border: '1px solid #8d1b2e',
          background: revealedTrueValue ? '#8d1b2e' : 'transparent',
          color: revealedTrueValue ? '#fff' : '#8d1b2e',
          cursor: 'pointer',
          transition: 'all 0.15s ease',
        }}
      >
        {revealedTrueValue ? 'Hide Truth' : 'Reveal True Value'}
      </button>
    </div>
  );
}
