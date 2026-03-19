interface ResultCardProps {
  label: string;
  value: string | number;
  unit: string;
  highlight?: boolean;
}

export function ResultCard({
  label, value, unit, highlight = false
}: ResultCardProps) {
  return (
    <div style={{
      background: '#f9f9f9',
      borderRadius: '8px',
      padding: '10px 14px',
      border: highlight ? '1.5px solid #378ADD' : '0.5px solid #e0e0e0'
    }}>
      <div style={{
        fontSize: '12px', color: '#888', marginBottom: '4px'
      }}>
        {label}
      </div>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: '4px' }}>
        <span style={{ fontSize: '22px', fontWeight: 500, color: '#111' }}>
          {value}
        </span>
        <span style={{ fontSize: '13px', color: '#888' }}>
          {unit}
        </span>
      </div>
    </div>
  );
}