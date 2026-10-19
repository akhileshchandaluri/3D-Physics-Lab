import { useCallback } from 'react';
import type { DataTableProps } from './types';
import styles from './DataTable.module.css';

export function DataTable<T extends Record<string, unknown> = Record<string, unknown>>({
  columns,
  rows,
  onChange,
  onAddRow,
  onClearRows,
  title = 'Observation Table',
  emptyMessage = 'No observations recorded yet.',
}: DataTableProps<T>) {
  const handleExportCsv = useCallback(() => {
    if (columns.length === 0) return;

    const headers = columns.map((c) => (c.unit ? `"${c.label} (${c.unit})"` : `"${c.label}"`));
    const csvRows = rows.map((row) =>
      columns
        .map((col) => {
          const val = row[col.key];
          if (val === null || val === undefined) return '""';
          return typeof val === 'string' ? `"${val.replace(/"/g, '""')}"` : String(val);
        })
        .join(',')
    );

    const csvContent = [headers.join(','), ...csvRows].join('\r\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    const sanitizedTitle = title.toLowerCase().replace(/[^a-z0-9]+/g, '_');
    link.setAttribute('download', `${sanitizedTitle || 'observations'}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }, [columns, rows, title]);

  return (
    <div className={styles.container}>
      <div className={styles.headerRow}>
        <h4 className={styles.title}>{title}</h4>
        <div className={styles.actions}>
          {onAddRow && (
            <button
              type="button"
              className={`${styles.button} ${styles.primaryButton}`}
              onClick={onAddRow}
            >
              + Add Row
            </button>
          )}
          {onClearRows && rows.length > 0 && (
            <button
              type="button"
              className={`${styles.button} ${styles.dangerButton}`}
              onClick={onClearRows}
            >
              Clear
            </button>
          )}
          <button
            type="button"
            className={styles.button}
            onClick={handleExportCsv}
            disabled={rows.length === 0}
            title="Download table data as CSV"
          >
            Export CSV
          </button>
        </div>
      </div>

      <div className={styles.tableWrap}>
        {rows.length === 0 ? (
          <div className={styles.emptyState}>{emptyMessage}</div>
        ) : (
          <table className={styles.table}>
            <thead>
              <tr>
                {columns.map((col) => (
                  <th key={col.key} className={styles.th}>
                    {col.label}
                    {col.unit && <span className={styles.unit}>({col.unit})</span>}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((row, rowIndex) => (
                <tr key={rowIndex} className={styles.tr}>
                  {columns.map((col) => {
                    const value = row[col.key];

                    if (col.render) {
                      return (
                        <td key={col.key} className={styles.td}>
                          {col.render(row, rowIndex)}
                        </td>
                      );
                    }

                    if (col.editable && onChange) {
                      return (
                        <td key={col.key} className={styles.td}>
                          <input
                            type="text"
                            className={styles.input}
                            value={value !== null && value !== undefined ? String(value) : ''}
                            onChange={(e) => onChange(rowIndex, col.key, e.target.value)}
                          />
                        </td>
                      );
                    }

                    return (
                      <td key={col.key} className={styles.td}>
                        {value !== null && value !== undefined ? String(value) : '—'}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
