# Shared Lab Kit (`components/lab`)

The Shared Lab Kit provides standardized, reusable UI components, layout structures, and state management hooks for all Physim virtual physics laboratories.

---

## Architecture Overview

All virtual experiments in Physim follow a modular structure:
- `physics/`: Pure TypeScript physical engine (formulas with JSDoc, SI units, Vitest suites).
- `sim/`: Deterministic simulation state machine and Mulberry32 PRNG noise generators.
- `scene/` or `canvas/`: 3D (React Three Fiber) or 2D interactive canvas rendering.
- `ui/`: Controls, measurement panels, and data inspection sheets.
- `<Name>.tsx`: Main component mounted via `LabShell`.

---

## Included Kit Utilities

### 1. `LabShell` (`<LabShell />`)
The root layout container for every simulation screen. It guarantees responsive layout compliance (desktop 1280px down to mobile 390px):
- **Top bar**: Back link to `/dashboard`, session badge, experiment title, and save controls slot.
- **Collapsible Theory & Procedure drawer**: Accessible reference sheet for lab manual instructions and formulas.
- **Main Layout Grid**:
  - `controls`: Left panel for input sliders, toggle switches, and parameters.
  - `visualization`: Centre stage for 3D/2D interactive canvas.
  - `results`: Right panel for observation tables, real-time gauges, and graphs.
- **Result Banner**: Slot for post-submission percent error and true value revelation.

```tsx
import { LabShell } from '@/components/lab/LabShell';

export function LaserGratingLab() {
  return (
    <LabShell
      sessionCode="Session 09"
      title="Determination of Wavelength of Laser Using Diffraction Grating"
      controls={<ControlPanel />}
      visualization={<GratingCanvas />}
      results={<ChartAndTable />}
      theoryProcedure={<TheoryDrawerContent />}
    />
  );
}
```

---

### 2. `ChartPanel` (`<ChartPanel />`)
Reusable Chart.js wrapper powered by `react-chartjs-2`:
- Automatic Chart.js component registration (registered once at module level).
- Inherits theme CSS variables (`--text-secondary`, `--grid-line`, `--primary-600`) for seamless light/dark mode support.
- Supports scatter points, line graphs, and linear regression best-fit lines.

```tsx
import { ChartPanel } from '@/components/lab/ChartPanel';

<ChartPanel
  title="Diffraction Angle vs Fringe Order"
  xLabel="Order (m)"
  yLabel="sin(θ)"
  datasets={[
    {
      label: 'Measured Orders',
      type: 'scatter',
      points: [{ x: 1, y: 0.126 }, { x: 2, y: 0.252 }],
    },
  ]}
  fitLine={{ slope: 0.126, intercept: 0 }}
/>
```

---

### 3. `DataTable` (`<DataTable />`)
Observation data table with client-side CSV export:
- Supports read-only or editable cells with unit display in column headers.
- Built-in "Export CSV" button generating instant file downloads.
- Handlers for adding and clearing observation rows.

```tsx
import { DataTable } from '@/components/lab/DataTable';

<DataTable
  title="Laser Diffraction Measurements"
  columns={[
    { key: 'order', label: 'Order m', editable: false },
    { key: 'distance', label: 'Screen Distance', unit: 'm', editable: true },
    { key: 'separation', label: 'Fringe Separation 2y', unit: 'cm', editable: true },
  ]}
  rows={rows}
  onChange={(rowIndex, key, value) => updateRow(rowIndex, key, value)}
  onAddRow={addNewReading}
/>
```

---

### 4. `useExperimentSave`
Hook managing the full save & load lifecycle adhering to the Physim backend contract:
- Auto-loads saved runs when `?savedId=<id>` is present in the URL.
- Supports read-only shared links and validation guards (`isSavedState`).
- Restricts payload sizes to under 60 KB.
- Transparently creates (`POST /api/v1/experiments`) or updates (`PATCH /api/v1/experiments/<id>`) saves.

```tsx
import { useExperimentSave } from '@/components/lab/useExperimentSave';

const { status, message, save, currentSavedId, loadedState } = useExperimentSave({
  experimentId: 'laser-grating',
  isSavedState: isLaserGratingSavedState,
  initialState,
  isReadOnly,
});
```

---

### 5. `stats.ts` (`@/lib/stats`)
Pure TypeScript statistical library:
- `mean(values)`: Arithmetic mean $\bar{x}$.
- `sampleStdDev(values)`: Sample standard deviation with Bessel's correction ($N - 1$).
- `linearRegression(xs, ys)`: Ordinary least squares fit yielding slope, intercept, $R^2$, and standard error.
- `percentError(measured, trueVal)`: Percentage error calculation.
- `mulberry32(seed)`: Seeded 32-bit PRNG for reproducible student runs.
- `gaussianNoise(rng, sigma)`: Box-Muller normal measurement noise.
