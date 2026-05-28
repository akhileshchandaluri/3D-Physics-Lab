interface SolarSimulationPanelProps {
  voltage: number;
  current: number;
  power: number;
  lightIntensity: number;
  isRunning: boolean;
}

export function SolarSimulationPanel({
  voltage,
  current,
  power,
  lightIntensity,
  isRunning,
}: SolarSimulationPanelProps) {
  const rayOpacity = Math.min(1, lightIntensity / 120);
  return (
    <div className="solar-visual">
      <svg viewBox="0 0 700 260" className="solar-visual__svg">
        <circle cx="95" cy="55" r="30" fill={`rgba(255, 193, 7, ${rayOpacity})`} />
        {[0, 1, 2, 3].map((idx) => (
          <line
            key={idx}
            x1={130 + idx * 15}
            y1={60}
            x2={245 + idx * 8}
            y2={112}
            className="solar-light-ray"
            style={{ animationDelay: `${idx * 0.2}s`, opacity: rayOpacity }}
          />
        ))}

        <rect x="250" y="85" width="140" height="80" rx="8" className="solar-panel" />
        <text x="320" y="130" textAnchor="middle" className="solar-meter-label">Solar Cell</text>

        <rect x="430" y="98" width="95" height="50" rx="8" className="solar-meter" />
        <text x="477" y="127" textAnchor="middle" className="solar-meter-label">
          A: {current.toFixed(3)} A
        </text>

        <rect x="545" y="98" width="95" height="50" rx="8" className="solar-meter" />
        <text x="592" y="127" textAnchor="middle" className="solar-meter-label">
          V: {voltage.toFixed(3)} V
        </text>

        <line x1="390" y1="123" x2="430" y2="123" className="solar-wire" />
        <line x1="525" y1="123" x2="545" y2="123" className="solar-wire" />
        <line x1="640" y1="123" x2="670" y2="123" className="solar-wire" />
        <line x1="670" y1="123" x2="670" y2="210" className="solar-wire" />
        <line x1="670" y1="210" x2="320" y2="210" className="solar-wire" />
        <line x1="320" y1="210" x2="320" y2="166" className="solar-wire" />

        {isRunning && (
          <>
            <circle cx="406" cy="123" r="4" className="solar-current-dot" />
            <circle cx="532" cy="123" r="4" className="solar-current-dot solar-current-dot--delayed" />
            <circle cx="646" cy="123" r="4" className="solar-current-dot solar-current-dot--late" />
          </>
        )}
      </svg>
      <div className="solar-visual__metrics">
        <div className="vlabs-result-card">
          <div className="vlabs-result-card__label">Voltage</div>
          <div className="vlabs-result-card__value">
            <span className="vlabs-result-card__number">{voltage.toFixed(3)}</span>
            <span className="vlabs-result-card__unit">V</span>
          </div>
        </div>
        <div className="vlabs-result-card vlabs-result-card--highlight">
          <div className="vlabs-result-card__label">Current</div>
          <div className="vlabs-result-card__value">
            <span className="vlabs-result-card__number">{current.toFixed(3)}</span>
            <span className="vlabs-result-card__unit">A</span>
          </div>
        </div>
        <div className="vlabs-result-card">
          <div className="vlabs-result-card__label">Power</div>
          <div className="vlabs-result-card__value">
            <span className="vlabs-result-card__number">{power.toFixed(3)}</span>
            <span className="vlabs-result-card__unit">W</span>
          </div>
        </div>
      </div>
    </div>
  );
}
