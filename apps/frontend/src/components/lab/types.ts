import type { ReactNode } from 'react';

/**
 * 2D point representation for chart datasets.
 */
export interface ChartPoint {
  x: number;
  y: number;
}

/**
 * Dataset configuration for ChartPanel.
 */
export interface ChartDataset {
  label: string;
  points: ChartPoint[];
  type?: 'scatter' | 'line';
  color?: string;
}

/**
 * Parameters for drawing a linear regression fit line across the x range.
 */
export interface FitLine {
  slope: number;
  intercept: number;
}

/**
 * Props for the reusable ChartPanel component.
 */
export interface ChartPanelProps {
  title?: string;
  xLabel?: string;
  yLabel?: string;
  datasets: ChartDataset[];
  fitLine?: FitLine;
  height?: number | string;
}

/**
 * Column definition for observation tables in DataTable.
 */
export interface TableColumn<T = Record<string, unknown>> {
  key: string;
  label: string;
  unit?: string;
  editable?: boolean;
  render?: (row: T, index: number) => ReactNode;
}

/**
 * Props for the DataTable component.
 */
export interface DataTableProps<T extends Record<string, unknown> = Record<string, unknown>> {
  columns: TableColumn<T>[];
  rows: T[];
  onChange?: (rowIndex: number, columnKey: string, value: string | number) => void;
  onAddRow?: () => void;
  onClearRows?: () => void;
  title?: string;
  emptyMessage?: string;
}

/**
 * Props for the LabShell frame layout.
 */
export interface LabShellProps {
  title: string;
  sessionCode?: string;
  backUrl?: string;
  saveControls?: ReactNode;
  controls: ReactNode;
  visualization: ReactNode;
  results: ReactNode;
  theoryProcedure?: ReactNode;
  resultBanner?: ReactNode;
}

/**
 * Save operation status.
 */
export type SaveStatus = 'idle' | 'saving' | 'saved' | 'error';

/**
 * Options configuration for useExperimentSave hook.
 */
export interface UseExperimentSaveOptions<T> {
  experimentId: string;
  isSavedState: (state: unknown) => state is T;
  initialState?: unknown;
  isReadOnly?: boolean;
  defaultTitle?: string;
}

/**
 * Return signature of useExperimentSave hook.
 */
export interface UseExperimentSaveReturn<T> {
  status: SaveStatus;
  message: string | null;
  save: (state: T, title?: string, notes?: string) => Promise<boolean>;
  currentSavedId: string | null;
  loadedState: T | null;
}
