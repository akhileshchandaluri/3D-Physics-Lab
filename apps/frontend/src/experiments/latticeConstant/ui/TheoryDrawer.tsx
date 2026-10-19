export function TheoryDrawer() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', fontSize: '14px', lineHeight: '1.6', color: 'var(--text-primary)' }}>
      <div>
        <h4 style={{ margin: '0 0 6px 0', color: '#8d1b2e' }}>Aim</h4>
        <p style={{ margin: 0 }}>
          To determine the lattice parameter ($a$) of a cubic crystal (NaCl, KCl, LiF) by X-ray powder diffraction and evaluate Miller indices ($hkl$) satisfying FCC selection rules.
        </p>
      </div>

      <div>
        <h4 style={{ margin: '0 0 6px 0', color: '#8d1b2e' }}>Bragg's Law & Crystal Geometry</h4>
        <p style={{ margin: 0 }}>
          Constructive interference occurs when X-rays scattered from successive crystal planes differ in path length by an integer number of wavelengths:
        </p>
        <div style={{ background: 'var(--surface-subtle)', padding: '10px', borderRadius: '8px', margin: '8px 0', fontFamily: 'monospace' }}>
          2 · d_hkl · sin(θ) = λ
        </div>
        <p style={{ margin: 0 }}>
          For a cubic lattice with unit cell dimension a, the interplanar spacing d_hkl is:
        </p>
        <div style={{ background: 'var(--surface-subtle)', padding: '10px', borderRadius: '8px', margin: '8px 0', fontFamily: 'monospace' }}>
          d_hkl = a / sqrt(h² + k² + l²)  ⟹  a = λ · sqrt(h² + k² + l²) / (2 · sin(θ))
        </div>
      </div>

      <div>
        <h4 style={{ margin: '0 0 6px 0', color: '#8d1b2e' }}>FCC Selection Rules & Rock Salt Structure</h4>
        <ul style={{ margin: '6px 0', paddingLeft: '20px' }}>
          <li>Rock salt lattices (NaCl, KCl, LiF) are face-centered cubic (FCC) with a two-atom basis.</li>
          <li><strong>Allowed Reflections:</strong> $h, k, l$ must be all odd or all even. Mixed parity indices (e.g. 100, 110, 210) are forbidden.</li>
          <li><strong>Linear Regression Slope:</strong> sin²(θ) = (λ² / (4 a²)) · (h² + k² + l²), so slope s = λ² / (4 a²) ⟹ a = λ / (2 √s).</li>
        </ul>
      </div>

      <div>
        <h4 style={{ margin: '0 0 6px 0', color: '#8d1b2e' }}>Procedure</h4>
        <ol style={{ margin: '6px 0', paddingLeft: '20px' }}>
          <li>Select the sample crystal (NaCl, KCl, or LiF) and X-ray source (Cu K-α = 1.5406 Å).</li>
          <li>Scan $2\theta$ from $10^\circ$ to $90^\circ$ and observe the diffraction peaks.</li>
          <li>Click the Bragg peaks or use the snap buttons to record peak angles $2\theta$.</li>
          <li>Assign the corresponding $(hkl)$ Miller indices from the allowed reflections dropdown.</li>
          <li>Evaluate $a$ for each peak and from the slope of $\sin^2(\theta)$ vs $(h^2+k^2+l^2)$.</li>
        </ol>
      </div>
    </div>
  );
}
