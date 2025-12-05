
import React, { useState, useMemo, useRef, useEffect } from 'react';
import { Project, Status, TeamMember } from '../types';
import { Eye, CheckCircle, FileText, AlertTriangle, Upload, Clock, Briefcase, Settings2, EyeOff, ArrowUpDown, ArrowUp, ArrowDown, ChevronUp, ChevronDown, PieChart as PieChartIcon, Calendar, CheckSquare, MoreHorizontal, User, Bell, Users, BarChart2, MessageSquare, Zap, Search, Plus, Mic, Paperclip, Sparkles, ArrowRight } from 'lucide-react';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';

interface ProjectTableProps {
  projects: Project[];
  onProjectClick: (project: Project) => void;
  members: TeamMember[];
  compact?: boolean; 
  selectedId?: string;
}

type SortKey = 'clientName' | 'serviceType' | 'amount' | 'status' | 'assignedTo' | 'daysElapsed' | 'paymentStatus';
type ViewMode = 'list' | 'dashboard';
type DashboardTab = 'Timeline' | 'Overview';

type ColumnId = 
  | 'clientName' 
  | 'serviceType' 
  | 'amount' 
  | 'billingAdvance' 
  | 'billingBalance' 
  | 'proposalSent' 
  | 'paymentStatus' 
  | 'contractSigned' 
  | 'assignedTo' 
  | 'promisedDays' 
  | 'daysElapsed' 
  | 'timerStatus' 
  | 'latestReason' 
  | 'remarks'
  | 'status';

interface ColumnConfig {
  id: ColumnId;
  label: string;
  visible: boolean;
  sortKey?: SortKey;
  align?: 'left' | 'center' | 'right';
  bgClass?: string; 
}

const DEFAULT_COLUMNS: ColumnConfig[] = [
  { id: 'clientName', label: 'Client / Project', visible: true, sortKey: 'clientName', align: 'left' },
  { id: 'serviceType', label: 'Service', visible: true, sortKey: 'serviceType', align: 'left' },
  { id: 'amount', label: 'Fees (AED)', visible: true, sortKey: 'amount', align: 'right', bgClass: 'bg-indigo-50 dark:bg-indigo-500/5' },
  { id: 'billingAdvance', label: 'Advance', visible: true, align: 'right', bgClass: 'bg-emerald-50 dark:bg-emerald-500/5' },
  { id: 'billingBalance', label: 'Balance', visible: true, align: 'right', bgClass: 'bg-orange-50 dark:bg-orange-500/5' },
  { id: 'proposalSent', label: 'Proposal', visible: true, align: 'center' },
  { id: 'paymentStatus', label: 'Payment', visible: true, sortKey: 'paymentStatus', align: 'center' },
  { id: 'contractSigned', label: 'Contract', visible: false, align: 'center' }, 
  { id: 'assignedTo', label: 'Assigned', visible: true, sortKey: 'assignedTo', align: 'left' },
  { id: 'promisedDays', label: 'Promised Duration', visible: true, align: 'left' },
  { id: 'daysElapsed', label: 'Days Elapsed', visible: true, sortKey: 'daysElapsed', align: 'left' },
  { id: 'timerStatus', label: 'Timer Status', visible: true, align: 'left' },
  { id: 'latestReason', label: 'Status Reason', visible: true, align: 'left' },
  { id: 'remarks', label: 'Remarks', visible: true, align: 'left' },
  { id: 'status', label: 'Status', visible: true, sortKey: 'status', align: 'left' }, 
];

const COLORS = ['#6366f1', '#a5b4fc', '#f59e0b', '#ec4899'];

