import { useOhmsLaw } from '../../hooks/useOhmsLaw';
import { ExperimentLayout } from '../../components/shared/ExperimentLayout';
import { SliderInput } from '../../components/shared/SliderInput';
import { ResultCard } from '../../components/shared/ResultCard';
import { FormulaBar } from '../../components/shared/FormulaBar';
import { CircuitDiagram } from './CircuitDiagram';
import { IVChart } from './IVChart';

export function OhmsLaw() {
  const {
    voltage, setVoltage,
    resistance, setResistance,
    temperature, setTemperature,
    currentMa,
    effectiveResistance,
    power,
    brightnessRatio,
    ivCurve,
  } = useOhmsLaw({ voltage: 12, resistance: 200, temperature: 25 });

  return (
    <ExperimentLayout
      sessionNumber="Session 02"
      title="Ohm's law simulator"

      controls={
        <>
          <div style={{
            fontSize: '12px', fontWeight: 500,
            color: '#888', marginBottom: '14px'
          }}>
            Controls
          </div>

          <SliderInput
            label="Voltage"
            min={0} max={24} step={0.5}
            value={voltage} unit="V"
            onChange={setVoltage}
          />
          <SliderInput
            label="Resistance"
            min={10} max={1000} step={10}
            value={resistance} unit="Ω"
            onChange={setResistance}
          />
          <SliderInput
            label="Temperature"
            min={25} max={200} step={5}
            value={temperature} unit="°C"
            onChange={setTemperature}
          />

          <div style={{ marginTop: '20px' }}>
            <div style={{
              fontSize: '12px', color: '#888', marginBottom: '6px'
            }}>
              Circuit diagram
            </div>
            <CircuitDiagram
              brightnessRatio={brightnessRatio}
              voltage={voltage}
              resistance={resistance}
            />
          </div>
        </>
      }

      visualization={
        <>
          <div style={{
            fontSize: '12px', fontWeight: 500,
            color: '#888', marginBottom: '14px'
          }}>
            I-V characteristic
          </div>
          <IVChart
            ivCurve={ivCurve}
            resistance={resistance}
            temperature={temperature}
          />
        </>
      }

      results={
        <>
          <ResultCard
            label="Voltage"
            value={voltage.toFixed(1)}
            unit="V"
          />
          <ResultCard
            label="Current"
            value={currentMa.toFixed(2)}
            unit="mA"
            highlight
          />
          <ResultCard
            label="Resistance (eff.)"
            value={Math.round(effectiveResistance)}
            unit="Ω"
          />
          <ResultCard
            label="Power"
            value={power.toFixed(3)}
            unit="W"
          />
        </>
      }

      formula={
        <FormulaBar formulas={[
          { label: 'Current', expression: 'I = V / R' },
          { label: 'Power', expression: 'P = V × I' },
          { label: 'Temp correction',
            expression: 'R(T) = R₀(1 + α·ΔT)' },
        ]} />
      }
    />
  );
}