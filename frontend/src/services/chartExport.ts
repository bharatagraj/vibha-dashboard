/**
 * chartExport.ts — Vibha Dashboard Platform
 * Day 12, Hour 3: Individual chart export (PNG, JPG, SVG, PDF, JSON, PPTX)
 */

import * as echarts from 'echarts';
import jsPDF from 'jspdf';
import PptxGenJS from 'pptxgenjs';

export type ChartExportFormat = 'png' | 'jpg' | 'svg' | 'pdf' | 'json' | 'pptx';

/**
 * Export chart as PNG
 */
export function exportChartAsPNG(
  chartInstance: echarts.ECharts | null,
  filename: string,
): void {
  if (!chartInstance) return;

  try {
    const dataURL = chartInstance.getDataURL({
      type: 'png',
      pixelRatio: 2,
      backgroundColor: '#fff',
    });
    downloadImage(dataURL, `${filename}.png`);
  } catch (error) {
    console.error('PNG export failed:', error);
  }
}

/**
 * Export chart as JPG
 */
export function exportChartAsJPG(
  chartInstance: echarts.ECharts | null,
  filename: string,
): void {
  if (!chartInstance) return;

  try {
    const dataURL = chartInstance.getDataURL({
      type: 'jpg',
      pixelRatio: 2,
      backgroundColor: '#fff',
    });
    downloadImage(dataURL, `${filename}.jpg`);
  } catch (error) {
    console.error('JPG export failed:', error);
  }
}

/**
 * Export chart as SVG (vector format)
 */
export function exportChartAsSVG(
  chartInstance: echarts.ECharts | null,
  filename: string,
): void {
  if (!chartInstance) return;

  try {
    const dataURL = chartInstance.getDataURL({
      type: 'svg',
      backgroundColor: '#fff',
    });
    downloadImage(dataURL, `${filename}.svg`);
  } catch (error) {
    console.error('SVG export failed:', error);
  }
}

/**
 * Export chart as PDF
 */
export function exportChartAsPDF(
  chartInstance: echarts.ECharts | null,
  filename: string,
): void {
  if (!chartInstance) return;

  try {
    const dataURL = chartInstance.getDataURL({
      type: 'png',
      pixelRatio: 2,
      backgroundColor: '#fff',
    });

    const canvas = chartInstance.getRenderedCanvas();
    const width = canvas.width;
    const height = canvas.height;
    const aspectRatio = width / height;

    const pdf = new jsPDF({
      orientation: aspectRatio > 1 ? 'landscape' : 'portrait',
      unit: 'mm',
      format: 'a4',
    });

    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    const margin = 10;
    const availWidth = pageWidth - 2 * margin;
    const availHeight = pageHeight - 2 * margin;

    let imgWidth = availWidth;
    let imgHeight = (imgWidth / aspectRatio);

    if (imgHeight > availHeight) {
      imgHeight = availHeight;
      imgWidth = (imgHeight * aspectRatio);
    }

    const x = (pageWidth - imgWidth) / 2;
    const y = (pageHeight - imgHeight) / 2;

    pdf.addImage(dataURL, 'PNG', x, y, imgWidth, imgHeight);
    pdf.save(`${filename}.pdf`);
  } catch (error) {
    console.error('PDF export failed:', error);
  }
}

/**
 * Export chart as PowerPoint slide
 */
export function exportChartAsPPTX(
  chartInstance: echarts.ECharts | null,
  filename: string,
  chartTitle: string,
): void {
  if (!chartInstance) return;

  try {
    const dataURL = chartInstance.getDataURL({
      type: 'png',
      pixelRatio: 2,
      backgroundColor: '#fff',
    });

    const pres = new PptxGenJS();
    const slide = pres.addSlide();

    // Add background
    slide.background = { color: 'FFFFFF' };

    // Add title
    slide.addText(chartTitle, {
      x: 0.5,
      y: 0.5,
      w: 9,
      h: 0.5,
      fontSize: 28,
      bold: true,
      color: '1F4E78',
    });

    // Add timestamp
    slide.addText(`Exported: ${new Date().toLocaleString()}`, {
      x: 0.5,
      y: 1.1,
      w: 9,
      h: 0.3,
      fontSize: 10,
      color: '666666',
      italic: true,
    });

    // Add chart image (centered)
    slide.addImage({
      data: dataURL,
      x: 0.5,
      y: 1.6,
      w: 9,
      h: 5,
      rsize: { type: 'cover' },
    });

    // Add footer
    slide.addText('Vibha Dashboard Platform', {
      x: 0.5,
      y: 6.9,
      w: 9,
      h: 0.3,
      fontSize: 9,
      color: '999999',
      align: 'center',
    });

    // Save
    pres.writeFile(`${filename}.pptx`);
  } catch (error) {
    console.error('PPTX export failed:', error);
  }
}

/**
 * Export chart config and data as JSON
 */
export function exportChartAsJSON(
  chartInstance: echarts.ECharts | null,
  data: Record<string, any>[],
  filename: string,
  chartTitle: string,
): void {
  if (!chartInstance) return;

  try {
    const option = chartInstance.getOption();
    const exportData = {
      title: chartTitle,
      exportedAt: new Date().toISOString(),
      chartConfig: option,
      rawData: data,
    };

    const jsonString = JSON.stringify(exportData, null, 2);
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    downloadFile(url, `${filename}.json`);
    URL.revokeObjectURL(url);
  } catch (error) {
    console.error('JSON export failed:', error);
  }
}

/**
 * Generic export handler (selects format)
 */
export function exportChart(
  chartInstance: echarts.ECharts | null,
  format: ChartExportFormat,
  data: Record<string, any>[],
  filename: string,
  chartTitle: string,
): void {
  switch (format) {
    case 'png':
      exportChartAsPNG(chartInstance, filename);
      break;
    case 'jpg':
      exportChartAsJPG(chartInstance, filename);
      break;
    case 'svg':
      exportChartAsSVG(chartInstance, filename);
      break;
    case 'pdf':
      exportChartAsPDF(chartInstance, filename);
      break;
    case 'pptx':
      exportChartAsPPTX(chartInstance, filename, chartTitle);
      break;
    case 'json':
      exportChartAsJSON(chartInstance, data, filename, chartTitle);
      break;
    default:
      console.warn(`Unknown export format: ${format}`);
  }
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function downloadImage(dataURL: string, filename: string): void {
  const link = document.createElement('a');
  link.href = dataURL;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

function downloadFile(url: string, filename: string): void {
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

/**
 * Generate filename with timestamp
 */
export function generateChartFilename(chartTitle: string): string {
  const sanitized = chartTitle
    .toLowerCase()
    .replace(/\s+/g, '_')
    .replace(/[^a-z0-9_]/g, '');
  const date = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
  return `${sanitized}_${date}`;
}

export default {
  exportChart,
  exportChartAsPNG,
  exportChartAsJPG,
  exportChartAsSVG,
  exportChartAsPDF,
  exportChartAsPPTX,
  exportChartAsJSON,
  generateChartFilename,
};
