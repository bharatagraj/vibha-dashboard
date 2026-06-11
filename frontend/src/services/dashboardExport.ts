/**
 * dashboardExport.ts — Vibha Dashboard Platform
 * Day 12, Hour 3: Complete dashboard export (PDF, Excel, PPTX)
 */

import jsPDF from 'jspdf';
import * as XLSX from 'xlsx';
import PptxGenJS from 'pptxgenjs';

export interface DashboardExportData {
  dashboardName: string;
  kpis: Record<string, any>;
  charts: Array<{
    title: string;
    data: Record<string, any>[];
  }>;
  tableData: Record<string, any>[];
}

/**
 * Export complete dashboard as PDF
 */
export async function exportDashboardAsPDF(
  exportData: DashboardExportData,
): Promise<void> {
  try {
    const { dashboardName, kpis, charts, tableData } = exportData;
    
    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4',
    });

    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    const margin = 15;
    const contentWidth = pageWidth - 2 * margin;
    let yPosition = margin;

    // Title
    pdf.setFontSize(20);
    pdf.setFont(undefined, 'bold');
    pdf.text(dashboardName, margin, yPosition);
    yPosition += 15;

    // Timestamp
    pdf.setFontSize(10);
    pdf.setFont(undefined, 'normal');
    pdf.setTextColor(100, 100, 100);
    pdf.text(`Exported: ${new Date().toLocaleString()}`, margin, yPosition);
    yPosition += 12;

    // KPIs Summary
    pdf.setFontSize(14);
    pdf.setFont(undefined, 'bold');
    pdf.setTextColor(0, 0, 0);
    pdf.text('Key Performance Indicators', margin, yPosition);
    yPosition += 10;

    pdf.setFontSize(10);
    pdf.setFont(undefined, 'normal');
    const kpiEntries = Object.entries(kpis);
    const kpisPerRow = 3;
    for (let i = 0; i < kpiEntries.length; i++) {
      const [key, value] = kpiEntries[i];
      const xPos = margin + (i % kpisPerRow) * (contentWidth / kpisPerRow);
      const yPos = yPosition + Math.floor(i / kpisPerRow) * 15;

      if (yPos > pageHeight - margin - 10) {
        pdf.addPage();
        yPosition = margin;
      }

      pdf.text(
        `${key.replace(/_/g, ' ')}: ${value}`,
        xPos,
        yPos,
      );
    }
    yPosition += Math.ceil(kpiEntries.length / kpisPerRow) * 15 + 10;

    // Charts info
    pdf.setFontSize(14);
    pdf.setFont(undefined, 'bold');
    pdf.text('Charts', margin, yPosition);
    yPosition += 10;

    pdf.setFontSize(10);
    pdf.setFont(undefined, 'normal');
    for (const chart of charts) {
      if (yPosition > pageHeight - margin - 20) {
        pdf.addPage();
        yPosition = margin;
      }
      pdf.text(`• ${chart.title} (${chart.data.length} rows)`, margin + 5, yPosition);
      yPosition += 8;
    }
    yPosition += 5;

    // Data Table
    if (yPosition > pageHeight - margin - 40) {
      pdf.addPage();
      yPosition = margin;
    }

    pdf.setFontSize(14);
    pdf.setFont(undefined, 'bold');
    pdf.text('Data Summary', margin, yPosition);
    yPosition += 10;

    pdf.setFontSize(9);
    pdf.setFont(undefined, 'normal');
    pdf.text(`Total Records: ${tableData.length}`, margin, yPosition);
    yPosition += 8;

    if (tableData.length > 0) {
      const columns = Object.keys(tableData[0]);
      const rows = tableData.slice(0, 10);

      pdf.text('First 10 rows:', margin, yPosition);
      yPosition += 6;

      pdf.setFont(undefined, 'bold');
      let xPos = margin + 5;
      const colWidth = (contentWidth - 10) / columns.length;
      for (const col of columns) {
        pdf.text(col.substring(0, 12), xPos, yPosition, { maxWidth: colWidth - 2 });
        xPos += colWidth;
      }
      yPosition += 7;

      pdf.setFont(undefined, 'normal');
      for (const row of rows) {
        if (yPosition > pageHeight - margin - 10) {
          pdf.addPage();
          yPosition = margin;
        }
        xPos = margin + 5;
        for (const col of columns) {
          const value = String(row[col] ?? '—').substring(0, 15);
          pdf.text(value, xPos, yPosition, { maxWidth: colWidth - 2 });
          xPos += colWidth;
        }
        yPosition += 6;
      }

      if (tableData.length > 10) {
        yPosition += 3;
        pdf.setFont(undefined, 'italic');
        pdf.setTextColor(100, 100, 100);
        pdf.text(`... and ${tableData.length - 10} more rows`, margin, yPosition);
      }
    }

    // Footer
    pdf.setFontSize(8);
    pdf.setFont(undefined, 'normal');
    pdf.setTextColor(150, 150, 150);
    pdf.text(
      'Vibha Dashboard Platform',
      pageWidth / 2,
      pageHeight - 5,
      { align: 'center' },
    );

    const filename = `${dashboardName.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.pdf`;
    pdf.save(filename);
  } catch (error) {
    console.error('Dashboard PDF export failed:', error);
  }
}

