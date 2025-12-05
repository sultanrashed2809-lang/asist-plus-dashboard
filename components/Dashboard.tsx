
import React, { useMemo, useEffect, useRef, useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, PieChart, Pie, Legend, AreaChart, Area, Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis } from 'recharts';
import { Clock, AlertTriangle, FileText, UserCheck, AlertCircle, Timer, Bell, Wallet, TrendingUp, PieChart as PieChartIcon, CheckSquare, BarChart2, Users, Layers, DollarSign, MapPin, Activity, Globe, Zap } from 'lucide-react';
import { Project, Reminder, TeamMember } from '../types';

interface DashboardProps {
  projects: Project[];
  members?: TeamMember[];
  onStatClick?: (filterType: string) => void;
  theme?: 'light' | 'dark';
}

const StatCard: React.FC<{ title: string; value: string | number; subtitle: string; icon: any; color: string; onClick?: () => void }> = ({ title, value, subtitle, icon: Icon, color, onClick }) => (
  <div 
    onClick={onClick}
    className={`bg-white dark:bg-[#151515] p-6 rounded-xl shadow-sm dark:shadow-none border border-slate-200 dark:border-slate-800 flex items-start justify-between ${onClick ? 'cursor-pointer hover:border-teal-500/30 transition-all group' : ''} transition-colors duration-300`}
  >
    <div>
      <p className="text-sm font-medium text-slate-500 dark:text-slate-400 mb-1 uppercase tracking-wide">{title}</p>
      <h3 className={`text-3xl font-bold text-slate-800 dark:text-white ${onClick ? 'group-hover:text-teal-600 dark:group-hover:text-teal-400 transition-colors' : ''}`}>{value}</h3>
      <p className={`text-xs mt-2 ${color.includes('red') ? 'text-red-500 dark:text-red-400' : 'text-emerald-600 dark:text-emerald-400'} font-medium flex items-center gap-1`}>
        {subtitle}
      </p>
    </div>
    <div className={`p-3 rounded-xl bg-slate-100 dark:bg-black/40 border border-slate-200 dark:border-slate-700/50 ${onClick ? 'group-hover:scale-110 transition-transform' : ''}`}>
      <Icon size={24} className={color.replace('bg-', 'text-').replace('-500', '-500 dark:text-400')} />
    </div>
  </div>
);

const CHART_COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#6366f1'];

const EMIRATES_COORDS = {
    'Abu Dhabi': { lat: 24.4539, lng: 54.3773 },
    'Dubai': { lat: 25.2048, lng: 55.2708 },
    'Sharjah': { lat: 25.3463, lng: 55.4209 },
    'Ajman': { lat: 25.4052, lng: 55.5136 },
    'Umm Al Quwain': { lat: 25.5605, lng: 55.5532 },
    'Ras Al Khaimah': { lat: 25.7917, lng: 55.9799 },
    'Fujairah': { lat: 25.1288, lng: 56.3265 }
};

// Custom Tooltip that adapts to theme
const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white dark:bg-[#151515] border border-slate-200 dark:border-slate-700 p-3 rounded-lg shadow-xl">
        <p className="text-slate-500 dark:text-slate-300 text-xs font-bold mb-1">{label}</p>
        {payload.map((entry: any, index: number) => (
          <p key={index} className="text-xs" style={{ color: entry.color }}>
            {entry.name}: <span className="font-bold text-slate-800 dark:text-white">{entry.value.toLocaleString()}</span>
          </p>
        ))}
      </div>
    );
  }
  return null;
};

