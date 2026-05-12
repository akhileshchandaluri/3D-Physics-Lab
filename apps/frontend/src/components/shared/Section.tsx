import type { ReactNode } from 'react';

interface SectionProps {
  title: string;
  content: string | ReactNode;
}

export function Section({ title, content }: SectionProps) {
  return (
    <div style={{ padding: '20px' }}>
      <h2 style={{ fontSize: '18px', fontWeight: 600, marginBottom: '12px', color: '#111' }}>
        {title}
      </h2>
      <div style={{ fontSize: '14px', lineHeight: 1.7, color: '#4b5563' }}>
        {typeof content === 'string' ? <p>{content}</p> : content}
      </div>
    </div>
  );
}
