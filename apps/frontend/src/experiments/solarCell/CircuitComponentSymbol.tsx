export type SymbolType =
  | 'lightSource'
  | 'solarCell'
  | 'ammeter'
  | 'voltmeter'
  | 'key'
  | 'loadResistor';

interface CircuitComponentSymbolProps {
  type: SymbolType;
}

function MeterFace({
  letter,
  cx,
  cy,
  r,
}: {
  letter: string;
  cx: number;
  cy: number;
  r: number;
}) {
  return (
    <>
      <circle cx={cx} cy={cy} r={r} fill="#fafafa" stroke="#1e293b" strokeWidth="2.5" />
      {[...Array(12)].map((_, i) => {
        const angle = (-120 + i * 20) * (Math.PI / 180);
        const x1 = cx + (r - 6) * Math.cos(angle);
        const y1 = cy + (r - 6) * Math.sin(angle);
        const x2 = cx + (r - 2) * Math.cos(angle);
        const y2 = cy + (r - 2) * Math.sin(angle);
        return (
          <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} stroke="#94a3b8" strokeWidth="1.2" />
        );
      })}
      <line
        x1={cx}
        y1={cy}
        x2={cx + r * 0.45}
        y2={cy - r * 0.35}
        stroke="#e65100"
        strokeWidth="2.5"
        strokeLinecap="round"
      />
      <text x={cx} y={cy + 6} textAnchor="middle" className="solar-symbol__meter">
        {letter}
      </text>
    </>
  );
}

