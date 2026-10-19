import type React from 'react';

export interface ExperimentProps {
  initialState?: unknown;
  isReadOnly?: boolean;
}

export interface ExperimentRegistryEntry {
  id: string;
  code: string;
  title: string;
  path: string;
  available: boolean;
  load?: () => Promise<{ default: React.ComponentType<ExperimentProps> }>;
  wrapperStyle?: React.CSSProperties;
}
