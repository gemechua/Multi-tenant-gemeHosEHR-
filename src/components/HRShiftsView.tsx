import React, { useEffect, useRef } from 'react';
import * as d3 from 'd3';

export default function HRShiftsView() {
  const svgRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    if (!svgRef.current) return;
    
    // Simple D3 visualization
    const data = [10, 20, 15, 25, 30];
    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();
    
    svg.selectAll('rect')
      .data(data)
      .enter()
      .append('rect')
      .attr('x', (d, i) => i * 50)
      .attr('y', d => 200 - d * 5)
      .attr('width', 40)
      .attr('height', d => d * 5)
      .attr('fill', '#6366f1');
  }, []);

  return (
    <div className="p-6 bg-white rounded-2xl border border-slate-200">
      <h3 className="font-black text-slate-800 mb-6">Staff Availability & Shifts</h3>
      <svg ref={svgRef} width={300} height={200} />
    </div>
  );
}
