import React, { useEffect, useRef } from 'react'
import * as d3 from 'd3'
import { FilterSpec } from '@/types'

interface PieChartProps {
  spec: FilterSpec
  data: Record<string, unknown>[]
}

export const PieChart: React.FC<PieChartProps> = ({ spec, data }) => {
  const svgRef = useRef<SVGSVGElement>(null)

  useEffect(() => {
    if (!svgRef.current || !data || data.length === 0) return

    const { width, height, xAxisKey, yAxisKey } = spec.dimensions
    const radius = Math.min(width, height) / 2 - 40

    const pie = d3.pie<Record<string, unknown>>().value((d) => Number(d[yAxisKey]) || 0)
    const arc = d3.arc<d3.PieArcDatum<Record<string, unknown>>>().innerRadius(0).outerRadius(radius)
    const color = d3.scaleOrdinal(d3.schemeCategory10)

    const svg = d3.select(svgRef.current)
    svg.selectAll('*').remove()

    const g = svg
      .attr('width', width)
      .attr('height', height)
      .append('g')
      .attr('transform', `translate(${width / 2},${height / 2})`)

    g.selectAll('.arc')
      .data(pie(data))
      .enter()
      .append('g')
      .attr('class', 'arc')
      .append('path')
      .attr('d', arc)
      .style('fill', (d, i) => color(String(i)))

    g.selectAll('.arc')
      .data(pie(data))
      .append('text')
      .attr('transform', (d) => `translate(${arc.centroid(d)})`)
      .attr('text-anchor', 'middle')
      .attr('dy', '0.35em')
      .style('font-size', '12px')
      .text((d) => `${String(d.data[xAxisKey])}`)
  }, [data, spec])

  return <svg ref={svgRef} style={{ maxWidth: '100%', height: 'auto' }} />
}