const StatusBadge: React.FC<{ status: Status }> = ({ status }) => {
  const colors: Record<Status, string> = {
    'Lead': 'bg-slate-100 text-slate-600 border-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700',
    'Proposal Sent': 'bg-blue-50 text-blue-600 border-blue-200 dark:bg-blue-900/30 dark:text-blue-400 dark:border-blue-800/50',
    'Proposal Signed': 'bg-indigo-50 text-indigo-600 border-indigo-200 dark:bg-indigo-900/30 dark:text-indigo-400 dark:border-indigo-800/50',
    'Under Review': 'bg-purple-50 text-purple-600 border-purple-200 dark:bg-purple-900/30 dark:text-purple-400 dark:border-purple-800/50',
    'Under Process': 'bg-blue-50 text-blue-600 border-blue-200 dark:bg-blue-900/40 dark:text-blue-300 dark:border-blue-700/50',
    'On Hold': 'bg-red-50 text-red-600 border-red-200 dark:bg-red-900/30 dark:text-red-400 dark:border-red-800/50',
    'Review Completed': 'bg-teal-50 text-teal-600 border-teal-200 dark:bg-teal-900/30 dark:text-teal-400 dark:border-teal-800/50',
    'Completed': 'bg-emerald-50 text-emerald-600 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-400 dark:border-emerald-800/50',
    'Cancelled': 'bg-slate-100 text-slate-500 border-slate-200 dark:bg-slate-800 dark:text-slate-500 dark:border-slate-700',
    'Not Active': 'bg-slate-100 text-slate-500 border-slate-200 dark:bg-slate-800 dark:text-slate-500 dark:border-slate-700',
    'End': 'bg-emerald-50 text-emerald-600 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-400 dark:border-emerald-800/50',
  };
  return (
    <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider border ${colors[status] || 'bg-slate-100 text-slate-500 border-slate-200'}`}>
      {status}
    </span>
  );
};

const TimerStatusCell: React.FC<{ status: 'On Track' | 'At Risk' | 'Late' }> = ({ status }) => {
  let colorClass = 'bg-emerald-50 text-emerald-600 border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/20';
  if (status === 'At Risk') colorClass = 'bg-orange-50 text-orange-600 border-orange-200 dark:bg-orange-500/10 dark:text-orange-400 dark:border-orange-500/20';
  if (status === 'Late') colorClass = 'bg-red-50 text-red-600 border-red-200 dark:bg-red-500/10 dark:text-red-400 dark:border-red-500/20';

  return (
    <div className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md border ${colorClass}`}>
      <Clock size={12} />
      <span className="text-[10px] font-bold whitespace-nowrap">{status}</span>
    </div>
  );
};

