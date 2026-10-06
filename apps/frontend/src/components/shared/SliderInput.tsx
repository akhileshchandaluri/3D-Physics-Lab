interface SliderInputProps {
  label: string;
  min: number;
  max: number;
  step: number;
  value: number;
  unit: string;
  onChange: (value: number) => void;
}

export function SliderInput({
  label, min, max, step, value, unit, onChange
}: SliderInputProps) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center',
      gap: '12px', marginBottom: '12px'
    }}>
      <span style={{
        fontSize: '13px', color: '#595959', minWidth: '100px'
      }}>
        {label}
      </span>
      <input
        type="range"
        min={min} max={max} step={step} value={value}
        onChange={e => onChange(parseFloat(e.target.value))}
        style={{ flex: 1, accentColor: '#8d1b2e' }}
      />
      <span style={{
        fontSize: '13px', fontWeight: 500,
        minWidth: '72px', textAlign: 'right', color: '#212121'
      }}>
        {value} {unit}
      </span>
    </div>
  );
}