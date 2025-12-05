
import React, { useState, useMemo, useEffect } from 'react';
import { Download, Printer, Calendar, Filter } from 'lucide-react';
import { TEAM_MEMBERS } from '../constants';
import { Project } from '../types';

interface WeeklyReportProps {
    projects?: Project[];
}

type ReportPeriod = 'This Week' | 'Last Week' | 'This Month' | 'This Quarter' | 'This Year' | 'Custom';

export const WeeklyReport: React.FC<WeeklyReportProps> = ({ projects = [] }) => {
  const [period, setPeriod] = useState<ReportPeriod>('This Week');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // Initialize Default Dates
  useEffect(() => {
      if (period !== 'Custom') {
          const { start, end } = calculateDateRange(period);
          setStartDate(start);
          setEndDate(end);
      }
  }, [period]);

  const calculateDateRange = (type: ReportPeriod) => {
      const now = new Date();
      const start = new Date(now);
      const end = new Date(now);

      // Helper to set time to 00:00:00 for start and 23:59:59 for end
      const format = (d: Date) => d.toISOString().split('T')[0];

      if (type === 'This Week') {
          const day = now.getDay(); // 0 is Sunday
          const diff = now.getDate() - day + (day === 0 ? -6 : 1); // Adjust to Monday
          start.setDate(diff);
          end.setDate(diff + 6);
      } else if (type === 'Last Week') {
          const day = now.getDay();
          const diff = now.getDate() - day + (day === 0 ? -6 : 1) - 7;
          start.setDate(diff);
          end.setDate(diff + 6);
      } else if (type === 'This Month') {
          start.setDate(1);
          end.setMonth(now.getMonth() + 1, 0);
      } else if (type === 'This Quarter') {
          const quarter = Math.floor((now.getMonth() + 3) / 3);
          const startMonth = (quarter - 1) * 3;
          start.setMonth(startMonth, 1);
          end.setMonth(startMonth + 3, 0);
      } else if (type === 'This Year') {
          start.setMonth(0, 1);
          end.setMonth(11, 31);
      }
      
      return { start: format(start), end: format(end) };
  };

  const filteredProjects = useMemo(() => {
      if (!startDate || !endDate) return projects;
      
      const start = new Date(startDate).getTime();
      const end = new Date(endDate).getTime() + (24 * 60 * 60 * 1000) - 1; // End of day

      return projects.filter(p => {
          const pDate = new Date(p.startDate).getTime();
          return pDate >= start && pDate <= end;
      });
  }, [projects, startDate, endDate]);

  const calculateRow = (statusFilter: (p: Project) => boolean) => {
    const filtered = filteredProjects.filter(statusFilter);
    const totalCount = filtered.length;
    const totalAmount = filtered.reduce((sum, p) => sum + p.amount, 0);
    const members = TEAM_MEMBERS.map(member => {
        const memberProjects = filtered.filter(p => p.assignedTo === member.id);
        return {
            count: memberProjects.length,
            amount: memberProjects.reduce((sum, p) => sum + p.amount, 0)
        };
    });
    return { total: { count: totalCount, amount: totalAmount }, members };
  };

  const rows = [
    { label: 'Files Completed & Issued', filter: (p: Project) => p.status === 'Completed' || p.status === 'End' },
    { label: 'Under Review', filter: (p: Project) => p.status === 'Under Review' },
    { label: 'Under Process', filter: (p: Project) => p.status === 'Under Process' },
    { label: 'On Hold', filter: (p: Project) => p.status === 'On Hold' },
    { label: 'Review Completed', filter: (p: Project) => p.status === 'Review Completed' },
    { label: 'Cancelled', filter: (p: Project) => p.status === 'Cancelled' },
  ].map(def => ({ subject: def.label, ...calculateRow(def.filter) }));

  const grandTotalCount = rows.reduce((sum, r) => sum + r.total.count, 0);
  const grandTotalAmount = rows.reduce((sum, r) => sum + r.total.amount, 0);
  const teamCols = TEAM_MEMBERS.map(m => m.name);

  const handlePrint = () => {
      window.print();
  };

  return (
    <div className="space-y-6 print:space-y-2">
      {/* Print-specific styles injected here */}
      <style>{`
        @media print {
          @page { size: landscape; margin: 10mm; }
          body { -webkit-print-color-adjust: exact; }
          nav, aside, .no-print { display: none !important; }
          .print-container { width: 100%; }
          table { font-size: 10px !important; }
          h2 { font-size: 16px !important; }
        }
      `}</style>

      {/* Header & Controls */}
      <div className="flex flex-col gap-6 no-print">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
                <h2 className="text-xl font-bold text-slate-800">Weekly Report</h2>
                <p className="text-sm text-slate-500">Generate status reports based on specific date ranges.</p>
            </div>
            <div className="flex gap-3">
                <button 
                    onClick={handlePrint}
                    className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-300 text-slate-700 rounded-lg text-sm font-medium hover:bg-slate-50"
                >
                    <Printer size={16} /> Print to PDF
                </button>
                <button className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg text-sm font-medium hover:bg-emerald-700">
                    <Download size={16} /> Export Excel
                </button>
            </div>
          </div>

          {/* Filter Bar */}
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col md:flex-row items-end md:items-center gap-4">
              <div className="flex-1 w-full md:w-auto">
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Report Period</label>
                  <div className="relative">
                      <Filter className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                      <select 
                          value={period}
                          onChange={(e) => setPeriod(e.target.value as ReportPeriod)}
                          className="w-full pl-10 pr-4 py-2.5 border border-slate-300 rounded-lg text-sm font-medium text-slate-700 focus:ring-2 focus:ring-teal-500 focus:border-transparent outline-none appearance-none bg-white"
                      >
                          <option value="This Week">This Week</option>
                          <option value="Last Week">Last Week</option>
                          <option value="This Month">This Month</option>
                          <option value="This Quarter">This Quarter</option>
                          <option value="This Year">This Year</option>
                          <option value="Custom">Custom Range</option>
                      </select>
                  </div>
              </div>
              
              <div className="flex gap-2 flex-1 w-full md:w-auto">
                  <div className="flex-1">
                      <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Start Date</label>
                      <div className="relative">
                          <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                          <input 
                              type="date"
                              value={startDate}
                              onChange={(e) => { setStartDate(e.target.value); setPeriod('Custom'); }}
                              className="w-full pl-10 pr-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-teal-500"
                          />
                      </div>
                  </div>
                  <div className="flex-1">
                      <label className="block text-xs font-bold text-slate-500 uppercase mb-1">End Date</label>
                      <div className="relative">
                          <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                          <input 
                              type="date"
                              value={endDate}
                              onChange={(e) => { setEndDate(e.target.value); setPeriod('Custom'); }}
                              className="w-full pl-10 pr-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-teal-500"
                          />
                      </div>
                  </div>
              </div>
          </div>
      </div>

      {/* Print Header (Only visible in print) */}
      <div className="hidden print:block mb-4">
          <h1 className="text-xl font-bold text-slate-800">Assist+ Project Status Report</h1>
          <p className="text-xs text-slate-500">Period: {startDate} to {endDate}</p>
          <p className="text-xs text-slate-500">Generated: {new Date().toLocaleString()}</p>
      </div>

      <div className="bg-white border border-slate-200 rounded-lg overflow-hidden shadow-sm print:border-black print:shadow-none">
        <div className="overflow-x-auto custom-scrollbar print:overflow-visible">
            <table className="w-full text-sm border-collapse whitespace-nowrap">
                <thead>
                    <tr className="bg-slate-800 text-white print:bg-slate-200 print:text-black">
                        <th className="p-3 border border-slate-700 print:border-slate-400" rowSpan={2}>Sr No.</th>
                        <th className="p-3 border border-slate-700 print:border-slate-400 text-left min-w-[180px]" rowSpan={2}>Subject</th>
                        <th className="p-3 border border-slate-700 print:border-slate-400" colSpan={2}>Total</th>
                        {teamCols.map((name, i) => (
                             <th key={i} className="p-3 border border-slate-700 print:border-slate-400 bg-slate-700 print:bg-slate-300" colSpan={2}>{name}</th>
                        ))}
                    </tr>
                    <tr className="bg-slate-100 text-slate-600 font-semibold text-xs print:bg-white print:text-black">
                        <th className="p-2 border border-slate-200 print:border-slate-300">Count</th>
                        <th className="p-2 border border-slate-200 print:border-slate-300">Amount</th>
                        {teamCols.map((_, i) => (
                            <React.Fragment key={i}>
                                <th className="p-2 border border-slate-200 print:border-slate-300">Cnt</th>
                                <th className="p-2 border border-slate-200 print:border-slate-300">Amt</th>
                            </React.Fragment>
                        ))}
                    </tr>
                </thead>
                <tbody>
                    {rows.map((row, idx) => (
                        <tr key={idx} className={idx % 2 === 0 ? 'bg-white' : 'bg-slate-50 print:bg-white'}>
                            <td className="p-3 border border-slate-200 print:border-slate-300 text-center font-medium text-slate-500">{idx + 1}</td>
                            <td className="p-3 border border-slate-200 print:border-slate-300 font-semibold text-slate-700">{row.subject}</td>
                            <td className="p-3 border border-slate-200 print:border-slate-300 text-center font-bold text-slate-800">{row.total.count}</td>
                            <td className="p-3 border border-slate-200 print:border-slate-300 text-center font-medium text-slate-600">{row.total.amount > 0 ? (row.total.amount / 1000).toFixed(1) + 'k' : '-'}</td>
                            {row.members.map((data, mIdx) => (
                                <React.Fragment key={mIdx}>
                                    <td className="p-3 border border-slate-200 print:border-slate-300 text-center text-slate-600">{data.count || '-'}</td>
                                    <td className="p-3 border border-slate-200 print:border-slate-300 text-center text-slate-400 text-xs">{data.amount > 0 ? (data.amount/1000).toFixed(1)+'k' : '-'}</td>
                                </React.Fragment>
                            ))}
                        </tr>
                    ))}
                    <tr className="bg-slate-100 font-bold border-t-2 border-slate-300 print:bg-slate-200 print:border-black">
                         <td colSpan={2} className="p-3 border border-slate-200 print:border-slate-300 text-right text-slate-800">GRAND TOTAL</td>
                         <td className="p-3 border border-slate-200 print:border-slate-300 text-center text-teal-600 print:text-black">{grandTotalCount}</td>
                         <td className="p-3 border border-slate-200 print:border-slate-300 text-center text-teal-600 print:text-black">{grandTotalAmount > 0 ? (grandTotalAmount/1000).toFixed(1)+'k' : 0}</td>
                         {teamCols.map((_, i) => (
                             <React.Fragment key={i}>
                                 <td className="p-3 border border-slate-200 print:border-slate-300 text-center">-</td>
                                 <td className="p-3 border border-slate-200 print:border-slate-300 text-center">-</td>
                             </React.Fragment>
                         ))}
                    </tr>
                </tbody>
            </table>
        </div>
      </div>
    </div>
  );
};