/**
 * Export complete dashboard as Excel
 */
export function exportDashboardAsExcel(
  exportData: DashboardExportData,
): void {
  try {
    const { dashboardName, kpis, charts, tableData } = exportData;
    const workbook = XLSX.utils.book_new();

    // Sheet 1: Summary
    const summaryData = [
      ['Dashboard Summary'],
      ['Name', dashboardName],
      ['Exported', new Date().toLocaleString()],
      ['Total Records', tableData.length],
      ['Charts', charts.length],
      [],
    ];
    const summarySheet = XLSX.utils.aoa_to_sheet(summaryData);
    summarySheet['!cols'] = [{ wch: 20 }, { wch: 30 }];
    XLSX.utils.book_append_sheet(workbook, summarySheet, 'Summary');

    // Sheet 2: KPIs
    const kpiData = [['KPI', 'Value']];
    for (const [key, value] of Object.entries(kpis)) {
      kpiData.push([key.replace(/_/g, ' '), String(value)]);
    }
    const kpiSheet = XLSX.utils.aoa_to_sheet(kpiData);
    kpiSheet['!cols'] = [{ wch: 30 }, { wch: 20 }];
    XLSX.utils.book_append_sheet(workbook, kpiSheet, 'KPIs');

    // Sheet 3+: Each chart's data
    for (const [index, chart] of charts.entries()) {
      const chartSheet = XLSX.utils.json_to_sheet(chart.data);
      chartSheet['!cols'] = Object.keys(chart.data[0] || {}).map(() => ({ wch: 18 }));
      XLSX.utils.book_append_sheet(workbook, chartSheet, chart.title.substring(0, 31));
    }

    // Sheet N: Complete Data Table
    const dataSheet = XLSX.utils.json_to_sheet(tableData);
    dataSheet['!cols'] = Object.keys(tableData[0] || {}).map(() => ({ wch: 18 }));
    XLSX.utils.book_append_sheet(workbook, dataSheet, 'Data');

    const filename = `${dashboardName.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.xlsx`;
    XLSX.writeFile(workbook, filename);
  } catch (error) {
    console.error('Dashboard Excel export failed:', error);
  }
}

/**
 * Export complete dashboard as PowerPoint
 */
