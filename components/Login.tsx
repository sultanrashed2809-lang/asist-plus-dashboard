
import React, { useState } from 'react';
import { TeamMember } from '../types';
import { api } from '../services/api';
import { Lock, User, Loader2, Sun, Moon } from 'lucide-react';

interface LoginProps {
  onLogin: (user: TeamMember) => void;
  theme?: 'light' | 'dark';
  onToggleTheme?: () => void;
  companyLogo: string | null;
}

export const Login: React.FC<LoginProps> = ({ onLogin, theme, onToggleTheme, companyLogo }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
        const user = await api.login(username, password);
        if (user) {
            onLogin(user);
        } else {
            setError('Invalid username or password');
        }
    } catch (err) {
        setError('Connection failed. Please try again.');
    } finally {
        setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center p-4 transition-colors duration-300 relative">
      
      {onToggleTheme && (
          <button 
            onClick={onToggleTheme}
            className="absolute top-4 right-4 p-2 rounded-full bg-white dark:bg-slate-900 text-slate-500 dark:text-slate-400 hover:text-teal-600 dark:hover:text-teal-400 border border-slate-200 dark:border-slate-800 shadow-sm"
          >
              {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
          </button>
      )}

      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-xl dark:shadow-2xl dark:shadow-black/50 w-full max-w-md overflow-hidden border border-slate-200 dark:border-slate-800 transition-colors duration-300">
        <div className="p-8">
          <div className="text-center mb-8">
            {companyLogo ? (
                <img src={companyLogo} alt="Company Logo" className="h-32 w-auto mx-auto mb-6 object-contain" />
            ) : (
                <div className="w-16 h-16 bg-white dark:bg-[#111] rounded-2xl mx-auto flex items-center justify-center mb-4 shadow-lg shadow-teal-500/10 border border-slate-100 dark:border-slate-800 overflow-hidden p-1">
                    <div className="w-full h-full bg-teal-600 flex items-center justify-center rounded-xl">
                        <span className="text-white font-bold text-2xl">S</span>
                    </div>
                </div>
            )}
            <h2 className="text-2xl font-bold text-slate-800 dark:text-white">Welcome to Assist+</h2>
            <p className="text-slate-500 dark:text-slate-400 text-sm mt-2">Sign in to access the command center</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-slate-600 dark:text-slate-400 mb-2">Username</label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500" size={18} />
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent outline-none transition-all text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500"
                  placeholder="Enter your username"
                  disabled={isLoading}
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-600 dark:text-slate-400 mb-2">Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500" size={18} />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent outline-none transition-all text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500"
                  placeholder="••••••••"
                  disabled={isLoading}
                />
              </div>
            </div>

            {error && (
              <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-900/50 text-red-600 dark:text-red-400 text-sm rounded-lg text-center">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-teal-600 text-white font-bold py-3 rounded-lg hover:bg-teal-500 transition-colors shadow-lg shadow-teal-500/20 flex justify-center items-center gap-2"
            >
              {isLoading ? <Loader2 size={20} className="animate-spin" /> : 'Sign In'}
            </button>
          </form>
          
          <div className="mt-6 pt-6 border-t border-slate-100 dark:border-slate-800 text-center">
             <p className="text-xs text-slate-500">
                Super Admin: admin / admin <br/>
                Employee: ahmad / password
             </p>
          </div>
        </div>
        <div className="bg-slate-50 dark:bg-slate-950/50 p-4 text-center border-t border-slate-200 dark:border-slate-800">
            <p className="text-xs text-slate-500">© 2025 Assist Plus. Internal Use Only.</p>
        </div>
      </div>
    </div>
  );
};
