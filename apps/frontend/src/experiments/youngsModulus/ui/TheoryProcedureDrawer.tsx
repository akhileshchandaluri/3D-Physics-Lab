import styles from './ui.module.css';

export function TheoryProcedureDrawer() {
  return (
    <div className={styles.theoryContent}>
      <div>
        <h3 className={styles.theoryHeading}>1. Objective</h3>
        <p>
          To determine Young&apos;s Modulus (Y) of the material of a rectangular beam by the
          method of uniform bending using a travelling microscope.
        </p>
      </div>

      <div>
        <h3 className={styles.theoryHeading}>2. Physical Theory & Governing Equations</h3>
        <p>
          A uniform beam of rectangular cross-section (breadth b, thickness d) rests symmetrically
          on two knife edges separated by a distance l. Two equal masses M are suspended at equal
          distances a beyond the knife edges.
        </p>
        <p>
          Since equal opposite couples act at both ends, the bending moment throughout the
          portion of the beam between the knife edges is constant:
        </p>
        <div className={styles.formulaBox}>
          Bending Moment: τ = M · g · a &nbsp; (constant between knife edges)
        </div>
        <p>
          Because the bending moment is uniform, the beam bends into a circular arc of constant
          radius of curvature R:
        </p>
        <div className={styles.formulaBox}>
          Radius of Curvature: R = Y · I / (M · g · a) = (Y · b · d³) / (12 · M · g · a)
        </div>
        <p>
          Here, I = b·d³ / 12 is the geometric second moment of area (area moment of inertia).
          The elevation e of the centre of the beam relative to the knife edges is related to R by
          the circular arc sagitta formula:
        </p>
        <div className={styles.formulaBox}>
          Centre Elevation: e = l² / (8 · R) = 3 · M · g · a · l² / (2 · b · d³ · Y)
        </div>
        <p>
          Rearranging this gives the Young&apos;s Modulus Y:
        </p>
        <div className={styles.formulaBox}>
          Y = 3 · M · g · a · l² / (2 · b · d³ · e)
        </div>
      </div>

      <div>
        <h3 className={styles.theoryHeading}>3. Graphical Slope Method</h3>
        <p>
          Plotting elevation e (y-axis) against mass M (x-axis) yields a straight line passing
          through the origin with slope s = e / M:
        </p>
        <div className={styles.formulaBox}>
          Y = 3 · g · a · l² / (2 · b · d³ · s)
        </div>
      </div>

      <div>
        <h3 className={styles.theoryHeading}>4. Maximum Bending Stress & Elastic Limit</h3>
        <p>
          The maximum tensile/compressive stress in the extreme outer fibres of the beam is:
        </p>
        <div className={styles.formulaBox}>
          σ_max = τ · (d / 2) / I = 6 · M · g · a / (b · d²)
        </div>
        <p>
          To ensure valid elastic deformation and avoid permanent set, σ_max must remain well
          below the yield strength of the material (e.g. Steel ~ 250 MPa, Brass ~ 200 MPa).
        </p>
      </div>

      <div>
        <h3 className={styles.theoryHeading}>5. Experimental Procedure</h3>
        <ol style={{ paddingLeft: '20px', margin: '4px 0' }}>
          <li>
            Measure the breadth b of the beam using a Vernier Caliper (LC 0.02 mm) at multiple points
            and find the mean.
          </li>
          <li>
            Measure the thickness d of the beam using a Screw Gauge (LC 0.01 mm) at multiple points
            and find the mean.
          </li>
          <li>
            Position the two knife edges on the bench at a span distance l = 0.70 m.
          </li>
          <li>
            Attach two weight hangers symmetrically at distance a = 0.15 m beyond each knife edge.
          </li>
          <li>
            Focus the horizontal cross-wire of the travelling microscope (LC 0.01 mm) on a vertical reference
            pin at the centre of the beam and record the initial reading.
          </li>
          <li>
            Add slotted weights in regular increments of 100 g (0.1 kg) up to 500 g
            (loading phase) and record the microscope readings.
          </li>
          <li>
            Unload weights in steps of 100 g down to 100 g (unloading phase) and record the
            readings.
          </li>
          <li>
            Compute the mean elevation e, the ratio e/M, plot e vs M, determine slope s, and
            calculate Young&apos;s Modulus Y.
          </li>
        </ol>
      </div>
    </div>
  );
}
