
import React, { useState, useEffect } from 'react';
import { Project, TeamMember, Status, FieldDefinition, DocTemplate } from '../types';
import { X, Clock, Edit2, Calendar, Video, Plus, Link as LinkIcon, MoreHorizontal, FileVideo, Send, Image as ImageIcon, ExternalLink, CheckCircle, AlertOctagon, UserCheck } from 'lucide-react';
import { IntercomForm } from './IntercomForm';

interface ProjectDetailPanelProps {
  project: Project | null;
  onClose: () => void;
  members: TeamMember[];
  onUpdateProject: (project: Project, remarks?: string) => void;
  customFields?: FieldDefinition[]; 
  templates?: DocTemplate[]; 
  currentUser?: TeamMember;
}

export const ProjectDetailPanel: React.FC<ProjectDetailPanelProps> = ({ 
    project, 
    onClose, 
    members, 
    onUpdateProject,
    customFields,
    templates,
    currentUser
}) => {
  const [activeTab, setActiveTab] = useState<'Overview' | 'Intercom' | 'Documents' | 'ICV & Compliance' | 'History'>('Overview');
  const [remarks, setRemarks] = useState('');
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [targetStatus, setTargetStatus] = useState<Status | null>(null);

  // --- Local State for New Features ---
  const [notes, setNotes] = useState([
      { id: 1, content: 'Client requires the initial draft by Monday.', type: 'text', date: '2 days ago' },
      { id: 2, content: 'Site inspection walkthrough.', type: 'video', date: 'Yesterday' }
  ]);
  const [newNote, setNewNote] = useState('');

  const handleAddNote = () => {
      if (!newNote.trim()) return;
      setNotes(prev => [...prev, { id: Date.now(), content: newNote, type: 'text', date: 'Just now' }]);
      setNewNote('');
  };

  const handleAddVideoNote = () => {
      // Simulation of adding a video note
      const titles = ['Screen recording', 'Walkthrough', 'Feedback clip'];
      setNotes(prev => [...prev, { 
          id: Date.now(), 
          content: `${titles[Math.floor(Math.random() * titles.length)]} - ${new Date().toLocaleTimeString()}`, 
          type: 'video', 
          date: 'Just now' 
      }]);
  };

  // --- WORKFLOW ACTIONS ---
  const handleWorkflowAction = (action: 'Submit' | 'Approve' | 'Reject' | 'Complete' | 'Cancel') => {
      if (!project || !currentUser) return;

      let newStatus: Status | null = null;

      if (action === 'Submit') newStatus = 'Under Review';
      else if (action === 'Approve') newStatus = 'Review Completed';
      else if (action === 'Complete') newStatus = 'Completed';
      else if (action === 'Reject') newStatus = 'Under Process'; // Send back
      else if (action === 'Cancel') newStatus = 'Cancelled';

      if (newStatus) {
          if (action === 'Reject' || action === 'Cancel') {
              // Open modal for mandatory remarks
              setTargetStatus(newStatus);
              setRemarks(''); // Clear previous remarks
              setShowRejectModal(true);
          } else {
              onUpdateProject({ ...project, status: newStatus });
          }
      }
  };

  const confirmRejection = () => {
      if (!project || !targetStatus) return;
      if (!remarks.trim()) {
          alert("Validation Error: Remarks are MANDATORY for this action.");
          return;
      }
      onUpdateProject({ ...project, status: targetStatus, remarks: remarks }, remarks);
      setShowRejectModal(false);
      setRemarks('');
  };
  
  if (!project) return null;

  // Determine available actions based on Role & Status
  const canSubmit = currentUser?.role === 'Auditor' && project.status === 'Under Process';
  const canApprove = (currentUser?.role === 'Manager' || currentUser?.role === 'Super Admin') && project.status === 'Under Review';
  const canFinalize = (currentUser?.role === 'Super Admin') && project.status === 'Review Completed';
  const canReject = (currentUser?.role === 'Manager' || currentUser?.role === 'Super Admin') && (project.status === 'Under Review' || project.status === 'Review Completed');

  return (
    <div className="flex flex-col h-full bg-[#09090b] text-white relative">
        
        {/* HEADER */}
        <div className="px-6 py-4 border-b border-slate-800 bg-[#09090b] flex justify-between items-center sticky top-0 z-20">
          <div>
             <div className="flex items-center gap-2 mb-1">
                <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded border ${
                    project.status === 'Under Review' ? 'bg-purple-900/50 text-purple-400 border-purple-700' :
                    project.status === 'Review Completed' ? 'bg-teal-900/50 text-teal-400 border-teal-700' :
                    'bg-slate-800/50 text-slate-500 border-slate-700'
                }`}>{project.status}</span>
                <span className="text-[10px] font-mono text-slate-600">{project.elNumber || '#P001'}</span>
             </div>
             <h2 className="text-xl font-bold text-white leading-tight">{project.clientName}</h2>
             <p className="text-xs text-slate-400">{project.projectName || 'New Client Project'}</p>
          </div>
          <div className="flex items-center gap-3">
              {/* WORKFLOW BUTTONS */}
              {canSubmit && (
                  <button onClick={() => handleWorkflowAction('Submit')} className="flex items-center gap-2 px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-lg transition-colors">
                      <Send size={14} /> Submit for Review
                  </button>
              )}
              {canApprove && (
                  <button onClick={() => handleWorkflowAction('Approve')} className="flex items-center gap-2 px-3 py-1.5 bg-teal-600 hover:bg-teal-500 text-white text-xs font-bold rounded-lg transition-colors">
                      <CheckCircle size={14} /> Approve
                  </button>
              )}
              {canFinalize && (
                  <button onClick={() => handleWorkflowAction('Complete')} className="flex items-center gap-2 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-lg transition-colors">
                      <UserCheck size={14} /> Finalize Project
                  </button>
              )}
              {canReject && (
                  <button onClick={() => handleWorkflowAction('Reject')} className="flex items-center gap-2 px-3 py-1.5 bg-red-600/20 hover:bg-red-600/40 text-red-500 border border-red-900/50 text-xs font-bold rounded-lg transition-colors">
                      <AlertOctagon size={14} /> Reject
                  </button>
              )}

              <button onClick={onClose} className="p-2 hover:bg-slate-800 rounded-full text-slate-400 hover:text-white transition-colors">
                 <X size={20} />
              </button>
          </div>
        </div>

        {/* NAVIGATION TABS */}
        <div className="px-6 border-b border-slate-800 bg-[#09090b] flex gap-6 overflow-x-auto sticky top-[80px] z-10">
           {['Overview', 'Intercom', 'Documents', 'ICV & Compliance', 'History'].map(tab => (
               <button 
                  key={tab}
                  onClick={() => setActiveTab(tab as any)}
                  className={`py-3 text-xs font-bold border-b-2 transition-all whitespace-nowrap uppercase tracking-wide ${activeTab === tab ? 'border-teal-500 text-teal-500' : 'border-transparent text-slate-500 hover:text-slate-300'}`}
               >
                   {tab}
               </button>
           ))}
        </div>

        {/* MAIN CONTENT */}
        <div className="flex-1 overflow-y-auto custom-scrollbar p-6">
            
            {/* --- OVERVIEW TAB --- */}
            {activeTab === 'Overview' && (
                <div className="space-y-6 max-w-4xl mx-auto">
                    
                    {/* Life Timer */}
                    <div className="bg-[#0f1012] border border-slate-800 rounded-lg p-4 flex items-center justify-between shadow-sm relative overflow-hidden group">
                        <div className="absolute left-0 top-0 bottom-0 w-1 bg-emerald-500"></div>
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-emerald-500/10 rounded-full text-emerald-500">
                                <Clock size={20} />
                            </div>
                            <div>
                                <p className="text-[10px] font-bold text-emerald-500 uppercase tracking-wider">Life Timer</p>
                                <div className="flex items-baseline gap-2">
                                    <h3 className="text-2xl font-bold text-white">Day {project.daysElapsed}</h3>
                                    <span className="text-xs text-slate-500">elapsed</span>
                                </div>
                            </div>
                        </div>
                        <span className="px-3 py-1 bg-emerald-900/30 text-emerald-400 text-xs font-bold rounded border border-emerald-500/20 uppercase tracking-wider">
                            {project.timerStatus === 'Late' ? 'Overdue' : 'On Track'}
                        </span>
                    </div>

                    {/* NEW SECTION: Notes (Full Width) */}
                    <div className="grid grid-cols-1 gap-6">
                        {/* Notes Card */}
                        <div className="bg-[#0f1012] border border-slate-800 rounded-2xl p-5 flex flex-col h-full">
                            <div className="flex justify-between items-center mb-4">
                                <h3 className="font-bold text-base text-white">Project Notes</h3>
                                <span className="text-xs text-slate-500">{notes.length} notes</span>
                            </div>

                            {/* List Area */}
                            <div className="flex-1 space-y-3 overflow-y-auto max-h-[250px] custom-scrollbar mb-4 pr-1">
                                {notes.map((note) => (
                                    <div key={note.id} className="p-3 bg-[#18181b] rounded-xl border border-slate-800 text-sm group">
                                        <div className="flex items-start gap-3">
                                            <div className={`mt-0.5 p-1.5 rounded-lg ${note.type === 'video' ? 'bg-red-500/10 text-red-500' : 'bg-blue-500/10 text-blue-500'}`}>
                                                {note.type === 'video' ? <FileVideo size={14} /> : <Edit2 size={14} />}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="text-slate-300 leading-relaxed text-xs">{note.content}</p>
                                                <p className="text-[10px] text-slate-600 mt-1">{note.date}</p>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {/* Input Area */}
                            <div className="relative">
                                <input 
                                    type="text" 
                                    placeholder="Add a new note..."
                                    className="w-full bg-[#18181b] border border-slate-800 rounded-xl pl-4 pr-20 py-3 text-xs text-white focus:ring-1 focus:ring-teal-500 outline-none transition-colors"
                                    value={newNote}
                                    onChange={(e) => setNewNote(e.target.value)}
                                    onKeyDown={(e) => e.key === 'Enter' && handleAddNote()}
                                />
                                <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
                                    <button 
                                        onClick={handleAddVideoNote}
                                        className="p-1.5 hover:bg-slate-700 text-slate-400 hover:text-red-400 rounded-lg transition-colors"
                                        title="Attach Video"
                                    >
                                        <FileVideo size={14} />
                                    </button>
                                    <button 
                                        onClick={handleAddNote}
                                        className="p-1.5 bg-teal-600 text-white rounded-lg hover:bg-teal-500 transition-colors"
                                    >
                                        <Plus size={14} />
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* PROJECT DETAILS */}
                    <div className="bg-[#0f1012] border border-slate-800 rounded-lg p-5">
                        <h3 className="text-xs font-bold text-slate-400 uppercase flex items-center gap-2 mb-4">
                            <span className="w-2 h-2 bg-teal-500 rounded-full"></span> Project Details
                        </h3>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-1">
                                <label className="text-[10px] font-bold text-slate-500 uppercase">ISO Standards</label>
                                <div className="p-2 bg-[#18181b] border border-slate-700 rounded text-xs text-slate-300">
                                    {project.intercomData?.isoStandards?.join(', ') || 'Select...'}
                                </div>
                            </div>
                            <div className="space-y-1">
                                <label className="text-[10px] font-bold text-slate-500 uppercase">Surveillance</label>
                                <div className="p-2 bg-[#18181b] border border-slate-700 rounded text-xs text-slate-300">
                                    {project.intercomData?.surveillance || 'Select...'}
                                </div>
                            </div>
                            <div className="space-y-1">
                                <label className="text-[10px] font-bold text-slate-500 uppercase">Accreditation</label>
                                <div className="p-2 bg-[#18181b] border border-slate-700 rounded text-xs text-slate-300">
                                    {project.intercomData?.accreditation || 'Select...'}
                                </div>
                            </div>
                            <div className="space-y-1">
                                <label className="text-[10px] font-bold text-slate-500 uppercase">Trade License?</label>
                                <div className="p-2 bg-[#18181b] border border-slate-700 rounded text-xs text-slate-300">
                                    {project.intercomData?.hasTradeLicense || 'Select...'}
                                </div>
                            </div>
                            <div className="space-y-1">
                                <label className="text-[10px] font-bold text-slate-500 uppercase">VAT Certificate?</label>
                                <div className="p-2 bg-[#18181b] border border-slate-700 rounded text-xs text-slate-300">
                                    {project.intercomData?.vatCertificate || 'Select...'}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* CLIENT INFO */}
                    <div className="bg-[#0f1012] border border-slate-800 rounded-lg p-5">
                        <h3 className="text-xs font-bold text-slate-400 uppercase flex items-center gap-2 mb-4">
                            <span className="w-2 h-2 bg-blue-500 rounded-full"></span> Client Info
                        </h3>
                        <div className="space-y-1">
                            <label className="text-[10px] font-bold text-slate-500 uppercase">Scope of Work</label>
                            <div className="p-3 bg-[#18181b] border border-slate-700 rounded text-sm text-slate-200">
                                {project.customData?.scope_of_work || project.serviceType}
                            </div>
                        </div>
                    </div>

                    {/* CONSULTANT INFO */}
                    <div className="bg-[#0f1012] border border-slate-800 rounded-lg p-5">
                        <h3 className="text-xs font-bold text-slate-400 uppercase flex items-center gap-2 mb-4">
                            <span className="w-2 h-2 bg-purple-500 rounded-full"></span> Consultant Info
                        </h3>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-1">
                                <label className="text-[10px] font-bold text-slate-500 uppercase">Consultant Name</label>
                                <div className="p-2 bg-[#18181b] border border-slate-700 rounded text-xs text-slate-300">
                                    {project.intercomData?.consultantName || project.customData?.consultant_name || ''}
                                </div>
                            </div>
                            <div className="space-y-1">
                                <label className="text-[10px] font-bold text-slate-500 uppercase">Consultant Mobile</label>
                                <div className="p-2 bg-[#18181b] border border-slate-700 rounded text-xs text-slate-300">
                                    {project.intercomData?.consultantPhone || project.customData?.consultant_mobile || ''}
                                </div>
                            </div>
                            <div className="space-y-1 col-span-2">
                                <label className="text-[10px] font-bold text-slate-500 uppercase">Consultant Type</label>
                                <div className="p-2 bg-[#18181b] border border-slate-700 rounded text-xs text-slate-300">
                                    {project.intercomData?.consultantType || project.customData?.consultant_type || 'Company'}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* FINANCIALS */}
                    <div className="bg-[#0f1012] border border-slate-800 rounded-lg p-5">
                        <h3 className="text-xs font-bold text-slate-400 uppercase flex items-center gap-2 mb-4">
                            <span className="w-2 h-2 bg-orange-500 rounded-full"></span> Financials
                        </h3>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-1">
                                <label className="text-[10px] font-bold text-slate-500 uppercase">Financial Evaluation</label>
                                <div className="p-2 bg-[#18181b] border border-slate-700 rounded text-xs text-slate-300">
                                    {project.intercomData?.financialEvaluation || 'Select...'}
                                </div>
                            </div>
                            <div className="space-y-1">
                                <label className="text-[10px] font-bold text-slate-500 uppercase">Initial Payment</label>
                                <div className="p-2 bg-[#18181b] border border-slate-700 rounded text-xs text-slate-300">
                                    {project.intercomData?.initialPayment || 'Select...'}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* CORE DEFINITION */}
                    <div className="bg-[#0f1012] border border-slate-800 rounded-lg p-5">
                        <h3 className="text-xs font-bold text-slate-400 uppercase flex items-center gap-2 mb-4">
                            <span className="w-2 h-2 bg-indigo-500 rounded-full"></span> Core Definition
                        </h3>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-1 col-span-2">
                                <label className="text-[10px] font-bold text-slate-500 uppercase">Project Name</label>
                                <div className="p-2 bg-[#18181b] border border-slate-700 rounded text-xs text-slate-300">
                                    {project.projectName}
                                </div>
                            </div>
                            <div className="space-y-1">
                                <label className="text-[10px] font-bold text-slate-500 uppercase">Service Type</label>
                                <div className="p-2 bg-[#18181b] border border-slate-700 rounded text-xs text-slate-300">
                                    {project.serviceType}
                                </div>
                            </div>
                            <div className="space-y-1">
                                <label className="text-[10px] font-bold text-slate-500 uppercase">Engagement Letter #</label>
                                <div className="p-2 bg-[#18181b] border border-slate-700 rounded text-xs text-slate-300">
                                    {project.elNumber}
                                </div>
                            </div>
                        </div>
                    </div>

                </div>
            )}

            {/* --- INTERCOM TAB --- */}
            {activeTab === 'Intercom' && (
                <div className="bg-[#0f1012] border border-slate-800 rounded-lg p-4">
                    <IntercomForm 
                        project={project} 
                        onUpdate={() => {}} 
                        currentUser={members[0]} 
                        templates={templates} // Passing templates to link functionality
                    />
                </div>
            )}

            {/* Placeholders for other tabs */}
            {(activeTab === 'Documents' || activeTab === 'ICV & Compliance' || activeTab === 'History') && (
                <div className="flex flex-col items-center justify-center h-64 text-slate-500">
                    <p>Content for {activeTab} will go here.</p>
                </div>
            )}

        </div>

        {/* MODAL FOR MANDATORY REMARKS */}
        {showRejectModal && (
            <div className="absolute inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                <div className="bg-[#18181b] border border-slate-800 rounded-2xl p-6 w-full max-w-md shadow-2xl animate-in zoom-in-95">
                    <div className="flex items-center gap-2 mb-4 text-red-500">
                        <AlertOctagon size={24} />
                        <h3 className="text-lg font-bold text-white">Action Required</h3>
                    </div>
                    <p className="text-xs text-slate-400 mb-2">
                        You are about to <span className="font-bold text-white">{targetStatus === 'Cancelled' ? 'Cancel' : 'Reject/Hold'}</span> this project.
                    </p>
                    <p className="text-xs text-red-400 mb-4 font-bold uppercase tracking-wide">
                        Mandatory remarks required to proceed.
                    </p>
                    
                    <textarea 
                        className="w-full bg-black border border-slate-700 rounded-xl p-3 text-sm text-white focus:ring-1 focus:ring-teal-500 outline-none h-32 resize-none placeholder-slate-600"
                        placeholder="Please explain why this action is being taken..."
                        value={remarks}
                        onChange={(e) => setRemarks(e.target.value)}
                        autoFocus
                    />
                    <div className="flex justify-end gap-3 mt-4">
                        <button onClick={() => setShowRejectModal(false)} className="px-4 py-2 text-sm text-slate-400 hover:text-white transition-colors">Cancel</button>
                        <button 
                            onClick={confirmRejection} 
                            disabled={!remarks.trim()}
                            className="px-6 py-2 bg-red-600 disabled:bg-red-900/50 disabled:text-red-300/50 text-white rounded-lg text-sm font-bold hover:bg-red-700 transition-colors shadow-lg"
                        >
                            Confirm Action
                        </button>
                    </div>
                </div>
            </div>
        )}
    </div>
  );
};
