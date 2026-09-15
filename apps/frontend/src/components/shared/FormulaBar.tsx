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
      padding: '8px 14px', background: '#f9f9f9',
      borderRadius: '8px', fontSize: '13px',
      marginTop: '12px', border: '0.5px solid #e0e0e0'
    }}>
      {formulas.map(f => (
        <span key={f.label}>
          <span style={{ color: '#888' }}>{f.label}:&nbsp;</span>
          <span style={{
            fontWeight: 500, color: '#111', fontFamily: 'monospace'
          }}>
            {f.expression}
          </span>
        </span>
      ))}
    </div>
  );
}