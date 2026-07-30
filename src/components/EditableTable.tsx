import React from 'react';
import { Plus, Trash2 } from 'lucide-react';

interface Column {
  key: string;
  label: string;
  type: 'text' | 'number';
}

interface EditableTableProps {
  columns: Column[];
  data: any[];
  setData: (data: any[]) => void;
  title: string;
  getRowClassName?: (row: any) => string;
}

export default function EditableTable({ columns, data, setData, title, getRowClassName }: EditableTableProps) {
  const addRow = () => {
    const newRow = columns.reduce((acc, col) => ({ ...acc, [col.key]: col.type === 'number' ? 0 : '' }), {});
    setData([...data, newRow]);
  };

  const updateCell = (index: number, key: string, value: any) => {
    const newData = [...data];
    newData[index][key] = value;
    setData(newData);
  };

  const deleteRow = (index: number) => {
    setData(data.filter((_, i) => i !== index));
  };

  return (
    <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <h4 className="text-md font-bold text-slate-900">{title}</h4>
        <button onClick={addRow} className="flex items-center gap-1 text-xs font-bold text-indigo-600 hover:text-indigo-700">
          <Plus size={14} /> Add Row
        </button>
      </div>
      <div className="overflow-x-auto -mx-6 px-6">
        <table className="w-full text-left text-xs min-w-[600px]">
          <thead className="text-slate-400 uppercase font-black tracking-wider">
          <tr>
            {columns.map(col => <th key={col.key} className="pb-2 px-2">{col.label}</th>)}
            <th className="pb-2 px-2">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {data.map((row, i) => (
            <tr key={i} className={getRowClassName ? getRowClassName(row) : ''}>
              {columns.map(col => (
                <td key={col.key} className="py-2 px-2">
                  <input
                    type={col.type}
                    value={row[col.key]}
                    onChange={(e) => updateCell(i, col.key, col.type === 'number' ? Number(e.target.value) : e.target.value)}
                    className="w-full px-2 py-1 bg-slate-50 border border-slate-200 rounded text-slate-900"
                  />
                </td>
              ))}
              <td className="py-2 px-2">
                <button onClick={() => deleteRow(i)} className="text-rose-400 hover:text-rose-600">
                  <Trash2 size={14} />
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      </div>
    </div>
  );
}
