/**
 * exportService.ts — Vibha Dashboard Platform
 * CSV export + delegation to dashboardExport for PDF/Excel/PPTX
 */

import { exportDashboardAsPDF, exportDashboardAsExcel, exportDashboardAsPPTX } from './dashboardExport'

/**
 * Export data as CSV
 */
export function exportDataAsCSV(data: Record<string, any>[], dashboardName: string): void {
  if (data.length === 0) {
    alert('No data to export');
    return;
  }

  const headers = Object.keys(data[0]);
  const csvContent = [
    headers.join(','),
    ...data.map(row =>
      headers
        .map(header => {
          const value = row[header];
          const stringValue = String(value ?? '');
          return stringValue.includes(',') ? `"${stringValue}"` : stringValue;
        })
        .join(','),
    ),
  ].join('\n');

  const blob = new Blob([csvContent], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `${dashboardName}_${new Date().toISOString().split('T')[0]}.csv`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
  console.log('✓ CSV exported');
}

/**
 * Export dashboard as PDF (delegates to dashboardExport)
 */
export async function exportDashboardAsPDF(exportData: {
  dashboardName: string;
  kpis: Record<string, any>;
  charts: Array<{ title: string; data: Record<string, any>[] }>;
  tableData: Record<string, any>[];
}): Promise<void> {
  return import('./dashboardExport').then(module =>
    module.exportDashboardAsPDF(exportData)
  );
}

export default {
  exportDataAsCSV,
  exportDashboardAsPDF,
  exportDashboardAsExcel,
  exportDashboardAsPPTX,
};
