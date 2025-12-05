
import React, { useState, useMemo, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Bell, Calendar, ChevronRight, CheckCircle2, Clock, AlertTriangle, Briefcase, UserPlus, Flag, ArrowRight, Maximize2, Minimize2, X, GripHorizontal, ChevronLeft, ChevronDown, Check, MoreVertical, Plus, ShieldAlert } from 'lucide-react';
import { Project, TeamMember, CalendarEvent, EventType } from '../types';

interface RightPanelProps {
  projects: Project[];
  currentUser: TeamMember | null;
  calendarEvents: CalendarEvent[];
  onAddEvent: (event: CalendarEvent) => void;
}

// Custom Animated Assist+ Icon (Matches Chatbot)
const AssistPlusHeaderIcon = () => (
  <div className="relative flex items-center justify-center group w-8 h-8 mr-3">
    <div className="absolute inset-0 border border-teal-500/20 rounded-full animate-[spin_10s_linear_infinite] group-hover:border-teal-500/40 transition-colors"></div>
    <div className="absolute inset-[15%] border border-dashed border-slate-700 rounded-full animate-[spin_15s_linear_infinite_reverse]"></div>
    <svg viewBox="0 0 100 100" className="w-[60%] h-[60%] drop-shadow-[0_0_10px_rgba(20,184,166,0.3)] transition-all duration-500">
      <line x1="50" y1="10" x2="50" y2="90" stroke="#10b981" strokeWidth="4" strokeLinecap="round" />
      <line x1="10" y1="50" x2="90" y2="50" stroke="#10b981" strokeWidth="4" strokeLinecap="round" />
      <rect x="15" y="15" width="30" height="30" rx="4" fill="#1e293b" className="group-hover:fill-slate-700 transition-colors" />
      <text x="30" y="38" fontSize="20" fontWeight="bold" fill="white" textAnchor="middle" fontFamily="serif">A</text>
      <rect x="55" y="55" width="30" height="30" rx="4" fill="#1e293b" className="group-hover:fill-slate-700 transition-colors" />
      <text x="70" y="78" fontSize="20" fontWeight="bold" fill="white" textAnchor="middle" fontFamily="serif">P</text>
      <path d="M60 40 L70 30 L80 35 L90 20" stroke="#94a3b8" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" className="animate-pulse" />
    </svg>
  </div>
);

