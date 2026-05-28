import { useMemo, useState } from 'react';

type ComponentKey =
  | 'solarCell'
  | 'ammeter'
  | 'voltmeter'
  | 'rheostat'
  | 'loadResistor';

interface Position {
  x: number;
  y: number;
}

interface CircuitBuilderProps {
  onValidityChange: (isValid: boolean, message: string) => void;
}

const terminalMap: Record<ComponentKey, { id: string; x: number; y: number }[]> = {
  solarCell: [
    { id: 'solar+', x: 6, y: 26 },
    { id: 'solar-', x: 122, y: 26 },
  ],
  ammeter: [
    { id: 'ammeter+', x: 6, y: 26 },
    { id: 'ammeter-', x: 122, y: 26 },
  ],
  rheostat: [
    { id: 'rheostat-in', x: 6, y: 26 },
    { id: 'rheostat-out', x: 122, y: 26 },
  ],
  loadResistor: [
    { id: 'load-in', x: 6, y: 26 },
    { id: 'load-out', x: 122, y: 26 },
  ],
  voltmeter: [
    { id: 'voltmeter+', x: 64, y: 6 },
    { id: 'voltmeter-', x: 64, y: 46 },
  ],
};

const requiredConnections: [string, string][] = [
  ['solar+', 'ammeter+'],
  ['ammeter-', 'rheostat-in'],
  ['rheostat-out', 'load-in'],
  ['load-out', 'solar-'],
  ['voltmeter+', 'load-in'],
  ['voltmeter-', 'load-out'],
];

const allowedPairs = new Set(
  requiredConnections.flatMap(([a, b]) => [`${a}|${b}`, `${b}|${a}`]),
);

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
  const [positions, setPositions] = useState<Record<ComponentKey, Position>>({
    solarCell: { x: 24, y: 70 },
    ammeter: { x: 210, y: 70 },
    rheostat: { x: 390, y: 70 },
    loadResistor: { x: 570, y: 70 },
    voltmeter: { x: 570, y: 220 },
  });
  const [connections, setConnections] = useState<[string, string][]>([]);
  const [dragging, setDragging] = useState<ComponentKey | null>(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [selectedTerminal, setSelectedTerminal] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState(
    'Drag components and connect valid terminals.',
  );

  const connectedSet = useMemo(
    () => new Set(connections.map(([a, b]) => edgeKey(a, b))),
    [connections],
  );

  const validateCircuit = (nextConnections: [string, string][]) => {
    const edges = new Set(nextConnections.map(([a, b]) => edgeKey(a, b)));
    const isValid = requiredConnections.every(([a, b]) => edges.has(edgeKey(a, b)));
    const message = isValid
      ? 'Circuit complete. You can start the experiment.'
      : 'Incomplete circuit. Ensure series path and voltmeter parallel connection.';
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
    const nextX = Math.min(Math.max(0, e.clientX - rect.left - dragOffset.x), rect.width - 140);
    const nextY = Math.min(Math.max(0, e.clientY - rect.top - dragOffset.y), rect.height - 56);
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
      setStatusMessage('Invalid connection for this experiment setup.');
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

  const components: { key: ComponentKey; label: string; short: string }[] = [
    { key: 'solarCell', label: 'Solar Cell', short: 'SC' },
    { key: 'ammeter', label: 'Ammeter', short: 'A' },
    { key: 'rheostat', label: 'Rheostat', short: 'Rh' },
    { key: 'loadResistor', label: 'Load Resistor', short: 'RL' },
    { key: 'voltmeter', label: 'Voltmeter', short: 'V' },
  ];

  return (
    <div className="solar-circuit-builder">
      <div className="solar-circuit-builder__header">
        <span>{statusMessage}</span>
        <button className="vlabs-observations__clear" onClick={clearConnections}>
          Reset Wires
        </button>
      </div>
      <div
        className="solar-circuit-canvas"
        onPointerMove={onPointerMove}
        onPointerUp={() => setDragging(null)}
        onPointerLeave={() => setDragging(null)}
      >
        <svg className="solar-circuit-wires">
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

        {components.map((component) => (
          <div
            key={component.key}
            className="solar-component"
            style={{ left: positions[component.key].x, top: positions[component.key].y }}
            onPointerDown={(e) => onPointerDown(component.key, e)}
          >
            <div className="solar-component__title">{component.label}</div>
            <div className="solar-component__symbol">{component.short}</div>
            {terminalMap[component.key].map((terminal) => (
              <button
                key={terminal.id}
                className={`solar-terminal${selectedTerminal === terminal.id ? ' selected' : ''}`}
                style={{ left: terminal.x - 5, top: terminal.y - 5 }}
                onClick={(e) => {
                  e.stopPropagation();
                  connectTerminal(terminal.id);
                }}
                title={terminal.id}
              />
            ))}
          </div>
        ))}
      </div>
      <div className="solar-circuit-builder__legend">
        Components: Solar Cell, Ammeter, Voltmeter, Variable Resistor (Rheostat), Load Resistor, Connecting Wires
      </div>
    </div>
  );
}
