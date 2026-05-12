import { useState } from 'react';
import type { ReactNode } from 'react';

interface TabsProps {
  tabs: string[];
  children: ReactNode[];
}

export function Tabs({ tabs, children }: TabsProps) {
  const [active, setActive] = useState(0);

  return (
    <div>
      <div style={{
        display: 'flex',
        borderBottom: '0.5px solid #e0e0e0',
        padding: '0 20px',
        gap: '4px',
      }}>
        {tabs.map((tab, index) => (
          <button
            key={tab}
            onClick={() => setActive(index)}
            style={{
              padding: '10px 16px',
              fontSize: '13px',
              fontWeight: 500,
              color: active === index ? '#4f46e5' : '#888',
              borderBottom: active === index ? '2px solid #4f46e5' : '2px solid transparent',
              background: 'none',
              cursor: 'pointer',
              transition: 'all 0.15s',
              marginBottom: '-0.5px',
            }}
          >
            {tab}
          </button>
        ))}
      </div>
      <div>
        {children[active]}
      </div>
    </div>
  );
}
