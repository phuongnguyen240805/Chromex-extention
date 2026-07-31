import React from "react";

interface TableProps {
  headers: string[];
  children: React.ReactNode;
}

export const Table: React.FC<TableProps> = ({ headers, children }) => {
  return (
    <div className="w-full overflow-hidden rounded-xl border border-white/5 bg-white/5">
      <table className="w-full text-left text-sm text-slate-300 font-semibold font-inter">
        <thead className="bg-white/5 text-slate-400 font-semibold font-inter border-b border-white/5">
          <tr>
            {headers.map((header, i) => (
              <th key={i} className="px-4 py-3 font-semibold font-inter uppercase tracking-wider text-[10px]">
                {header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-white/5">
          {children}
        </tbody>
      </table>
    </div>
  );
};

export const TableRow: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <tr className="hover:bg-white/[0.02] transition-colors group font-semibold font-inter">
    {children}
  </tr>
);

export const TableCell: React.FC<{ children: React.ReactNode, className?: string }> = ({ children, className = "" }) => (
  <td className={`px-4 py-3 font-semibold font-inter ${className}`}>
    {children}
  </td>
);
