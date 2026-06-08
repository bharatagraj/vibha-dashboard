export const exportChartAsPNG = (svgElement: SVGSVGElement | null, filename: string) => {
  if (!svgElement) return

  const canvas = document.createElement('canvas')
  const ctx = canvas.getContext('2d')
  const svg = new XMLSerializer().serializeToString(svgElement)
  const img = new Image()

  img.onload = () => {
    canvas.width = img.width
    canvas.height = img.height
    ctx?.drawImage(img, 0, 0)
    const link = document.createElement('a')
    link.href = canvas.toDataURL('image/png')
    link.download = `${filename}.png`
    link.click()
  }

  img.src = 'data:image/svg+xml;base64,' + btoa(svg)
}

export const exportDataAsCSV = (data: Record<string, unknown>[], filename: string) => {
  if (!data || data.length === 0) return

  const headers = Object.keys(data[0])
  const csvContent = [
    headers.join(','),
    ...data.map((row) => headers.map((h) => row[h]).join(',')),
  ].join('\n')

  const link = document.createElement('a')
  link.href = 'data:text/csv;charset=utf-8,' + encodeURIComponent(csvContent)
  link.download = `${filename}.csv`
  link.click()
}

export const exportDashboardAsPDF = (dashboardName: string) => {
  // Placeholder - would need jsPDF library
  alert(`PDF export for "${dashboardName}" - coming soon!`)
}
