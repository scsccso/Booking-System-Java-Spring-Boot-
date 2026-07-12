import { Link, useLocation, useNavigate, Outlet } from 'react-router-dom';
import { LayoutDashboard, LogOut, Terminal, Users, Database } from 'lucide-react';
import { logout } from '../utils/auth';

export default function AdminLayout() {
  const location = useLocation();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout(navigate, true);
  };

  const menuItems = [
    { name: 'Dashboard', path: '/admin/dashboard', icon: <LayoutDashboard size={18} /> },
    { name: 'Assets', path: '/admin/assets', icon: <Database size={18} /> },
    { name: 'Audits', path: '/admin/audits', icon: <Users size={18} /> }
  ];

  return (
    <div className="min-h-screen bg-slate-50 flex text-slate-900">
      {/* Sidebar */}
      <aside className="w-64 bg-slate-900 text-white flex-shrink-0 flex flex-col h-screen sticky top-0 shadow-xl border-r border-slate-800">
        <div className="h-16 flex items-center px-6 border-b border-slate-800">
          <Terminal className="text-cyan-400 mr-3" size={24} />
          <span className="font-bold text-lg tracking-widest uppercase">Admin</span>
        </div>
        <div className="flex-1 py-6 flex flex-col gap-2 px-3 overflow-y-auto">
          {menuItems.map(item => (
            <Link
              key={item.path}
              to={item.path}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 text-sm font-medium
                ${location.pathname.startsWith(item.path)
                  ? 'bg-cyan-500/10 text-cyan-400 shadow-[inset_4px_0_0_0_rgba(34,211,238,1)]' 
                  : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'
                }`}
            >
              {item.icon}
              {item.name}
            </Link>
          ))}
        </div>
        <div className="p-4 border-t border-slate-800">
          <button 
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium text-slate-400 hover:text-red-400 hover:bg-red-950/30 rounded-lg transition-colors"
          >
            <LogOut size={16} />
            Logout
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top bar */}
        <header className="h-16 bg-white border-b border-slate-200 flex items-center px-8 shadow-sm flex-shrink-0 sticky top-0 z-10">
          <h2 className="text-lg font-semibold text-slate-800">Global Control Panel</h2>
        </header>
        <div className="flex-1 overflow-auto p-8">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
