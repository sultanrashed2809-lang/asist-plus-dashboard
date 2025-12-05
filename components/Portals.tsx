
import React from 'react';
import { PortalDefinition } from '../types';
import { GLOBAL_PORTALS } from '../constants';
import { ExternalLink, Globe, Building, ShieldCheck, Plus, Edit2, Trash2, Search } from 'lucide-react';

export const Portals: React.FC = () => {
  const [searchQuery, setSearchQuery] = React.useState('');

  const filteredPortals = GLOBAL_PORTALS.filter(p => 
    p.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.description?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-bold text-slate-800">Global Portals</h2>
          <p className="text-sm text-slate-500">Manage external government, client, and internal links.</p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2 bg-teal-600 text-white rounded-lg text-sm font-medium hover:bg-teal-700 shadow-sm">
            <Plus size={16} /> Add Portal
        </button>
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
        <input 
          type="text"
          placeholder="Search portals..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-teal-500 focus:border-transparent"
        />
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredPortals.map(portal => (
            <div key={portal.id} className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-all flex flex-col group">
                <div className="flex justify-between items-start mb-4">
                    <div className={`p-3 rounded-xl ${
                        portal.type === 'Government' ? 'bg-slate-900 text-white' :
                        portal.type === 'Internal' ? 'bg-teal-50 text-teal-600' :
                        'bg-blue-50 text-blue-600'
                    }`}>
                        {portal.type === 'Government' ? <ShieldCheck size={24} /> :
                         portal.type === 'Internal' ? <Building size={24} /> :
                         <Globe size={24} />}
                    </div>
                    <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded"><Edit2 size={14} /></button>
                        <button className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded"><Trash2 size={14} /></button>
                    </div>
                </div>
                
                <h3 className="font-bold text-lg text-slate-800 mb-1">{portal.label}</h3>
                <p className="text-sm text-slate-500 mb-4 flex-1">{portal.description}</p>
                
                <div className="mt-auto pt-4 border-t border-slate-100 flex items-center justify-between">
                    <span className="text-xs font-bold uppercase text-slate-400 tracking-wider">{portal.type}</span>
                    <a 
                        href={portal.url} 
                        target="_blank" 
                        rel="noreferrer"
                        className="flex items-center gap-1.5 text-sm font-bold text-teal-600 hover:text-teal-700 hover:underline"
                    >
                        Open Portal <ExternalLink size={14} />
                    </a>
                </div>
            </div>
        ))}
      </div>
    </div>
  );
};