export const ProjectTable: React.FC<ProjectTableProps> = ({ projects, onProjectClick, members, compact = false, selectedId }) => {
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [columns, setColumns] = useState<ColumnConfig[]>(DEFAULT_COLUMNS);
  const [isColumnMenuOpen, setIsColumnMenuOpen] = useState(false);
  const [areFinancialsVisible, setAreFinancialsVisible] = useState(true);
  const [sortConfig, setSortConfig] = useState<{ key: SortKey; direction: 'asc' | 'desc' } | null>(null);
  
  // Dashboard internal state - ONLY 2 Tabs now
  const [activeDashboardTab, setActiveDashboardTab] = useState<DashboardTab>('Overview');

  const menuRef = useRef<HTMLDivElement>(null);
  
  const getTeamMember = (id: string) => members.find(m => m.id === id);

  useEffect(() => {
      const handleClickOutside = (event: MouseEvent) => {
          if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
              setIsColumnMenuOpen(false);
          }
      };
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      setSelectedIds(new Set(projects.map(p => p.id)));
    } else {
      setSelectedIds(new Set());
    }
  };

  const handleSelect = (id: string) => {
    const newSelected = new Set(selectedIds);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedIds(newSelected);
  };

  const handleSort = (key: SortKey) => {
      let direction: 'asc' | 'desc' = 'asc';
      if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
          direction = 'desc';
      }
      setSortConfig({ key, direction });
  };

  const sortedProjects = useMemo(() => {
      if (!sortConfig) return projects;
      
      return [...projects].sort((a, b) => {
          let valA: any = a[sortConfig.key];
          let valB: any = b[sortConfig.key];

          if (sortConfig.key === 'assignedTo') {
              valA = getTeamMember(a.assignedTo)?.name || '';
              valB = getTeamMember(b.assignedTo)?.name || '';
          }

          if (valA === undefined || valA === null) valA = '';
          if (valB === undefined || valB === null) valB = '';

          if (valA < valB) return sortConfig.direction === 'asc' ? -1 : 1;
          if (valA > valB) return sortConfig.direction === 'asc' ? 1 : -1;
          return 0;
      });
  }, [projects, sortConfig, members]);

  const isAllSelected = projects.length > 0 && selectedIds.size === projects.length;

  const renderSortIcon = (key?: SortKey) => {
      if (!key) return null;
      if (sortConfig?.key !== key) return <ArrowUpDown size={12} className="text-slate-400 dark:text-slate-600 ml-1.5" />;
      if (sortConfig.direction === 'asc') return <ArrowUp size={12} className="text-purple-600 dark:text-purple-400 ml-1.5" />;
      return <ArrowDown size={12} className="text-purple-600 dark:text-purple-400 ml-1.5" />;
  };

  const toggleColumn = (id: ColumnId) => {
      setColumns(cols => cols.map(c => c.id === id ? { ...c, visible: !c.visible } : c));
  };

  const toggleFinancials = () => {
      setAreFinancialsVisible(!areFinancialsVisible);
      if (viewMode === 'list') {
          const financialIds = ['amount', 'billingAdvance', 'billingBalance'];
          setColumns(cols => cols.map(c => financialIds.includes(c.id) ? { ...c, visible: !areFinancialsVisible } : c));
      }
  };

  const renderCell = (project: Project, colId: ColumnId) => {
      const member = getTeamMember(project.assignedTo);
      switch (colId) {
          case 'clientName':
              return (
                <div className="flex flex-col max-w-[200px]">
                  <span className="font-semibold text-sm text-slate-800 dark:text-slate-200 truncate" title={project.clientName}>{project.clientName}</span>
                  <span className="text-xs text-slate-500 truncate" title={project.projectName}>{project.projectName}</span>
                </div>
              );
          case 'serviceType':
              return <span className="text-xs text-slate-600 dark:text-slate-400 whitespace-nowrap">{project.serviceType}</span>;
          case 'amount':
              return <span className="text-xs font-medium text-slate-700 dark:text-slate-300 font-mono whitespace-nowrap">{project.amount ? project.amount.toLocaleString() : '-'}</span>;
          case 'billingAdvance':
              return <span className="text-xs font-medium text-emerald-600 dark:text-emerald-400 font-mono whitespace-nowrap">{project.billingAdvance ? project.billingAdvance.toLocaleString() : '-'}</span>;
          case 'billingBalance':
              return <span className="text-xs font-medium text-orange-600 dark:text-orange-400 font-mono whitespace-nowrap">{project.billingBalance ? project.billingBalance.toLocaleString() : '-'}</span>;
          case 'proposalSent':
              return (
                <div className="flex items-center justify-center gap-2">
                    <div className={`p-1 rounded ${project.proposalSent ? 'bg-blue-50 text-blue-600 dark:bg-blue-500/20 dark:text-blue-400' : 'bg-slate-100 text-slate-400 dark:bg-slate-800 dark:text-slate-600'}`} title="Sent"><FileText size={14} /></div>
                    <div className={`p-1 rounded ${project.proposalSigned ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-400' : 'bg-slate-100 text-slate-400 dark:bg-slate-800 dark:text-slate-600'}`} title="Signed"><CheckCircle size={14} /></div>
                </div>
              );
          case 'paymentStatus':
              return (
                 <div className="flex flex-col items-center gap-1">
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full whitespace-nowrap border ${project.paymentStatus === 'Paid' ? 'bg-emerald-50 text-emerald-600 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-400 dark:border-emerald-800' : project.paymentStatus === 'Partially Paid' ? 'bg-blue-50 text-blue-600 border-blue-200 dark:bg-blue-900/30 dark:text-blue-400 dark:border-blue-800' : project.paymentStatus === 'Pending' ? 'bg-orange-50 text-orange-600 border-orange-200 dark:bg-orange-900/30 dark:text-orange-400 dark:border-orange-800' : 'bg-slate-100 text-slate-500 border-slate-200 dark:bg-slate-800 dark:text-slate-500 dark:border-slate-700'}`}>{project.paymentStatus}</span>
                 </div>
              );
          case 'contractSigned':
              return project.contractSigned ? <CheckCircle size={16} className="text-emerald-500 mx-auto" /> : <div className="w-4 h-4 rounded-full border-2 border-slate-300 dark:border-slate-700 mx-auto"></div>;
          case 'status':
              return <StatusBadge status={project.status} />;
          case 'assignedTo':
              return (
                <div className="flex items-center gap-2">
                    <img src={member?.avatar} alt="" className="w-6 h-6 rounded-full border border-slate-200 dark:border-slate-700" />
                    <span className="text-xs text-slate-700 dark:text-slate-300 truncate max-w-[80px]">{member?.name}</span>
                </div>
              );
          case 'promisedDays': return <span className="text-xs font-medium text-slate-500 dark:text-slate-400 whitespace-nowrap">{project.promisedDays}</span>;
          case 'daysElapsed': return <span className="text-xs font-bold text-slate-700 dark:text-slate-300 whitespace-nowrap">Day {project.daysElapsed}</span>;
          case 'timerStatus': return <TimerStatusCell status={project.timerStatus} />;
          case 'latestReason':
              if ((project.status === 'On Hold' || project.status === 'Cancelled') && project.latestReason) {
                  return (
                    <div className="group relative" title={project.latestReason.detail}>
                        <div className={`inline-flex flex-col items-start gap-0.5 px-2 py-1.5 rounded-lg border cursor-help transition-colors ${project.latestReason.type === 'Internal' ? 'bg-red-50 text-red-600 border-red-200 hover:bg-red-100 dark:bg-red-900/20 dark:border-red-800 dark:text-red-400' : 'bg-blue-50 text-blue-600 border-blue-200 hover:bg-blue-100 dark:bg-blue-900/20 dark:border-blue-800 dark:text-blue-400'}`}>
                            <div className="flex items-center gap-1.5"><AlertTriangle size={12} /><span className="text-[10px] font-bold uppercase tracking-wider opacity-80">{project.latestReason.type}</span></div>
                        </div>
                    </div>
                  );
              }
              return <span className="text-xs text-slate-400 dark:text-slate-600">-</span>;
          case 'remarks':
              return <div className="max-w-[150px] whitespace-normal">{project.remarks ? <p className="text-[10px] text-slate-500 dark:text-slate-500 line-clamp-1 leading-snug" title={project.remarks}>{project.remarks}</p> : <span className="text-xs text-slate-400 dark:text-slate-600">-</span>}</div>;
          default: return null;
      }
  };

  const renderList = () => (
      <div className="overflow-x-auto custom-scrollbar h-full">
        <table className="w-full whitespace-nowrap">
          <thead className="bg-slate-50 dark:bg-[#151515] border-b border-slate-200 dark:border-slate-800 sticky top-0 z-10">
            <tr>
              <th className="px-3 py-3 w-10 text-center">
                 <input type="checkbox" className="w-4 h-4 rounded border-slate-300 dark:border-slate-600 cursor-pointer" checked={isAllSelected} onChange={handleSelectAll} />
              </th>
              {columns.filter(c => c.visible).map((col) => (
                  <th key={col.id} className={`px-4 py-3 text-[10px] font-bold text-slate-500 uppercase tracking-wider cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800 ${col.align === 'right' ? 'text-right' : col.align === 'center' ? 'text-center' : 'text-left'} ${col.bgClass || ''}`} onClick={() => col.sortKey && handleSort(col.sortKey)}>
                      <div className={`flex items-center gap-1 ${col.align === 'right' ? 'justify-end' : col.align === 'center' ? 'justify-center' : 'justify-start'}`}>
                          {col.label}
                          {renderSortIcon(col.sortKey)}
                      </div>
                  </th>
              ))}
              <th className="px-4 py-3 text-right text-[10px] font-bold text-slate-500 uppercase tracking-wider">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800/50 bg-white dark:bg-[#0a0a0a]">
            {sortedProjects.map((project) => (
                <tr 
                    key={project.id} 
                    draggable="true"
                    onDragStart={(e) => {
                        e.dataTransfer.setData('project', JSON.stringify(project));
                        e.dataTransfer.effectAllowed = 'copy';
                    }}
                    className={`transition-colors cursor-pointer group ${selectedIds.has(project.id) || selectedId === project.id ? 'bg-purple-50 dark:bg-purple-900/20' : 'hover:bg-slate-50 dark:hover:bg-slate-800/30'}`} 
                    onClick={() => onProjectClick(project)}
                >
                  <td className="px-3 py-3 text-center" onClick={(e) => e.stopPropagation()}>
                     <input type="checkbox" className="w-4 h-4 rounded border-slate-300 dark:border-slate-600 cursor-pointer" checked={selectedIds.has(project.id)} onChange={() => handleSelect(project.id)} />
                  </td>
                  {columns.filter(c => c.visible).map((col) => (
                      <td key={col.id} className={`px-4 py-3 ${col.align === 'right' ? 'text-right' : col.align === 'center' ? 'text-center' : 'text-left'} ${col.bgClass || ''}`}>
                          {renderCell(project, col.id)}
                      </td>
                  ))}
                  <td className="px-4 py-3 text-right">
                    <button className="p-1.5 text-slate-400 dark:text-slate-500 hover:text-purple-600 dark:hover:text-purple-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"><Eye size={16} /></button>
                  </td>
                </tr>
            ))}
          </tbody>
        </table>
      </div>
  );

  // --- DASHBOARD VIEW (Formerly Board) ---
  const renderDashboard = () => {
    // Active Team Members
    const involvedMemberIds = new Set(projects.map(p => p.assignedTo));
    const activeMembers = members.filter(m => involvedMemberIds.has(m.id)).slice(0, 5);

    // To Do List Logic (Filtered from projects)
    const todoList = projects.slice(0, 6).map(p => ({
        id: `task-${p.id}`,
        title: `Follow up on ${p.clientName}`,
        subtitle: `Action needed for ${p.projectName}`,
        avatars: [getTeamMember(p.assignedTo)?.avatar || "https://ui-avatars.com/api/?name=User"]
    }));

    // --- TIMELINE LOGIC ---
    const timelineProjects = projects
        .filter(p => !['Completed', 'Cancelled', 'End'].includes(p.status) && p.startDate)
        .sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime())
        .slice(0, 6); // Show top 6

    let timelineStart = new Date();
    if (timelineProjects.length > 0) {
        timelineStart = new Date(timelineProjects[0].startDate);
    }
    timelineStart.setDate(timelineStart.getDate() - 1);
    
    const daysToShow = 7;
    const timelineEnd = new Date(timelineStart);
    timelineEnd.setDate(timelineStart.getDate() + daysToShow);
    const totalDuration = timelineEnd.getTime() - timelineStart.getTime();

    const gridDates = [];
    for (let i = 0; i <= daysToShow; i++) {
        const d = new Date(timelineStart);
        d.setDate(d.getDate() + i);
        gridDates.push(d);
    }

    // --- Tab Content Renders ---
    
    const renderTimelineTab = () => (
        <div className="flex-1 relative mt-2 bg-white dark:bg-[#151515] rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm">
            {/* Vertical Grid Lines & Dates */}
            <div className="absolute inset-0 flex justify-between pointer-events-none z-0 px-6 pt-6">
                {gridDates.map((date, i) => (
                    <div key={i} className="flex flex-col h-full items-center relative">
                        <div className="h-full border-r border-dashed border-slate-200 dark:border-slate-800 w-px"></div>
                        <div className="absolute bottom-4 text-[10px] font-bold text-slate-400 whitespace-nowrap">
                            {date.getDate()} {date.toLocaleString('default', { month: 'short' })}
                        </div>
                    </div>
                ))}
            </div>

            {/* "Today" Marker */}
            <div className="absolute top-6 bottom-12 left-[40%] w-[2px] bg-[#6366f1] z-20">
                <div className="absolute -top-1.5 -left-[5px] w-3 h-3 rounded-full border-2 border-[#6366f1] bg-white dark:bg-[#111]"></div>
            </div>

            {/* Projects (Gantt Bars) */}
            <div className="relative z-10 space-y-6 pt-4 px-2 pb-12">
                {timelineProjects.map((p, i) => {
                    const start = new Date(p.startDate).getTime();
                    const end = p.targetDeadline ? new Date(p.targetDeadline).getTime() : start + (4 * 24 * 60 * 60 * 1000);
                    
                    let left = ((start - timelineStart.getTime()) / totalDuration) * 100;
                    let width = ((end - start) / totalDuration) * 100;

                    if (left < 0) { width += left; left = 0; }
                    if (left + width > 100) width = 100 - left;
                    if (width < 10) width = 15;

                    return (
                        <div key={p.id} className="relative h-16 w-full">
                            <div 
                                className="absolute top-0 bottom-0 rounded-2xl shadow-lg border border-slate-100 dark:border-slate-700 bg-white dark:bg-slate-800 p-3 flex flex-col justify-center transition-transform hover:scale-[1.02] hover:z-30 cursor-pointer"
                                style={{ left: `${left}%`, width: `${width}%` }}
                            >
                                <div className="flex justify-between items-start gap-2">
                                    <span className="text-xs font-bold text-slate-800 dark:text-white truncate leading-tight">{p.projectName}</span>
                                    <div className="flex -space-x-2 shrink-0">
                                        <img src={`https://ui-avatars.com/api/?name=${p.clientName}&background=random`} className="w-5 h-5 rounded-full border-2 border-white dark:border-slate-800" alt=""/>
                                        <img src={`https://ui-avatars.com/api/?name=${p.assignedTo}&background=random`} className="w-5 h-5 rounded-full border-2 border-white dark:border-slate-800" alt=""/>
                                    </div>
                                </div>
                                <div className="mt-1 flex items-center gap-2">
                                    <span className="text-[10px] font-medium text-slate-500">{p.status}</span>
                                    <span className="text-[10px] font-bold text-indigo-500">{(p.daysElapsed * 10) % 100}%</span>
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );

    const renderOverviewTab = () => (
        <div className="grid grid-cols-12 gap-6 h-full auto-rows-min">
            
            {/* 1. To-Do List (Yellow) */}
            <div className="col-span-12 md:col-span-4 bg-[#fde047] rounded-[32px] p-6 relative overflow-hidden shadow-sm flex flex-col h-full min-h-[300px]">
                <div className="flex justify-between items-start mb-6">
                    <div>
                        <div className="text-sm font-bold text-yellow-900 mb-1">
                            {new Date().toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'long', year: 'numeric' })}
                        </div>
                        <div className="flex items-center gap-2">
                            <span className="text-xs font-bold text-yellow-800 opacity-60">Task</span>
                            <span className="text-xs font-bold text-yellow-800 opacity-60">Collaboration</span>
                            <div className="bg-white/30 px-2 py-0.5 rounded-full text-[10px] font-bold text-yellow-900">+8</div>
                        </div>
                    </div>
                    <button className="bg-yellow-500/20 hover:bg-yellow-500/30 text-yellow-900 px-3 py-1 rounded-full text-xs font-bold transition-colors">Done</button>
                </div>
                
                <h3 className="font-bold text-yellow-900 text-lg mb-4 flex items-center gap-2">
                    To do list 
                    <div className="flex -space-x-1">
                        <div className="w-4 h-4 rounded-full bg-blue-500 border border-white"></div>
                        <div className="w-4 h-4 rounded-full bg-green-500 border border-white"></div>
                        <div className="w-4 h-4 rounded-full bg-orange-500 border border-white"></div>
                    </div>
                </h3>

                <div className="space-y-3 overflow-y-auto custom-scrollbar flex-1 pr-2">
                    {[
                        "Set Up Task Dependencies for Workflow Coordination",
                        "Receive and Respond to Real-Time Notifications",
                        "Break Down Long-Term Projects into Weekly",
                        "Access File History and Restore Previous Versions",
                        "Integrate Project Management with External Productivity",
                        "Upload, Share, and Version-Control Project Files"
                    ].map((task, i) => (
                        <div key={i} className="flex items-start gap-3 group cursor-pointer">
                            <div className={`w-4 h-4 rounded border-2 border-yellow-700/30 flex items-center justify-center mt-0.5 ${i < 2 ? 'bg-yellow-700/10' : ''}`}>
                                {i < 2 && <CheckSquare size={10} className="text-yellow-900" />}
                            </div>
                            <p className="text-xs font-medium text-yellow-900 leading-snug group-hover:underline">{task}</p>
                        </div>
                    ))}
                </div>
                
                <div className="flex gap-4 mt-4 pt-4 border-t border-yellow-500/20 text-yellow-800/60">
                    <BarChart2 size={16} />
                    <Settings2 size={16} />
                    <Paperclip size={16} />
                </div>
            </div>

            {/* 2. Reminders */}
            <div className="col-span-12 md:col-span-3 bg-white dark:bg-[#151515] rounded-[32px] p-6 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col h-full min-h-[300px]">
                <div className="flex justify-between items-center mb-6">
                    <h3 className="font-bold text-slate-800 dark:text-white">Reminder. <span className="text-slate-400 font-normal">2025</span></h3>
                    <MoreHorizontal size={16} className="text-slate-400" />
                </div>

                <div className="flex flex-col items-center mb-6">
                    <div className="text-sm text-slate-500">Sunday, Feb</div>
                    <div className="text-6xl font-light text-slate-800 dark:text-white my-2">10</div>
                </div>

                <div className="space-y-4 relative flex-1">
                    {/* Vertical Line */}
                    <div className="absolute left-[3.5rem] top-2 bottom-2 w-px bg-slate-100 dark:bg-slate-800"></div>
                    
                    {[
                        { time: '07:00', icon: '📝', color: 'bg-black text-white' },
                        { time: '08:00', icon: '📞', color: 'bg-yellow-400 text-yellow-900' },
                        { time: '08:00', icon: '📊', color: 'bg-blue-500 text-white' },
                        { time: '08:00', icon: '🥗', color: 'bg-green-500 text-white' },
                    ].map((item, i) => (
                        <div key={i} className="flex items-center gap-4 relative z-10">
                            <div className="w-10 text-xs font-bold text-slate-400 text-right">{item.time}</div>
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs shadow-sm ${item.color}`}>
                                {item.icon}
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* 3. Team Collaboration */}
            <div className="col-span-12 md:col-span-5 bg-white dark:bg-[#151515] rounded-[32px] p-6 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col h-full min-h-[300px]">
                <div className="flex justify-between items-center mb-6">
                    <h3 className="font-bold text-slate-800 dark:text-white flex items-center gap-2">
                        <Users size={18} /> Team Collaboration
                    </h3>
                    <div className="flex -space-x-2">
                        {['AD', 'SP', 'WD', 'ER', 'ZA'].map((ini, i) => (
                            <div key={i} className={`w-6 h-6 rounded-full flex items-center justify-center text-[8px] font-bold text-white border border-white dark:border-slate-900 ${['bg-blue-500', 'bg-slate-200', 'bg-slate-200', 'bg-green-500', 'bg-yellow-500'][i]}`}>
                                {ini}
                            </div>
                        ))}
                    </div>
                </div>

                <div className="space-y-3 overflow-y-auto custom-scrollbar flex-1 pr-1">
                    {/* Add Button Row */}
                    <div className="flex items-center gap-4 p-2 border border-dashed border-slate-200 dark:border-slate-700 rounded-2xl hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer transition-colors">
                        <div className="w-10 h-10 rounded-full bg-slate-50 dark:bg-slate-800 flex items-center justify-center text-slate-400">
                            <Plus size={16} />
                        </div>
                    </div>

                    {[
                        { name: 'Allison Dorwart', time: '07:00', status: 'online', color: 'bg-green-500', ini: 'AD' },
                        { name: 'Allison Dorwart', time: '07:00', status: 'online', color: 'bg-yellow-500', ini: 'AD' },
                        { name: 'Allison Dorwart', time: '07:00', status: 'online', color: 'bg-pink-500', ini: 'AD' }
                    ].map((user, i) => (
                        <div key={i} className="flex items-center gap-4 p-2">
                            <div className={`w-10 h-10 rounded-full flex items-center justify-center text-xs font-bold text-white ${user.color}`}>
                                {user.ini}
                            </div>
                            <div className="flex-1">
                                <div className="flex justify-between items-center">
                                    <h4 className="font-bold text-sm text-slate-800 dark:text-white">{user.name}</h4>
                                    <span className="text-xs text-slate-400"><Calendar size={12} /></span>
                                </div>
                                <p className="text-[10px] text-slate-400">{user.time}</p>
                                <p className="text-[10px] text-slate-400">See who's online and track activity</p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* 4. Detailed Report */}
            <div className="col-span-12 md:col-span-8 bg-white dark:bg-[#151515] rounded-[32px] p-6 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col h-full min-h-[200px]">
                <div className="flex justify-between items-start mb-4">
                    <div>
                        <h3 className="font-bold text-slate-800 dark:text-white flex items-center gap-2">Detailed Report <span className="w-2 h-2 bg-slate-300 rounded-full"></span></h3>
                        <p className="text-xs text-slate-400">Real-Time Notifications</p>
                    </div>
                    <button className="text-xs font-bold text-slate-500 flex items-center gap-1">Daily <ChevronDown size={12} /></button>
                </div>

                <div className="flex items-center gap-2 mb-6">
                    <div className="w-6 h-6 rounded-full bg-blue-500 text-white text-[8px] flex items-center justify-center font-bold">ER</div>
                    <div className="w-6 h-6 rounded-full bg-orange-500 text-white text-[8px] flex items-center justify-center font-bold">AD</div>
                    <div className="w-6 h-6 rounded-full bg-pink-500 text-white text-[8px] flex items-center justify-center font-bold">6+</div>
                    <div className="ml-auto"><MoreHorizontal size={16} className="text-slate-300" /></div>
                </div>

                <div className="flex justify-between text-[10px] font-bold text-slate-400 mb-2 border-b border-slate-100 dark:border-slate-800 pb-2">
                    <span>Task</span>
                    <span>Collaboration</span>
                    <span>Meeting</span>
                </div>

                <div className="flex justify-between items-end mt-auto">
                    <div className="text-center">
                        <div className="text-2xl font-bold text-slate-800 dark:text-white">3</div>
                        <div className="text-[10px] text-slate-400">On Going</div>
                        <div className="flex items-center justify-center gap-1 text-[8px] text-red-500 font-bold mt-1"><span className="w-1 h-1 bg-red-500 rounded-full"></span> High</div>
                    </div>
                    <div className="text-center">
                        <div className="text-2xl font-bold text-slate-800 dark:text-white">6</div>
                        <div className="text-[10px] text-slate-400">Done</div>
                        <div className="flex items-center justify-center gap-1 text-[8px] text-emerald-500 font-bold mt-1"><span className="w-1 h-1 bg-emerald-500 rounded-full"></span> Low</div>
                    </div>
                    <div className="text-center">
                        <div className="text-2xl font-bold text-slate-800 dark:text-white">10</div>
                        <div className="text-[10px] text-slate-400">Done</div>
                        <div className="flex items-center justify-center gap-1 text-[8px] text-blue-500 font-bold mt-1"><span className="w-1 h-1 bg-blue-500 rounded-full"></span> Low</div>
                    </div>
                    <div className="text-center">
                        <div className="text-2xl font-bold text-slate-800 dark:text-white">2</div>
                        <div className="text-[10px] text-slate-400">On Going</div>
                        <div className="flex items-center justify-center gap-1 text-[8px] text-red-500 font-bold mt-1"><span className="w-1 h-1 bg-red-500 rounded-full"></span> High</div>
                    </div>
                </div>
            </div>

            {/* 6. Performance */}
            <div className="col-span-12 md:col-span-4 bg-white dark:bg-[#151515] rounded-[32px] p-6 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col h-full min-h-[200px]">
                <div className="flex justify-between items-start mb-6">
                    <div>
                        <h3 className="font-bold text-slate-800 dark:text-white">Performance</h3>
                        <p className="text-xs text-slate-400 mt-1">Efficiency Metrics</p>
                    </div>
                    <MoreHorizontal size={16} className="text-slate-300" />
                </div>

                <div className="flex-1 flex flex-col gap-4">
                    <div className="flex-1 bg-slate-50 dark:bg-slate-800/50 rounded-2xl p-4 flex flex-col justify-center">
                         <span className="text-xs text-slate-500 uppercase font-bold tracking-wider mb-1">Project</span>
                         <div className="flex items-end gap-2">
                             <span className="text-3xl font-bold text-slate-800 dark:text-white">94%</span>
                             <span className="text-xs text-emerald-500 font-bold mb-1">+2%</span>
                         </div>
                    </div>
                    <div className="flex-1 bg-slate-50 dark:bg-slate-800/50 rounded-2xl p-4 flex flex-col justify-center">
                         <span className="text-xs text-slate-500 uppercase font-bold tracking-wider mb-1">My Performance</span>
                         <div className="flex items-end gap-2">
                             <span className="text-3xl font-bold text-slate-800 dark:text-white">98%</span>
                             <span className="text-xs text-emerald-500 font-bold mb-1">+5%</span>
                         </div>
                    </div>
                </div>
            </div>

        </div>
    );

    return (
        <div className="p-6 bg-slate-50 dark:bg-black h-full overflow-y-auto custom-scrollbar">
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold text-slate-800 dark:text-white">Project Dashboard</h2>
                <div className="flex bg-slate-200 dark:bg-slate-800/50 p-1 rounded-xl">
                    <button 
                        onClick={() => setActiveDashboardTab('Overview')}
                        className={`px-6 py-2 text-xs font-bold rounded-lg transition-all ${activeDashboardTab === 'Overview' ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}
                    >
                        Overview
                    </button>
                    <button 
                        onClick={() => setActiveDashboardTab('Timeline')}
                        className={`px-6 py-2 text-xs font-bold rounded-lg transition-all flex items-center gap-2 ${activeDashboardTab === 'Timeline' ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 shadow-sm' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}
                    >
                        Timeline
                    </button>
                </div>
            </div>

            {activeDashboardTab === 'Timeline' && renderTimelineTab()}
            {activeDashboardTab === 'Overview' && renderOverviewTab()}
        </div>
    );
  }

  return (
    <div className={`bg-white dark:bg-[#0a0a0a] h-full flex flex-col relative transition-colors duration-300 ${!compact ? 'rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm' : ''}`}>
      {!compact && (
          <div className="flex items-center justify-between p-3 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0a0a0a]">
              <div className="flex gap-4">
                  <button onClick={() => setViewMode('list')} className={`pb-2 text-sm font-bold transition-all border-b-2 ${viewMode === 'list' ? 'border-purple-600 text-purple-600 dark:text-purple-400' : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}>
                      List
                  </button>
                  <button onClick={() => setViewMode('dashboard')} className={`pb-2 text-sm font-bold transition-all border-b-2 ${viewMode === 'dashboard' ? 'border-purple-600 text-purple-600 dark:text-purple-400' : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}>
                      Dashboard
                  </button>
              </div>
              <div className="flex gap-2">
                   <button onClick={toggleFinancials} className="flex items-center gap-2 px-3 py-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-medium text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors shadow-sm">
                        {areFinancialsVisible ? <EyeOff size={14} /> : <Eye size={14} />}
                        {areFinancialsVisible ? 'Hide Money' : 'Show Money'}
                   </button>
                   {viewMode === 'list' && (
                       <div className="relative" ref={menuRef}>
                           <button onClick={() => setIsColumnMenuOpen(!isColumnMenuOpen)} className={`flex items-center gap-2 px-3 py-1.5 border rounded-lg text-xs font-medium transition-colors shadow-sm ${isColumnMenuOpen ? 'bg-purple-50 dark:bg-purple-900/30 border-purple-200 dark:border-purple-800 text-purple-600 dark:text-purple-400' : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700'}`}>
                                <Settings2 size={14} /> Columns
                           </button>
                           {isColumnMenuOpen && (
                               <div className="absolute right-0 top-full mt-2 w-64 bg-white dark:bg-slate-900 rounded-xl shadow-xl border border-slate-200 dark:border-slate-700 z-50 animate-in fade-in zoom-in-95 duration-150 overflow-hidden">
                                   <div className="p-3 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50">
                                       <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider">Customize Columns</h4>
                                   </div>
                                   <div className="max-h-[300px] overflow-y-auto custom-scrollbar p-1">
                                       {columns.map((col, index) => (
                                           <div key={col.id} className="flex items-center justify-between p-2 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-lg group transition-colors">
                                               <label className="flex items-center gap-2 text-sm text-slate-700 dark:text-slate-300 cursor-pointer flex-1">
                                                   <input type="checkbox" checked={col.visible} onChange={() => toggleColumn(col.id)} className="rounded border-slate-300 dark:border-slate-600 text-purple-600 focus:ring-purple-500" />
                                                   {col.label}
                                               </label>
                                               <div className="flex gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                                                   <button disabled={index === 0} className="p-1 text-slate-400 hover:text-purple-600 hover:bg-slate-100 rounded disabled:opacity-30"><ChevronUp size={14} /></button>
                                                   <button disabled={index === columns.length - 1} className="p-1 text-slate-400 hover:text-purple-600 hover:bg-slate-100 rounded disabled:opacity-30"><ChevronDown size={14} /></button>
                                               </div>
                                           </div>
                                       ))}
                                   </div>
                               </div>
                           )}
                       </div>
                   )}
              </div>
          </div>
      )}
      <div className="flex-1 bg-slate-50/50 dark:bg-[#0a0a0a] overflow-hidden">
          {viewMode === 'list' && renderList()}
          {viewMode === 'dashboard' && renderDashboard()}
          {/* Other view modes would go here, simplified for this request */}
      </div>
    </div>
  );
};