export const Dashboard: React.FC<DashboardProps> = ({ projects, members = [], onStatClick, theme = 'dark' }) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<any>(null);
  const [mapView, setMapView] = useState<'live' | 'static'>('live');

  // dynamic calculation
  const activeProjects = projects.filter(p => p.status !== 'Completed' && p.status !== 'Cancelled' && p.status !== 'End');
  const totalActive = activeProjects.length;
  const slaBreach = projects.filter(p => p.timerStatus === 'Late').length;
  const waitingClient = projects.filter(p => p.delayReason === 'Client Delay' || p.delayReason === 'Missing Docs').length;
  
  // Avg Duration
  const avgDuration = totalActive > 0 
    ? Math.floor(activeProjects.reduce((acc, p) => acc + p.daysElapsed, 0) / totalActive)
    : 0;
  
  const criticalProjects = projects.filter(p => p.timerStatus === 'Late' || p.timerStatus === 'At Risk');

  // Financial Calculations
  const totalRevenue = projects.reduce((sum, p) => sum + (Number(p.amount) || 0), 0);
  const collectedRevenue = projects.reduce((sum, p) => sum + (Number(p.billingAdvance) || 0), 0);
  const pendingRevenue = projects.reduce((sum, p) => {
      if (p.billingBalance !== undefined && p.billingBalance !== null) {
          return sum + Number(p.billingBalance);
      }
      return sum + ((Number(p.amount) || 0) - (Number(p.billingAdvance) || 0));
  }, 0);

  // --- REAL-TIME CHARTS DATA ---

  // 1. SLA Adherence
  const realSLAData = useMemo(() => {
      const buckets = { 'Week 1': { onTime: 0, late: 0 }, 'Week 2': { onTime: 0, late: 0 }, 'Week 3': { onTime: 0, late: 0 }, 'Week 4+': { onTime: 0, late: 0 } };
      activeProjects.forEach(p => {
          const weekNum = Math.ceil((p.daysElapsed || 1) / 7);
          let key = 'Week 4+';
          if (weekNum === 1) key = 'Week 1';
          else if (weekNum === 2) key = 'Week 2';
          else if (weekNum === 3) key = 'Week 3';

          if (p.timerStatus === 'Late') buckets[key as keyof typeof buckets].late++;
          else buckets[key as keyof typeof buckets].onTime++;
      });
      return Object.entries(buckets).map(([name, data]) => ({ name, ...data }));
  }, [activeProjects]);

  // 2. Status Distribution (Vertical Bar)
  const statusDistributionData = useMemo(() => {
      const counts: Record<string, number> = {};
      projects.forEach(p => {
          if (p.status === 'Not Active') return; 
          counts[p.status] = (counts[p.status] || 0) + 1;
      });
      return Object.entries(counts)
        .map(([name, value]) => ({ name, value }))
        .sort((a, b) => b.value - a.value);
  }, [projects]);

  // 3. Service Mix (Donut)
  const serviceMixData = useMemo(() => {
      const counts: Record<string, number> = {};
      projects.forEach(p => {
          counts[p.serviceType] = (counts[p.serviceType] || 0) + 1;
      });
      return Object.entries(counts)
        .map(([name, value]) => ({ name, value }))
        .sort((a, b) => b.value - a.value)
        .slice(0, 6); // Top 6
  }, [projects]);

  // 4. Monthly Trend (Area Chart)
  const monthlyTrendData = useMemo(() => {
      const data: Record<string, number> = {};
      // Initialize last 6 months with 0
      for (let i = 5; i >= 0; i--) {
          const d = new Date();
          d.setMonth(d.getMonth() - i);
          const key = d.toLocaleString('default', { month: 'short', year: '2-digit' });
          data[key] = 0;
      }

      projects.forEach(p => {
          const date = new Date(p.startDate);
          const key = date.toLocaleString('default', { month: 'short', year: '2-digit' });
          if (data[key] !== undefined) {
              data[key]++;
          }
      });
      
      return Object.entries(data).map(([name, value]) => ({ name, value }));
  }, [projects]);

  // 5. Team Workload (Bar)
  const teamWorkloadData = useMemo(() => {
      const data: Record<string, number> = {};
      projects.forEach(p => {
          if (['Completed', 'Cancelled', 'End'].includes(p.status)) return;
          const memberName = members.find(m => m.id === p.assignedTo)?.name || 'Unassigned';
          data[memberName] = (data[memberName] || 0) + 1;
      });
      return Object.entries(data)
        .map(([name, value]) => ({ name, value }))
        .sort((a, b) => b.value - a.value);
  }, [projects, members]);

  // 6. Payment Status Breakdown (Pie)
  const paymentStatusData = useMemo(() => {
      const counts: Record<string, number> = {};
      projects.forEach(p => {
          counts[p.paymentStatus] = (counts[p.paymentStatus] || 0) + 1;
      });
      return Object.entries(counts).map(([name, value]) => ({ name, value }));
  }, [projects]);

  // 7. Top Clients by Revenue (Horizontal Bar)
  const topClientsData = useMemo(() => {
      const clients: Record<string, number> = {};
      projects.forEach(p => {
          clients[p.clientName] = (clients[p.clientName] || 0) + (Number(p.amount) || 0);
      });
      return Object.entries(clients)
        .map(([name, value]) => ({ name, value }))
        .sort((a, b) => b.value - a.value)
        .slice(0, 5);
  }, [projects]);

  // 8. Team Performance Dimensions (Radar Chart)
  const performanceRadarData = useMemo(() => {
      const dimensions = [
          { subject: 'Speed', A: 120, fullMark: 150 },
          { subject: 'Quality', A: 98, fullMark: 150 },
          { subject: 'Volume', A: 86, fullMark: 150 },
          { subject: 'Efficiency', A: 99, fullMark: 150 },
          { subject: 'SLA', A: 85, fullMark: 150 },
          { subject: 'Client', A: 65, fullMark: 150 },
      ];
      return dimensions;
  }, [members]);

  // 9. Emirate Distribution Stats
  const emirateStats = useMemo(() => {
      const counts: Record<string, number> = {
          'Dubai': 0, 'Abu Dhabi': 0, 'Sharjah': 0, 'Ajman': 0, 
          'Umm Al Quwain': 0, 'Ras Al Khaimah': 0, 'Fujairah': 0
      };
      
      let totalMapped = 0;

      projects.forEach(p => {
          if (!p.coordinates?.area) return;
          const areaLower = p.coordinates.area.toLowerCase();
          
          if (areaLower.includes('abu dhabi') || areaLower.includes('al ain')) counts['Abu Dhabi']++;
          else if (areaLower.includes('sharjah')) counts['Sharjah']++;
          else if (areaLower.includes('ajman')) counts['Ajman']++;
          else if (areaLower.includes('fujairah')) counts['Fujairah']++;
          else if (areaLower.includes('ras al khaimah') || areaLower.includes('rak')) counts['Ras Al Khaimah']++;
          else if (areaLower.includes('umm al quwain')) counts['Umm Al Quwain']++;
          else counts['Dubai']++; // Default to Dubai
          
          totalMapped++;
      });

      return Object.entries(counts)
        .map(([name, value]) => ({ 
            name, 
            value,
            percentage: totalMapped > 0 ? Math.round((value / totalMapped) * 100) : 0
        }))
        .sort((a, b) => b.value - a.value);
  }, [projects]);

  // --- Leaflet Map Implementation ---
  useEffect(() => {
    if (!mapContainerRef.current || !window.L) return;

    if (!mapRef.current) {
        // Initialize Map
        const map = window.L.map(mapContainerRef.current, { zoomControl: false }).setView([25.12, 55.25], 10.5); 
        mapRef.current = map;
    }

    const map = mapRef.current;

    // Switch Tiles based on Theme
    const tileUrl = theme === 'dark' 
        ? 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png'
        : 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png';
    
    // Update Tile Layer
    map.eachLayer((layer: any) => {
        if (layer instanceof window.L.TileLayer) {
            map.removeLayer(layer);
        }
    });

    window.L.tileLayer(tileUrl, {
        attribution: '&copy; CARTO',
        subdomains: 'abcd',
        maxZoom: 20
    }).addTo(map);

    // Clear existing markers
    map.eachLayer((layer: any) => {
        if (layer instanceof window.L.Marker) {
            map.removeLayer(layer);
        }
    });

    if (mapView === 'live') {
        // --- LIVE VIEW: Individual Markers ---
        map.setView([25.12, 55.25], 10); // Focus Dubai/Close
        
        projects.forEach(p => {
            if (p.coordinates) {
                const color = p.serviceType.includes('Audit') ? '#3b82f6' : p.serviceType.includes('ICV') ? '#10b981' : '#f59e0b';
                
                const iconHtml = `
                    <div style="display: flex; align-items: center; justify-content: center; color: ${color}; filter: drop-shadow(0 0 4px ${color});">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor" stroke="none">
                            <circle cx="12" cy="12" r="6" fill="${color}"></circle>
                            <circle cx="12" cy="12" r="12" fill="${color}" opacity="0.3"></circle>
                        </svg>
                    </div>
                `;

                const icon = window.L.divIcon({
                    className: 'custom-marker',
                    html: iconHtml,
                    iconSize: [24, 24],
                    iconAnchor: [12, 12],
                    popupAnchor: [0, -12]
                });

                window.L.marker([p.coordinates.lat, p.coordinates.lng], { icon })
                    .addTo(map)
                    .bindPopup(`
                        <div style="font-family: sans-serif; background: ${theme === 'dark' ? '#1e293b' : 'white'}; color: ${theme === 'dark' ? 'white' : '#1e293b'}; padding: 8px; border-radius: 6px; border: 1px solid ${theme === 'dark' ? '#334155' : '#e2e8f0'}; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1);">
                            <strong style="font-size: 13px; display: block; margin-bottom: 2px;">${p.clientName}</strong>
                            <div style="font-size: 11px; color: ${theme === 'dark' ? '#94a3b8' : '#64748b'};">${p.coordinates.area}</div>
                            <div style="font-size: 10px; color: #3b82f6; font-weight: bold; margin-top: 4px;">${p.serviceType}</div>
                        </div>
                    `);
            }
        });
    } else {
        // --- STATIC VIEW: Aggregated Emirate Counts ---
        map.setView([24.7, 55.2], 8); // Zoom out to UAE

        emirateStats.forEach(stat => {
            if (stat.value > 0) {
                const coords = EMIRATES_COORDS[stat.name as keyof typeof EMIRATES_COORDS];
                if (coords) {
                    const iconHtml = `
                        <div style="display: flex; flex-direction: column; align-items: center; justify-content: center;">
                            <div style="background: rgba(16, 185, 129, 0.9); color: white; width: 32px; height: 32px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: bold; font-size: 12px; box-shadow: 0 0 15px rgba(16, 185, 129, 0.6); border: 2px solid white;">
                                ${stat.value}
                            </div>
                            <div style="background: ${theme === 'dark' ? 'rgba(15, 23, 42, 0.9)' : 'rgba(255, 255, 255, 0.95)'}; padding: 2px 8px; border-radius: 12px; font-size: 10px; font-weight: bold; margin-top: 6px; white-space: nowrap; color: ${theme === 'dark' ? '#e2e8f0' : '#1e293b'}; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.3); border: 1px solid ${theme === 'dark' ? '#334155' : '#e2e8f0'};">
                                ${stat.name}
                            </div>
                        </div>
                    `;

                    const icon = window.L.divIcon({
                        className: 'emirate-marker',
                        html: iconHtml,
                        iconSize: [60, 60],
                        iconAnchor: [30, 30]
                    });

                    window.L.marker([coords.lat, coords.lng], { icon }).addTo(map);
                }
            }
        });
    }

  }, [projects, theme, mapView, emirateStats]);


  // CEO Accountability Metrics
  const delayedProjects = projects.filter(p => p.timerStatus === 'Late' || p.status === 'On Hold');
  const clientFaultCount = delayedProjects.filter(p => 
    (p.latestReason?.type === 'Client') || 
    (!p.latestReason && (p.delayReason === 'Client Delay' || p.delayReason === 'Missing Docs'))
  ).length;
  const internalFaultCount = delayedProjects.filter(p => 
    (p.latestReason?.type === 'Internal') || 
    (!p.latestReason && (p.delayReason === 'Internal Issue'))
  ).length;
  const bottleneckLabel = clientFaultCount >= internalFaultCount ? "Client Response Delay" : "Internal Capacity";
  const bottleneckPercent = delayedProjects.length > 0 
    ? Math.round((Math.max(clientFaultCount, internalFaultCount) / delayedProjects.length) * 100) 
    : 0;
  const completedCount = projects.filter(p => p.status === 'Completed').length;
  const totalProjects = projects.length || 1;
  const efficiencyRate = Math.round((completedCount / totalProjects) * 100);

  // Reminders
  const allReminders: { reminder: Reminder, project: Project }[] = [];
  projects.forEach(p => {
      if (p.reminders) {
          p.reminders.forEach(r => {
              if (!r.isCompleted) {
                  allReminders.push({ reminder: r, project: p });
              }
          });
      }
  });
  allReminders.sort((a, b) => new Date(a.reminder.dueDate).getTime() - new Date(b.reminder.dueDate).getTime());
  const upcomingReminders = allReminders.slice(0, 5);

  const gridColor = theme === 'dark' ? '#334155' : '#f1f5f9';
  const axisColor = theme === 'dark' ? '#94a3b8' : '#64748b';

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard title="Active Projects" value={totalActive} subtitle="Target: 5-8 Days SLA" icon={FileText} color="text-teal-500" />
        <StatCard title="SLA Breach" value={slaBreach} subtitle={`${slaBreach > 5 ? 'Critical' : 'Moderate'} Level`} icon={AlertTriangle} color="text-red-500" onClick={() => onStatClick && onStatClick('Late')} />
        <StatCard title="Avg Duration" value={`${avgDuration} Days`} subtitle="Active projects avg age" icon={Clock} color="text-orange-500" />
        <StatCard title="Waiting Client" value={waitingClient} subtitle="Pending documents" icon={UserCheck} color="text-blue-500" />
      </div>

      {/* Financial Health Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white dark:bg-[#151515] p-5 rounded-xl border border-slate-200 dark:border-slate-800 flex items-center justify-between shadow-sm dark:shadow-none">
              <div>
                  <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Total Revenue (Fees)</p>
                  <p className="text-2xl font-bold text-slate-800 dark:text-white">AED {totalRevenue.toLocaleString()}</p>
              </div>
              <div className="p-3 bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-100 dark:border-indigo-500/20 rounded-lg"><Wallet size={24} /></div>
          </div>
          <div className="bg-white dark:bg-[#151515] p-5 rounded-xl border border-slate-200 dark:border-slate-800 flex items-center justify-between shadow-sm dark:shadow-none">
              <div>
                  <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Collected</p>
                  <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">AED {collectedRevenue.toLocaleString()}</p>
              </div>
              <div className="p-3 bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-500/20 rounded-lg"><TrendingUp size={24} /></div>
          </div>
          <div className="bg-white dark:bg-[#151515] p-5 rounded-xl border border-slate-200 dark:border-slate-800 flex items-center justify-between shadow-sm dark:shadow-none">
              <div>
                  <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Pending Collection</p>
                  <p className="text-2xl font-bold text-orange-500 dark:text-orange-400">AED {pendingRevenue.toLocaleString()}</p>
              </div>
              <div className="p-3 bg-orange-50 dark:bg-orange-500/10 text-orange-600 dark:text-orange-400 border border-orange-100 dark:border-orange-500/20 rounded-lg"><PieChartIcon size={24} /></div>
          </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* SLA Chart */}
        <div className="lg:col-span-2 bg-white dark:bg-[#151515] p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm dark:shadow-none">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-lg font-bold text-slate-800 dark:text-white">SLA Adherence</h3>
              <p className="text-sm text-slate-500 dark:text-slate-400">Active projects by duration (Week 1 = 0-7 days)</p>
            </div>
            <div className="flex gap-4 text-sm">
              <div className="flex items-center gap-2"><span className="w-3 h-3 rounded-full bg-teal-500"></span><span className="text-slate-600 dark:text-slate-300">On Track</span></div>
              <div className="flex items-center gap-2"><span className="w-3 h-3 rounded-full bg-red-500"></span><span className="text-slate-600 dark:text-slate-300">Late</span></div>
            </div>
          </div>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={realSLAData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={gridColor} />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: axisColor, fontSize: 12 }} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: axisColor, fontSize: 12 }} allowDecimals={false} />
                <Tooltip content={<CustomTooltip />} cursor={{ fill: theme === 'dark' ? '#1e293b' : '#f1f5f9' }} />
                <defs>
                    <linearGradient id="colorOnTrack" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#14b8a6" stopOpacity={0.8}/>
                        <stop offset="95%" stopColor="#14b8a6" stopOpacity={0.4}/>
                    </linearGradient>
                    <linearGradient id="colorLate" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#ef4444" stopOpacity={0.8}/>
                        <stop offset="95%" stopColor="#ef4444" stopOpacity={0.4}/>
                    </linearGradient>
                </defs>
                <Bar dataKey="onTime" stackId="a" name="On Track" fill="url(#colorOnTrack)" radius={[0, 0, 4, 4]} barSize={30} />
                <Bar dataKey="late" stackId="a" name="Late" fill="url(#colorLate)" radius={[4, 4, 0, 0]} barSize={30} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="flex flex-col gap-6">
          {/* Critical Timers */}
          <div className="bg-white dark:bg-[#151515] p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm dark:shadow-none flex flex-col flex-1">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-slate-800 dark:text-white">Critical Timers</h3>
              <span className="px-2 py-1 bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 text-xs font-medium rounded-full border border-red-200 dark:border-red-500/20">Needs Action</span>
            </div>
            <div className="flex-1 overflow-y-auto custom-scrollbar space-y-4 pr-2 max-h-[200px]">
              {criticalProjects.length === 0 ? (
                <div className="text-center py-10 text-slate-400"><Clock className="mx-auto mb-2 opacity-50" /><p className="text-sm">No critical projects</p></div>
              ) : (
                criticalProjects.map((project) => (
                  <div key={project.id} className="p-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-[#0a0a0a] hover:bg-slate-100 dark:hover:bg-[#1a1a1a] transition-colors cursor-pointer group">
                    <div className="flex justify-between items-start mb-2">
                      <h4 className="font-semibold text-sm text-slate-700 dark:text-slate-200 group-hover:text-slate-900 dark:group-hover:text-white truncate max-w-[140px]">{project.projectName}</h4>
                      <span className={`text-xs font-bold ${project.timerStatus === 'Late' ? 'text-red-500 dark:text-red-400' : 'text-orange-500 dark:text-orange-400'}`}>{project.timerStatus === 'Late' ? 'OVERDUE' : 'RISK'}</span>
                    </div>
                    <div className="flex justify-between items-center text-xs text-slate-500 mb-2">
                      <span>{project.clientName}</span>
                      <span>{project.assignedTo === 't1' ? 'Alaes' : 'Team'}</span>
                    </div>
                    <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-1.5">
                      <div className={`h-1.5 rounded-full ${project.timerStatus === 'Late' ? 'bg-red-500' : 'bg-orange-500'}`} style={{ width: '90%' }}></div>
                    </div>
                    <div className="flex justify-between text-[10px] mt-1 text-slate-500 font-medium">
                      <span>Promised: {project.promisedDays}</span>
                      <span>Day {project.daysElapsed}</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Reminders */}
          <div className="bg-white dark:bg-[#151515] p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm dark:shadow-none flex flex-col flex-1">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-slate-800 dark:text-white flex items-center gap-2"><Bell size={18} className="text-orange-500" /> Pending Reminders</h3>
                <span className="text-xs bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400 px-2 py-0.5 rounded-full font-bold border border-orange-200 dark:border-orange-500/20">{upcomingReminders.length}</span>
              </div>
              <div className="space-y-3 flex-1 overflow-y-auto custom-scrollbar max-h-[200px]">
                  {upcomingReminders.length === 0 ? (
                      <div className="text-center py-8 text-slate-400"><CheckSquare className="mx-auto mb-2 opacity-50" /><p className="text-sm">All caught up!</p></div>
                  ) : (
                      upcomingReminders.map((item) => {
                          const isOverdue = new Date(item.reminder.dueDate) < new Date();
                          return (
                            <div key={`${item.project.id}-${item.reminder.id}`} className={`flex items-start gap-3 p-3 rounded-lg border transition-colors ${isOverdue ? 'bg-red-50 dark:bg-red-900/10 border-red-200 dark:border-red-900/30' : 'bg-slate-50 dark:bg-[#0a0a0a] border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600'}`}>
                                <div className={`p-1.5 mt-0.5 rounded-full ${isOverdue ? 'bg-red-100 dark:bg-red-900/50 text-red-600 dark:text-red-400' : 'bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400'}`}><Clock size={14} /></div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-medium text-slate-700 dark:text-slate-300 truncate">{item.reminder.title}</p>
                                    <p className="text-xs text-slate-500 truncate mb-1">Proj: {item.project.projectName}</p>
                                    <div className="flex justify-between items-center">
                                        <span className={`text-[10px] font-bold ${isOverdue ? 'text-red-500 dark:text-red-400' : 'text-slate-500'}`}>Due: {item.reminder.dueDate}</span>
                                    </div>
                                </div>
                            </div>
                          );
                      })
                  )}
              </div>
          </div>
        </div>
      </div>

      {/* ADVANCED ANALYTICS SECTION */}
      <div className="pt-4 border-t border-slate-200 dark:border-slate-800">
          <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-4 flex items-center gap-2">
              <Activity size={20} className="text-teal-500" />
              Advanced Analytics
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              
              {/* Project Intake Trend (Area Chart) */}
              <div className="bg-white dark:bg-[#151515] p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm dark:shadow-none">
                  <h4 className="text-sm font-bold text-slate-500 dark:text-slate-400 mb-4 flex items-center gap-2"><TrendingUp size={16} /> Project Intake Trend</h4>
                  <div className="h-64 w-full">
                      <ResponsiveContainer width="100%" height="100%">
                          <AreaChart data={monthlyTrendData}>
                              <defs>
                                <linearGradient id="colorIntake" x1="0" y1="0" x2="0" y2="1">
                                  <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.8}/>
                                  <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0}/>
                                </linearGradient>
                              </defs>
                              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={gridColor} />
                              <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: axisColor, fontSize: 10 }} />
                              <YAxis axisLine={false} tickLine={false} tick={{ fill: axisColor, fontSize: 10 }} />
                              <Tooltip content={<CustomTooltip />} cursor={{ stroke: '#475569' }} />
                              <Area type="monotone" dataKey="value" stroke="#8b5cf6" fillOpacity={1} fill="url(#colorIntake)" />
                          </AreaChart>
                      </ResponsiveContainer>
                  </div>
              </div>

              {/* Performance Radar */}
              <div className="bg-white dark:bg-[#151515] p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm dark:shadow-none">
                  <h4 className="text-sm font-bold text-slate-500 dark:text-slate-400 mb-4 flex items-center gap-2"><Layers size={16} /> Team Performance Dimensions</h4>
                  <div className="h-64 w-full">
                      <ResponsiveContainer width="100%" height="100%">
                          <RadarChart cx="50%" cy="50%" outerRadius="70%" data={performanceRadarData}>
                              <PolarGrid stroke={theme === 'dark' ? '#334155' : '#cbd5e1'} />
                              <PolarAngleAxis dataKey="subject" tick={{ fill: axisColor, fontSize: 10 }} />
                              <PolarRadiusAxis angle={30} domain={[0, 150]} tick={false} axisLine={false} />
                              <Radar name="Team" dataKey="A" stroke="#2dd4bf" strokeWidth={2} fill="#2dd4bf" fillOpacity={0.3} />
                              <Tooltip content={<CustomTooltip />} />
                          </RadarChart>
                      </ResponsiveContainer>
                  </div>
              </div>

              {/* Service Mix */}
              <div className="bg-white dark:bg-[#151515] p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm dark:shadow-none">
                  <h4 className="text-sm font-bold text-slate-500 dark:text-slate-400 mb-4 flex items-center gap-2"><PieChartIcon size={16} /> Service Distribution</h4>
                  <div className="h-64 w-full">
                      <ResponsiveContainer width="100%" height="100%">
                          <PieChart>
                              <Pie data={serviceMixData} innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value" stroke="none">
                                  {serviceMixData.map((entry, index) => (
                                      <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                                  ))}
                              </Pie>
                              <Tooltip content={<CustomTooltip />} />
                              <Legend wrapperStyle={{fontSize: '12px', color: axisColor}} />
                          </PieChart>
                      </ResponsiveContainer>
                  </div>
              </div>

              {/* Client Location Map (Interactive) */}
              <div className="bg-white dark:bg-[#151515] p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm dark:shadow-none flex flex-col lg:col-span-2 relative">
                  <div className="flex justify-between items-center mb-4">
                      <h4 className="text-sm font-bold text-slate-500 dark:text-slate-400 flex items-center gap-2"><MapPin size={16} /> Client Geographic Distribution</h4>
                      <div className="flex bg-slate-100 dark:bg-slate-800 rounded-lg p-1 gap-1">
                          <button 
                            onClick={() => setMapView('live')}
                            className={`px-3 py-1 text-xs font-bold rounded-md transition-colors ${mapView === 'live' ? 'bg-white dark:bg-slate-700 text-teal-600 dark:text-teal-400 shadow-sm' : 'text-slate-500 dark:text-slate-400'}`}
                          >
                              Live
                          </button>
                          <button 
                            onClick={() => setMapView('static')}
                            className={`px-3 py-1 text-xs font-bold rounded-md transition-colors ${mapView === 'static' ? 'bg-white dark:bg-slate-700 text-teal-600 dark:text-teal-400 shadow-sm' : 'text-slate-500 dark:text-slate-400'}`}
                          >
                              Summary
                          </button>
                      </div>
                  </div>
                  
                  <div className="relative w-full h-96">
                      {/* Left Overlay Card (Summary Mode) */}
                      {mapView === 'static' && (
                          <div className="absolute top-4 left-4 z-[400] w-56 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md rounded-lg border border-slate-200 dark:border-slate-800 shadow-xl overflow-hidden p-3 animate-in fade-in slide-in-from-left-4 duration-300">
                              <h5 className="text-xs font-bold text-slate-500 uppercase mb-2 pb-2 border-b border-slate-100 dark:border-slate-800 flex items-center gap-1">
                                  <Globe size={12} /> UAE Breakdown
                              </h5>
                              <div className="space-y-2 max-h-60 overflow-y-auto custom-scrollbar">
                                  {emirateStats.map((stat, i) => (
                                      <div key={i} className="space-y-1">
                                          <div className="flex justify-between items-center text-xs">
                                              <span className="text-slate-700 dark:text-slate-300 font-medium truncate">{stat.name}</span>
                                              <span className="font-mono font-bold text-teal-600 dark:text-teal-400">{stat.value}</span>
                                          </div>
                                          <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-1.5 overflow-hidden">
                                              <div 
                                                className="bg-teal-500 h-full rounded-full transition-all duration-500" 
                                                style={{ width: `${stat.percentage}%` }}
                                              />
                                          </div>
                                      </div>
                                  ))}
                              </div>
                          </div>
                      )}

                      <div ref={mapContainerRef} className="w-full h-full rounded-lg overflow-hidden border border-slate-200 dark:border-slate-800 z-0">
                            {/* Map renders here */}
                      </div>
                  </div>
                  
                  {mapView === 'live' && (
                      <div className="flex gap-4 mt-2 justify-end">
                            <div className="flex items-center gap-1 text-xs text-slate-500 dark:text-slate-400"><div className="w-2 h-2 rounded-full bg-blue-500"></div> Audit</div>
                            <div className="flex items-center gap-1 text-xs text-slate-500 dark:text-slate-400"><div className="w-2 h-2 rounded-full bg-emerald-500"></div> ICV</div>
                            <div className="flex items-center gap-1 text-xs text-slate-500 dark:text-slate-400"><div className="w-2 h-2 rounded-full bg-orange-500"></div> Other</div>
                      </div>
                  )}
              </div>

              {/* Team Workload */}
              <div className="bg-white dark:bg-[#151515] p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm dark:shadow-none">
                  <h4 className="text-sm font-bold text-slate-500 dark:text-slate-400 mb-4 flex items-center gap-2"><Users size={16} /> Active Workload</h4>
                  <div className="h-64 w-full">
                      <ResponsiveContainer width="100%" height="100%">
                          <BarChart data={teamWorkloadData} layout="vertical" margin={{left: 20}}>
                              <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke={gridColor} />
                              <XAxis type="number" hide />
                              <YAxis dataKey="name" type="category" width={80} axisLine={false} tickLine={false} tick={{fontSize: 11, fill: axisColor}} />
                              <Tooltip cursor={{fill: theme === 'dark' ? '#334155' : '#e2e8f0'}} content={<CustomTooltip />} />
                              <Bar dataKey="value" fill="#3b82f6" radius={[0, 4, 4, 0]} barSize={15}>
                                {teamWorkloadData.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={entry.value > 8 ? '#ef4444' : '#3b82f6'} />
                                ))}
                              </Bar>
                          </BarChart>
                      </ResponsiveContainer>
                  </div>
              </div>

          </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* CEO Accountability Snapshot */}
          <div className="lg:col-span-3 bg-slate-900 dark:bg-[#050505] rounded-xl p-6 border border-slate-800 text-white flex flex-col md:flex-row justify-between items-start gap-6 shadow-xl relative overflow-hidden">
                <div className="absolute top-0 right-0 p-10 opacity-5"><Activity size={200} /></div>
                <div className="flex items-center gap-3 mb-2 md:mb-0 relative z-10">
                    <div className="p-3 bg-slate-800 rounded-lg border border-slate-700"><AlertCircle className="text-red-400" size={24} /></div>
                    <div>
                        <h3 className="text-lg font-bold">CEO Accountability Snapshot</h3>
                        <p className="text-xs text-slate-400">Live bottlenecks & efficiency metrics</p>
                    </div>
                </div>
                
                <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-4 w-full relative z-10">
                    <div className="bg-slate-800/50 p-4 rounded-lg border border-slate-700">
                        <p className="text-slate-400 text-xs uppercase tracking-wider mb-1">Primary Bottleneck</p>
                        <p className="text-xl font-semibold text-white">{bottleneckLabel}</p>
                        <p className="text-xs text-slate-500 mt-1">{bottleneckPercent}% of overdue projects</p>
                    </div>
                    <div className="bg-slate-800/50 p-4 rounded-lg border border-slate-700">
                        <p className="text-slate-400 text-xs uppercase tracking-wider mb-1">Overall Efficiency</p>
                        <p className="text-xl font-semibold text-emerald-400">{efficiencyRate}% Completion</p>
                        <p className="text-xs text-slate-500 mt-1">Active vs Total Projects</p>
                    </div>
                    <div className="bg-slate-800/50 p-4 rounded-lg border border-slate-700">
                        <p className="text-slate-400 text-xs uppercase tracking-wider mb-1">Top Performer (Speed)</p>
                        <p className="text-xl font-semibold text-white">Sinan</p>
                        <p className="text-xs text-slate-500 mt-1">Avg closing: 7 days</p>
                    </div>
                </div>
          </div>
      </div>
    </div>
  );
};
