export function TheoryDrawer() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', fontSize: '14px', lineHeight: '1.6', color: 'var(--text-primary)' }}>
      <div>
        <h4 style={{ margin: '0 0 6px 0', color: '#8d1b2e' }}>Aim</h4>
        <p style={{ margin: 0 }}>
          To determine the Hall coefficient ($R_H$), majority carrier density ($n$), carrier type, and carrier mobility ($\mu$) of a semiconductor crystal using the Hall Effect.
        </p>
      </div>

      <div>
        <h4 style={{ margin: '0 0 6px 0', color: '#8d1b2e' }}>Physics Principle</h4>
        <p style={{ margin: 0 }}>
          When a current $I$ flows along the longitudinal axis ($x$) of a semiconductor specimen in the presence of a perpendicular magnetic field $B$ ($z$), charge carriers experience a transverse Lorentz force:
        </p>
        <div style={{ background: 'var(--surface-subtle)', padding: '10px', borderRadius: '8px', margin: '8px 0', fontFamily: 'monospace' }}>
          F_Lorentz = q (v_d × B)
        </div>
        <p style={{ margin: 0 }}>
          Carriers deflect transversely and accumulate on one edge face until the resulting transverse electric field $E_H$ balances the magnetic force:
        </p>
        <div style={{ background: 'var(--surface-subtle)', padding: '10px', borderRadius: '8px', margin: '8px 0', fontFamily: 'monospace' }}>
          q E_H = q v_d B  ⟹  V_H = E_H · w = (R_H · I · B) / t
        </div>
      </div>

      <div>
        <h4 style={{ margin: '0 0 6px 0', color: '#8d1b2e' }}>Working Formulas</h4>
        <ul style={{ margin: '6px 0', paddingLeft: '20px' }}>
          <li><strong>Hall Coefficient:</strong> R_H = (V_H · t) / (I · B) (m³/C)</li>
          <li><strong>Carrier Density:</strong> n = 1 / (|R_H| · q) (m⁻³) where q = 1.602 × 10⁻¹⁹ C</li>
          <li><strong>Carrier Type:</strong> Determined from the sign of V_H (negative for electrons/n-type, positive for holes/p-type).</li>
          <li><strong>Offset Cancellation:</strong> Reversing B eliminates misalignment voltage V_0: V_H = (V(+B) - V(-B)) / 2.</li>
          <li><strong>Mobility:</strong> μ = |R_H| · σ (m²/V·s).</li>
        </ul>
      </div>

      <div>
        <h4 style={{ margin: '0 0 6px 0', color: '#8d1b2e' }}>Procedure</h4>
        <ol style={{ margin: '6px 0', paddingLeft: '20px' }}>
          <li>Select the sample (n-type Ge or p-type Ge).</li>
          <li><strong>Part 1:</strong> Fix magnet current at $2.0$ A ($B \approx 0.5$ T) and vary specimen current $I$ from $1$ to $10$ mA. Record $V(+B)$ and $V(-B)$ to compute $V_H$.</li>
          <li><strong>Part 2:</strong> Fix specimen current at $5.0$ mA and vary electromagnet current $I_m$ from $0.4$ to $2.4$ A.</li>
          <li>Plot $V_H$ vs $I$ and $V_H$ vs $B$. Find the slopes to evaluate $R_H$ and carrier density $n$.</li>
        </ol>
      </div>
    </div>
  );
};
