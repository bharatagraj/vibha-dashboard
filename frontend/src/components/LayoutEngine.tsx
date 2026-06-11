/**
 * Vibha Dashboard Platform — Layout Engine v1.0
 * Wraps react-grid-layout (RGL) with Vibha configuration.
 */

import React, { ReactNode, useState, useCallback, useMemo, useEffect, useRef } from 'react'
import GridLayout, { Layout, Layouts } from 'react-grid-layout'
import 'react-grid-layout/css/styles.css'
import 'react-resizable/css/styles.css'

export interface LayoutItem {
  i: string
  x: number
  y: number
  w: number
  h: number
  minW?: number
  minH?: number
  static?: boolean
}

export interface LayoutEngineProps {
  children: ReactNode
  layoutConfig?: LayoutItem[]
  onLayoutChange?: (newLayout: Layout[]) => void
  isEditMode?: boolean
}

const GRID_CONFIG = {
  cols: 12,
  rowHeight: 80,
  containerPadding: [0, 16],   // Reduced horizontal padding
  margin: [16, 16],
  isDraggable: true,
  isResizable: true,
  compactType: null,           // No auto-compacting
  preventCollision: true,      // Prevent overlap
  useCSSTransforms: true,
  dragHandleClassName: 'vibha-drag-handle',
}

export const LayoutEngine = React.forwardRef<HTMLDivElement, LayoutEngineProps>(
  ({ children, layoutConfig, onLayoutChange, isEditMode = false }, ref) => {
    const containerRef = useRef<HTMLDivElement>(null)
    const [containerWidth, setContainerWidth] = useState(1200)

    // Measure container width on mount and resize
    useEffect(() => {
      const updateWidth = () => {
        if (containerRef.current) {
          const width = containerRef.current.offsetWidth
          console.log(`📐 Container width: ${width}px`)
          setContainerWidth(width)
        }
      }

      updateWidth()
      window.addEventListener('resize', updateWidth)
      return () => window.removeEventListener('resize', updateWidth)
    }, [])

    const initialLayout = useMemo(() => {
      if (layoutConfig && layoutConfig.length > 0) {
        console.log(`📐 RGL initialized with ${layoutConfig.length} items:`, layoutConfig)
        return layoutConfig as Layout[]
      }
      return generateDefaultLayout(React.Children.count(children))
    }, [layoutConfig, children])

    const [layout, setLayout] = useState<Layout[]>(initialLayout)

    const handleLayoutChange = useCallback(
      (newLayout: Layout[]) => {
        console.log('📐 Layout changed:', newLayout)
        setLayout(newLayout)
        if (onLayoutChange) {
          onLayoutChange(newLayout)
        }
      },
      [onLayoutChange]
    )

    const gridConfig = {
      ...GRID_CONFIG,
      isDraggable: isEditMode,
      isResizable: isEditMode,
    }

    return (
      <div
        ref={containerRef}
        className="vibha-zone-charts"
        style={{
          width: '100%',
          background: 'transparent',
        }}
      >
        <GridLayout
          className="layout-grid"
          layout={layout}
          onLayoutChange={handleLayoutChange}
          width={containerWidth}
          {...gridConfig}
        >
          {React.Children.map(children, (child, idx) => {
            if (!React.isValidElement(child)) return null

            const childId = child.key || `widget-${idx}`
            let layoutItem = layout.find((l) => l.i === childId)

            if (!layoutItem) {
              const colsPerRow = 2
              const row = Math.floor(idx / colsPerRow)
              const col = (idx % colsPerRow) * 6

              layoutItem = {
                i: childId,
                x: col,
                y: row * 4,
                w: 6,
                h: 4,
                minW: 3,
                minH: 2,
              }
            }

            return (
              <div
                key={childId}
                data-grid={layoutItem}
                style={{
                  touchAction: 'none',
                }}
              >
                {React.cloneElement(child, {
                  draggable: isEditMode,
                  'data-rgl-widget': childId,
                })}
              </div>
            )
          })}
        </GridLayout>
      </div>
    )
  }
)

LayoutEngine.displayName = 'LayoutEngine'

function generateDefaultLayout(childCount: number): Layout[] {
  const layout: Layout[] = []

  for (let i = 0; i < childCount; i++) {
    const colsPerRow = 2
    const row = Math.floor(i / colsPerRow)
    const col = (i % colsPerRow) * 6

    layout.push({
      i: `widget-${i}`,
      x: col,
      y: row * 4,
      w: 6,
      h: 4,
      minW: 3,
      minH: 2,
    })
  }

  console.log(`📐 Auto-generated layout for ${childCount} widgets:`, layout)
  return layout
}

export default LayoutEngine
