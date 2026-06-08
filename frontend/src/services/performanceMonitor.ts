export const logPerformance = (label: string) => {
  console.log(`⏱️ ${label} - ${performance.now().toFixed(2)}ms`)
}

export const measureRender = (componentName: string, callback: () => void) => {
  const start = performance.now()
  callback()
  const end = performance.now()
  console.log(`🎨 ${componentName} rendered in ${(end - start).toFixed(2)}ms`)
}

export const reportWebVitals = () => {
  console.log('=== Web Vitals ===')
  if ('PerformanceObserver' in window) {
    const observer = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        console.log(`${entry.name}: ${entry.duration.toFixed(2)}ms`)
      }
    })
    observer.observe({ entryTypes: ['largest-contentful-paint', 'first-input', 'layout-shift'] })
  }
}
