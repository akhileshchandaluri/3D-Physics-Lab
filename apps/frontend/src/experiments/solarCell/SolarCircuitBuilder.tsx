import { useMemo, useState } from 'react';
import { CircuitComponentSymbol, componentDimensions } from './CircuitComponentSymbol';

type ComponentKey = keyof typeof componentDimensions;

interface Position {
  x: number;
  y: number;
}

interface CircuitBuilderProps {
  onValidityChange: (isValid: boolean, message: string) => void;
}

const terminalMap = Object.fromEntries(
  (Object.keys(componentDimensions) as ComponentKey[]).map((key) => [
    key,
    componentDimensions[key].terminals,
  ]),
) as Record<ComponentKey, { id: string; x: number; y: number }[]>;

/** Matches lab diagram: V ∥ solar cell; series A → K → LOAD → return. */
const requiredConnections: [string, string][] = [
  ['solar+', 'voltmeter+'],
  ['solar-', 'voltmeter-'],
  ['solar+', 'ammeter+'],
  ['ammeter-', 'key+'],
  ['key-', 'load-in'],
  ['load-out', 'solar-'],
];

const allowedPairs = new Set(
  requiredConnections.flatMap(([a, b]) => [`${a}|${b}`, `${b}|${a}`]),
);

const defaultPositions: Record<ComponentKey, Position> = {
  lightSource: { x: 28, y: 200 },
  solarCell: { x: 140, y: 140 },
  voltmeter: { x: 320, y: 145 },
  ammeter: { x: 480, y: 100 },
  key: { x: 680, y: 100 },
  loadResistor: { x: 860, y: 120 },
};

function edgeKey(a: string, b: string): string {
  return [a, b].sort().join('|');
}

function terminalCoordinates(
  terminalId: string,
  positions: Record<ComponentKey, Position>,
): { x: number; y: number } {
  const compKey = (Object.keys(terminalMap) as ComponentKey[]).find((key) =>
    terminalMap[key].some((t) => t.id === terminalId),
  );
  if (!compKey) return { x: 0, y: 0 };
  const terminal = terminalMap[compKey].find((t) => t.id === terminalId)!;
  return {
    x: positions[compKey].x + terminal.x,
    y: positions[compKey].y + terminal.y,
  };
}

