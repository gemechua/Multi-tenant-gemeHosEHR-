import React, { useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';
import { collection, onSnapshot, getDocs, query, orderBy } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { RefreshCw, BarChart2 } from 'lucide-react';

interface ChartDataItem {
  department: string;
  Pending: number;
  Completed: number;
}

export default function PaymentFlowChart() {
  const svgRef = useRef<SVGSVGElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [data, setData] = useState<ChartDataItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Listen to patient_workflows and fetch financial_ledger to build aggregation
    const unsub = onSnapshot(collection(db, 'patient_workflows'), (snapshot) => {
      // Initialize counters
      const counts: Record<string, { Pending: number; Completed: number }> = {
        'Registration': { Pending: 0, Completed: 0 },
        'Laboratory': { Pending: 0, Completed: 0 },
        'Radiology': { Pending: 0, Completed: 0 },
        'Pharmacy': { Pending: 0, Completed: 0 },
        'Liaison': { Pending: 0, Completed: 0 },
      };

      // Aggregates from active workflows
      snapshot.docs.forEach((docSnap) => {
        const wf = docSnap.data();

        // Registration Fee Pending
        if (wf.stage === 'cashier' && wf.substage?.includes('Registration')) {
          counts['Registration'].Pending += wf.paymentRequestAmount || 150;
        }

        // Lab Fee Pending
        if (wf.labStatus === 'pending_payment') {
          counts['Laboratory'].Pending += 280;
        }

        // Radiology Fee Pending
        if (wf.radStatus === 'pending_payment') {
          counts['Radiology'].Pending += 450;
        }

        // Pharmacy Fee Pending
        if (wf.rxStatus === 'pending_payment') {
          counts['Pharmacy'].Pending += 120;
        }

        // Liaison Admission Fee Pending
        if (wf.stage === 'liaison' && wf.substage?.includes('Admission') && wf.paymentStatus === 'pending') {
          counts['Liaison'].Pending += wf.paymentRequestAmount || 600;
        }
      });

      // Also get financial ledger for actual completed payments
      getDocs(query(collection(db, 'financial_ledger'))).then((ledgerSnap) => {
        ledgerSnap.docs.forEach((ledg) => {
          const item = ledg.data();
          const amount = Number(item.amount) || 0;
          if (item.status === 'Paid') {
            const reason = item.reason || '';
            let dept = 'Registration';
            if (reason.includes('Lab')) dept = 'Laboratory';
            else if (reason.includes('Radiology') || reason.includes('Imaging')) dept = 'Radiology';
            else if (reason.includes('Prescription') || reason.includes('Pharmacy')) dept = 'Pharmacy';
            else if (reason.includes('Admission')) dept = 'Liaison';

            if (counts[dept]) {
              counts[dept].Completed += amount;
            }
          }
        });

        // Convert record counts to chart list data
        const chartData: ChartDataItem[] = Object.keys(counts).map((key) => ({
          department: key,
          Pending: counts[key].Pending,
          Completed: counts[key].Completed,
        }));

        setData(chartData);
        setLoading(false);
      }).catch((err) => {
        console.error('Error fetching ledger details in D3 chart:', err);
        // Fallback to active state counts
        const chartData: ChartDataItem[] = Object.keys(counts).map((key) => ({
          department: key,
          Pending: counts[key].Pending,
          Completed: counts[key].Completed,
        }));
        setData(chartData);
        setLoading(false);
      });
    }, (error) => {
      console.error('Error subscribing to workflows for chart:', error);
      setLoading(false);
    });

    return () => unsub();
  }, []);

  useEffect(() => {
    if (loading || data.length === 0 || !svgRef.current) return;

    // Clear previous elements
    d3.select(svgRef.current).selectAll('*').remove();

    const margin = { top: 20, right: 30, bottom: 40, left: 100 };
    const width = 600 - margin.left - margin.right;
    const height = 280 - margin.top - margin.bottom;

    const svg = d3.select(svgRef.current)
      .attr('viewBox', `0 0 600 280`)
      .append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`);

    const departments = data.map(d => d.department);
    const subGroups = ['Pending', 'Completed'];

    // Y axis (Departments)
    const y = d3.scaleBand()
      .domain(departments)
      .range([0, height])
      .padding(0.25);

    svg.append('g')
      .call(d3.axisLeft(y).tickSize(0))
      .selectAll('text')
      .style('font-family', 'ui-sans-serif, system-ui')
      .style('font-weight', '700')
      .style('font-size', '10px')
      .style('fill', '#1e293b');

    // Inside Y positioning for group bars
    const ySub = d3.scaleBand()
      .domain(subGroups)
      .range([0, y.bandwidth()])
      .padding(0.05);

    // X axis (Amounts)
    const maxVal = d3.max(data, (d: ChartDataItem) => Math.max(d.Pending, d.Completed)) || 1000;
    const x = d3.scaleLinear()
      .domain([0, maxVal * 1.1])
      .range([0, width]);

    // X Gridlines
    svg.append('g')
      .attr('class', 'grid')
      .attr('transform', `translate(0,${height})`)
      .call(d3.axisBottom(x)
        .ticks(5)
        .tickSize(-height)
        .tickFormat(() => '')
      )
      .selectAll('line')
      .style('stroke', '#f1f5f9')
      .style('stroke-dasharray', '3,3');

    // X axis labels
    svg.append('g')
      .attr('transform', `translate(0,${height})`)
      .call(d3.axisBottom(x).ticks(5).tickFormat(d => `${d} ETB`))
      .selectAll('text')
      .style('font-family', 'JetBrains Mono, monospace')
      .style('font-weight', '500')
      .style('font-size', '9px')
      .style('fill', '#64748b');

    // Color mapper
    const colors = d3.scaleOrdinal<string>()
      .domain(subGroups)
      .range(['#f59e0b', '#10b981']); // Amber-500, Emerald-500

    // Render grouped bars
    const bars = svg.append('g')
      .selectAll('g')
      .data(data)
      .enter()
      .append('g')
      .attr('transform', (d: ChartDataItem) => `translate(0, ${y(d.department) || 0})`);

    bars.selectAll('rect')
      .data((d: ChartDataItem) => subGroups.map(key => ({ key, value: d[key as 'Pending' | 'Completed'] })))
      .enter()
      .append('rect')
      .attr('x', 0)
      .attr('y', (d: any) => ySub(d.key) || 0)
      .attr('height', ySub.bandwidth())
      .attr('fill', (d: any) => colors(d.key))
      .attr('rx', 3)
      // Transition entrance
      .transition()
      .duration(1000)
      .attr('width', (d: any) => x(d.value));

    // Values indicators texts on bars
    bars.selectAll('.bar-label')
      .data((d: ChartDataItem) => subGroups.map(key => ({ key, value: d[key as 'Pending' | 'Completed'] })))
      .enter()
      .append('text')
      .attr('x', (d: any) => x(d.value) + 5)
      .attr('y', (d: any) => (ySub(d.key) || 0) + ySub.bandwidth() / 2 + 3)
      .style('font-family', 'JetBrains Mono, monospace')
      .style('font-size', '8px')
      .style('font-weight', '700')
      .style('fill', '#475569')
      .text((d: any) => d.value > 0 ? `${d.value}` : '');

  }, [loading, data]);

  return (
    <div className="bg-white border border-gray-150 rounded-2xl p-4 shadow-3xs space-y-4">
      <div className="flex justify-between items-center border-b border-gray-100 pb-3">
        <div>
          <h4 className="text-xs font-black text-gray-900 uppercase tracking-wider font-mono flex items-center gap-1.5">
            <BarChart2 size={14} className="text-emerald-600" />
            Payment Flow Revenue by Department
          </h4>
          <p className="text-[10px] text-gray-500 mt-0.5">Live aggregate ratio of completed vs pending payments (ETB).</p>
        </div>
        <div className="flex gap-4 text-[10px] font-mono font-bold">
          <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded bg-amber-500 block"></span> Pending</span>
          <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded bg-emerald-500 block"></span> Completed</span>
        </div>
      </div>

      {loading ? (
        <div className="py-12 text-center">
          <RefreshCw className="animate-spin text-emerald-600 mx-auto" size={20} />
          <p className="text-[10px] text-gray-400 mt-1">Aggregating transactional logs...</p>
        </div>
      ) : (
        <div ref={containerRef} className="w-full overflow-x-auto">
          <svg ref={svgRef} className="w-full max-w-[600px] h-[280px] mx-auto" />
        </div>
      )}
    </div>
  );
}
