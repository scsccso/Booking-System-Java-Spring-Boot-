import { useState, useMemo } from 'react';
import { Calendar, LayoutDashboard, Database, Search, ArrowUpDown, AlertTriangle, TrendingUp, Activity, CheckCircle2, Wrench } from 'lucide-react';
import { useAdminManagement } from '../hooks/useAdminManagement';
import type { Resource } from '../types';

// Lightweight SVG Sparkline — no external libs
function Sparkline({ data, color }: { data: number[]; color: string }) {
  const max = Math.max(...data, 1);
  const min = Math.min(...data);
  const range = max - min || 1;
  const w = 80;
  const h = 32;
  const pts = data.map((v, i) => {
    const x = (i / (data.length - 1)) * w;
    const y = h - ((v - min) / range) * h;
    return `${x},${y}`;
  });
  const polyline = pts.join(' ');
  const area = `0,${h} ${polyline} ${w},${h}`;

  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="w-20 h-8 overflow-visible">
      <defs>
        <linearGradient id={`grad-${color}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.25" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <polygon points={area} fill={`url(#grad-${color})`} />
      <polyline points={polyline} fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

// Mock sparkline data (8 hourly readings to simulate trend)
const MOCK_TRENDS = {
  bookings: [2, 5, 4, 8, 7, 12, 10, 14],
  occupancy: [20, 35, 30, 55, 50, 68, 60, 72],
};

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

  const [searchQuery, setSearchQuery] = useState('');
  const [sortConfig, setSortConfig] = useState<{key: keyof Resource, direction: 'asc'|'desc'} | null>(null);
  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
  } | null>(null);

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
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') direction = 'desc';
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

  const avgOccupancy = stats?.occupancyRates
    ? Object.values(stats.occupancyRates).reduce((acc, v) => acc + v.rate, 0) / Math.max(Object.keys(stats.occupancyRates).length, 1)
    : 0;

  return (
    <div className="max-w-7xl mx-auto p-6 min-h-screen relative">

      {/* ── Page Header ── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-xl shadow-lg shadow-cyan-500/30">
            <LayoutDashboard className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Operations Center</h1>
            <p className="text-xs text-slate-500 mt-0.5 font-medium">FlexiSpace · Live telemetry dashboard</p>
          </div>
        </div>
        <div className="flex items-center gap-2 bg-white px-4 py-2.5 rounded-xl shadow-sm border border-slate-200 text-slate-600 hover:border-cyan-300 transition-colors">
          <Calendar className="w-4 h-4 text-cyan-500" />
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="text-sm font-semibold focus:outline-none text-slate-700 bg-transparent cursor-pointer"
          />
        </div>
      </div>

      {/* ── Toasts ── */}
      {errorMsg && (
        <div className="mb-6 p-4 bg-red-950/5 border border-red-200 text-red-700 rounded-xl flex items-center gap-3 text-sm font-medium">
          <AlertTriangle className="w-4 h-4 flex-shrink-0" />{errorMsg}
        </div>
      )}
      {successMsg && (
        <div className="mb-6 p-4 bg-green-950/5 border border-green-200 text-green-700 rounded-xl flex items-center gap-3 text-sm font-medium">
          <CheckCircle2 className="w-4 h-4 flex-shrink-0" />{successMsg}
        </div>
      )}

      {loading ? (
        <div className="py-20 flex flex-col items-center gap-4">
          <div className="animate-spin rounded-full h-10 w-10 border-2 border-slate-200 border-t-cyan-600" />
          <p className="text-sm text-slate-400 font-medium">Fetching live data…</p>
        </div>
      ) : (
        <>
          {/* ── KPI Cards ── */}
          {stats && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-8">

              {/* Card 1: Total Bookings */}
              <div className="group relative bg-gradient-to-br from-slate-900 to-slate-950 rounded-2xl p-6 overflow-hidden border border-slate-800 shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all duration-300">
                <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_rgba(6,182,212,0.08),transparent_60%)]" />
                <div className="relative flex items-start justify-between">
                  <div>
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">Total Bookings Today</p>
                    <p className="text-5xl font-black text-white tracking-tight">{stats.totalBookings}</p>
                    <div className="mt-3 flex items-center gap-1.5">
                      <TrendingUp className="w-3.5 h-3.5 text-emerald-400" />
                      <span className="text-xs font-bold text-emerald-400">+12.4% vs last hour</span>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <div className="p-2.5 rounded-xl bg-slate-800/80 border border-slate-700">
                      <Activity className="w-5 h-5 text-cyan-400" />
                    </div>
                    <Sparkline data={MOCK_TRENDS.bookings} color="#22d3ee" />
                  </div>
                </div>
              </div>

              {/* Card 2: Avg Occupancy */}
              <div className="group relative bg-gradient-to-br from-slate-900 to-slate-950 rounded-2xl p-6 overflow-hidden border border-slate-800 shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all duration-300">
                <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_rgba(16,185,129,0.08),transparent_60%)]" />
                <div className="relative flex items-start justify-between">
                  <div>
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">Avg Occupancy Rate</p>
                    <p className="text-5xl font-black text-white tracking-tight">{avgOccupancy.toFixed(1)}<span className="text-2xl text-slate-400 font-bold">%</span></p>
                    <div className="mt-3 flex items-center gap-1.5">
                      <TrendingUp className="w-3.5 h-3.5 text-emerald-400" />
                      <span className="text-xs font-bold text-emerald-400">+5.2% vs last hour</span>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <div className="p-2.5 rounded-xl bg-slate-800/80 border border-slate-700">
                      <Database className="w-5 h-5 text-emerald-400" />
                    </div>
                    <Sparkline data={MOCK_TRENDS.occupancy} color="#34d399" />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ── Per-Resource Occupancy Cards ── */}
          {stats?.occupancyRates && Object.keys(stats.occupancyRates).length > 0 && (
            <div className="mb-8">
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">Resource Occupancy Breakdown</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {Object.entries(stats.occupancyRates).map(([id, stat]) => {
                  const pct = Math.min(stat.rate, 100);
                  const barColor = pct > 80 ? 'bg-red-500' : pct > 50 ? 'bg-amber-400' : 'bg-emerald-500';
                  return (
                    <div key={id} className="bg-white rounded-xl p-5 border border-slate-100 shadow-sm hover:shadow-md hover:border-slate-200 transition-all duration-200">
                      <div className="flex items-center justify-between mb-3">
                        <p className="text-sm font-bold text-slate-800 truncate">{stat.name}</p>
                        <span className={`text-sm font-black ${pct > 80 ? 'text-red-600' : pct > 50 ? 'text-amber-600' : 'text-emerald-600'}`}>{pct.toFixed(1)}%</span>
                      </div>
                      <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                        <div className={`h-full rounded-full transition-all duration-700 ease-out ${barColor}`} style={{ width: `${pct}%` }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* ── Resource Management Matrix ── */}
          <div>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
              <div className="flex items-center gap-2">
                <Database className="w-4 h-4 text-slate-500" />
                <h2 className="text-base font-bold text-slate-900 tracking-tight">Resource Matrix</h2>
                <span className="text-xs font-bold text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">{processedResources.length}</span>
              </div>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <Search size={14} />
                </div>
                <input
                  type="text"
                  placeholder="Search assets…"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full sm:w-56 pl-8 pr-4 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-cyan-400/40 focus:border-cyan-400 outline-none shadow-sm transition-all placeholder:text-slate-400"
                />
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden shadow-sm">
              {/* Header */}
              <div className="grid grid-cols-[1fr_120px_140px_160px] border-b border-slate-100 bg-slate-50/70">
                <button className="px-5 py-3 text-left text-[11px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1 hover:text-slate-600 transition-colors" onClick={() => handleSort('name')}>
                  Asset Name <ArrowUpDown className="w-3 h-3" />
                </button>
                <button className="px-4 py-3 text-left text-[11px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1 hover:text-slate-600 transition-colors" onClick={() => handleSort('type')}>
                  Type <ArrowUpDown className="w-3 h-3" />
                </button>
                <button className="px-4 py-3 text-left text-[11px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1 hover:text-slate-600 transition-colors" onClick={() => handleSort('status')}>
                  Status <ArrowUpDown className="w-3 h-3" />
                </button>
                <div className="px-4 py-3 text-right text-[11px] font-bold text-slate-400 uppercase tracking-widest">Control</div>
              </div>

              {/* Body */}
              {processedResources.length === 0 ? (
                <div className="py-16 text-center text-slate-400 text-sm font-medium">No assets match your search.</div>
              ) : (
                <div className="divide-y divide-slate-50">
                  {processedResources.map(resource => (
                    <div key={resource.id} className="grid grid-cols-[1fr_120px_140px_160px] items-center hover:bg-slate-800/[0.02] transition-colors duration-150 group">
                      <div className="px-5 py-4">
                        <p className="text-sm font-semibold text-slate-900">{resource.name}</p>
                      </div>
                      <div className="px-4 py-4">
                        <span className="text-xs font-bold text-slate-500 bg-slate-100 px-2.5 py-1 rounded-md">{resource.type}</span>
                      </div>
                      <div className="px-4 py-4">
                        {resource.status === 'ACTIVE' ? (
                          <span className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-full">
                            <span className="relative flex h-1.5 w-1.5">
                              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                              <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500" />
                            </span>
                            Active
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 text-xs font-bold text-amber-700 bg-amber-50 border border-amber-200 px-2.5 py-1 rounded-full">
                            <Wrench className="w-2.5 h-2.5" />
                            Maintenance
                          </span>
                        )}
                      </div>
                      <div className="px-4 py-4 text-right">
                        <button
                          onClick={() => requestStatusToggle(resource)}
                          className={`text-xs font-bold px-3.5 py-1.5 rounded-lg border transition-all duration-150 active:scale-95
                            ${resource.status === 'ACTIVE'
                              ? 'text-amber-600 border-amber-200 bg-amber-50 hover:bg-amber-100 hover:border-amber-300'
                              : 'text-emerald-600 border-emerald-200 bg-emerald-50 hover:bg-emerald-100 hover:border-emerald-300'
                            }`}
                        >
                          {resource.status === 'ACTIVE' ? '→ Maintenance' : '→ Activate'}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </>
      )}

      {/* ── Confirmation Modal ── */}
      {confirmModal?.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm" onClick={() => setConfirmModal(null)} />
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md relative z-10 overflow-hidden border border-slate-100">
            <div className="p-6">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-12 h-12 rounded-full bg-amber-100 flex items-center justify-center flex-shrink-0 text-amber-600">
                  <AlertTriangle size={22} />
                </div>
                <h3 className="text-lg font-bold text-slate-900">{confirmModal.title}</h3>
              </div>
              <p className="text-slate-500 text-sm leading-relaxed mb-8">{confirmModal.message}</p>
              <div className="flex gap-3 justify-end">
                <button
                  onClick={() => setConfirmModal(null)}
                  className="px-4 py-2 text-sm font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors active:scale-95"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmModal.onConfirm}
                  className="px-5 py-2 text-sm font-semibold text-white bg-amber-600 hover:bg-amber-700 rounded-lg shadow-sm transition-all active:scale-95"
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
