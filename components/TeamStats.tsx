
import React, { useState, useEffect, useMemo } from 'react';
import { TeamMember, AssignmentConfig, Project, AssignmentMode } from '../types';
import { Star, TrendingUp, MoreHorizontal, ArrowRight, BrainCircuit, RotateCw, CheckCircle2, Sliders, X, Save, RefreshCw, Briefcase, Activity, Zap, Layers, Clock, AlertTriangle, Filter } from 'lucide-react';
import { MOCK_ACTIVITY_LOGS } from '../constants';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, AreaChart, Area, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar } from 'recharts';

interface TeamStatsProps {
  members: TeamMember[];
  projects: Project[];
  onUpdateMember: (member: TeamMember) => void;
  currentUserRole?: string;
}

export const TeamStats: React.FC<TeamStatsProps> = ({ members, projects, onUpdateMember, currentUserRole }) => {
  const [selectedMember, setSelectedMember] = useState<TeamMember | null>(null);
  const [editedConfig, setEditedConfig] = useState<AssignmentConfig | null>(null);
  const [activeTab, setActiveTab] = useState<'stats' | 'logs'>('stats');
  const [isSaving, setIsSaving] = useState(false);
  const [showSaveSuccess, setShowSaveSuccess] = useState(false);
  
  // --- NEW STATES ---
  const [showAllMembers, setShowAllMembers] = useState(false);
  const [viewMode, setViewMode] = useState<'performance' | 'live'>('performance');

  useEffect(() => {
    if (selectedMember) {
      setEditedConfig({ ...selectedMember.assignmentConfig });
      setShowSaveSuccess(false);
      setActiveTab('stats');
    }
  }, [selectedMember]);

  // --- CALCULATE METRICS PER MEMBER ---
  const memberMetrics = useMemo(() => {
      return members.map(m => {
          const mProjects = projects.filter(p => p.assignedTo === m.id);
          const revenue = mProjects.reduce((sum, p) => sum + (p.amount || 0), 0);
          const completedCount = mProjects.filter(p => p.status === 'Completed').length;
          
          return {
              ...m,
              revenue,
              projectCount: mProjects.length,
              realCompletionRate: m.completionRate, // Using mock data for demo, typically calculated
          };
      }).sort((a, b) => b.revenue - a.revenue); // Sort by highest earner for the "Hero" card
  }, [members, projects]);

  const displayedMembers = showAllMembers ? memberMetrics : memberMetrics.slice(0, 3);

  // --- CHART DATA ---
  const performanceData = [
      { name: 'Jan', VisionForge: 4000, PromptLab: 2400, StreamCraft: 2400 },
      { name: 'Feb', VisionForge: 3000, PromptLab: 1398, StreamCraft: 2210 },
      { name: 'Mar', VisionForge: 2000, PromptLab: 5800, StreamCraft: 2290 },
      { name: 'Apr', VisionForge: 2780, PromptLab: 3908, StreamCraft: 2000 },
      { name: 'May', VisionForge: 1890, PromptLab: 4800, StreamCraft: 2181 },
      { name: 'Jun', VisionForge: 2390, PromptLab: 3800, StreamCraft: 2500 },
      { name: 'Jul', VisionForge: 3490, PromptLab: 4300, StreamCraft: 2100 },
  ];

  const revenueData = memberMetrics.map(m => ({
      name: m.name.split(' ')[0], // First name
      value: m.revenue,
      projects: m.projectCount
  })).slice(0, 5);

  const handleConfigChange = (key: keyof AssignmentConfig, value: any) => {
    if (!editedConfig) return;
    setEditedConfig({ ...editedConfig, [key]: value });
  };

  const handleSave = () => {
    if (!selectedMember || !editedConfig) return;
    setIsSaving(true);
    setTimeout(() => {
      const updatedMember = { ...selectedMember, assignmentConfig: editedConfig };
      onUpdateMember(updatedMember);
      setSelectedMember(updatedMember);
      setIsSaving(false);
      setShowSaveSuccess(true);
    }, 600);
  };

  const getActionStyle = (action: string) => {
      switch (action.toUpperCase()) {
          case 'LOGIN': return 'bg-blue-900/20 text-blue-400 border-blue-500/30';
          case 'EDIT': return 'bg-indigo-900/20 text-indigo-400 border-indigo-500/30';
          case 'FOLLOW-UP': return 'bg-blue-900/20 text-blue-400 border-blue-500/30'; // Similar to Login/Info
          case 'CREATE': return 'bg-emerald-900/20 text-emerald-400 border-emerald-500/30';
          case 'VIEW': return 'bg-slate-800 text-slate-400 border-slate-700';
          case 'DELETE': return 'bg-red-900/20 text-red-400 border-red-500/30';
          default: return 'bg-slate-800 text-slate-400 border-slate-700';
      }
  };

  return (
    <div className="flex h-[calc(100vh-theme(spacing.20))] gap-6 overflow-hidden p-6 bg-[#0a0a0a] text-slate-100 font-sans">
       
       <div className="flex-1 flex flex-col gap-6 overflow-y-auto custom-scrollbar">
           
           {/* Header */}
           <div className="flex justify-between items-center">
               <h1 className="text-2xl font-bold text-white">Team insights</h1>
               <div className="flex items-center gap-2">
                   <button 
                        onClick={() => setViewMode('performance')}
                        className={`p-2 rounded-full transition-all duration-200 ${viewMode === 'performance' ? 'bg-slate-800 text-white shadow-lg shadow-slate-700/50' : 'hover:bg-slate-800 text-slate-400'}`}
                        title="Performance Metrics"
                   >
                        <Activity size={20} />
                   </button>
                   <button 
                        onClick={() => setViewMode('live')}
                        className={`p-2 rounded-full transition-all duration-200 ${viewMode === 'live' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/50' : 'hover:bg-slate-800 text-slate-400'}`}
                        title="Live Activity Feed"
                   >
                        <Zap size={20} />
                   </button>
               </div>
           </div>

           {/* TEAM LEADERS / MEMBERS ROW */}
           <div>
               <div className="flex justify-between items-center mb-4">
                   <h2 className="text-lg font-bold text-slate-200">Team Leaders</h2>
                   <button 
                        onClick={() => setShowAllMembers(!showAllMembers)}
                        className="text-xs text-slate-400 hover:text-white flex items-center gap-1 transition-colors"
                   >
                       {showAllMembers ? 'Show less' : 'View all'} <ArrowRight size={12} className={`transition-transform duration-300 ${showAllMembers ? 'rotate-180' : ''}`} />
                   </button>
               </div>
               
               <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 gap-6">
                   {displayedMembers.map((member, index) => {
                       const isTop = index === 0;
                       return (
                           <div 
                               key={member.id}
                               onClick={() => setSelectedMember(member)}
                               draggable="true"
                               onDragStart={(e) => {
                                   e.dataTransfer.setData('member', JSON.stringify(member));
                                   e.dataTransfer.effectAllowed = 'copy';
                               }}
                               className={`rounded-3xl p-6 relative cursor-pointer transition-all duration-300 group hover:-translate-y-1 ${
                                   isTop 
                                   ? 'bg-blue-600 text-white shadow-xl shadow-blue-900/20' 
                                   : 'bg-[#151515] border border-slate-800 hover:border-slate-700 text-slate-200'
                               }`}
                           >
                               <div className="flex justify-between items-start mb-6">
                                   <div className="flex items-center gap-4">
                                       <img 
                                           src={member.avatar} 
                                           alt={member.name} 
                                           className={`w-12 h-12 rounded-full object-cover border-2 ${isTop ? 'border-white/30' : 'border-slate-700'}`} 
                                       />
                                       <div>
                                           <div className="flex items-center gap-1.5">
                                               <h3 className="font-bold text-base">{member.name}</h3>
                                               {isTop && <CheckCircle2 size={16} className="text-white fill-white/20" />}
                                           </div>
                                           <p className={`text-xs ${isTop ? 'text-blue-100' : 'text-slate-500'}`}>{member.role}</p>
                                       </div>
                                   </div>
                                   <button className={`p-1 rounded hover:bg-white/10 ${isTop ? 'text-white' : 'text-slate-500'}`}>
                                       <MoreHorizontal size={20} />
                                   </button>
                               </div>

                               {/* Progress Bar */}
                               <div className="mb-6">
                                   <div className="flex justify-between text-xs font-medium mb-2">
                                       <span className={isTop ? 'text-blue-100' : 'text-slate-500'}>Efficiency Score</span>
                                       <span>{member.completionRate}%</span>
                                   </div>
                                   <div className={`w-full h-1.5 rounded-full overflow-hidden ${isTop ? 'bg-black/20' : 'bg-slate-800'}`}>
                                       <div 
                                           className={`h-full rounded-full ${isTop ? 'bg-white' : 'bg-slate-600'}`} 
                                           style={{ width: `${member.completionRate}%` }}
                                       ></div>
                                   </div>
                               </div>

                               {/* Stats Grid */}
                               <div className={`grid grid-cols-3 gap-2 pt-4 border-t ${isTop ? 'border-white/20' : 'border-slate-800'}`}>
                                   <div>
                                       <p className={`text-[10px] uppercase tracking-wider mb-1 ${isTop ? 'text-blue-100' : 'text-slate-500'}`}>Earnings</p>
                                       <p className="text-sm font-bold">${(member.revenue/1000).toFixed(1)}k</p>
                                   </div>
                                   <div className={`border-l pl-4 ${isTop ? 'border-white/20' : 'border-slate-800'}`}>
                                       <p className={`text-[10px] uppercase tracking-wider mb-1 ${isTop ? 'text-blue-100' : 'text-slate-500'}`}>Projects</p>
                                       <p className="text-sm font-bold">{member.projectCount}</p>
                                   </div>
                                   <div className={`border-l pl-4 ${isTop ? 'border-white/20' : 'border-slate-800'}`}>
                                       <p className={`text-[10px] uppercase tracking-wider mb-1 ${isTop ? 'text-blue-100' : 'text-slate-500'}`}>Rating</p>
                                       <p className="text-sm font-bold">{member.rating}</p>
                                   </div>
                               </div>
                           </div>
                       );
                   })}
               </div>
           </div>

           {/* --- VIEW MODE CONTENT --- */}
           {viewMode === 'performance' ? (
                // MODE: PERFORMANCE CHARTS (Default)
                <>
                    {/* MIDDLE SECTION: TRENDING & PERFORMANCE */}
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-in fade-in slide-in-from-bottom-2 duration-500">
                        
                        {/* Left: Trending/Assignment Modes */}
                        <div className="space-y-6">
                            <div className="flex justify-between items-center mb-1">
                                <h3 className="text-sm font-bold text-slate-200 flex items-center gap-2">
                                    Assignment Modes <span className="text-slate-500 cursor-help" title="Active allocation strategies">ⓘ</span>
                                </h3>
                                <ArrowRight size={14} className="text-slate-500" />
                            </div>

                            {/* Mode Card 1 */}
                            <div className="bg-[#151515] p-5 rounded-2xl border border-slate-800 flex items-center justify-between group hover:border-slate-700 transition-colors">
                                <div className="flex items-center gap-4">
                                    <div className="p-3 bg-emerald-500/10 text-emerald-500 rounded-xl">
                                        <BrainCircuit size={20} />
                                    </div>
                                    <div>
                                        <p className="text-sm font-bold text-slate-200">Auto-Smart</p>
                                        <p className="text-xs text-emerald-500 flex items-center gap-1">
                                            <TrendingUp size={10} /> 45% Usage
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {/* Mode Card 2 */}
                            <div className="bg-[#151515] p-5 rounded-2xl border border-slate-800 flex items-center justify-between group hover:border-slate-700 transition-colors">
                                <div className="flex items-center gap-4">
                                    <div className="p-3 bg-purple-500/10 text-purple-500 rounded-xl">
                                        <RotateCw size={20} />
                                    </div>
                                    <div>
                                        <p className="text-sm font-bold text-slate-200">Round-Robin</p>
                                        <p className="text-xs text-purple-500 flex items-center gap-1">
                                            <TrendingUp size={10} /> 30% Usage
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Right: Performance Chart */}
                        <div className="lg:col-span-2 bg-[#151515] p-6 rounded-3xl border border-slate-800">
                            <div className="flex justify-between items-start mb-6">
                                <div>
                                    <h3 className="font-bold text-base text-slate-200 mb-1">Performance</h3>
                                    <p className="text-xs text-slate-500">Output value across creative platforms</p>
                                </div>
                                
                                {/* Legend / Filter */}
                                <div className="flex gap-4">
                                    <div className="flex items-center gap-2">
                                        <span className="w-2 h-2 rounded-full bg-yellow-500"></span>
                                        <span className="text-xs text-slate-400">VisionForge</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <span className="w-2 h-2 rounded-full bg-blue-500"></span>
                                        <span className="text-xs text-slate-400">PromptLab</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <span className="w-2 h-2 rounded-full bg-pink-500"></span>
                                        <span className="text-xs text-slate-400">StreamCraft</span>
                                    </div>
                                </div>
                            </div>

                            <div className="h-64 w-full">
                                <ResponsiveContainer width="100%" height="100%">
                                    <AreaChart data={performanceData}>
                                        <defs>
                                            <linearGradient id="colorYellow" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%" stopColor="#eab308" stopOpacity={0.1}/>
                                                <stop offset="95%" stopColor="#eab308" stopOpacity={0}/>
                                            </linearGradient>
                                            <linearGradient id="colorBlue" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.1}/>
                                                <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                                            </linearGradient>
                                        </defs>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#334155" opacity={0.3} />
                                        <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fontSize: 10, fill: '#64748b'}} dy={10} />
                                        <YAxis axisLine={false} tickLine={false} tick={{fontSize: 10, fill: '#64748b'}} />
                                        <Tooltip 
                                            contentStyle={{backgroundColor: '#1e293b', border: 'none', borderRadius: '12px', fontSize: '12px', color: '#fff'}} 
                                            itemStyle={{color: '#cbd5e1'}}
                                            cursor={{stroke: '#fff', strokeWidth: 1, strokeDasharray: '4 4'}}
                                        />
                                        <Area type="step" dataKey="VisionForge" stroke="#eab308" strokeWidth={2} fill="url(#colorYellow)" />
                                        <Area type="step" dataKey="PromptLab" stroke="#3b82f6" strokeWidth={2} fill="url(#colorBlue)" />
                                        <Area type="step" dataKey="StreamCraft" stroke="#ec4899" strokeWidth={2} fill="transparent" />
                                    </AreaChart>
                                </ResponsiveContainer>
                            </div>
                        </div>
                    </div>

                    {/* BOTTOM SECTION: TIME VS REVENUE */}
                    <div className="bg-[#151515] p-6 rounded-3xl border border-slate-800 animate-in fade-in slide-in-from-bottom-4 duration-700">
                        <div className="flex justify-between items-center mb-6">
                            <div>
                                <h3 className="font-bold text-base text-slate-200">Time vs Revenue</h3>
                                <p className="text-xs text-slate-500">Revenue generation per auditor</p>
                            </div>
                            <div className="flex gap-2">
                                    {['Aug', 'Sep', 'Oct', 'Nov', 'Dec'].map((m, i) => (
                                        <button key={m} className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors ${i === 4 ? 'bg-blue-600 text-white' : 'text-slate-500 hover:text-slate-300'}`}>
                                            {m}
                                        </button>
                                    ))}
                            </div>
                        </div>

                        <div className="h-48 w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={revenueData} barSize={40}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#334155" opacity={0.3} />
                                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fontSize: 10, fill: '#64748b'}} dy={10} />
                                    <YAxis axisLine={false} tickLine={false} tick={{fontSize: 10, fill: '#64748b'}} />
                                    <Tooltip 
                                        cursor={{fill: '#1e293b', opacity: 0.4}}
                                        contentStyle={{backgroundColor: '#0f172a', border: '1px solid #334155', borderRadius: '8px'}}
                                    />
                                    <Bar dataKey="value" radius={[6, 6, 6, 6]}>
                                        {revenueData.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={index === 3 ? '#3b82f6' : '#334155'} />
                                        ))}
                                    </Bar>
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                        
                        <div className="flex justify-center gap-6 mt-4">
                            <div className="flex items-center gap-2">
                                <span className="w-2 h-2 rounded-full bg-slate-700"></span>
                                <span className="text-xs text-slate-400">Production time</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <span className="w-2 h-2 rounded-full bg-blue-500"></span>
                                <span className="text-xs text-slate-400">Finalized assets</span>
                            </div>
                        </div>
                    </div>
                </>
           ) : (
                // MODE: LIVE ACTIVITY (Zap) - REFINED UI
                <div className="flex-1 bg-[#151515] p-0 rounded-3xl border border-slate-800 animate-in fade-in slide-in-from-bottom-2 duration-300 flex flex-col overflow-hidden">
                    {/* Header */}
                    <div className="p-6 border-b border-slate-800/50 flex justify-between items-center bg-[#181818]">
                        <div>
                            <h3 className="font-bold text-lg text-white flex items-center gap-2">
                                <Zap size={18} className="text-indigo-500 fill-indigo-500" /> Live Activity Feed
                            </h3>
                            <p className="text-xs text-slate-500 mt-1">Real-time system logs and team actions</p>
                        </div>
                        <div className="flex gap-3">
                            <div className="bg-indigo-900/20 text-indigo-400 px-3 py-1.5 rounded-full text-xs font-bold border border-indigo-500/30 flex items-center gap-2 shadow-inner">
                                <span className="w-2 h-2 bg-indigo-500 rounded-full animate-pulse shadow-[0_0_8px_rgba(99,102,241,0.6)]"></span> Live
                            </div>
                            <button className="p-2 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-white transition-colors">
                                <Filter size={18} />
                            </button>
                        </div>
                    </div>

                    {/* Feed List */}
                    <div className="flex-1 overflow-y-auto custom-scrollbar bg-[#0f0f0f] p-4 space-y-2">
                        {MOCK_ACTIVITY_LOGS.map((log, idx) => (
                            <div key={log.id} className="flex items-center gap-4 p-4 rounded-xl border border-slate-800/50 bg-[#121212] hover:bg-[#1a1a1a] hover:border-slate-700/50 transition-all group">
                                {/* Time */}
                                <div className="min-w-[70px] text-xs font-mono font-bold text-slate-500 group-hover:text-slate-400">
                                    {new Date(log.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                                </div>

                                {/* Divider */}
                                <div className="w-px h-8 bg-slate-800 group-hover:bg-slate-700 transition-colors"></div>

                                {/* Main Content */}
                                <div className="flex-1">
                                    <div className="flex items-center gap-3 mb-1">
                                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase border tracking-wider ${getActionStyle(log.action)}`}>
                                            {log.action}
                                        </span>
                                        <span className="text-sm font-bold text-slate-200">{log.userName}</span>
                                    </div>
                                    <p className="text-xs text-slate-500 truncate max-w-md">
                                        <span className="text-slate-400 font-medium">{log.target}</span> 
                                        {log.details && <span className="opacity-60"> - {log.details}</span>}
                                    </p>
                                </div>

                                {/* Right Side */}
                                {idx === 0 && (
                                    <div className="text-[10px] font-bold text-indigo-500 animate-pulse whitespace-nowrap px-3">
                                        Just now
                                    </div>
                                )}
                            </div>
                        ))}
                        
                        {/* Pagination / Load More */}
                        <div className="pt-4 text-center">
                            <button className="text-xs text-slate-600 hover:text-slate-400 transition-colors">View older logs</button>
                        </div>
                    </div>
                </div>
           )}

       </div>

       {/* CONFIGURATION SLIDE-OVER (Hidden by default, triggered on card click) */}
       {selectedMember && (
            <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex justify-end transition-opacity">
                <div className="w-full max-w-md bg-[#111] h-full shadow-2xl flex flex-col border-l border-slate-800 animate-in slide-in-from-right duration-300">
                    <div className="p-6 border-b border-slate-800 flex items-start justify-between bg-[#151515]">
                        <div className="flex items-center gap-4">
                            <img src={selectedMember.avatar} className="w-14 h-14 rounded-full border-2 border-slate-700" alt="" />
                            <div>
                                <h2 className="text-xl font-bold text-white">{selectedMember.name}</h2>
                                <p className="text-sm text-slate-400">{selectedMember.role}</p>
                            </div>
                        </div>
                        <button onClick={() => setSelectedMember(null)} className="p-2 hover:bg-slate-800 rounded-full text-slate-500 hover:text-white transition-colors">
                            <X size={20} />
                        </button>
                    </div>

                    <div className="flex-1 overflow-y-auto p-6 space-y-8">
                        {editedConfig && (
                            <div className="space-y-6">
                                <div className="bg-[#1a1a1a] p-4 rounded-xl border border-slate-800">
                                    <h3 className="font-bold text-white text-sm mb-4 flex items-center gap-2">
                                        <Sliders size={16} className="text-blue-500" /> Allocation Strategy
                                    </h3>
                                    <div className="space-y-3">
                                        {['Manual', 'Auto-Smart', 'Round-Robin'].map((mode) => (
                                            <button 
                                                key={mode} 
                                                onClick={() => handleConfigChange('mode', mode)}
                                                className={`w-full flex items-center justify-between p-3 rounded-lg border text-left transition-all ${
                                                    editedConfig.mode === mode 
                                                    ? 'bg-blue-600/10 border-blue-600/50 text-blue-400' 
                                                    : 'bg-black border-slate-800 text-slate-400 hover:border-slate-700'
                                                }`}
                                            >
                                                <span className="text-sm font-medium">{mode}</span>
                                                {editedConfig.mode === mode && <CheckCircle2 size={16} />}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                <div className="bg-[#1a1a1a] p-4 rounded-xl border border-slate-800">
                                    <h3 className="font-bold text-white text-sm mb-4 flex items-center gap-2">
                                        <Activity size={16} className="text-emerald-500" /> Recent Logs
                                    </h3>
                                    <div className="space-y-3">
                                        {MOCK_ACTIVITY_LOGS.filter(l => l.userId === selectedMember.id).slice(0, 3).map((log, i) => (
                                            <div key={i} className="flex gap-3 text-xs border-b border-slate-800 pb-2 last:border-0 last:pb-0">
                                                <span className="text-slate-500 font-mono">{new Date(log.timestamp).toLocaleDateString()}</span>
                                                <span className="text-slate-300">{log.action} {log.target}</span>
                                            </div>
                                        ))}
                                        {MOCK_ACTIVITY_LOGS.filter(l => l.userId === selectedMember.id).length === 0 && (
                                            <p className="text-xs text-slate-500 italic">No recent activity.</p>
                                        )}
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                    <div className="p-4 border-t border-slate-800 bg-[#151515] flex justify-end gap-3">
                        {showSaveSuccess && <span className="text-emerald-500 text-xs flex items-center gap-1 self-center mr-auto"><CheckCircle2 size={14}/> Saved</span>}
                        <button onClick={() => setSelectedMember(null)} className="px-4 py-2 text-sm text-slate-400 hover:text-white transition-colors">Cancel</button>
                        <button onClick={handleSave} disabled={isSaving} className="px-6 py-2 bg-blue-600 text-white rounded-lg text-sm font-bold hover:bg-blue-500 transition-colors flex items-center gap-2">
                            {isSaving ? <RefreshCw size={14} className="animate-spin"/> : <Save size={14} />} Save Changes
                        </button>
                    </div>
                </div>
            </div>
        )}
    </div>
  );
};