/** Lab schematic symbols — scaled for readable circuit builder canvas. */
export function CircuitComponentSymbol({ type }: CircuitComponentSymbolProps) {
  switch (type) {
    case 'lightSource':
      return (
        <svg viewBox="0 0 120 140" className="solar-symbol" aria-hidden>
          <defs>
            <radialGradient id="lampGlow" cx="50%" cy="40%" r="55%">
              <stop offset="0%" stopColor="#fff9c4" />
              <stop offset="100%" stopColor="#ffecb3" />
            </radialGradient>
          </defs>
          <circle cx="48" cy="48" r="34" fill="url(#lampGlow)" stroke="#5d4037" strokeWidth="2.5" />
          <path
            d="M48 78 Q38 88 48 98 Q58 88 48 78"
            fill="none"
            stroke="#5d4037"
            strokeWidth="2"
          />
          <line x1="48" y1="98" x2="48" y2="108" stroke="#5d4037" strokeWidth="2.5" />
          <text x="48" y="54" textAnchor="middle" className="solar-symbol__meter">
            MP
          </text>
          {[0, 1, 2, 3, 4].map((i) => {
            const startX = 78 + i * 2;
            const startY = 40 + i * 8;
            return (
              <g key={i}>
                <line
                  x1={startX}
                  y1={startY}
                  x2={startX + 28}
                  y2={startY + 18}
                  stroke="#f59e0b"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                />
                <polygon
                  points={`${startX + 28},${startY + 18} ${startX + 22},${startY + 14} ${startX + 24},${startY + 22}`}
                  fill="#f59e0b"
                />
              </g>
            );
          })}
          <text x="60" y="132" textAnchor="middle" className="solar-symbol__label">
            Lamp (MP)
          </text>
        </svg>
      );

    case 'solarCell':
      return (
        <svg viewBox="0 0 150 175" className="solar-symbol" aria-hidden>
          <circle cx="75" cy="78" r="52" fill="#fff" stroke="#1e293b" strokeWidth="3" />
          <line x1="62" y1="62" x2="62" y2="94" stroke="#1e293b" strokeWidth="4" strokeLinecap="round" />
          <line x1="82" y1="56" x2="82" y2="100" stroke="#1e293b" strokeWidth="2" strokeLinecap="round" />
          <text x="108" y="84" className="solar-symbol__dc">
            D.C.
          </text>
          <text x="75" y="24" textAnchor="middle" className="solar-symbol__polarity">
            +
          </text>
          <text x="75" y="148" textAnchor="middle" className="solar-symbol__polarity">
            −
          </text>
          <text x="75" y="168" textAnchor="middle" className="solar-symbol__label">
            Solar Cell
          </text>
        </svg>
      );

    case 'ammeter':
      return (
        <svg viewBox="0 0 160 95" className="solar-symbol" aria-hidden>
          <line x1="0" y1="48" x2="22" y2="48" stroke="#1e293b" strokeWidth="3" strokeLinecap="round" />
          <MeterFace letter="A" cx={80} cy={48} r={30} />
          <line x1="138" y1="48" x2="160" y2="48" stroke="#1e293b" strokeWidth="3" strokeLinecap="round" />
          <text x="80" y="88" textAnchor="middle" className="solar-symbol__label">
            Ammeter
          </text>
        </svg>
      );

    case 'voltmeter':
      return (
        <svg viewBox="0 0 110 170" className="solar-symbol" aria-hidden>
          <line x1="55" y1="0" x2="55" y2="18" stroke="#1e293b" strokeWidth="3" strokeLinecap="round" />
          <MeterFace letter="V" cx={55} cy={82} r={32} />
          <line x1="55" y1="146" x2="55" y2="164" stroke="#1e293b" strokeWidth="3" strokeLinecap="round" />
          <text x="55" y="168" textAnchor="middle" className="solar-symbol__label">
            Voltmeter
          </text>
        </svg>
      );

    case 'key':
      return (
        <svg viewBox="0 0 150 95" className="solar-symbol" aria-hidden>
          <line x1="0" y1="48" x2="20" y2="48" stroke="#1e293b" strokeWidth="3" strokeLinecap="round" />
          <text x="42" y="58" className="solar-symbol__key-paren">
            (
          </text>
          <circle cx="75" cy="48" r="7" fill="#1e293b" />
          <text x="98" y="58" className="solar-symbol__key-paren">
            )
          </text>
          <text x="75" y="28" textAnchor="middle" className="solar-symbol__key-label">
            K
          </text>
          <line x1="130" y1="48" x2="150" y2="48" stroke="#1e293b" strokeWidth="3" strokeLinecap="round" />
          <text x="75" y="88" textAnchor="middle" className="solar-symbol__label">
            Key
          </text>
        </svg>
      );

    case 'loadResistor':
      return (
        <svg viewBox="0 0 100 185" className="solar-symbol" aria-hidden>
          <line x1="50" y1="0" x2="50" y2="20" stroke="#1e293b" strokeWidth="3" strokeLinecap="round" />
          <path
            d="M50 20 L38 34 L62 48 L38 62 L62 76 L38 90 L62 104 L50 118"
            fill="none"
            stroke="#1e293b"
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <line x1="50" y1="118" x2="50" y2="138" stroke="#1e293b" strokeWidth="3" strokeLinecap="round" />
          <text x="50" y="162" textAnchor="middle" className="solar-symbol__load">
            LOAD
          </text>
        </svg>
      );

    default:
      return null;
  }
}

export const componentDimensions: Record<
  SymbolType,
  {
    width: number;
    height: number;
    terminals: { id: string; x: number; y: number }[];
    requiresConnection: boolean;
  }
> = {
  lightSource: {
    width: 120,
    height: 140,
    terminals: [],
    requiresConnection: false,
  },
  solarCell: {
    width: 150,
    height: 175,
    terminals: [
      { id: 'solar+', x: 75, y: 6 },
      { id: 'solar-', x: 75, y: 169 },
    ],
    requiresConnection: true,
  },
  voltmeter: {
    width: 110,
    height: 170,
    terminals: [
      { id: 'voltmeter+', x: 55, y: 6 },
      { id: 'voltmeter-', x: 55, y: 164 },
    ],
    requiresConnection: true,
  },
  ammeter: {
    width: 160,
    height: 95,
    terminals: [
      { id: 'ammeter+', x: 6, y: 48 },
      { id: 'ammeter-', x: 154, y: 48 },
    ],
    requiresConnection: true,
  },
  key: {
    width: 150,
    height: 95,
    terminals: [
      { id: 'key+', x: 6, y: 48 },
      { id: 'key-', x: 144, y: 48 },
    ],
    requiresConnection: true,
  },
  loadResistor: {
    width: 100,
    height: 185,
    terminals: [
      { id: 'load-in', x: 50, y: 6 },
      { id: 'load-out', x: 50, y: 179 },
    ],
    requiresConnection: true,
  },
};
