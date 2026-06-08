import React, { useEffect, useRef } from 'react'
import * as d3 from 'd3'
import { FilterSpec } from '@/types'

interface BarChartProps {
  spec: FilterSpec
  data: Record<string, unknown>[]
}

export const BarChart: React.FC<BarChartProps> = ({ spec, data }) => {
  const svgRef = useRef<SVGSVGElement>(null)

  useEffect(() => {
    if (!svgRef.current || !data || data.length === 0) return

    const { width, height, margin, xAxisKey, yAxisKey } = spec.dimensions

    const xScale = d3
      .scaleBand()
      .domain(data.map((d) => String(d[xAxisKey])))
      .range([margin.left, width - margin.right])
      .padding(0.1)

    const yScale = d3
      .scaleLinear()
      .domain([0, d3.max(data, (d) => Number(d[yAxisKey]) || 0) || 0])
      .range([height - margin.bottom, margin.top])

    const svg = d3.select(svgRef.current)
    svg.selectAll('*').remove()

    const g = svg.attr('width', width).attr('height', height).append('g')

    g.selectAll('.bar')
      .data(data)
      .enter()
      .append('rect')
      .attr('class', 'bar')
      .attr('x', (d) => xScale(String(d[xAxisKey])) || 0)
      .attr('y', (d) => yScale(Number(d[yAxisKey]) || 0))
      .attr('width', xScale.bandwidth())
      .attr('height', (d) => height - margin.bottom - yScale(Number(d[yAxisKey]) || 0))
      .attr('fill', '#0066cc')
      .style('opacity', 0.8)

    g.append('g')
      .attr('transform', `translate(0,${height - margin.bottom})`)
      .call(d3.axisBottom(xScale))

    g.append('g')
      .attr('transform', `translate(${margin.left},0)`)
      .call(d3.axisLeft(yScale))
  }, [data, spec])

  return <svg ref={svgRef} style={{ maxWidth: '100%', height: 'auto' }} />
}
