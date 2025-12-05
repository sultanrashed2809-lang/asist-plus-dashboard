
import React, { useState } from 'react';
import { Goal, TeamMember } from '../types';
import { Target, Plus, Check, MoreVertical, TrendingUp, AlertTriangle } from 'lucide-react';

interface GoalsProps {
    currentUser: TeamMember;
}

export const Goals: React.FC<GoalsProps> = ({ currentUser }) => {
    // Mock Goals State
    const [goals, setGoals] = useState<Goal[]>([
        { id: 'g1', title: 'Monthly Collections', type: 'Collection', targetValue: 500000, currentValue: 320000, unit: 'AED', deadline: '2025-11-30', status: 'On Track' },
        { id: 'g2', title: 'Project Completion', type: 'Completion', targetValue: 20, currentValue: 12, unit: 'Projects', deadline: '2025-11-30', status: 'At Risk' },
        { id: 'g3', title: 'Reduce Overdue Projects', type: 'Risk', targetValue: 5, currentValue: 8, unit: 'Projects', deadline: '2025-12-31', status: 'Off Track' },
    ]);

    const getProgressColor = (goal: Goal) => {
        const pct = (goal.currentValue / goal.targetValue) * 100;
        // For risk, lower is better usually, but assuming 'current' is what we have achieved vs target being goal.
        // Simplified: Higher % is better for Collection/Completion.
        if (goal.type === 'Risk') return goal.currentValue > goal.targetValue ? 'bg-red-500' : 'bg-emerald-500';
        if (pct >= 90) return 'bg-emerald-500';
        if (pct >= 60) return 'bg-orange-500';
        return 'bg-red-500';
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-xl font-bold text-slate-800 dark:text-white flex items-center gap-2">
                        <Target className="text-teal-600" /> Goals & Targets
                    </h2>
                    <p className="text-sm text-slate-500 dark:text-slate-400">Set and track team performance targets.</p>
                </div>
                {(currentUser.role === 'Super Admin' || currentUser.role === 'Admin') && (
                    <button className="flex items-center gap-2 px-4 py-2 bg-slate-900 dark:bg-slate-700 text-white rounded-lg text-sm font-bold hover:bg-slate-800 transition-colors shadow-lg">
                        <Plus size={16} /> Set New Goal
                    </button>
                )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {goals.map(goal => {
                    const percentage = Math.min(Math.round((goal.currentValue / goal.targetValue) * 100), 100);
                    return (
                        <div key={goal.id} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-sm relative group">
                            <div className="flex justify-between items-start mb-4">
                                <div className="flex items-center gap-3">
                                    <div className={`p-2 rounded-lg ${goal.type === 'Collection' ? 'bg-emerald-100 text-emerald-600' : goal.type === 'Risk' ? 'bg-red-100 text-red-600' : 'bg-blue-100 text-blue-600'}`}>
                                        {goal.type === 'Collection' ? <TrendingUp size={20} /> : goal.type === 'Risk' ? <AlertTriangle size={20} /> : <Target size={20} />}
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-slate-800 dark:text-white text-sm">{goal.title}</h3>
                                        <p className="text-xs text-slate-500">Deadline: {goal.deadline}</p>
                                    </div>
                                </div>
                                <button className="text-slate-400 hover:text-slate-600"><MoreVertical size={16} /></button>
                            </div>

                            <div className="mb-2 flex justify-between items-end">
                                <span className="text-2xl font-bold text-slate-800 dark:text-white">
                                    {goal.unit === 'AED' ? `AED ${goal.currentValue.toLocaleString()}` : goal.currentValue}
                                </span>
                                <span className="text-xs font-medium text-slate-500 mb-1">
                                    Target: {goal.unit === 'AED' ? `AED ${goal.targetValue.toLocaleString()}` : goal.targetValue}
                                </span>
                            </div>

                            <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-2 mb-2 overflow-hidden">
                                <div className={`h-2 rounded-full transition-all duration-1000 ${getProgressColor(goal)}`} style={{ width: `${percentage}%` }}></div>
                            </div>

                            <div className="flex justify-between items-center">
                                <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase ${
                                    goal.status === 'On Track' ? 'bg-emerald-50 text-emerald-600' : 
                                    goal.status === 'At Risk' ? 'bg-orange-50 text-orange-600' : 'bg-red-50 text-red-600'
                                }`}>
                                    {goal.status}
                                </span>
                                <span className="text-xs font-bold text-slate-400">{percentage}%</span>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};
