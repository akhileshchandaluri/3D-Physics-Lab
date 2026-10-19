import styles from './ui.module.css';

export function TheoryProcedureDrawer() {
  return (
    <div className={styles.theoryContent}>
      <div>
        <h3 className={styles.theoryHeading}>
          Determination of Wavelength of Laser Using Diffraction Grating
        </h3>
        <p>
          A transmission diffraction grating consists of a large number N of closely spaced equidistant parallel slits per unit length. When a monochromatic collimated laser beam of wavelength λ is normally incident on the grating, wavelets from adjacent slits interfere constructively along discrete directions satisfying the grating equation.
        </p>
      </div>

      <div>
        <h4 className={styles.theoryHeading}>Grating Equation & Slit Spacing</h4>
        <div className={styles.formulaBox}>
          d sin(θₙ) = n λ, where d = 10⁻³ / N (m) for N lines/mm
        </div>
        <p style={{ marginTop: '6px' }}>
          Here n = 0, ±1, ±2, ±3... is the diffraction order. An order n physically exists if and only if |sin(θₙ)| = |n λ / d| ≤ 1. If |sin(θₙ)| &gt; 1, that order does not form.
        </p>
      </div>

      <div>
        <h4 className={styles.theoryHeading}>Screen Geometry & Linear Regression</h4>
        <p>
          For a flat screen placed at distance D parallel to the grating, the lateral displacement xₙ of the n-th order spot from the central maximum (n = 0) is:
        </p>
        <div className={styles.formulaBox}>
          xₙ = D tan(θₙ) &nbsp; ⇒ &nbsp; θₙ = arctan(xₙ / D), &nbsp; λ = d sin(θₙ) / n
        </div>
        <p style={{ marginTop: '6px' }}>
          Plotting sin(θₙ) against order n produces a straight line passing through the origin:
        </p>
        <div className={styles.formulaBox}>
          slope = λ / d &nbsp; ⇒ &nbsp; λ = slope × d
        </div>
      </div>

      <div>
        <h4 className={styles.theoryHeading}>Experimental Procedure</h4>
        <ol style={{ paddingLeft: '20px', margin: 0 }}>
          <li>Select a grating line density N (100, 300, or 600 lines/mm) and set screen distance D (default 0.5 m).</li>
          <li>Observe the central un-deviated spot (n = 0) and the symmetric diffracted spots (orders n = ±1, ±2, ±3) on the observation screen.</li>
          <li>Use the draggable caliper crosshair on the screen view to measure spot position xₙ for each existing order, or click "Auto-Record All Orders".</li>
          <li>Notice how positive and negative orders (+n and -n) are averaged to cancel any small centering zero-error.</li>
          <li>Inspect the observation table and the sin(θ) vs n linear regression fit line in the chart panel.</li>
          <li>Click "Reveal True Value" to verify your experimentally determined wavelength against the true laser wavelength and evaluate your percent error.</li>
        </ol>
      </div>
    </div>
  );
}
