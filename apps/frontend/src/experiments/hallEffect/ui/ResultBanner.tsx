import { SAMPLES } from '../physics/hall';

interface ResultBannerProps {
  sampleKey: string;
  meanRhM3PerC: number;
  meanDensityM3: number;
  carrierType: 'n-type' | 'p-type' | 'undetermined';
  mobilityM2Vs: number;
  revealedTrueValue: boolean;
  onToggleReveal: () => void;
  percentError?: number;
}

export function ResultBanner({
  sampleKey,
  meanRhM3PerC,
  meanDensityM3,
  carrierType,
  mobilityM2Vs,
  revealedTrueValue,
  onToggleReveal,
  percentError,
}: ResultBannerProps) {
  const sample = SAMPLES[sampleKey] || SAMPLES['n-germanium'];

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
            Hall Coeff (R_H)
          </div>
          <div style={{ fontSize: '18px', fontWeight: 700, color: '#8d1b2e' }}>
            {meanRhM3PerC !== 0 ? `${meanRhM3PerC.toExponential(4)} m³/C` : '—'}
          </div>
        </div>

        <div>
          <div style={{ fontSize: '11px', textTransform: 'uppercase', color: 'var(--text-secondary)', fontWeight: 600 }}>
            Carrier Density (n)
          </div>
          <div style={{ fontSize: '18px', fontWeight: 700, color: 'var(--text-primary)' }}>
            {meanDensityM3 !== 0 ? `${meanDensityM3.toExponential(3)} m⁻³` : '—'}
          </div>
        </div>

        <div>
          <div style={{ fontSize: '11px', textTransform: 'uppercase', color: 'var(--text-secondary)', fontWeight: 600 }}>
            Determined Type
          </div>
          <div
            style={{
              fontSize: '15px',
              fontWeight: 700,
              color: carrierType === 'n-type' ? '#0284c7' : carrierType === 'p-type' ? '#d97706' : 'var(--text-secondary)',
            }}
          >
            {carrierType === 'n-type'
              ? 'n-type (Electrons e⁻)'
              : carrierType === 'p-type'
              ? 'p-type (Holes h⁺)'
              : '—'}
          </div>
        </div>

        <div>
          <div style={{ fontSize: '11px', textTransform: 'uppercase', color: 'var(--text-secondary)', fontWeight: 600 }}>
            Mobility (μ)
          </div>
          <div style={{ fontSize: '18px', fontWeight: 700, color: 'var(--text-primary)' }}>
            {mobilityM2Vs > 0 ? `${mobilityM2Vs.toFixed(3)} m²/V·s` : '—'}
          </div>
        </div>

        {revealedTrueValue && (
          <div style={{ background: 'rgba(141, 27, 46, 0.06)', padding: '6px 12px', borderRadius: '8px', border: '1px solid rgba(141, 27, 46, 0.2)' }}>
            <div style={{ fontSize: '11px', color: '#8d1b2e', fontWeight: 600 }}>
              Hidden Truth: {sample.carrierDensityM3.toExponential(2)} m⁻³ | μ = {sample.mobilityM2Vs} m²/V·s
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
};
