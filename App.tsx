
import React, { useState, useEffect, useMemo } from 'react';
import { Layout } from './components/Layout';
import { Dashboard } from './components/Dashboard';
import { ProjectTable } from './components/ProjectTable';
import { ProjectDetailPanel } from './components/ProjectDetailPanel';
import { WeeklyReport } from './components/WeeklyReport';
import { TeamStats } from './components/TeamStats';
import { Clients } from './components/Clients';
import { Chatbot } from './components/Chatbot';
import { Settings } from './components/Settings';
import { Login } from './components/Login';
import { AccessManagement } from './components/AccessManagement';
import { Portals } from './components/Portals'; 
import { Templates } from './components/Templates';
import { RecycleBin } from './components/RecycleBin'; 
import { Goals } from './components/Goals'; 
import { Project, TeamMember, FieldDefinition, DocTemplate, Notification, CalendarEvent } from './types';
import { Filter, Plus, Loader2, X, Search, ChevronLeft } from 'lucide-react';
import { api } from './services/api';
import { DEFAULT_FIELDS, DEFAULT_TEMPLATES } from './constants';

const App: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<TeamMember | null>(null);
  const [currentView, setCurrentView] = useState('dashboard');
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [calendarEvents, setCalendarEvents] = useState<CalendarEvent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [theme, setTheme] = useState<'light' | 'dark'>('dark');
  const [companyLogo, setCompanyLogo] = useState<string | null>(null);

  // Dynamic Fields & Templates State
  const [customFields, setCustomFields] = useState<FieldDefinition[]>(DEFAULT_FIELDS);
  const [docTemplates, setDocTemplates] = useState<DocTemplate[]>(DEFAULT_TEMPLATES);

  // Filtering State
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('');
  const [filterService, setFilterService] = useState<string>('');
  const [filterAssignee, setFilterAssignee] = useState<string>('');
  const [filterTimerStatus, setFilterTimerStatus] = useState<string>(''); 
  const [filterPaymentStatus, setFilterPaymentStatus] = useState<string>('');
  const [showFilters, setShowFilters] = useState(false);

  // Initialize Theme
  useEffect(() => {
    const savedTheme = localStorage.getItem('theme') as 'light' | 'dark' | null;
    if (savedTheme) {
        setTheme(savedTheme);
        document.documentElement.classList.toggle('dark', savedTheme === 'dark');
    } else {
        document.documentElement.classList.add('dark');
        setTheme('dark');
    }
  }, []);

  const toggleTheme = () => {
      const newTheme = theme === 'dark' ? 'light' : 'dark';
      setTheme(newTheme);
      localStorage.setItem('theme', newTheme);
      document.documentElement.classList.toggle('dark', newTheme === 'dark');
  };

  // Initialize API and Fetch Data
  useEffect(() => {
    const initData = async () => {
      api.init(); // Run backend triggers
      try {
        const [fetchedProjects, fetchedMembers, fetchedLogo, fetchedEvents] = await Promise.all([
          api.fetchProjects(),
          api.fetchMembers(),
          api.fetchCompanyLogo(),
          api.fetchCalendarEvents()
        ]);
        setProjects(fetchedProjects);
        setMembers(fetchedMembers);
        setCompanyLogo(fetchedLogo);
        setCalendarEvents(fetchedEvents);
        setNotifications(api.getNotifications());
      } catch (error) {
        console.error("Failed to load data", error);
      } finally {
        setIsLoading(false);
      }
    };

    initData();
  }, []);

  const uniqueStatuses = useMemo(() => Array.from(new Set(projects.map(p => p.status))), [projects]);
  const uniqueServices = useMemo(() => Array.from(new Set(projects.map(p => p.serviceType))), [projects]);
  
  const filteredProjects = useMemo(() => {
      return projects.filter(p => {
          // EXCLUDE DELETED PROJECTS FROM MAIN VIEW
          if (p.isDeleted) return false;

          // ROLE BASED ACCESS CONTROL FOR AUDITORS
          if (currentUser && currentUser.role === 'Auditor' && p.assignedTo !== currentUser.id) {
              return false;
          }

          const matchSearch = searchQuery ? (
              p.clientName.toLowerCase().includes(searchQuery.toLowerCase()) || 
              p.projectName.toLowerCase().includes(searchQuery.toLowerCase())
          ) : true;
          const matchStatus = filterStatus ? p.status === filterStatus : true;
          const matchService = filterService ? p.serviceType === filterService : true;
          const matchAssignee = filterAssignee ? p.assignedTo === filterAssignee : true;
          const matchTimer = filterTimerStatus ? p.timerStatus === filterTimerStatus : true;
          const matchPayment = filterPaymentStatus ? p.paymentStatus === filterPaymentStatus : true;
          
          return matchSearch && matchStatus && matchService && matchAssignee && matchTimer && matchPayment;
      });
  }, [projects, searchQuery, filterStatus, filterService, filterAssignee, filterTimerStatus, filterPaymentStatus, currentUser]);

  const handleLogin = (user: TeamMember) => {
    setCurrentUser(user);
    setCurrentView('dashboard');
  };

  const handleLogout = () => {
    setCurrentUser(null);
  };

  const handleProjectClick = (project: Project) => {
    setSelectedProject(project);
    setCurrentView('projects'); 
  };

  const handleOpenProjectById = (projectId: string) => {
      const project = projects.find(p => p.id === projectId);
      if (project) {
          setSelectedProject(project);
          if (currentView !== 'projects') setCurrentView('projects');
      }
  };

  const handleUpdateMember = async (updatedMember: TeamMember) => {
    setMembers(prev => prev.map(m => m.id === updatedMember.id ? updatedMember : m));
    await api.updateMember(updatedMember);
  };

  const handleAddMember = async (newMember: TeamMember) => {
    setMembers(prev => [...prev, newMember]);
    await api.addMember(newMember);
  };

  const handleDeleteMember = async (memberId: string) => {
    setMembers(prev => prev.filter(m => m.id !== memberId));
    await api.deleteMember(memberId);
  };
  
  const handleImportProjects = async (newProjects: Project[]) => {
    setProjects(newProjects);
    await api.importProjects(newProjects);
  };

  const handleUpdateProject = async (updatedProject: Project, remarks?: string) => {
    try {
        if (!currentUser) return;
        // The API now handles permission checks and logging
        await api.updateProject(updatedProject, currentUser, remarks);
        
        // Update local state if successful
        setProjects(prev => prev.map(p => p.id === updatedProject.id ? updatedProject : p));
        if (selectedProject && selectedProject.id === updatedProject.id) {
            setSelectedProject(updatedProject);
        }
    } catch (e: any) {
        alert(e.message); // Show permission/validation errors
    }
  };

  // --- RECYCLE BIN ACTIONS ---
  const handleRestoreProject = async (project: Project) => {
      const restored = { ...project, isDeleted: false, deletedAt: undefined, deletedBy: undefined };
      // Passing currentUser to log this action
      if (currentUser) await api.updateProject(restored, currentUser, "Restored from Recycle Bin");
      setProjects(prev => prev.map(p => p.id === restored.id ? restored : p));
  };

  const handlePermanentDelete = async (id: string) => {
      // In this mock, permanent delete removes from array. Real backend would purge DB.
      setProjects(prev => prev.filter(p => p.id !== id));
  };

  const handleAddProject = async (newProject: Project) => {
    if (!currentUser) return;
    let finalProject = { ...newProject };
    if (finalProject.assignedTo === 't5') {
        const sortedMembers = [...members].sort((a, b) => a.activeProjects - b.activeProjects);
        if (sortedMembers.length > 0) {
            finalProject.assignedTo = sortedMembers[0].id;
            finalProject.assignmentMode = 'Round-Robin';
        }
    }
    setProjects(prev => [finalProject, ...prev]);
    await api.createProject(finalProject, currentUser);
  };

  const handleUpdateClient = async (originalName: string, updatedDetails: Partial<Project>) => {
    const updatedProjectsList = projects.map(p => {
        if (p.clientName === originalName) {
            return {
                ...p,
                clientName: updatedDetails.clientName || p.clientName,
                contactPerson: updatedDetails.contactPerson || p.contactPerson,
                email: updatedDetails.email || p.email,
                phone: updatedDetails.phone || p.phone,
                clientType: updatedDetails.clientType || p.clientType,
            };
        }
        return p;
    });
    setProjects(updatedProjectsList);
    await api.importProjects(updatedProjectsList); 
  };

  const handleSearchSelect = (type: 'project' | 'client' | 'member' | 'page', id: string) => {
      if (type === 'page') {
          setCurrentView(id);
      } else if (type === 'project') {
          const proj = projects.find(p => p.id === id);
          if (proj) {
              setCurrentView('projects');
              setSelectedProject(proj);
          }
      } else if (type === 'client') {
          setCurrentView('clients');
      } else if (type === 'member') {
          setCurrentView('team');
      }
  };

  const handleStatClick = (filterType: string) => {
      if (filterType === 'Late') {
          setFilterTimerStatus('Late');
          setCurrentView('projects');
          setShowFilters(true);
      }
  };

  const handleUpdateLogo = async (logo: string | null) => {
      setCompanyLogo(logo);
      await api.updateCompanyLogo(logo);
  };

  // --- CALENDAR ACTIONS ---
  const handleAddCalendarEvent = async (event: CalendarEvent) => {
      setCalendarEvents(prev => [...prev, event]);
      await api.createCalendarEvent(event);
  };

  if (isLoading) {
      return (
          <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center transition-colors duration-300">
              <div className="text-center text-teal-600 dark:text-teal-500">
                  <Loader2 size={40} className="animate-spin mx-auto mb-4" />
                  <p className="text-slate-600 dark:text-slate-400 font-medium">Loading Assist+ Dashboard...</p>
              </div>
          </div>
      );
  }

  if (!currentUser) {
    return <Login onLogin={handleLogin} theme={theme} onToggleTheme={toggleTheme} companyLogo={companyLogo} />;
  }

  const renderProjectsView = () => {
      return (
          <div className="flex h-full gap-0 overflow-hidden">
              {/* Left Panel: Project List */}
              <div 
                className={`flex flex-col transition-all duration-300 ease-in-out border-r border-slate-200 dark:border-slate-800 ${
                    selectedProject ? 'w-[40%] min-w-[350px] border-r-2 border-slate-300 dark:border-slate-700' : 'w-full'
                }`}
              >
                  {/* Top Bar for List */}
                  <div className="p-4 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex flex-col gap-3">
                      <div className="flex justify-between items-center">
                          <h2 className="text-lg font-bold text-slate-800 dark:text-white">All Projects</h2>
                          {!selectedProject && (
                              <button 
                                  onClick={() => {
                                      const newProj: Project = {
                                          id: `p-${Date.now()}`,
                                          clientName: 'New Client Project',
                                          clientType: 'Company',
                                          projectName: 'New Audit',
                                          serviceType: 'Audit',
                                          amount: 0,
                                          status: 'Lead',
                                          proposalSent: false,
                                          proposalSigned: false,
                                          paymentStatus: 'Not Sent',
                                          paymentProofReceived: false,
                                          contractSigned: false,
                                          icdReceived: false,
                                          startDate: new Date().toISOString().split('T')[0],
                                          assignedDate: '',
                                          targetDeadline: '',
                                          completionDate: '',
                                          expiryDate: '',
                                          promisedDays: '5-8 days',
                                          daysElapsed: 0,
                                          timerStatus: 'On Track',
                                          assignedTo: 't5',
                                          assignmentMode: 'Manual',
                                          activityLog: [{ date: new Date().toISOString().split('T')[0], action: 'Project Created', user: currentUser.name }],
                                          contactPerson: '',
                                          email: '',
                                          phone: ''
                                      };
                                      handleAddProject(newProj);
                                      setSelectedProject(newProj);
                                  }}
                                  className="flex items-center gap-1 px-3 py-1.5 bg-teal-600 text-white rounded-lg text-xs font-medium hover:bg-teal-700 whitespace-nowrap"
                              >
                                  <Plus size={14} /> New Project
                              </button>
                          )}
                      </div>
                      
                      <div className="flex gap-2">
                          <div className="relative flex-1">
                              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
                              <input 
                                  type="text"
                                  placeholder="Search projects..."
                                  value={searchQuery}
                                  onChange={(e) => setSearchQuery(e.target.value)}
                                  className="w-full pl-9 pr-3 py-2 border border-slate-200 dark:border-slate-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                              />
                          </div>
                          <button 
                              onClick={() => setShowFilters(!showFilters)}
                              className={`flex items-center justify-center gap-2 px-3 py-2 border rounded-lg text-xs transition-colors ${showFilters ? 'bg-teal-50 border-teal-200 text-teal-700 dark:bg-teal-900/30 dark:border-teal-800 dark:text-teal-400' : 'bg-white border-slate-300 text-slate-600 hover:bg-slate-50 dark:bg-slate-900 dark:border-slate-700 dark:text-slate-400 dark:hover:bg-slate-800'}`}
                          >
                              <Filter size={14} />
                          </button>
                      </div>
                  </div>

                  {/* Filters Panel */}
                  {showFilters && (
                      <div className="p-4 bg-slate-50 dark:bg-slate-900/50 border-b border-slate-200 dark:border-slate-800 grid grid-cols-2 gap-3">
                          {[
                              { label: 'Status', value: filterStatus, setter: setFilterStatus, options: uniqueStatuses },
                              { label: 'Service', value: filterService, setter: setFilterService, options: uniqueServices },
                              { label: 'Payment', value: filterPaymentStatus, setter: setFilterPaymentStatus, options: ['Pending', 'Partially Paid', 'Paid', 'Not Sent'] },
                              { label: 'Assignee', value: filterAssignee, setter: setFilterAssignee, options: members.map(m => ({ val: m.id, txt: m.name })) },
                              { label: 'Timer', value: filterTimerStatus, setter: setFilterTimerStatus, options: ['On Track', 'At Risk', 'Late'] }
                          ].map((filter, i) => (
                              <div key={i}>
                                  <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">{filter.label}</label>
                                  <select 
                                      value={filter.value} 
                                      onChange={(e) => filter.setter(e.target.value)}
                                      className="w-full p-1.5 border border-slate-300 dark:border-slate-700 rounded text-xs bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-200"
                                  >
                                      <option value="">All</option>
                                      {filter.options.map((opt: any) => {
                                          const val = typeof opt === 'string' ? opt : opt.val;
                                          const txt = typeof opt === 'string' ? opt : opt.txt;
                                          return <option key={val} value={val}>{txt}</option>;
                                      })}
                                  </select>
                              </div>
                          ))}
                          <div className="flex items-end col-span-full justify-end">
                              <button 
                                  onClick={() => { setSearchQuery(''); setFilterStatus(''); setFilterService(''); setFilterAssignee(''); setFilterTimerStatus(''); setFilterPaymentStatus(''); }}
                                  className="text-xs text-red-500 hover:text-red-700 flex items-center gap-1"
                              >
                                  <X size={12} /> Clear
                              </button>
                          </div>
                      </div>
                  )}

                  {/* Project List Component */}
                  <div className="flex-1 overflow-hidden">
                      <ProjectTable 
                          projects={filteredProjects} 
                          onProjectClick={handleProjectClick} 
                          members={members}
                          compact={!!selectedProject} 
                          selectedId={selectedProject?.id}
                      />
                  </div>
              </div>

              {/* Right Panel: Detail View */}
              {selectedProject && (
                  <div className="flex-1 flex flex-col h-full bg-[#050505] overflow-hidden animate-in fade-in slide-in-from-right-4 duration-300 border-l border-slate-800">
                      <ProjectDetailPanel 
                          project={selectedProject} 
                          onClose={() => setSelectedProject(null)} 
                          members={members}
                          onUpdateProject={handleUpdateProject}
                          customFields={customFields}
                          templates={docTemplates}
                          currentUser={currentUser} // Pass currentUser for permission logic
                      />
                  </div>
              )}
          </div>
      );
  };

  const renderContent = () => {
    switch (currentView) {
      case 'dashboard':
        return <Dashboard projects={filteredProjects} members={members} onStatClick={handleStatClick} theme={theme} />;
      case 'projects':
        return renderProjectsView();
      case 'summary':
        return <WeeklyReport projects={filteredProjects} />;
      case 'team':
        return <TeamStats members={members} projects={filteredProjects} onUpdateMember={handleUpdateMember} currentUserRole={currentUser.role} />;
      case 'clients':
        return (
            <Clients 
                projects={filteredProjects} 
                onAddProject={handleAddProject} 
                onUpdateClient={handleUpdateClient} 
                currentUser={currentUser}
                onProjectClick={handleProjectClick}
            />
        );
      case 'portals':
        return <Portals />;
      case 'templates': 
        return <Templates onUpdateFields={setCustomFields} onUpdateTemplates={setDocTemplates} />;
      case 'access':
        if (currentUser.role !== 'Super Admin' && currentUser.role !== 'Admin') {
            return <div className="p-10 text-center text-slate-500">Access Denied</div>;
        }
        return (
            <AccessManagement 
                members={members} 
                onUpdateMember={handleUpdateMember} 
                onAddMember={handleAddMember}
                onDeleteMember={handleDeleteMember}
                onNavigate={handleSearchSelect}
            />
        );
      case 'settings':
        return (
            <Settings 
                projects={filteredProjects} 
                members={members} 
                onImportProjects={handleImportProjects} 
                currentUser={currentUser}
                companyLogo={companyLogo}
                onUpdateLogo={handleUpdateLogo}
            />
        );
      case 'recycle':
        return <RecycleBin projects={projects} onRestore={handleRestoreProject} onPermanentDelete={handlePermanentDelete} currentUser={currentUser} />;
      case 'goals':
        return <Goals currentUser={currentUser} />;
      default:
        return <Dashboard projects={filteredProjects} members={members} onStatClick={handleStatClick} theme={theme} />;
    }
  };

  return (
    <Layout 
        currentView={currentView} 
        setCurrentView={setCurrentView} 
        currentUser={currentUser}
        onLogout={handleLogout}
        projects={projects}
        members={members}
        onSearchSelect={handleSearchSelect}
        theme={theme}
        onToggleTheme={toggleTheme}
        companyLogo={companyLogo}
        notifications={notifications} // Pass real notifications
        calendarEvents={calendarEvents} // Pass real calendar events
        onAddEvent={handleAddCalendarEvent} // Pass event creator
    >
      {renderContent()}
      
      <Chatbot 
        projects={filteredProjects} 
        members={members} 
        onUpdateProject={handleUpdateProject}
        onOpenProject={handleOpenProjectById}
      />
    </Layout>
  );
};

export default App;
