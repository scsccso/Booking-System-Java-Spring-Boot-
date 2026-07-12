import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ShieldAlert, Terminal, AlertTriangle } from 'lucide-react';
import api from '../api';
import type { ApiResponse, LoginResponse } from '../types';

export default function AdminLogin() {
  const [username, setUsername] = useState('admin01');
  const [password, setPassword] = useState('123456');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg(null);
    try {
      const res = await api.post<ApiResponse<LoginResponse>>('/auth/login', { username, password });
      const { token, role } = res.data.data;
      if (role !== 'ADMIN') {
        setErrorMsg('Access Denied. You do not have administrator privileges.');
        return;
      }
      localStorage.setItem('token', token);
      localStorage.setItem('role', role);
      navigate('/admin');
    } catch (err: any) {
      if (err.response?.data?.message) {
        setErrorMsg(err.response.data.message);
      } else {
        setErrorMsg('An error occurred during authentication.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4 selection:bg-cyan-500/30">
      <div className="max-w-md w-full relative">
        {/* Glow effect */}
        <div className="absolute -inset-1 bg-gradient-to-r from-cyan-500 to-blue-500 rounded-3xl blur opacity-20 group-hover:opacity-30 transition duration-1000 group-hover:duration-200"></div>
        
        <div className="relative bg-slate-800 rounded-3xl shadow-2xl overflow-hidden p-8 border border-slate-700">
          <div className="text-center mb-10">
            <div className="w-16 h-16 bg-slate-900/50 text-cyan-400 rounded-2xl flex items-center justify-center mx-auto mb-5 shadow-[0_0_15px_rgba(34,211,238,0.2)] border border-slate-700">
              <ShieldAlert size={32} />
            </div>
            <h1 className="text-2xl font-bold text-white tracking-widest uppercase">System Admin</h1>
            <p className="text-xs text-slate-400 mt-2 tracking-widest font-mono">AUTHORIZED PERSONNEL ONLY</p>
          </div>

          {errorMsg && (
            <div className="mb-6 p-4 bg-red-950/50 border border-red-500/50 text-red-400 rounded-xl flex items-center text-sm font-medium">
              <AlertTriangle size={18} className="mr-3 flex-shrink-0" />
              {errorMsg}
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-6">
            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-2 uppercase tracking-wider">Operator ID</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-cyan-500/50">
                  <Terminal size={16} />
                </div>
                <input
                  type="text"
                  value={username}
                  onChange={e => setUsername(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-slate-900/50 border border-slate-700 rounded-xl text-white focus:bg-slate-900 focus:ring-1 focus:ring-cyan-500 focus:border-cyan-500 outline-none transition-all font-mono text-sm placeholder-slate-600"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-2 uppercase tracking-wider">Passcode</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-cyan-500/50">
                  <Terminal size={16} />
                </div>
                <input
                  type="password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-slate-900/50 border border-slate-700 rounded-xl text-white focus:bg-slate-900 focus:ring-1 focus:ring-cyan-500 focus:border-cyan-500 outline-none transition-all font-mono text-sm placeholder-slate-600 tracking-widest"
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-cyan-600 hover:bg-cyan-500 text-white font-bold py-3 px-4 rounded-xl shadow-[0_0_20px_rgba(8,145,178,0.4)] hover:shadow-[0_0_25px_rgba(34,211,238,0.6)] transition-all duration-300 disabled:opacity-70 disabled:cursor-not-allowed uppercase tracking-widest text-sm"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin mx-auto"></div>
              ) : (
                'Authenticate'
              )}
            </button>
          </form>
          
          <div className="mt-8 text-center">
            <button 
              onClick={() => navigate('/login')}
              className="text-xs font-medium text-slate-400 hover:text-cyan-400 transition-colors uppercase tracking-wider"
            >
              &larr; 返回用户预约端
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
