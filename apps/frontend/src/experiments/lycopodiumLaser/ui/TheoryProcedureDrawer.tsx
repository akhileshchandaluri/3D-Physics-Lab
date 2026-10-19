import styles from './ui.module.css';

export function TheoryProcedureDrawer() {
  return (
    <div className={styles.theoryContent}>
      <div>
        <h3 className={styles.theoryHeading}>
          Determination of Particle Size of Lycopodium Powder Using Laser
        </h3>
        <p>
          When a monochromatic laser beam of wavelength λ is incident on a glass slide dusted uniformly with microscopic lycopodium spores, each spherical spore acts as a circular obstacle. According to Babinet's principle, the Fraunhofer diffraction pattern produced by circular obstacles is identical to that produced by circular apertures of the same diameter d.
        </p>
      </div>

      <div>
        <h4 className={styles.theoryHeading}>Airy Pattern & Ring Condition</h4>
        <div className={styles.formulaBox}>
          I(θ) = I₀ [ 2 J₁(x) / x ]², where x = π d sin(θ) / λ
        </div>
        <p style={{ marginTop: '6px' }}>
          Dark concentric rings occur at the positive roots of the Bessel function J₁(x) = 0:
        </p>
        <div className={styles.formulaBox}>
          sin(θₙ) = kₙ λ / d, where k = [1.2197, 2.2331, 3.2383, 4.2411, 5.2428]
        </div>
      </div>

      <div>
        <h4 className={styles.theoryHeading}>Apparatus Geometry & Calculation</h4>
        <p>
          For a screen placed at a perpendicular distance D from the sample slide, the radius rₙ of the n-th dark ring on the screen satisfies:
        </p>
        <div className={styles.formulaBox}>
          rₙ = D tan(θₙ), &nbsp; d = kₙ λ / sin(arctan(rₙ / D))
        </div>
        <p style={{ marginTop: '6px' }}>
          Plotting the dark ring radius rₙ against kₙ yields a linear regression fit with slope:
        </p>
        <div className={styles.formulaBox}>
          slope = D λ / d &nbsp; ⇒ &nbsp; d = D λ / slope
        </div>
      </div>

      <div>
        <h4 className={styles.theoryHeading}>Experimental Procedure</h4>
        <ol style={{ paddingLeft: '20px', margin: 0 }}>
          <li>Select a laser wavelength preset (650 nm Red or 532 nm Green).</li>
          <li>Set the screen distance D (default 1.0 m) and choose a Lycopodium sample slide.</li>
          <li>Observe the circular concentric diffraction rings on the observation screen.</li>
          <li>Use the draggable caliper crosshair jaws to measure the diameter (2rₙ) of dark rings n = 1 to 4.</li>
          <li>Record the measurements into the observation table to compute individual ring estimates and regression slope.</li>
          <li>Click "Reveal True Value" to evaluate your experimental mean diameter against the accepted reference value and verify the percent error.</li>
        </ol>
      </div>
    </div>
  );
}
