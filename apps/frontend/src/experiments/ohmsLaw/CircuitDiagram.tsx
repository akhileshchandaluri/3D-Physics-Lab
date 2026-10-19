interface CircuitDiagramProps {
  brightnessRatio: number;
  voltage: number;
  resistance: number;
}

export function CircuitDiagram({
  brightnessRatio,
  voltage,
  resistance,
}: CircuitDiagramProps) {
  const currentA = resistance > 0 ? voltage / resistance : 0;
  const currentMa = currentA * 1000;
  const isRunning = voltage > 0 && resistance > 0;
  const animDuration = Math.max(0.4, 2.0 - Math.min(1.5, currentA * 2.0));

  const opacity = Math.min(0.12 + brightnessRatio * 0.85, 0.95);
  const glowRadius = Math.round(14 + brightnessRatio * 18);
  const glowColor =
    brightnessRatio > 0.65
      ? '#f59e0b'
      : brightnessRatio > 0.25
        ? '#fbbf24'
        : '#fde68a';
  const filamentColor = brightnessRatio > 0.05 ? '#fef08a' : '#888888';

  return (
    <div style={{ position: 'relative', width: '100%', maxWidth: '380px', margin: '0 auto' }}>
      <style>{`
        @keyframes circuitCurrentFlow {
          from {
            stroke-dashoffset: 24;
          }
          to {
            stroke-dashoffset: 0;
          }
        }
        @keyframes pulseGlow {
          0%, 100% { transform: scale(1); opacity: ${opacity}; }
          50% { transform: scale(1.08); opacity: ${Math.min(1, opacity + 0.1)}; }
        }
      `}</style>
      <svg
        width="100%"
        viewBox="0 0 320 130"
        style={{ marginTop: '8px', overflow: 'visible', filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.15))' }}
      >
        <defs>
          <radialGradient id="bulbGlowGrad" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor={glowColor} stopOpacity={opacity} />
            <stop offset="60%" stopColor={glowColor} stopOpacity={opacity * 0.5} />
            <stop offset="100%" stopColor={glowColor} stopOpacity="0" />
          </radialGradient>
          <filter id="bulbGlowFilter" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur in="SourceGraphic" stdDeviation="4" />
          </filter>
        </defs>

        {/* Base circuit wires (dark background path) */}
        <path
          d="M 35 65 L 35 22 L 255 22 L 255 50 M 255 78 L 255 102 L 35 102 L 35 75"
          fill="none"
          stroke="var(--border-subtle, #4b5563)"
          strokeWidth="2.5"
          strokeLinecap="round"
        />

        {/* Dynamic Current Flow (animated dashes) */}
        {isRunning && (
          <path
            d="M 35 65 L 35 22 L 255 22 L 255 50 M 255 78 L 255 102 L 35 102 L 35 75"
            fill="none"
            stroke="#38bdf8"
            strokeWidth="2.2"
            strokeDasharray="4 8"
            strokeLinecap="round"
            style={{
              animation: `circuitCurrentFlow ${animDuration}s linear infinite`,
            }}
          />
        )}

        {/* Battery / DC Power Source */}
        {/* Positive terminal (longer) */}
        <line x1="22" y1="65" x2="48" y2="65" stroke="#ef4444" strokeWidth="3" strokeLinecap="round" />
        <text x="14" y="62" fontSize="9" fontWeight="700" fill="#ef4444" textAnchor="middle">+</text>

        {/* Negative terminal (shorter) */}
        <line x1="27" y1="75" x2="43" y2="75" stroke="#3b82f6" strokeWidth="2.5" strokeLinecap="round" />
        <text x="14" y="80" fontSize="9" fontWeight="700" fill="#3b82f6" textAnchor="middle">-</text>

        <text x="35" y="55" fontSize="10" fontWeight="600" fill="var(--text-primary, #e2e8f0)" textAnchor="middle" fontFamily="monospace">
          {voltage.toFixed(1)}V
        </text>

        {/* Resistor Component */}
        <rect
          x="100"
          y="12"
          width="75"
          height="20"
          rx="4"
          fill="var(--surface-card, #1f2937)"
          stroke="#eab308"
          strokeWidth="1.8"
        />
        {/* Resistor color stripes representation */}
        <line x1="112" y1="13" x2="112" y2="31" stroke="#ef4444" strokeWidth="2" />
        <line x1="120" y1="13" x2="120" y2="31" stroke="#3b82f6" strokeWidth="2" />
        <line x1="128" y1="13" x2="128" y2="31" stroke="#eab308" strokeWidth="2" />
        <text
          x="152"
          y="26"
          textAnchor="middle"
          fontSize="10"
          fontWeight="600"
          fill="var(--text-primary, #f9fafb)"
          fontFamily="monospace"
        >
          {resistance}Ω
        </text>

        {/* Ammeter inline widget on bottom wire */}
        <circle cx="145" cy="102" r="12" fill="var(--surface-card, #1e293b)" stroke="#38bdf8" strokeWidth="1.5" />
        <text x="145" y="105" textAnchor="middle" fontSize="9" fontWeight="700" fill="#38bdf8" fontFamily="monospace">
          A
        </text>
        <text x="145" y="122" textAnchor="middle" fontSize="9" fill="var(--text-secondary, #94a3b8)" fontFamily="monospace">
          {currentMa >= 1000 ? `${currentA.toFixed(2)} A` : `${currentMa.toFixed(1)} mA`}
        </text>

        {/* Incandescent Lamp / Load */}
        {/* Outer radial light bloom */}
        {isRunning && (
          <circle
            cx="255"
            cy="64"
            r={glowRadius}
            fill="url(#bulbGlowGrad)"
            style={{
              transformOrigin: '255px 64px',
              animation: `pulseGlow 2s ease-in-out infinite`,
            }}
          />
        )}

        {/* Glass Bulb Envelope */}
        <circle
          cx="255"
          cy="64"
          r="14"
          fill={isRunning ? glowColor : 'transparent'}
          fillOpacity={opacity * 0.4}
          stroke="var(--text-secondary, #9ca3af)"
          strokeWidth="1.8"
        />

        {/* Filament zigzag */}
        <polyline
          points="249,69 252,60 255,67 258,58 261,65 264,57"
          fill="none"
          stroke={filamentColor}
          strokeWidth="1.6"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* Live Power Readout */}
        <text x="255" y="90" fontSize="9" fontWeight="600" fill="var(--text-secondary, #94a3b8)" textAnchor="middle" fontFamily="monospace">
          {((voltage * currentA)).toFixed(2)}W
        </text>
      </svg>
    </div>
  );
}