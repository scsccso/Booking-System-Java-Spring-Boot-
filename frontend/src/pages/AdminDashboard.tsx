import { useState, useMemo } from 'react';
import { Calendar, LayoutDashboard, Database, Search, ArrowUpDown, AlertTriangle } from 'lucide-react';
import { useAdminManagement } from '../hooks/useAdminManagement';
import type { Resource } from '../types';

export default function AdminDashboard() {
  const {
    stats,
    resources,
    selectedDate,
    setSelectedDate,
    loading,
    errorMsg,
    successMsg,
    toggleResourceStatus,
    clearMessages
  } = useAdminManagement();

  // Search & Sort State
  const [searchQuery, setSearchQuery] = useState('');
  const [sortConfig, setSortConfig] = useState<{key: keyof Resource, direction: 'asc'|'desc'} | null>(null);

  // Modal State
  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
  } | null>(null);

  // Derived filtered & sorted resources
  const processedResources = useMemo(() => {
    let filtered = resources;
    
    if (searchQuery) {
      filtered = filtered.filter(r => 
        r.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
        r.type.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    if (sortConfig) {
      filtered = [...filtered].sort((a, b) => {
        if (a[sortConfig.key] < b[sortConfig.key]) return sortConfig.direction === 'asc' ? -1 : 1;
        if (a[sortConfig.key] > b[sortConfig.key]) return sortConfig.direction === 'asc' ? 1 : -1;
        return 0;
      });
    }

    return filtered;
  }, [resources, searchQuery, sortConfig]);

  const handleSort = (key: keyof Resource) => {
    let direction: 'asc' | 'desc' = 'asc';
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  const requestStatusToggle = (resource: Resource) => {
    const isCurrentlyActive = resource.status === 'ACTIVE';
    const actionName = isCurrentlyActive ? 'Maintenance Mode' : 'Active Status';
    const actionDesc = isCurrentlyActive 
      ? 'This will immediately take the resource offline and cancel any existing bookings for it. Are you sure you want to proceed?' 
      : 'This will bring the resource back online and make it available for booking. Are you sure?';

    setConfirmModal({
      isOpen: true,
      title: `Confirm ${actionName}`,
      message: actionDesc,
      onConfirm: () => {
        toggleResourceStatus(resource.id, resource.status);
        setConfirmModal(null);
      }
    });
  };

  return (
    <div className="max-w-7xl mx-auto p-6 bg-slate-50 min-h-screen relative">
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-white rounded-xl shadow-sm border border-slate-200">
            <LayoutDashboard className="w-6 h-6 text-cyan-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Admin Dashboard</h1>
            <p className="text-sm text-slate-500">System utilization overview</p>
          </div>
        </div>
        
        <div className="flex items-center gap-2 bg-white px-4 py-2 rounded-lg shadow-sm border border-slate-200">
          <Calendar className="w-4 h-4 text-slate-500" />
          <input 
            type="date" 
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="text-sm font-medium focus:outline-none text-slate-700 bg-transparent cursor-pointer"
          />
        </div>
      </div>

      {errorMsg && (
        <div className="mb-6 p-4 bg-red-50 border-l-4 border-red-500 text-red-700 rounded shadow-sm">
          <span className="font-medium text-sm">{errorMsg}</span>
        </div>
      )}
      
      {successMsg && (
        <div className="mb-6 p-4 bg-green-50 border-l-4 border-green-500 text-green-700 rounded shadow-sm">
          <span className="font-medium text-sm">{successMsg}</span>
        </div>
      )}

      {loading ? (
        <div className="py-20 flex justify-center">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-cyan-600"></div>
        </div>
      ) : (
        <>
          {stats && (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex items-center justify-between group hover:shadow-md transition-shadow">
                  <div>
                    <p className="text-sm font-semibold text-slate-500 uppercase tracking-wide">Total Bookings</p>
                    <p className="text-4xl font-bold text-slate-900 mt-2">{stats.totalBookings}</p>
                  </div>
                  <div className="w-16 h-16 rounded-full bg-cyan-50 flex items-center justify-center group-hover:scale-110 transition-transform">
                    <Calendar className="w-8 h-8 text-cyan-500" />
                  </div>
                </div>
              </div>
              
              <h2 className="text-xl font-bold text-slate-900 mb-4">Resource Occupancy Rates</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
                {Object.entries(stats.occupancyRates || {}).map(([id, stat]) => (
                  <div key={id} className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex flex-col justify-between group hover:shadow-md transition-shadow">
                    <div>
                      <p className="text-sm font-semibold text-slate-700">{stat.name}</p>
                      <div className="flex items-baseline gap-2 mt-2">
                        <p className="text-3xl font-bold text-slate-900">{stat.rate.toFixed(1)}%</p>
                      </div>
                    </div>
                    <div className="mt-4 w-full bg-slate-200 rounded-full h-2.5">
                      <div className="bg-cyan-600 h-2.5 rounded-full" style={{ width: `${Math.min(stat.rate, 100)}%` }}></div>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
            <div className="flex items-center gap-2">
              <Database className="w-5 h-5 text-slate-700" />
              <h2 className="text-xl font-bold text-slate-900">Resource Management</h2>
            </div>
            
            {/* Search Filter */}
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                <Search size={16} />
              </div>
              <input
                type="text"
                placeholder="Search resources..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full sm:w-64 pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-cyan-500 outline-none shadow-sm"
              />
            </div>
          </div>
          
          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 text-sm font-medium uppercase tracking-wider">
                  <th className="p-4 cursor-pointer hover:bg-slate-100 transition-colors group" onClick={() => handleSort('name')}>
                    <div className="flex items-center gap-1">Name <ArrowUpDown className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" /></div>
                  </th>
                  <th className="p-4 cursor-pointer hover:bg-slate-100 transition-colors group" onClick={() => handleSort('type')}>
                    <div className="flex items-center gap-1">Type <ArrowUpDown className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" /></div>
                  </th>
                  <th className="p-4 cursor-pointer hover:bg-slate-100 transition-colors group" onClick={() => handleSort('status')}>
                    <div className="flex items-center gap-1">Status <ArrowUpDown className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" /></div>
                  </th>
                  <th className="p-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {processedResources.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="p-8 text-center text-slate-500 font-medium">No resources found.</td>
                  </tr>
                ) : (
                  processedResources.map(resource => (
                    <tr key={resource.id} className="hover:bg-slate-50 transition-colors">
                      <td className="p-4 text-slate-900 font-medium">{resource.name}</td>
                      <td className="p-4 text-slate-500 text-sm">{resource.type}</td>
                      <td className="p-4">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border
                          ${resource.status === 'ACTIVE' 
                            ? 'bg-green-50 text-green-700 border-green-200' 
                            : 'bg-amber-50 text-amber-700 border-amber-200'}`}
                        >
                          {resource.status}
                        </span>
                      </td>
                      <td className="p-4 text-right">
                        <button
                          onClick={() => requestStatusToggle(resource)}
                          className={`text-sm font-medium px-3 py-1.5 rounded-lg border transition-colors
                            ${resource.status === 'ACTIVE'
                              ? 'text-amber-600 border-amber-200 hover:bg-amber-50'
                              : 'text-green-600 border-green-200 hover:bg-green-50'
                            }`}
                        >
                          {resource.status === 'ACTIVE' ? 'Set to Maintenance' : 'Set to Active'}
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </>
      )}

      {/* Confirmation Modal */}
      {confirmModal && confirmModal.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => setConfirmModal(null)}></div>
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md relative z-10 overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-6">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-12 h-12 rounded-full bg-amber-100 flex items-center justify-center flex-shrink-0 text-amber-600">
                  <AlertTriangle size={24} />
                </div>
                <h3 className="text-xl font-bold text-slate-900">{confirmModal.title}</h3>
              </div>
              <p className="text-slate-600 text-sm leading-relaxed mb-8">{confirmModal.message}</p>
              
              <div className="flex gap-3 justify-end">
                <button 
                  onClick={() => setConfirmModal(null)}
                  className="px-4 py-2 font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button 
                  onClick={confirmModal.onConfirm}
                  className="px-5 py-2 font-medium text-white bg-amber-600 hover:bg-amber-700 rounded-lg shadow-sm transition-colors"
                >
                  Confirm Action
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
