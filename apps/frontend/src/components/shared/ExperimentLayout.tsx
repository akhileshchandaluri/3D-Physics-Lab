import { ReactNode } from 'react';

interface ExperimentLayoutProps {
  title: string;
  sessionNumber: string;
  controls: ReactNode;
  visualization: ReactNode;
  results: ReactNode;
  formula: ReactNode;
}

export function ExperimentLayout({
  title, sessionNumber,
  controls, visualization, results, formula
}: ExperimentLayoutProps) {
  return (
    <div style={{ padding: '24px', maxWidth: '1100px', margin: '0 auto' }}>

      <div style={{ marginBottom: '20px' }}>
        <span style={{ fontSize: '12px', color: '#888' }}>
          {sessionNumber}
        </span>
        <h1 style={{
          fontSize: '20px', fontWeight: 500,
          margin: '4px 0 0', color: '#111'
        }}>
          {title}
        </h1>
      </div>

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
        gap: '16px', marginBottom: '16px'
      }}>
        <div style={{
          background: '#fff', border: '0.5px solid #e0e0e0',
          borderRadius: '12px', padding: '16px'
        }}>
          {controls}
        </div>
        <div style={{
          background: '#fff', border: '0.5px solid #e0e0e0',
          borderRadius: '12px', padding: '16px'
        }}>
          {visualization}
        </div>
      </div>

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(4, minmax(0, 1fr))',
        gap: '10px', marginBottom: '12px'
      }}>
        {results}
      </div>

      {formula}
    </div>
  );
}