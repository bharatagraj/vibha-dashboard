/**
 * Vibha Dashboard Platform — Card Component v1.0
 * Deploy to: frontend/src/components/Card.tsx
 *
 * Reusable card wrapper for all dashboard widgets.
 * Handles: layout, header, title, subtitle, actions, body content.
 *
 * Usage:
 *   <Card title="Emissions Trend" subtitle="Last 12 months">
 *     <Chart ... />
 *   </Card>
 */

import React, { ReactNode } from 'react'

export interface CardProps {
  /** Widget title (required) — displayed uppercase, 13px, semibold */
  title: string

  /** Optional subtitle (12px, muted) */
  subtitle?: string

  /** Main content — usually a chart or table */
  children: ReactNode

  /** Optional action buttons (gear icon, download, etc.) */
  actions?: ReactNode

  /** Optional CSS class for grid positioning (from RGL) */
  className?: string

  /** Optional custom styles */
  style?: React.CSSProperties

  /** Optional: set to true for KPI cards (applies different layout) */
  isKpi?: boolean
}

/**
 * Card component — applies consistent styling to all dashboard widgets
 * Inherits colors and spacing from design-tokens.css
 * 
 * The card header has the .vibha-drag-handle class so LayoutEngine
 * knows only the header is draggable (not the chart body).
 */
export const Card = React.forwardRef<HTMLDivElement, CardProps>(
  ({ title, subtitle, children, actions, className, style, isKpi }, ref) => {
    return (
      <div
        ref={ref}
        className={`vibha-card ${className || ''}`}
        style={style}
      >
        {/* Card Header — title, subtitle, actions — THIS IS THE DRAG HANDLE */}
        {!isKpi && (
          <div className="vibha-card-header vibha-drag-handle">
            <div>
              <h3 className="vibha-card-title">{title}</h3>
              {subtitle && <p className="vibha-card-subtitle">{subtitle}</p>}
            </div>
            {actions && <div className="vibha-card-actions">{actions}</div>}
          </div>
        )}

        {/* KPI Header — for KPI cards, title is often skipped or minimal */}
        {isKpi && actions && (
          <div className="vibha-card-header vibha-drag-handle">
            {actions && <div className="vibha-card-actions" style={{ marginLeft: 'auto' }}>{actions}</div>}
          </div>
        )}

        {/* Card Body — flexible height, lets children (charts, tables) fill */}
        <div className="vibha-card-body">
          {children}
        </div>
      </div>
    )
  }
)

Card.displayName = 'Card'

export default Card
