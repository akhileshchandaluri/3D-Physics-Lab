interface CircuitDiagramProps {
  brightnessRatio: number;
  voltage: number;
  resistance: number;
}

export function CircuitDiagram({
  brightnessRatio, voltage, resistance
}: CircuitDiagramProps) {
  const opacity = Math.min(0.15 + brightnessRatio * 0.75, 0.90).toFixed(2);
  const glowColor = brightnessRatio > 0.6 ? '#EF9F27' : '#FAC775';

  return (
    <svg width="100%" viewBox="0 0 300 120" style={{ marginTop: '8px' }}>

      {/* Top wire */}
      <line x1="30" y1="20" x2="240" y2="20"
        stroke="#888" strokeWidth="1.5"/>

      {/* Left wire down */}
      <line x1="30" y1="20" x2="30" y2="65"
        stroke="#888" strokeWidth="1.5"/>

      {/* Battery long line */}
      <line x1="18" y1="65" x2="42" y2="65"
        stroke="#888" strokeWidth="2.5"/>
      {/* Battery short line */}
      <line x1="23" y1="74" x2="37" y2="74"
        stroke="#888" strokeWidth="1.5"/>

      {/* Left wire down continued */}
      <line x1="30" y1="74" x2="30" y2="95"
        stroke="#888" strokeWidth="1.5"/>

      {/* Bottom wire */}
      <line x1="30" y1="95" x2="240" y2="95"
        stroke="#888" strokeWidth="1.5"/>

      {/* Right wire top segment to bulb */}
      <line x1="240" y1="20" x2="240" y2="51"
        stroke="#888" strokeWidth="1.5"/>

      {/* Right wire bottom segment from bulb */}
      <line x1="240" y1="79" x2="240" y2="95"
        stroke="#888" strokeWidth="1.5"/>

      {/* Wire from left to resistor */}
      <line x1="30" y1="20" x2="80" y2="20"
        stroke="#888" strokeWidth="1.5"/>

      {/* Resistor box */}
      <rect x="80" y="10" width="90" height="20" rx="3"
        fill="none" stroke="#888" strokeWidth="1.5"/>
      <text x="125" y="24"
        textAnchor="middle" fontSize="10"
        fill="#666" fontFamily="monospace">
        {resistance}Ω
      </text>

      {/* Wire from resistor to right */}
      <line x1="170" y1="20" x2="240" y2="20"
        stroke="#888" strokeWidth="1.5"/>

      {/* Bulb glow circle (behind outline) */}
      <circle cx="240" cy="65" r="18"
        fill={glowColor}
        opacity={opacity}/>

      {/* Bulb outline */}
      <circle cx="240" cy="65" r="14"
        fill="none" stroke="#888" strokeWidth="1.5"/>

      {/* Bulb filament zigzag */}
      <polyline
        points="234,70 237,62 240,68 243,60 246,66 249,58"
        fill="none"
        stroke="#888"
        strokeWidth="1.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {/* Voltage label next to battery */}
      <text x="10" y="60"
        fontSize="10" fill="#666" fontFamily="monospace">
        {voltage}V
      </text>

      {/* Labels */}
      <text x="125" y="108"
        textAnchor="middle" fontSize="10" fill="#aaa">
        Simple resistive circuit
      </text>
    </svg>
  );
}