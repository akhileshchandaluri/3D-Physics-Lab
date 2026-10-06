import type { ReactNode } from 'react';

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
    <div>

      <div style={{ marginBottom: '20px' }}>
        <span style={{ fontSize: '12px', color: '#8d1b2e', fontWeight: 600 }}>
          {sessionNumber}
        </span>
        <h1 style={{
          fontSize: '20px', fontWeight: 500,
          margin: '4px 0 0', color: '#212121'
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
          background: '#fff', border: '1px solid #e6e6e6',
          borderRadius: '12px', padding: '16px'
        }}>
          {controls}
        </div>
        <div style={{
          background: '#fff', border: '1px solid #e6e6e6',
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