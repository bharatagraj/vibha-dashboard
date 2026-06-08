import React, { useEffect, useRef } from 'react'
import * as d3 from 'd3'
import { FilterSpec } from '@/types'

interface LineChartProps {
  spec: FilterSpec
  data: Record<string, unknown>[]
}

export const LineChart: React.FC<LineChartProps> = ({ spec, data }) => {
  const svgRef = useRef<SVGSVGElement>(null)

  useEffect(() => {
    if (!svgRef.current || !data || data.length === 0) return

    const { width, height, margin, xAxisKey, yAxisKey } = spec.dimensions

    const xScale = d3
      .scalePoint()
      .domain(data.map((d) => String(d[xAxisKey])))
      .range([margin.left, width - margin.right])

    const yScale = d3
      .scaleLinear()
      .domain([0, d3.max(data, (d) => Number(d[yAxisKey]) || 0) || 0])
      .range([height - margin.bottom, margin.top])

    const line = d3
      .line<Record<string, unknown>>()
      .x((d) => xScale(String(d[xAxisKey])) || 0)
      .y((d) => yScale(Number(d[yAxisKey]) || 0))

    const svg = d3.select(svgRef.current)
    svg.selectAll('*').remove()

    const g = svg.attr('width', width).attr('height', height).append('g')

    g.append('path')
      .datum(data)
      .attr('d', line)
      .style('stroke', '#0066cc')
      .style('stroke-width', 2)
      .style('fill', 'none')

    g.selectAll('.dot')
      .data(data)
      .enter()
      .append('circle')
      .attr('cx', (d) => xScale(String(d[xAxisKey])) || 0)
      .attr('cy', (d) => yScale(Number(d[yAxisKey]) || 0))
      .attr('r', 4)
      .style('fill', '#0066cc')

    g.append('g')
      .attr('transform', `translate(0,${height - margin.bottom})`)
      .call(d3.axisBottom(xScale))

    g.append('g')
      .attr('transform', `translate(${margin.left},0)`)
      .call(d3.axisLeft(yScale))
  }, [data, spec])

  return <svg ref={svgRef} style={{ maxWidth: '100%', height: 'auto' }} />
}