export function SolarCircuitBuilder({ onValidityChange }: CircuitBuilderProps) {
  const [positions, setPositions] = useState<Record<ComponentKey, Position>>(defaultPositions);
  const [connections, setConnections] = useState<[string, string][]>([]);
  const [dragging, setDragging] = useState<ComponentKey | null>(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [selectedTerminal, setSelectedTerminal] = useState<string | null>(null);
  const [showReference, setShowReference] = useState(true);
  const [statusMessage, setStatusMessage] = useState(
    'Arrange components like the reference diagram, then connect terminals.',
  );

  const connectedSet = useMemo(
    () => new Set(connections.map(([a, b]) => edgeKey(a, b))),
    [connections],
  );

  const validateCircuit = (nextConnections: [string, string][]) => {
    const edges = new Set(nextConnections.map(([a, b]) => edgeKey(a, b)));
    const isValid = requiredConnections.every(([a, b]) => edges.has(edgeKey(a, b)));
    const message = isValid
      ? 'Circuit matches the diagram. You can start the experiment.'
      : 'Incomplete circuit. Voltmeter parallel to cell; series path A → K → LOAD.';
    setStatusMessage(message);
    onValidityChange(isValid, message);
  };

  const onPointerDown = (key: ComponentKey, e: React.PointerEvent<HTMLDivElement>) => {
    const rect = (e.currentTarget.parentElement as HTMLElement).getBoundingClientRect();
    setDragging(key);
    setDragOffset({
      x: e.clientX - rect.left - positions[key].x,
      y: e.clientY - rect.top - positions[key].y,
    });
  };

  const onPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!dragging) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const dims = componentDimensions[dragging];
    const nextX = Math.min(
      Math.max(0, e.clientX - rect.left - dragOffset.x),
      rect.width - dims.width,
    );
    const nextY = Math.min(
      Math.max(0, e.clientY - rect.top - dragOffset.y),
      rect.height - dims.height,
    );
    setPositions((prev) => ({ ...prev, [dragging]: { x: nextX, y: nextY } }));
  };

  const connectTerminal = (terminalId: string) => {
    if (!selectedTerminal) {
      setSelectedTerminal(terminalId);
      return;
    }
    if (selectedTerminal === terminalId) {
      setSelectedTerminal(null);
      return;
    }
    const directedKey = `${selectedTerminal}|${terminalId}`;
    if (!allowedPairs.has(directedKey)) {
      setStatusMessage('Invalid connection for this circuit diagram.');
      setSelectedTerminal(null);
      return;
    }

    const normalized = edgeKey(selectedTerminal, terminalId);
    if (connectedSet.has(normalized)) {
      setStatusMessage('That wire is already connected.');
      setSelectedTerminal(null);
      return;
    }

    const next = [...connections, [selectedTerminal, terminalId] as [string, string]];
    setConnections(next);
    setSelectedTerminal(null);
    validateCircuit(next);
  };

  const clearConnections = () => {
    setConnections([]);
    setSelectedTerminal(null);
    setStatusMessage('Connections cleared. Rebuild the circuit.');
    onValidityChange(false, 'Circuit reset.');
  };

  const resetLayout = () => {
    setPositions(defaultPositions);
    clearConnections();
  };

  const components: { key: ComponentKey; label: string }[] = [
    { key: 'lightSource', label: 'Lamp (MP)' },
    { key: 'solarCell', label: 'Solar Cell' },
    { key: 'voltmeter', label: 'Voltmeter' },
    { key: 'ammeter', label: 'Ammeter' },
    { key: 'key', label: 'Key' },
    { key: 'loadResistor', label: 'Load' },
  ];

  return (
    <div className="solar-circuit-builder">
      <div className="solar-circuit-builder__header">
        <span>{statusMessage}</span>
        <div className="solar-circuit-builder__actions">
          <button
            type="button"
            className="vlabs-observations__clear"
            onClick={() => setShowReference((v) => !v)}
          >
            {showReference ? 'Hide Reference' : 'Show Reference'}
          </button>
          <button type="button" className="vlabs-observations__clear" onClick={resetLayout}>
            Reset Layout
          </button>
          <button type="button" className="vlabs-observations__clear" onClick={clearConnections}>
            Reset Wires
          </button>
        </div>
      </div>

      <div className="solar-circuit-builder__body">
        {showReference && (
          <aside className="solar-circuit-reference">
            <div className="solar-circuit-reference__title">Reference diagram</div>
            <img
              src="/exp/solar/circuit-reference.png"
              alt="Solar cell experiment circuit diagram"
              className="solar-circuit-reference__img"
            />
          </aside>
        )}

        <div
          className="solar-circuit-canvas"
          onPointerMove={onPointerMove}
          onPointerUp={() => setDragging(null)}
          onPointerLeave={() => setDragging(null)}
        >
          <svg className="solar-circuit-wires" aria-hidden>
            {connections.map(([from, to]) => {
              const p1 = terminalCoordinates(from, positions);
              const p2 = terminalCoordinates(to, positions);
              return (
                <line
                  key={`${from}-${to}`}
                  x1={p1.x}
                  y1={p1.y}
                  x2={p2.x}
                  y2={p2.y}
                  className="solar-circuit-wire"
                />
              );
            })}
          </svg>

          {components.map((component) => {
            const dims = componentDimensions[component.key];
            return (
              <div
                key={component.key}
                className="solar-component solar-component--symbol"
                style={{
                  left: positions[component.key].x,
                  top: positions[component.key].y,
                  width: dims.width,
                  height: dims.height,
                }}
                onPointerDown={(e) => onPointerDown(component.key, e)}
              >
                <CircuitComponentSymbol type={component.key} />
                {terminalMap[component.key].map((terminal) => (
                  <button
                    key={terminal.id}
                    type="button"
                    className={`solar-terminal${selectedTerminal === terminal.id ? ' selected' : ''}`}
                    style={{ left: terminal.x - 8, top: terminal.y - 8 }}
                    onClick={(e) => {
                      e.stopPropagation();
                      connectTerminal(terminal.id);
                    }}
                    title={`${component.label} (${terminal.id})`}
                    aria-label={`${component.label} terminal ${terminal.id}`}
                  />
                ))}
              </div>
            );
          })}
        </div>
      </div>

      <div className="solar-circuit-builder__legend">
        Connect: V parallel to solar cell (+ to +, − to −). Series: + → A → K → LOAD → −.
      </div>
    </div>
  );
}
