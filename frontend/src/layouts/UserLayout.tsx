import { Link, useLocation, useNavigate, Outlet } from 'react-router-dom';
import { CalendarDays, LogOut } from 'lucide-react';
import { logout } from '../utils/auth';

export default function UserLayout() {
  const location = useLocation();
  const navigate = useNavigate();
  const username = localStorage.getItem('username') || 'User';

  const handleLogout = () => {
    logout(navigate, false);
  };

  return (
    <div className="min-h-screen bg-gray-50 font-sans text-gray-900 flex flex-col">
      <nav className="bg-white border-b border-gray-200 sticky top-0 z-50 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex">
              <div className="flex-shrink-0 flex items-center gap-2">
                <div className="w-8 h-8 bg-orange-600 rounded-lg flex items-center justify-center shadow-md">
                  <span className="text-white font-bold text-xl leading-none tracking-tighter">B</span>
                </div>
                <span className="font-bold text-xl text-gray-900 tracking-tight">BookingApp</span>
              </div>
              <div className="hidden sm:ml-10 sm:flex sm:space-x-8">
                <Link 
                  to="/booking" 
                  className={`inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium transition-colors ${
                    location.pathname === '/booking' 
                      ? 'border-orange-500 text-gray-900' 
                      : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
                  }`}
                >
                  <CalendarDays className="w-4 h-4 mr-2" />
                  Reserve Space
                </Link>
              </div>
            </div>
            <div className="flex items-center gap-4">
               <span className="text-sm font-medium text-gray-700 bg-gray-100 px-3 py-1 rounded-full hidden sm:block">
                 {username}
               </span>
               <button onClick={handleLogout} className="flex items-center text-sm font-medium text-gray-500 hover:text-orange-600 transition-colors">
                 <LogOut className="w-4 h-4 mr-1" />
                 Logout
               </button>
            </div>
          </div>
        </div>
      </nav>
      <main className="flex-1 transition-all">
        <Outlet />
      </main>
    </div>
  );
}