export const RightPanel: React.FC<RightPanelProps> = ({ projects, currentUser, calendarEvents: manualEvents, onAddEvent }) => {
  const [activeTab, setActiveTab] = useState<'notifications' | 'calendar'>('calendar');
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split('T')[0]);

  // --- FLOATING CALENDAR STATE ---
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  const [isCalendarExpanded, setIsCalendarExpanded] = useState(false);
  const [calPosition, setCalPosition] = useState({ x: 100, y: 100 });
  const [isDragging, setIsDragging] = useState(false);
  const dragRef = useRef<{ startX: number, startY: number, initialX: number, initialY: number } | null>(null);
  
  // Full Calendar Navigation State
  const [viewDate, setViewDate] = useState(new Date());

  // --- 1. NOTIFICATION LOGIC ---
  const notifications = useMemo(() => {
    const list = [];

    // A. Manager Allocation Trigger
    if (currentUser && (currentUser.role === 'Manager' || currentUser.role === 'Admin' || currentUser.role === 'Super Admin')) {
        const pendingAllocation = projects.filter(p => 
            p.assignedTo === currentUser.id && 
            (p.status === 'Lead' || p.status === 'Proposal Sent')
        );

        if (pendingAllocation.length > 0) {
            list.push({
                id: 'alloc-trigger',
                type: 'urgent',
                title: 'Allocation Required',
                desc: `You have ${pendingAllocation.length} projects assigned to you. Please allocate them to auditors immediately.`,
                time: 'High Priority',
                action: 'Allocate'
            });
        }
    }

    // B. SLA Breaches
    const overdueProjects = projects.filter(p => p.timerStatus === 'Late');
    if (overdueProjects.length > 0) {
        list.push({
            id: 'sla-breach',
            type: 'urgent',
            title: 'SLA Breach Risk',
            desc: `${overdueProjects.length} projects are currently overdue.`,
            time: 'Real-time'
        });
    }

    // C. Payment Received
    const recentPayments = projects.filter(p => p.paymentStatus === 'Paid' && p.daysElapsed < 3);
    if (recentPayments.length > 0) {
        list.push({
            id: 'payment-rec',
            type: 'success',
            title: 'Payment Received',
            desc: `Received payment for ${recentPayments[0].clientName}.`,
            time: 'Today'
        });
    }

    // D. Reminders (Due Today or Overdue)
    const today = new Date().toISOString().split('T')[0];
    projects.forEach(p => {
        p.reminders?.forEach(r => {
            if (!r.isCompleted && r.dueDate === today) {
                list.push({
                    id: r.id,
                    type: 'urgent', // Showing as urgent for visibility in High Priority tab
                    title: 'Reminder Due Today',
                    desc: `${r.title} for ${p.projectName}`,
                    time: 'Today',
                    action: 'Complete'
                });
            }
        });
    });

    return list;
  }, [projects, currentUser]);


  // --- 2. CALENDAR LOGIC ---
  const calendarEvents = useMemo(() => {
    const events: CalendarEvent[] = [];

    projects.forEach((p, idx) => {
        // Deterministic mock time generator based on index to spread events out visually
        const getMockTime = (offsetHours: number) => {
            const startHour = 8 + (idx % 8); // Spread between 8am and 4pm
            return `${String(startHour + offsetHours).padStart(2, '0')}:00`;
        };

        if (p.startDate) {
            events.push({
                id: `${p.id}-alloc`, date: p.startDate, type: 'Allocation', projectId: p.id, projectName: p.projectName,
                description: 'Received', clientName: p.clientName, mockTime: getMockTime(0), mockDuration: 1
            });
        }
        if (p.assignedDate) {
            events.push({
                id: `${p.id}-assigned`, date: p.assignedDate, type: 'Assigned', projectId: p.id, projectName: p.projectName,
                description: 'Assigned', clientName: p.clientName, mockTime: getMockTime(1), mockDuration: 1
            });
        } 
        if (p.targetDeadline) {
            events.push({
                id: `${p.id}-review`, date: p.targetDeadline, type: 'Review', projectId: p.id, projectName: p.projectName,
                description: 'Target Deadline', clientName: p.clientName, mockTime: getMockTime(2), mockDuration: 2
            });
        }
        if (p.completionDate) {
            events.push({
                id: `${p.id}-complete`, date: p.completionDate, type: 'Completion', projectId: p.id, projectName: p.projectName,
                description: 'Completed', clientName: p.clientName, mockTime: getMockTime(3), mockDuration: 1
            });
        } 
        
        // Reminders
        if (p.reminders) {
            p.reminders.forEach((r, rIdx) => {
                if (!r.isCompleted) {
                    events.push({
                        id: r.id,
                        date: r.dueDate,
                        type: 'Reminder',
                        projectId: p.id,
                        projectName: p.projectName,
                        description: r.title, clientName: p.clientName, mockTime: `09:${String(rIdx * 15).padStart(2, '0')}`, mockDuration: 0.5
                    });
                }
            });
        }
    });

    // Merge with manual events passed from props
    return [...events, ...manualEvents];
  }, [projects, manualEvents]);

  const getEventsForDate = (date: string) => calendarEvents.filter(e => e.date === date).sort((a, b) => (a.mockTime || '').localeCompare(b.mockTime || ''));

  // Calendar Generation
  const today = new Date();
  const currentMonth = today.getMonth(); 
  const currentYear = today.getFullYear();
  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
  
  const generateCalendarDays = () => {
      const days = [];
      for (let i = 1; i <= daysInMonth; i++) {
          const dateStr = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(i).padStart(2, '0')}`;
          const hasEvents = calendarEvents.some(e => e.date === dateStr);
          const isSelected = selectedDate === dateStr;
          
          days.push(
              <div 
                key={i} 
                onClick={() => setSelectedDate(dateStr)}
                className={`aspect-square flex flex-col items-center justify-center rounded-full cursor-pointer relative transition-all
                    ${isSelected ? 'bg-teal-600 text-white font-bold shadow-md shadow-teal-500/30 scale-110' : 'hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-400'}
                    ${i === today.getDate() && !isSelected ? 'border border-teal-500 text-teal-600 dark:text-teal-400' : ''}
                `}
              >
                  <span className="text-xs">{i}</span>
                  {hasEvents && !isSelected && (
                      <div className="w-1 h-1 rounded-full mt-0.5 bg-orange-500"></div>
                  )}
              </div>
          );
      }
      return days;
  };

  // Widgets Stats
  const myPendingTasks = currentUser ? projects.filter(p => p.assignedTo === currentUser.id && p.status !== 'Completed').length : 0;
  const approvalCount = projects.filter(p => p.status === 'Review Completed').length;

  const smartWidgets = [
    { title: 'My Tasks', value: `${myPendingTasks} Pending`, icon: CheckCircle2, color: 'text-emerald-500', bg: 'bg-emerald-50 dark:bg-emerald-900/20' },
    { title: 'Approvals', value: `${approvalCount} Waiting`, icon: Clock, color: 'text-orange-500', bg: 'bg-orange-50 dark:bg-orange-900/20' },
    { title: 'System Health', value: 'Optimal', icon: AlertTriangle, color: 'text-blue-500', bg: 'bg-blue-50 dark:bg-blue-900/20' },
  ];

  const getEventIcon = (type: EventType) => {
      switch(type) {
          case 'Allocation': return <Briefcase size={14} className="text-blue-500" />;
          case 'Assigned': return <UserPlus size={14} className="text-purple-500" />;
          case 'Review': return <Clock size={14} className="text-orange-500" />;
          case 'Completion': return <CheckCircle2 size={14} className="text-emerald-500" />;
          case 'Expiry': return <ShieldAlert size={14} className="text-red-500" />;
          case 'Reminder': return <Bell size={14} className="text-yellow-500" />;
          case 'Meeting': return <UserPlus size={14} className="text-pink-500" />;
          default: return <Flag size={14} className="text-slate-400" />;
      }
  };

  const getEventColor = (type: EventType) => {
      switch(type) {
          case 'Allocation': return 'bg-blue-50 dark:bg-blue-900/10 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800/30';
          case 'Assigned': return 'bg-purple-50 dark:bg-purple-900/10 text-purple-700 dark:text-purple-300 border-purple-200 dark:border-purple-800/30';
          case 'Review': return 'bg-orange-50 dark:bg-orange-900/10 text-orange-700 dark:text-orange-300 border-orange-200 dark:border-orange-800/30';
          case 'Completion': return 'bg-emerald-50 dark:bg-emerald-900/10 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800/30';
          case 'Expiry': return 'bg-red-50 dark:bg-red-900/10 text-red-700 dark:text-red-300 border-red-200 dark:border-red-800/30';
          case 'Reminder': return 'bg-yellow-50 dark:bg-yellow-900/10 text-yellow-700 dark:text-yellow-300 border-yellow-200 dark:border-yellow-800/30';
          default: return 'bg-slate-50 dark:bg-slate-800 text-slate-500 dark:text-slate-400 border-slate-200 dark:border-slate-700';
      }
  };

  const getAgendaCardStyle = (type: EventType) => {
      switch(type) {
          case 'Allocation': return { bg: 'bg-emerald-500/10', border: 'border-emerald-500', text: 'text-emerald-300' }; // Greenish
          case 'Review': return { bg: 'bg-purple-500/10', border: 'border-purple-500', text: 'text-purple-300' }; // Purple
          case 'Completion': return { bg: 'bg-emerald-500/20', border: 'border-emerald-400', text: 'text-emerald-200' };
          case 'Expiry': return { bg: 'bg-red-500/10', border: 'border-red-500', text: 'text-red-300' };
          case 'Reminder': return { bg: 'bg-orange-500/10', border: 'border-orange-500', text: 'text-orange-300' };
          case 'Meeting': return { bg: 'bg-pink-500/10', border: 'border-pink-500', text: 'text-pink-300' };
          default: return { bg: 'bg-slate-500/10', border: 'border-slate-500', text: 'text-slate-300' };
      }
  };

  // --- FLOATING WINDOW LOGIC ---
  useEffect(() => {
    if (isCalendarOpen && calPosition.x === 100) {
        // Center it
        const width = 1000;
        const height = 700;
        setCalPosition({ 
            x: (window.innerWidth - width) / 2, 
            y: (window.innerHeight - height) / 2 
        });
    }
  }, [isCalendarOpen]);

  // Drag Handlers
  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    dragRef.current = {
        startX: e.clientX,
        startY: e.clientY,
        initialX: calPosition.x,
        initialY: calPosition.y
    };
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
        if (!isDragging || !dragRef.current) return;
        const dx = e.clientX - dragRef.current.startX;
        const dy = e.clientY - dragRef.current.startY;
        setCalPosition({
            x: dragRef.current.initialX + dx,
            y: dragRef.current.initialY + dy
        });
    };
    const handleMouseUp = () => setIsDragging(false);

    if (isDragging) {
        window.addEventListener('mousemove', handleMouseMove);
        window.addEventListener('mouseup', handleMouseUp);
    }
    return () => {
        window.removeEventListener('mousemove', handleMouseMove);
        window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging]);

  const handleTimeSlotClick = (hour: number) => {
      const title = prompt(`Add Event at ${hour}:00? Enter title:`);
      if (title) {
          const newEvent: CalendarEvent = {
              id: `custom-${Date.now()}`,
              date: selectedDate,
              type: 'Meeting',
              projectId: 'manual',
              projectName: 'Manual Entry',
              description: title,
              clientName: currentUser?.name || 'User',
              mockTime: `${String(hour).padStart(2, '0')}:00`,
              mockDuration: 1
          };
          onAddEvent(newEvent);
      }
  };

  const renderMiniCalendar = () => {
      const year = viewDate.getFullYear();
      const month = viewDate.getMonth();
      const daysInM = new Date(year, month + 1, 0).getDate();
      const firstDay = new Date(year, month, 1).getDay();
      
      const days = [];
      for (let i = 0; i < firstDay; i++) days.push(<div key={`empty-${i}`} />);
      for (let i = 1; i <= daysInM; i++) {
          const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(i).padStart(2, '0')}`;
          const isSelected = selectedDate === dateStr;
          days.push(
              <div 
                key={i} 
                onClick={() => setSelectedDate(dateStr)}
                className={`w-8 h-8 flex items-center justify-center rounded-full text-xs font-medium cursor-pointer transition-all
                    ${isSelected ? 'bg-blue-600 text-white' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}
                `}
              >
                  {i}
              </div>
          );
      }
      return days;
  };

  const FloatingCalendar = () => {
      const displayDate = new Date(selectedDate);
      const dayEvents = getEventsForDate(selectedDate);

      return (
        <div 
            className={`fixed z-[200] shadow-2xl rounded-3xl border bg-[#09090b] flex overflow-hidden animate-in fade-in zoom-in-95 duration-200 border-[#27272a] text-slate-200`}
            style={{ 
                left: calPosition.x, 
                top: calPosition.y,
                width: isCalendarExpanded ? '95vw' : '1000px',
                height: isCalendarExpanded ? '90vh' : '700px',
                maxHeight: '95vh',
                maxWidth: '95vw',
                transition: isDragging ? 'none' : 'width 0.3s ease, height 0.3s ease' 
            }}
        >
            {/* --- SIDEBAR (Mini Calendar) --- */}
            <div className="w-[280px] bg-[#18181b] border-r border-[#27272a] flex flex-col p-6 shrink-0">
                {/* Header (Year) */}
                <div className="flex justify-between items-center mb-6">
                    <button onClick={() => setViewDate(new Date(viewDate.setMonth(viewDate.getMonth() - 1)))} className="p-1 hover:bg-slate-800 rounded text-slate-400"><ChevronLeft size={16}/></button>
                    <span className="font-bold text-sm text-white">{viewDate.toLocaleString('default', { month: 'long', year: 'numeric' })}</span>
                    <button onClick={() => setViewDate(new Date(viewDate.setMonth(viewDate.getMonth() + 1)))} className="p-1 hover:bg-slate-800 rounded text-slate-400"><ChevronRight size={16}/></button>
                </div>

                {/* Mini Grid */}
                <div className="grid grid-cols-7 gap-y-2 text-center text-[10px] text-slate-500 font-bold mb-2">
                    {['S','M','T','W','T','F','S'].map(d => <span key={d}>{d}</span>)}
                </div>
                <div className="grid grid-cols-7 gap-y-1 justify-items-center mb-8">
                    {renderMiniCalendar()}
                </div>

                {/* Calendars List */}
                <div className="space-y-6 overflow-y-auto custom-scrollbar flex-1 pr-2">
                    <div>
                        <div className="flex justify-between items-center mb-2 cursor-pointer group">
                            <span className="text-xs font-bold text-slate-300">My calendars</span>
                            <ChevronDown size={14} className="text-slate-500 group-hover:text-white" />
                        </div>
                        <div className="space-y-2">
                            <label className="flex items-center gap-2 text-xs text-slate-400 cursor-pointer hover:text-white group">
                                <div className="w-4 h-4 rounded bg-pink-500 flex items-center justify-center border border-pink-600"><Check size={10} className="text-white"/></div>
                                {currentUser?.name || 'User'}
                            </label>
                            <label 
                                className="flex items-center gap-2 text-xs text-slate-400 cursor-pointer hover:text-white group"
                                onClick={() => handleTimeSlotClick(9)}
                            >
                                <Plus size={14} className="text-slate-500 group-hover:text-teal-500"/> <span className="group-hover:text-teal-500 transition-colors">Add new</span>
                            </label>
                        </div>
                    </div>

                    <div>
                        <div className="flex justify-between items-center mb-2 cursor-pointer group">
                            <span className="text-xs font-bold text-slate-300">Vet Calendars</span>
                            <ChevronDown size={14} className="text-slate-500 group-hover:text-white" />
                        </div>
                        <div className="space-y-2">
                            <label className="flex items-center gap-2 text-xs text-slate-400 cursor-pointer hover:text-white">
                                <div className="w-4 h-4 rounded border border-purple-500 flex items-center justify-center bg-purple-500/20"><Check size={10} className="text-purple-500"/></div>
                                Allocations
                            </label>
                            <label className="flex items-center gap-2 text-xs text-slate-400 cursor-pointer hover:text-white">
                                <div className="w-4 h-4 rounded border border-orange-500 flex items-center justify-center bg-orange-500/20"><Check size={10} className="text-orange-500"/></div>
                                Reviews
                            </label>
                            <label className="flex items-center gap-2 text-xs text-slate-400 cursor-pointer hover:text-white">
                                <div className="w-4 h-4 rounded border border-emerald-500 flex items-center justify-center bg-emerald-500/20"><Check size={10} className="text-emerald-500"/></div>
                                Completions
                            </label>
                        </div>
                    </div>

                    {/* Placeholder Accordions */}
                    <div>
                        <div className="flex justify-between items-center mb-2 cursor-pointer group opacity-50 hover:opacity-100 transition-opacity">
                            <span className="text-xs font-bold text-slate-300">Staff</span>
                            <ChevronDown size={14} className="text-slate-500" />
                        </div>
                    </div>
                    <div>
                        <div className="flex justify-between items-center mb-2 cursor-pointer group opacity-50 hover:opacity-100 transition-opacity">
                            <span className="text-xs font-bold text-slate-300">Departments</span>
                            <ChevronDown size={14} className="text-slate-500" />
                        </div>
                    </div>
                </div>
            </div>

            {/* --- MAIN CONTENT (Day View) --- */}
            <div className="flex-1 flex flex-col bg-[#09090b]">
                {/* Top Bar */}
                <div 
                    className="h-16 border-b border-[#27272a] flex items-center justify-between px-6 cursor-grab active:cursor-grabbing select-none bg-[#09090b]"
                    onMouseDown={handleMouseDown}
                >
                    <div className="flex items-center gap-4">
                        <button onClick={() => setViewDate(new Date())} className="px-3 py-1.5 border border-slate-700 rounded-lg text-xs font-bold text-white hover:bg-slate-800 transition-colors">
                            Today
                        </button>
                        <div className="flex items-center gap-2">
                            <button onClick={() => setSelectedDate(new Date(new Date(selectedDate).setDate(new Date(selectedDate).getDate() - 1)).toISOString().split('T')[0])}><ChevronLeft size={16} className="text-slate-400"/></button>
                            <h2 className="text-lg font-bold text-white min-w-[140px] text-center">
                                {displayDate.toLocaleString('default', { month: 'long', day: 'numeric', year: 'numeric' })}
                            </h2>
                            <button onClick={() => setSelectedDate(new Date(new Date(selectedDate).setDate(new Date(selectedDate).getDate() + 1)).toISOString().split('T')[0])}><ChevronRight size={16} className="text-slate-400"/></button>
                        </div>
                        <span className="px-2 py-1 bg-blue-500/10 text-blue-400 text-[10px] font-bold rounded">KW {Math.ceil(displayDate.getDate() / 7)}</span>
                    </div>

                    <div className="flex items-center gap-2">
                        <button onClick={() => setIsCalendarExpanded(!isCalendarExpanded)} className="p-2 hover:bg-[#27272a] rounded-full text-slate-400 hover:text-white transition-colors">
                            {isCalendarExpanded ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
                        </button>
                        <button onClick={() => setIsCalendarOpen(false)} className="p-2 hover:bg-red-900/30 hover:text-red-400 rounded-full text-slate-400 transition-colors">
                            <X size={18} />
                        </button>
                    </div>
                </div>

                {/* Day Agenda Grid */}
                <div className="flex-1 overflow-y-auto custom-scrollbar relative p-4">
                    {/* Time Lines */}
                    {Array.from({ length: 11 }).map((_, i) => {
                        const hour = i + 8; // 8 AM to 6 PM
                        return (
                            <div key={hour} className="flex relative min-h-[80px] group" onClick={() => handleTimeSlotClick(hour)}>
                                <div className="w-16 text-right pr-4 text-xs font-medium text-slate-500 -mt-2">
                                    {hour > 12 ? `${hour - 12} PM` : `${hour} AM`}
                                </div>
                                <div className="flex-1 border-t border-[#27272a] group-hover:bg-slate-900/50 transition-colors cursor-pointer relative">
                                    {/* Invisible Add Button on Hover */}
                                    <div className="absolute inset-0 opacity-0 group-hover:opacity-100 flex items-center justify-center pointer-events-none">
                                        <Plus size={16} className="text-slate-600" />
                                    </div>
                                </div>
                            </div>
                        );
                    })}

                    {/* Red Line (Current Time - Mocked to 11 AMish visually or real time) */}
                    <div className="absolute top-[260px] left-16 right-0 h-px bg-red-500 z-10 flex items-center shadow-[0_0_8px_rgba(239,68,68,0.5)]">
                        <div className="w-2 h-2 rounded-full bg-red-500 -ml-1"></div>
                    </div>

                    {/* Events Layer */}
                    <div className="absolute top-4 left-16 right-4 bottom-0 pointer-events-none">
                        {/* Static Example Banner for "Today's Focus" if day is today */}
                        {selectedDate === today.toISOString().split('T')[0] && (
                            <div 
                                className="absolute top-0 left-0 right-0 h-6 bg-emerald-600 text-white text-[10px] font-bold px-3 flex items-center rounded-sm z-20 mx-1 shadow-md cursor-pointer pointer-events-auto hover:brightness-110"
                                onClick={() => alert("Ascension Day: Focus on Critical Deadlines")}
                            >
                                Today's Focus: Critical Deadlines
                            </div>
                        )}

                        {dayEvents.map((evt) => {
                            const styles = getAgendaCardStyle(evt.type);
                            // Positioning Logic based on mockTime (8:00 = 0px top, 80px per hour)
                            const [h, m] = (evt.mockTime || '09:00').split(':').map(Number);
                            const top = ((h - 8) * 80) + ((m / 60) * 80);
                            const height = (evt.mockDuration || 1) * 80;

                            return (
                                <div 
                                    key={evt.id}
                                    className={`absolute left-0 right-0 m-1 p-3 rounded-lg border-l-4 pointer-events-auto cursor-pointer hover:brightness-110 transition-all shadow-sm ${styles.bg} ${styles.border}`}
                                    style={{ top: `${top}px`, height: `${height - 4}px`, width: '95%', zIndex: 15 }}
                                    title={`${evt.type}: ${evt.projectName}`}
                                    onClick={() => alert(`Event: ${evt.projectName}\n${evt.description}`)}
                                >
                                    <div className="flex justify-between items-start h-full">
                                        <div className="flex flex-col h-full justify-center min-w-0">
                                            <h4 className="text-xs font-bold text-white truncate w-full">{evt.clientName} • {evt.projectName}</h4>
                                            <p className={`text-[10px] ${styles.text} truncate`}>{evt.mockTime} - {evt.description}</p>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>
        </div>
      );
  };

  return (
    <div className="h-full flex flex-col bg-white dark:bg-slate-900 border-l border-slate-200 dark:border-slate-800 shadow-xl transition-colors duration-300">
      {/* Tabs Header */}
      <div className="flex border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50">
        <div className={`flex-1 relative flex items-center justify-center transition-colors ${activeTab === 'calendar' ? 'bg-white dark:bg-slate-800/50' : ''}`}>
            <button 
                onClick={() => setActiveTab('calendar')}
                className={`flex-1 py-4 text-sm font-bold text-center border-b-2 flex items-center justify-center gap-2 ${activeTab === 'calendar' ? 'border-teal-500 text-teal-600 dark:text-teal-400' : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}
            >
                <Calendar size={14} /> Calendar
            </button>
            {activeTab === 'calendar' && (
                <button 
                    onClick={() => setIsCalendarOpen(true)}
                    className="absolute right-3 p-1.5 text-slate-400 hover:text-teal-600 dark:hover:text-teal-400 hover:bg-slate-100 dark:hover:bg-slate-700 rounded transition-colors"
                    title="Maximize Calendar"
                >
                    <Maximize2 size={14} />
                </button>
            )}
        </div>
        <button 
            onClick={() => setActiveTab('notifications')}
            className={`flex-1 py-4 text-sm font-bold text-center border-b-2 transition-colors flex items-center justify-center gap-2 ${activeTab === 'notifications' ? 'border-teal-500 text-teal-600 dark:text-teal-400 bg-white dark:bg-slate-800/50' : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}
        >
            <Bell size={14} /> Notifications
            {notifications.some(n => n.type === 'urgent') && (
                <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></span>
            )}
        </button>
      </div>

      {/* Content Area */}
      <div className="flex-1 overflow-y-auto custom-scrollbar p-4 space-y-6">
        
        {/* Notifications Tab */}
        {activeTab === 'notifications' && (
            <div className="space-y-3 animate-in fade-in slide-in-from-top-2">
                {notifications.length === 0 ? (
                    <div className="text-center py-8">
                        <Bell className="mx-auto mb-2 text-slate-400 dark:text-slate-600" />
                        <p className="text-sm text-slate-500">No new notifications</p>
                    </div>
                ) : (
                    notifications.map((n, i) => (
                        <div key={i} className={`p-3 rounded-lg border hover:shadow-md transition-all cursor-pointer group relative overflow-hidden ${n.type === 'urgent' ? 'bg-red-50 dark:bg-red-900/10 border-red-200 dark:border-red-900/30' : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700'}`}>
                            {n.type === 'urgent' && <div className="absolute left-0 top-0 bottom-0 w-1 bg-red-500"></div>}
                            <div className="flex justify-between items-start mb-1 pl-2">
                                <h4 className={`text-sm font-bold ${n.type === 'urgent' ? 'text-red-600 dark:text-red-400' : 'text-slate-800 dark:text-slate-300'}`}>{n.title}</h4>
                                <span className="text-[10px] text-slate-500">{n.time}</span>
                            </div>
                            <p className="text-xs text-slate-500 dark:text-slate-400 leading-snug pl-2 mb-2">{n.desc}</p>
                            {n.action && (
                                <div className="pl-2">
                                    <button className="px-3 py-1 bg-red-600 text-white text-xs font-bold rounded-md hover:bg-red-700 transition-colors shadow-sm flex items-center gap-1">
                                        {n.action} Now <ArrowRight size={10} />
                                    </button>
                                </div>
                            )}
                        </div>
                    ))
                )}
                <button className="w-full py-2 text-xs font-bold text-slate-500 hover:text-teal-600 dark:hover:text-teal-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded transition-colors">
                    View All History
                </button>
            </div>
        )}

        {/* Calendar Tab (Sidebar Widget) */}
        {activeTab === 'calendar' && (
            <div className="space-y-4 animate-in fade-in slide-in-from-top-2">
                 <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 text-center shadow-sm dark:shadow-lg">
                     <div className="flex justify-between items-center mb-4 px-2">
                        <p className="text-sm font-bold text-slate-800 dark:text-slate-300 uppercase tracking-wider">
                            {new Date(currentYear, currentMonth).toLocaleString('default', { month: 'long', year: 'numeric' })}
                        </p>
                        <div className="flex gap-1">
                             <span className="w-2 h-2 rounded-full bg-orange-500"></span>
                             <span className="text-[10px] text-slate-500">Event</span>
                        </div>
                     </div>
                     <div className="grid grid-cols-7 gap-1 text-[10px] text-slate-500 font-bold mb-2 uppercase">
                         <span>Su</span><span>Mo</span><span>Tu</span><span>We</span><span>Th</span><span>Fr</span><span>Sa</span>
                     </div>
                     <div className="grid grid-cols-7 gap-2 text-sm font-medium text-slate-600 dark:text-slate-400">
                         {generateCalendarDays()}
                     </div>
                 </div>

                 {/* Events List for Selected Date */}
                 <div className="space-y-2">
                     <div className="flex items-center justify-between mb-2">
                        <p className="text-xs font-bold text-slate-500 uppercase">Events for {selectedDate}</p>
                        <span className="px-2 py-0.5 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 text-[10px] rounded-full font-bold border border-slate-200 dark:border-slate-700">
                            {getEventsForDate(selectedDate).length}
                        </span>
                     </div>
                     
                     {getEventsForDate(selectedDate).length === 0 ? (
                         <div className="p-4 border border-dashed border-slate-200 dark:border-slate-800 rounded-lg text-center bg-slate-50 dark:bg-slate-900">
                             <p className="text-xs text-slate-500 dark:text-slate-600">No events scheduled.</p>
                         </div>
                     ) : (
                        <div className="space-y-2">
                            {getEventsForDate(selectedDate).map((evt) => (
                                <div key={evt.id} className={`flex gap-3 items-center p-3 border rounded-lg transition-colors shadow-sm ${getEventColor(evt.type)}`}>
                                    <div className="p-2 bg-white/50 dark:bg-slate-900/50 rounded-lg">
                                        {getEventIcon(evt.type)}
                                    </div>
                                    <div className="min-w-0">
                                        <div className="flex items-center gap-2">
                                            <span className="text-[10px] font-bold uppercase tracking-wider opacity-75">
                                                {evt.type}
                                            </span>
                                        </div>
                                        <p className="text-xs font-bold truncate text-slate-800 dark:text-slate-200">{evt.projectName}</p>
                                        <p className="text-[10px] opacity-80 mt-0.5 truncate">{evt.description}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                     )}
                 </div>
            </div>
        )}
      </div>

      {/* FLOATING CALENDAR WINDOW - PORTAL */}
      {isCalendarOpen && createPortal(
          <FloatingCalendar />,
          document.body
      )}

      {/* Smart Widgets (Bottom) */}
      <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900">
          <p className="text-xs font-bold text-slate-500 uppercase mb-3 flex items-center gap-1">
            <Clock size={12} /> Smart Shortcuts
          </p>
          <div className="grid grid-cols-1 gap-2">
              {smartWidgets.map((w, i) => (
                  <div key={i} className="flex items-center justify-between p-2 bg-white dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-lg shadow-sm hover:border-teal-500/30 transition-all cursor-pointer group">
                      <div className="flex items-center gap-3">
                          <div className={`p-1.5 rounded ${w.bg}`}>
                              <w.icon size={16} className={w.color} />
                          </div>
                          <span className="text-xs font-bold text-slate-700 dark:text-slate-300 group-hover:text-black dark:group-hover:text-white">{w.title}</span>
                      </div>
                      <span className={`text-xs font-bold ${w.color} bg-slate-50 dark:bg-slate-900 px-2 py-0.5 rounded border border-slate-200 dark:border-slate-800`}>{w.value}</span>
                  </div>
              ))}
          </div>
      </div>
    </div>
  );
};
