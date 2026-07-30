import React, { useState } from 'react';
import { Search, ChevronDown, ChevronUp, MapPin, AlertCircle } from 'lucide-react';
import VendorDashboard from './VendorDashboard';

interface Vendor {
  id: string;
  name: string;
  taxId: string;
  category: string;
  riskScore: 'Low' | 'Medium' | 'High';
  outstandingBalance: number;
  creditLimit: number;
  address: string;
}

const vendors: Vendor[] = [
  { id: '1', name: 'MedTech Supplies', taxId: 'TAX-001', category: 'Medical', riskScore: 'Low', outstandingBalance: 2000, creditLimit: 5000, address: '123 Medical St' },
  { id: '2', name: 'City Utilities', taxId: 'TAX-002', category: 'Utilities', riskScore: 'High', outstandingBalance: 4500, creditLimit: 5000, address: '456 Power Ave' },
  { id: '3', name: 'Staffing Corp', taxId: 'TAX-003', category: 'Personnel', riskScore: 'Medium', outstandingBalance: 1000, creditLimit: 2000, address: '789 Talent Rd' },
];

export default function VendorList() {
  const [searchTerm, setSearchTerm] = useState('');
  const [groupByCategory, setGroupByCategory] = useState(false);
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());

  const filteredVendors = vendors.filter(v => 
    v.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    v.taxId.toLowerCase().includes(searchTerm.toLowerCase()) ||
    v.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const grouped = filteredVendors.reduce((acc, v) => {
    if (!acc[v.category]) acc[v.category] = [];
    acc[v.category].push(v);
    return acc;
  }, {} as Record<string, Vendor[]>);

  const toggleCategory = (cat: string) => {
    const next = new Set(expandedCategories);
    if (next.has(cat)) next.delete(cat);
    else next.add(cat);
    setExpandedCategories(next);
  };

  return (
    <div className="space-y-6">
        <VendorDashboard />
        <div className="bg-white p-6 rounded-lg border space-y-4">
          <div className='flex justify-between items-center'>
            <h2 className="text-lg font-bold">Active Vendors</h2>
            <button onClick={() => setGroupByCategory(!groupByCategory)} className="text-xs font-bold text-indigo-600">
                {groupByCategory ? 'Ungroup' : 'Group by Category'}
            </button>
          </div>
          <div className="relative">
            <Search className="absolute left-3 top-2.5 text-slate-400" size={16} />
            <input 
              type="text" 
              placeholder="Search vendors (name, tax ID, category)..." 
              className="pl-9 pr-4 py-2 border rounded-xl text-xs w-full focus:outline-none focus:ring-2 focus:ring-indigo-500"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="border rounded-lg overflow-hidden text-xs">
            {groupByCategory ? (
                Object.entries(grouped).map(([cat, vendors]) => (
                    <div key={cat} className='border-b last:border-b-0'>
                        <div className='flex justify-between items-center p-3 font-bold bg-slate-50 cursor-pointer' onClick={() => toggleCategory(cat)}>
                            {cat} ({vendors.length})
                            {expandedCategories.has(cat) ? <ChevronUp size={16}/> : <ChevronDown size={16}/>}
                        </div>
                        {expandedCategories.has(cat) && vendors.map(v => <VendorRow key={v.id} v={v} />)}
                    </div>
                ))
            ) : (
                filteredVendors.map(v => <VendorRow key={v.id} v={v} />)
            )}
          </div>
        </div>
    </div>
  );
}

function VendorRow({ v }: { v: Vendor; key?: string }) {
    const isWarning = v.outstandingBalance > v.creditLimit * 0.8;
    return (
        <div className="flex justify-between p-3 border-b text-xs items-center last:border-b-0">
            <div className='flex flex-col'>
                <span className="font-bold">{v.name}</span>
                <span className='text-slate-500 flex items-center gap-1'><MapPin size={10} /> {v.address}</span>
            </div>
            <span className={`px-2 py-0.5 rounded font-bold ${v.riskScore === 'Low' ? 'bg-emerald-100 text-emerald-700' : v.riskScore === 'Medium' ? 'bg-amber-100 text-amber-700' : 'bg-rose-100 text-rose-700'}`}>{v.riskScore} Risk</span>
            <div className='flex flex-col items-end'>
                <span className='font-bold'>${v.outstandingBalance} / ${v.creditLimit}</span>
                {isWarning && <span className='text-rose-600 font-bold flex items-center gap-1'><AlertCircle size={10} /> Limit Warning</span>}
            </div>
        </div>
    );
}
