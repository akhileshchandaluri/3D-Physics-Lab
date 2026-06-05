import { useState } from 'react';
import type { ReactNode } from 'react';
import { Box, Tabs as MuiTabs, Tab as MuiTab } from '@mui/material';

interface TabsProps {
  tabs: string[];
  children: ReactNode[];
}

export function Tabs({ tabs, children }: TabsProps) {
  const [active, setActive] = useState(0);

  const handleChange = (_event: React.SyntheticEvent, newValue: number) => {
    setActive(newValue);
  };

  return (
    <Box sx={{ width: '100%' }}>
      <Box sx={{ borderBottom: 1, borderColor: 'divider', px: 2 }}>
        <MuiTabs 
          value={active} 
          onChange={handleChange} 
          aria-label="simulation configuration tabs"
        >
          {tabs.map((tab, index) => (
            <MuiTab 
              key={tab} 
              label={tab} 
              id={`tab-${index}`}
              aria-controls={`tabpanel-${index}`}
            />
          ))}
        </MuiTabs>
      </Box>
      <Box sx={{ p: 2 }}>
        {children[active]}
      </Box>
    </Box>
  );
}

