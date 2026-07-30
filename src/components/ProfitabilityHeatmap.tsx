import React, { useEffect, useRef } from 'react';
import * as d3 from 'd3';

export default function ProfitabilityHeatmap() {
  const ref = useRef<SVGSVGElement>(null);
  
  useEffect(() => {
    if (!ref.current) return;
    const data = [
      { service: 'Imaging', margin: 0.8, freeCare: 0.1 },
      { service: 'Surgery', margin: 0.6, freeCare: 0.3 },
      { service: 'General', margin: 0.2, freeCare: 0.5 },
    ];
    
    const svg = d3.select(ref.current);
    svg.selectAll('*').remove();
    
    // Simple visualization logic
    svg.selectAll('rect')
       .data(data)
       .enter()
       .append('rect')
       .attr('x', (d, i) => i * 100)
       .attr('y', d => 100 - d.margin * 100)
       .attr('width', 80)
       .attr('height', d => d.margin * 100)
       .attr('fill', d => d.freeCare > 0.4 ? '#e11d48' : '#10b981');
       
  }, []);

  return (
    <div className="bg-white dark:bg-slate-800 p-4 rounded-lg border border-slate-200 dark:border-slate-700">
        <h4 className="text-xs font-bold text-slate-500 mb-2">Profitability Heatmap</h4>
        <svg ref={ref} width="300" height="120" />
    </div>
  );
}
