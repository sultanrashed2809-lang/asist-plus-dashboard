
import React, { useState } from 'react';
import { Project, TeamMember } from '../types';
import { Trash2, RefreshCw, AlertTriangle, Search, Filter } from 'lucide-react';

interface RecycleBinProps {
    projects: Project[]; // Contains deleted projects too
    onRestore: (project: Project) => void;
    onPermanentDelete: (id: string) => void;
    currentUser: TeamMember;
}

export const RecycleBin: React.FC<RecycleBinProps> = ({ projects, onRestore, onPermanentDelete, currentUser }) => {
    const [searchQuery, setSearchQuery] = useState('');
    
    // Only show deleted projects
    const deletedProjects = projects.filter(p => p.isDeleted);
    
    const filteredItems = deletedProjects.filter(p => 
        p.projectName.toLowerCase().includes(searchQuery.toLowerCase()) || 
        p.clientName.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const isSuperAdmin = currentUser.role === 'Super Admin';

    return (
        <div className="space-y-6">
            <div>
                <h2 className="text-xl font-bold text-slate-800 dark:text-white flex items-center gap-2">
                    <Trash2 className="text-red-500" /> Recycle Bin
                </h2>
                <p className="text-sm text-slate-500 dark:text-slate-400">Manage deleted projects. Only Super Admin can permanently delete items.</p>
            </div>

            <div className="flex justify-between items-center bg-white dark:bg-[#151515] p-4 rounded-xl border border-slate-200 dark:border-slate-800">
                <div className="relative max-w-md w-full">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                    <input 
                        type="text"
                        placeholder="Search deleted items..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 border border-slate-200 dark:border-slate-700 rounded-lg text-sm bg-transparent dark:text-white focus:ring-2 focus:ring-red-500 outline-none"
                    />
                </div>
                <div className="text-xs font-bold text-slate-500 dark:text-slate-400">
                    {filteredItems.length} Items Found
                </div>
            </div>

            <div className="bg-white dark:bg-[#151515] border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden shadow-sm">
                <table className="w-full text-left">
                    <thead className="bg-slate-50 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700">
                        <tr>
                            <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase">Project / Client</th>
                            <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase">Deleted Date</th>
                            <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase">Deleted By</th>
                            <th className="px-6 py-4 text-right text-xs font-semibold text-slate-500 uppercase">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                        {filteredItems.length === 0 ? (
                            <tr><td colSpan={4} className="p-8 text-center text-slate-400 italic">Recycle bin is empty.</td></tr>
                        ) : (
                            filteredItems.map(item => (
                                <tr key={item.id} className="hover:bg-red-50/50 dark:hover:bg-red-900/10 transition-colors group">
                                    <td className="px-6 py-4">
                                        <div className="font-medium text-slate-800 dark:text-white">{item.projectName}</div>
                                        <div className="text-xs text-slate-500">{item.clientName}</div>
                                    </td>
                                    <td className="px-6 py-4 text-sm text-slate-600 dark:text-slate-300">
                                        {item.deletedAt ? new Date(item.deletedAt).toLocaleDateString() : '-'}
                                    </td>
                                    <td className="px-6 py-4 text-sm text-slate-600 dark:text-slate-300">
                                        {item.deletedBy || 'Unknown'}
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <div className="flex justify-end gap-2">
                                            <button 
                                                onClick={() => onRestore(item)}
                                                className="flex items-center gap-1 px-3 py-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-teal-600 dark:text-teal-400 text-xs font-bold rounded hover:bg-teal-50 dark:hover:bg-teal-900/30 transition-colors"
                                            >
                                                <RefreshCw size={14} /> Restore
                                            </button>
                                            {isSuperAdmin && (
                                                <button 
                                                    onClick={() => {
                                                        if (confirm('PERMANENTLY DELETE? This cannot be undone.')) {
                                                            onPermanentDelete(item.id);
                                                        }
                                                    }}
                                                    className="flex items-center gap-1 px-3 py-1.5 bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-900 text-red-600 dark:text-red-400 text-xs font-bold rounded hover:bg-red-100 dark:hover:bg-red-900/40 transition-colors"
                                                >
                                                    <Trash2 size={14} /> Delete Forever
                                                </button>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};
