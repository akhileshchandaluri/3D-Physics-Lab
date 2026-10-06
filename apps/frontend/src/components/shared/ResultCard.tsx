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
      background: highlight ? '#f8e8eb' : '#fff',
      borderRadius: '8px',
      padding: '10px 14px',
      border: highlight ? '1.5px solid #8d1b2e' : '1px solid #e6e6e6'
    }}>
      <div style={{
        fontSize: '12px', color: '#595959', marginBottom: '4px'
      }}>
        {label}
      </div>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: '4px' }}>
        <span style={{ fontSize: '22px', fontWeight: 500, color: '#212121' }}>
          {value}
        </span>
        <span style={{ fontSize: '13px', color: '#595959' }}>
          {unit}
        </span>
      </div>
    </div>
  );
}