export function exportDashboardAsPPTX(
  exportData: DashboardExportData,
): void {
  try {
    const { dashboardName, kpis, charts, tableData } = exportData;
    const pres = new PptxGenJS();

    // Slide 1: Title Slide
    const titleSlide = pres.addSlide();
    titleSlide.background = { color: '1F4E78' };
    titleSlide.addText(dashboardName, {
      x: 0.5,
      y: 2,
      w: 9,
      h: 1,
      fontSize: 44,
      bold: true,
      color: 'FFFFFF',
      align: 'center',
    });
    titleSlide.addText('Dashboard Export', {
      x: 0.5,
      y: 3.2,
      w: 9,
      h: 0.5,
      fontSize: 24,
      color: 'CCCCCC',
      align: 'center',
    });
    titleSlide.addText(`Exported: ${new Date().toLocaleString()}`, {
      x: 0.5,
      y: 6,
      w: 9,
      h: 0.3,
      fontSize: 12,
      color: 'FFFFFF',
      align: 'center',
      italic: true,
    });

    // Slide 2: KPIs Summary
    const kpiSlide = pres.addSlide();
    kpiSlide.background = { color: 'FFFFFF' };
    kpiSlide.addText('Key Performance Indicators', {
      x: 0.5,
      y: 0.3,
      w: 9,
      h: 0.5,
      fontSize: 28,
      bold: true,
      color: '1F4E78',
    });

    const kpiTableData: (string | number)[][] = [
      ['KPI', 'Value'],
      ...Object.entries(kpis).map(([k, v]) => [k.replace(/_/g, ' '), v]),
    ];

    kpiSlide.addTable(kpiTableData, {
      x: 0.5,
      y: 1.1,
      w: 9,
      h: 4.5,
      border: { pt: 1, color: 'CCCCCC' },
      fill: { color: 'F0F0F0' },
      fontSize: 11,
    });

    // Slide 3: Chart Summary
    const chartSlide = pres.addSlide();
    chartSlide.background = { color: 'FFFFFF' };
    chartSlide.addText('Charts Overview', {
      x: 0.5,
      y: 0.3,
      w: 9,
      h: 0.5,
      fontSize: 28,
      bold: true,
      color: '1F4E78',
    });

    let chartSummaryText = '';
    for (const chart of charts) {
      chartSummaryText += `• ${chart.title}\n   Records: ${chart.data.length}\n\n`;
    }

    chartSlide.addText(chartSummaryText, {
      x: 0.5,
      y: 1.1,
      w: 9,
      h: 5,
      fontSize: 12,
      color: '333333',
    });

    // Slide 4: Data Table Summary
    if (tableData.length > 0) {
      const dataSlide = pres.addSlide();
      dataSlide.background = { color: 'FFFFFF' };
      dataSlide.addText('Data Summary', {
        x: 0.5,
        y: 0.3,
        w: 9,
        h: 0.5,
        fontSize: 28,
        bold: true,
        color: '1F4E78',
      });

      dataSlide.addText(`Total Records: ${tableData.length}`, {
        x: 0.5,
        y: 1.1,
        w: 9,
        h: 0.4,
        fontSize: 12,
        color: '333333',
        bold: true,
      });

      const columns = Object.keys(tableData[0]);
      const dataTableRows = tableData.slice(0, 5);
      const dataTableData: (string | number)[][] = [
        columns.map(c => c.replace(/_/g, ' ')),
        ...dataTableRows.map(row => columns.map(col => String(row[col] ?? '—'))),
      ];

      dataSlide.addTable(dataTableData, {
        x: 0.5,
        y: 1.7,
        w: 9,
        h: 4,
        border: { pt: 1, color: 'CCCCCC' },
        fill: { color: 'F0F0F0' },
        fontSize: 9,
      });

      if (tableData.length > 5) {
        dataSlide.addText(`... and ${tableData.length - 5} more rows`, {
          x: 0.5,
          y: 6,
          w: 9,
          h: 0.3,
          fontSize: 10,
          color: '999999',
          italic: true,
        });
      }
    }

    const filename = `${dashboardName.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.pptx`;
    pres.writeFile(filename);
  } catch (error) {
    console.error('Dashboard PPTX export failed:', error);
  }
}

export default {
  exportDashboardAsPDF,
  exportDashboardAsExcel,
  exportDashboardAsPPTX,
};
