
import React, { useState } from 'react';
import { TeamMember, Role, ActivityLog } from '../types';
import { Shield, Edit2, Trash2, UserPlus, Lock, X, Save, Mail, User, Key, Activity, Search, FileText, ArrowUpRight } from 'lucide-react';

interface AccessManagementProps {
  members: TeamMember[];
  onUpdateMember: (member: TeamMember) => void;
  onAddMember: (member: TeamMember) => void;
  onDeleteMember: (id: string) => void;
  onNavigate: (type: 'project' | 'client' | 'member' | 'page', id: string) => void;
}

export const AccessManagement: React.FC<AccessManagementProps> = ({ members, onUpdateMember, onAddMember, onDeleteMember, onNavigate }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState<Partial<TeamMember>>({
    role: 'Auditor',
  });

  const resetForm = () => {
    setFormData({
        name: '',
        email: '',
        username: '',
        password: '',
        role: 'Auditor'
    });
    setIsEditing(false);
  };

  const handleOpenAdd = () => {
    resetForm();
    setIsModalOpen(true);
  };

  const handleOpenEdit = (member: TeamMember) => {
    setFormData({ ...member });
    setIsEditing(true);
    setIsModalOpen(true);
  };

  const handleDelete = (id: string, name: string) => {
    if (window.confirm(`Are you sure you want to delete user ${name}? This action cannot be undone.`)) {
        onDeleteMember(id);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (isEditing && formData.id) {
        onUpdateMember(formData as TeamMember);
    } else {
        // Add new member logic
        const newMember: TeamMember = {
            id: `u-${Date.now()}`,
            name: formData.name || 'New User',
            username: formData.username || `user${Date.now()}`,
            email: formData.email || '',
            password: formData.password || 'password', // Default password
            role: formData.role as Role,
            avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(formData.name || 'User')}&background=random`,
            activeProjects: 0,
            completedProjects: 0,
            completionRate: 0,
            avgClosingTime: 0,
            rating: 0,
            workloadScore: 0,
            assignmentConfig: {
                mode: 'Manual',
                smartWeighting: 'Balanced',
                specialties: [],
                maxActiveLoad: 5
            }
        };
        onAddMember(newMember);
    }
    setIsModalOpen(false);
  };

  return (
    <div className="space-y-6 relative">
      <div className="flex justify-between items-center">
        <div>
            <h2 className="text-xl font-bold text-slate-800">Access Management</h2>
            <p className="text-sm text-slate-500">Manage team roles and system permissions.</p>
        </div>
        <button 
            onClick={handleOpenAdd}
            className="flex items-center gap-2 px-4 py-2 bg-slate-900 text-white rounded-lg hover:bg-slate-800 transition-colors shadow-lg shadow-slate-200"
        >
            <UserPlus size={16} /> Add User
        </button>
      </div>

      <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse whitespace-nowrap">
                <thead className="bg-slate-50 border-b border-slate-200">
                    <tr>
                    <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase">User</th>
                    <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase">Username</th>
                    <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase">Current Role</th>
                    <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase">Permissions Level</th>
                    <th className="px-6 py-4 text-right text-xs font-semibold text-slate-500 uppercase">Actions</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                    {members.map((member) => (
                    <tr key={member.id} className="hover:bg-slate-50 transition-colors">
                        <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                            <img src={member.avatar} alt="" className="w-8 h-8 rounded-full bg-slate-100" />
                            <div>
                                <p className="font-bold text-sm text-slate-800">{member.name}</p>
                                <p className="text-xs text-slate-500">{member.email || 'No email'}</p>
                            </div>
                        </div>
                        </td>
                        <td className="px-6 py-4 text-sm font-mono text-slate-600">@{member.username}</td>
                        <td className="px-6 py-4">
                            <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold border ${
                                member.role === 'Super Admin' ? 'bg-purple-100 text-purple-700 border-purple-200' :
                                member.role === 'Admin' ? 'bg-indigo-100 text-indigo-700 border-indigo-200' :
                                member.role === 'Manager' ? 'bg-teal-100 text-teal-700 border-teal-200' :
                                'bg-slate-100 text-slate-600 border-slate-200'
                            }`}>
                                {member.role === 'Super Admin' && <Shield size={12} />}
                                {member.role}
                            </span>
                        </td>
                        <td className="px-6 py-4">
                            <div className="flex items-center gap-1">
                                {member.role === 'Super Admin' ? (
                                    Array(5).fill(0).map((_, i) => <div key={i} className="w-2 h-4 bg-purple-500 rounded-sm"></div>)
                                ) : member.role === 'Manager' ? (
                                    Array(3).fill(0).map((_, i) => <div key={i} className="w-2 h-4 bg-teal-500 rounded-sm"></div>)
                                ) : (
                                    Array(1).fill(0).map((_, i) => <div key={i} className="w-2 h-4 bg-slate-300 rounded-sm"></div>)
                                )}
                            </div>
                        </td>
                        <td className="px-6 py-4 text-right">
                            <div className="flex justify-end gap-2">
                                <button 
                                    onClick={() => handleOpenEdit(member)}
                                    className="p-2 hover:bg-slate-200 rounded text-slate-500 hover:text-slate-800 transition-colors"
                                    title="Edit User"
                                >
                                    <Edit2 size={16} />
                                </button>
                                <button 
                                    onClick={() => handleDelete(member.id, member.name)}
                                    className="p-2 hover:bg-red-50 rounded text-slate-400 hover:text-red-600 transition-colors"
                                    title="Delete User"
                                >
                                    <Trash2 size={16} />
                                </button>
                            </div>
                        </td>
                    </tr>
                    ))}
                </tbody>
                </table>
            </div>
      </div>

      {/* Add/Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden animate-in slide-in-from-bottom-4 duration-300">
                <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                    <h3 className="text-lg font-bold text-slate-800">{isEditing ? 'Edit User' : 'Add New User'}</h3>
                    <button onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-slate-200 rounded-full transition-colors">
                        <X size={20} className="text-slate-500" />
                    </button>
                </div>
                
                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Full Name</label>
                            <div className="relative">
                                <User className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                                <input 
                                    type="text" 
                                    required
                                    className="w-full pl-10 pr-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                                    placeholder="John Doe"
                                    value={formData.name || ''}
                                    onChange={e => setFormData({...formData, name: e.target.value})}
                                />
                            </div>
                        </div>
                         <div>
                            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Username</label>
                            <div className="relative">
                                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-mono text-xs">@</span>
                                <input 
                                    type="text" 
                                    required
                                    className="w-full pl-8 pr-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-teal-500 focus:border-transparent font-mono"
                                    placeholder="johndoe"
                                    value={formData.username || ''}
                                    onChange={e => setFormData({...formData, username: e.target.value})}
                                />
                            </div>
                        </div>
                    </div>

                    <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Email Address</label>
                        <div className="relative">
                            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                            <input 
                                type="email" 
                                required
                                className="w-full pl-10 pr-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                                placeholder="john@assistplus.ae"
                                value={formData.email || ''}
                                onChange={e => setFormData({...formData, email: e.target.value})}
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Role</label>
                        <select 
                            className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                            value={formData.role}
                            onChange={e => setFormData({...formData, role: e.target.value as Role})}
                        >
                            <option value="Super Admin">Super Admin (Full Access)</option>
                            <option value="Admin">Admin (Manage Users & Projects)</option>
                            <option value="Manager">Manager (Assign & Review)</option>
                            <option value="Auditor">Auditor (View & Update Own)</option>
                            <option value="Viewer">Viewer (Read Only)</option>
                        </select>
                    </div>

                    <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase mb-1">
                            {isEditing ? 'Reset Password (Optional)' : 'Password'}
                        </label>
                        <div className="relative">
                            <Key className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                            <input 
                                type="password" 
                                required={!isEditing}
                                className="w-full pl-10 pr-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                                placeholder={isEditing ? "Leave blank to keep current" : "Enter password"}
                                value={formData.password || ''}
                                onChange={e => setFormData({...formData, password: e.target.value})}
                            />
                        </div>
                    </div>

                    <div className="pt-4 flex justify-end gap-3">
                        <button 
                            type="button" 
                            onClick={() => setIsModalOpen(false)}
                            className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                        >
                            Cancel
                        </button>
                        <button 
                            type="submit"
                            className="flex items-center gap-2 px-6 py-2 bg-slate-900 text-white rounded-lg text-sm font-bold hover:bg-slate-800 transition-colors shadow-lg"
                        >
                            <Save size={16} /> {isEditing ? 'Save Changes' : 'Create User'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
      )}
    </div>
  );
};
