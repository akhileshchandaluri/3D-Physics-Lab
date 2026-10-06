interface FormulaItem {
  label: string;
  expression: string;
}

interface FormulaBarProps {
  formulas: FormulaItem[];
}

export function FormulaBar({ formulas }: FormulaBarProps) {
  return (
    <div style={{
      display: 'flex', gap: '24px', flexWrap: 'wrap',
      padding: '8px 14px', background: '#fff',
      borderRadius: '8px', fontSize: '13px',
      marginTop: '12px', border: '1px solid #e6e6e6'
    }}>
      {formulas.map(f => (
        <span key={f.label}>
          <span style={{ color: '#8d1b2e' }}>{f.label}:&nbsp;</span>
          <span style={{
            fontWeight: 500, color: '#212121', fontFamily: 'monospace'
          }}>
            {f.expression}
          </span>
        </span>
      ))}
    </div>
  );
}