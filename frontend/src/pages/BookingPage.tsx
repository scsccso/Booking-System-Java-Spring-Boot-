import { useState } from 'react';
import { Monitor, Users, AlertCircle, CheckCircle, Clock, Trash2, Calendar, CalendarX, Zap } from 'lucide-react';
import { useUserBooking } from '../hooks/useUserBooking';

const HOURS = Array.from({ length: 9 }, (_, i) => i + 9); // 9 to 17

const RESOURCE_METADATA_MAP: Record<string, { icon: React.ReactNode, meta: string, accentBg: string, accentText: string }> = {
  'ROOM': {
    icon: <Users size={16} />,
    meta: '👥 8 Seats · 🖥️ 4K Projector',
    accentBg: 'bg-violet-100',
    accentText: 'text-violet-600',
  },
  'DESK': {
    icon: <Monitor size={16} />,
    meta: '🔌 Dual Outlets · 🪟 Window View',
    accentBg: 'bg-emerald-100',
    accentText: 'text-emerald-600',
  }
};

export default function BookingPage() {
  const {
    resources,
    bookings,
    myBookings,
    dailyQuota,
    remainingQuota,
    selectedDate,
    setSelectedDate,
    loading,
    errorMsg,
    successMsg,
    submitting,
    isBooked,
    validateAndSubmit,
    cancelMyBooking,
    flashSlots,
    clearMessages
  } = useUserBooking();

  const [selectedSlot, setSelectedSlot] = useState<{ resourceId: number, hour: number, duration: number } | null>(null);

  const todayStr = new Date().toLocaleDateString('en-CA');
  const currentHour = new Date().getHours();

  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
  } | null>(null);

  const requestCancelBooking = (booking: any) => {
    setConfirmModal({
      isOpen: true,
      title: 'Cancel Booking',
      message: `Are you sure you want to cancel your booking for ${booking.resource.name} at ${booking.startHour}:00? This action is irreversible.`,
      onConfirm: () => {
        cancelMyBooking(booking.id);
        setConfirmModal(null);
      }
    });
  };

  const next7Days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() + i);
    return {
      dateStr: d.toLocaleDateString('en-CA'),
      dayName: i === 0 ? 'Today' : i === 1 ? 'Tmrw' : d.toLocaleDateString('en-US', { weekday: 'short' }),
      dayNum: d.getDate()
    };
  });

  const handleSlotClick = (resourceId: number, hour: number) => {
    if (isBooked(resourceId, hour)) return;
    clearMessages();
    setSelectedSlot({ resourceId, hour, duration: 1 });
  };

  const handleConfirmBooking = async () => {
    if (!selectedSlot) return;
    const success = await validateAndSubmit(
      selectedSlot.resourceId,
      selectedSlot.hour,
      selectedSlot.hour + selectedSlot.duration
    );
    if (success) setSelectedSlot(null);
  };

  const selectedResource = selectedSlot ? resources.find(r => r.id === selectedSlot.resourceId) : null;
  const isQuotaExceeded = selectedSlot && (selectedDate === todayStr && selectedSlot.duration > remainingQuota);
  const usedHours = dailyQuota - remainingQuota;
  const quotaPct = (usedHours / dailyQuota) * 100;

  return (
    <div className="max-w-[1400px] mx-auto p-4 sm:p-6 my-4">
      <div className="flex flex-col xl:flex-row gap-6 items-start">

        {/* ────────── LEFT PANE: GRID ────────── */}
        <div className="w-full xl:w-[70%]">

          {/* 7-Day Slider */}
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm mb-5 p-5">
            <div className="flex items-center justify-between mb-4">
              <h1 className="text-xl font-extrabold text-slate-900 tracking-tight">Workspace Grid</h1>
              <span className="text-xs font-bold text-slate-400 bg-slate-100 px-2.5 py-1 rounded-full tracking-wide">
                {selectedDate}
              </span>
            </div>
            <div className="flex gap-2 overflow-x-auto pb-1">
              {next7Days.map(day => {
                const isSelected = selectedDate === day.dateStr;
                let dotColor = 'bg-slate-200';
                if (isSelected && resources.length > 0) {
                  const ratio = bookings.length / (resources.length * HOURS.length);
                  dotColor = ratio > 0.8 ? 'bg-red-400' : ratio > 0.5 ? 'bg-amber-400' : 'bg-emerald-400';
                } else {
                  dotColor = 'bg-emerald-300';
                }
                return (
                  <button
                    key={day.dateStr}
                    onClick={() => { setSelectedDate(day.dateStr); setSelectedSlot(null); }}
                    className={`flex-shrink-0 w-[72px] py-3 rounded-xl flex flex-col items-center justify-center transition-all duration-200 border
                      ${isSelected
                        ? 'border-blue-500 bg-blue-600 shadow-lg shadow-blue-600/25'
                        : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50'
                      }`}
                  >
                    <span className={`text-[10px] font-black tracking-widest uppercase ${isSelected ? 'text-blue-200' : 'text-slate-400'}`}>
                      {day.dayName}
                    </span>
                    <span className={`text-lg font-black mt-0.5 ${isSelected ? 'text-white' : 'text-slate-700'}`}>
                      {day.dayNum}
                    </span>
                    <div className={`w-1 h-1 rounded-full mt-1.5 ${dotColor}`} />
                  </button>
                );
              })}
            </div>
          </div>

          {/* Grid Matrix */}
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
            {loading ? (
              <div className="p-6">
                <div className="flex border-b border-slate-100 pb-4 mb-4">
                  <div className="w-56 h-4 bg-slate-100 rounded animate-pulse" />
                  {HOURS.map(h => <div key={h} className="flex-1 mx-1 h-4 bg-slate-100 rounded animate-pulse" />)}
                </div>
                <div className="space-y-4">
                  {Array.from({ length: 4 }).map((_, idx) => (
                    <div key={idx} className="flex items-center gap-2">
                      <div className="w-56 h-12 bg-slate-100 rounded-xl animate-pulse" />
                      {HOURS.map(h => (
                        <div key={h} className="flex-1 h-12 bg-slate-100 rounded-xl animate-pulse" />
                      ))}
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <div className="min-w-[800px] p-5">
                  {/* Hour header */}
                  <div className="flex border-b border-slate-100 pb-3 mb-4">
                    <div className="w-60 text-[10px] font-black text-slate-300 uppercase tracking-[0.15em] px-2">Asset</div>
                    {HOURS.map(h => (
                      <div key={h} className="flex-1 text-center text-[10px] font-black text-slate-400 tracking-wide">
                        {h}:00
                      </div>
                    ))}
                  </div>

                  {/* Resource rows */}
                  <div className="space-y-3">
                    {resources.length === 0 && (
                      <div className="text-center py-12 text-slate-400 text-sm font-medium">No active resources available.</div>
                    )}
                    {resources.map(resource => {
                      const meta = RESOURCE_METADATA_MAP[resource.type] || RESOURCE_METADATA_MAP['DESK'];
                      return (
                        <div key={resource.id} className="flex items-center">
                          {/* Label */}
                          <div className="w-60 flex items-center gap-2.5 pr-4 flex-shrink-0">
                            <div className={`p-2 rounded-lg flex-shrink-0 ${meta.accentBg} ${meta.accentText}`}>
                              {meta.icon}
                            </div>
                            <div className="min-w-0">
                              <div className="text-xs font-bold text-slate-800 truncate">{resource.name}</div>
                              <div className="text-[9px] font-semibold text-slate-400 mt-0.5 truncate">{meta.meta}</div>
                            </div>
                          </div>

                          {/* Hour cells */}
                          {HOURS.map(h => {
                            const booked = isBooked(resource.id, h);
                            const isSelected = selectedSlot?.resourceId === resource.id &&
                              h >= selectedSlot.hour &&
                              h < selectedSlot.hour + selectedSlot.duration;

                            const flashEntry = flashSlots.find(f => f.resourceId === resource.id && f.hour === h);
                            const flashClass = flashEntry
                              ? (flashEntry.type === 'booked' ? 'animate-flash-red' : 'animate-flash-green')
                              : '';

                            return (
                              <div key={h} className="flex-1 px-[3px] h-11">
                                <button
                                  onClick={() => handleSlotClick(resource.id, h)}
                                  disabled={booked}
                                  className={`
                                    w-full h-full rounded-lg border relative overflow-hidden transition-all duration-200 focus:outline-none
                                    ${flashClass}
                                    ${booked
                                      ? (flashEntry?.type === 'booked' ? '' : 'cursor-not-allowed border-slate-200 bg-slate-100/60')
                                      : isSelected
                                        ? 'bg-blue-600 border-blue-500 shadow-[0_0_15px_rgba(37,99,235,0.45)] scale-105 z-10'
                                        : (flashEntry?.type === 'freed' ? '' : 'bg-white shadow-[inset_0_1px_2px_rgba(0,0,0,0.05)] border-slate-200 hover:border-blue-300 hover:bg-blue-50 cursor-pointer hover:scale-105')
                                    }
                                  `}
                                >
                                  {/* Diagonal stripe for booked cells */}
                                  {booked && !flashClass && (
                                    <div className="absolute inset-0 opacity-[0.12] bg-[repeating-linear-gradient(45deg,#334155,#334155_1.5px,transparent_1.5px,transparent_7px)]" />
                                  )}
                                </button>
                              </div>
                            );
                          })}
                        </div>
                      );
                    })}
                  </div>

                  {/* Legend */}
                  <div className="flex items-center gap-5 mt-5 pt-4 border-t border-slate-100">
                    <div className="flex items-center gap-1.5">
                      <div className="w-4 h-4 rounded bg-white border border-slate-200 shadow-[inset_0_1px_2px_rgba(0,0,0,0.05)]" />
                      <span className="text-[10px] font-semibold text-slate-400">Available</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <div className="w-4 h-4 rounded bg-slate-100 border border-slate-200 overflow-hidden relative">
                        <div className="absolute inset-0 opacity-20 bg-[repeating-linear-gradient(45deg,#334155,#334155_1.5px,transparent_1.5px,transparent_7px)]" />
                      </div>
                      <span className="text-[10px] font-semibold text-slate-400">Booked</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <div className="w-4 h-4 rounded bg-blue-600 border border-blue-500 shadow-[0_0_8px_rgba(37,99,235,0.4)]" />
                      <span className="text-[10px] font-semibold text-slate-400">Selected</span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* ────────── RIGHT PANE: CONSOLE ────────── */}
        <div className="w-full xl:w-[30%] space-y-5 mt-1 xl:mt-0 sticky top-4">

          {/* Glassmorphism Booking Console */}
          <div className="backdrop-blur-md bg-white/80 border border-slate-200/50 shadow-xl rounded-2xl overflow-hidden">
            <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-5 py-4">
              <h2 className="font-bold text-white flex items-center gap-2 tracking-wide text-sm">
                <Zap className="w-4 h-4" />
                Booking Console
              </h2>
            </div>

            <div className="p-5">
              {/* Quota Progress */}
              <div className="mb-5">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.12em]">Daily Quota</span>
                  <span className={`text-xs font-bold ${remainingQuota <= 1 ? 'text-red-500' : 'text-slate-600'}`}>
                    {remainingQuota}h remaining
                  </span>
                </div>
                <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ease-out ${
                      quotaPct >= 100 ? 'bg-red-500' : quotaPct > 60 ? 'bg-amber-400' : 'bg-emerald-500'
                    }`}
                    style={{ width: `${Math.min(quotaPct, 100)}%` }}
                  />
                </div>
                <div className="flex justify-between mt-1">
                  <span className="text-[9px] text-slate-400 font-semibold">{usedHours}h used</span>
                  <span className="text-[9px] text-slate-400 font-semibold">{dailyQuota}h limit</span>
                </div>
              </div>

              {/* Alerts */}
              {errorMsg && (
                <div className="mb-4 p-3 bg-red-50 border border-red-100 text-red-600 rounded-xl text-xs font-semibold flex items-start gap-2">
                  <AlertCircle className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" />
                  {errorMsg}
                </div>
              )}
              {successMsg && (
                <div className="mb-4 p-3 bg-emerald-50 border border-emerald-100 text-emerald-700 rounded-xl text-xs font-semibold flex items-start gap-2">
                  <CheckCircle className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" />
                  {successMsg}
                </div>
              )}

              {/* Selection UI */}
              {selectedSlot ? (
                <div className="space-y-4">
                  <div className="flex items-center gap-3 p-3.5 bg-blue-50 border border-blue-100 rounded-xl">
                    <div className="p-2 bg-white rounded-lg shadow-sm text-blue-600 flex-shrink-0">
                      {selectedResource?.type === 'ROOM' ? <Users size={14} /> : <Monitor size={14} />}
                    </div>
                    <div className="min-w-0">
                      <div className="font-bold text-xs text-blue-900 truncate">{selectedResource?.name}</div>
                      <div className="text-[10px] text-blue-500 font-semibold mt-0.5">{selectedSlot.hour}:00 start</div>
                    </div>
                  </div>

                  <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.12em] mb-1.5">Duration</label>
                    <select
                      value={selectedSlot.duration}
                      onChange={(e) => setSelectedSlot({ ...selectedSlot, duration: parseInt(e.target.value) })}
                      className="w-full bg-white border border-slate-200 rounded-xl py-2.5 px-3 text-sm font-semibold text-slate-700 focus:ring-2 focus:ring-blue-400/30 focus:border-blue-400 outline-none transition-all shadow-sm"
                    >
                      <option value={1}>1 Hour</option>
                      <option value={2}>2 Hours</option>
                      <option value={3}>3 Hours</option>
                      <option value={4}>4 Hours</option>
                    </select>
                  </div>

                  {isQuotaExceeded && (
                    <p className="text-[11px] font-bold text-red-500 animate-pulse">
                      ⚠ Only {remainingQuota}h remaining today. Please reduce duration.
                    </p>
                  )}

                  <div className="flex gap-2 pt-1">
                    <button
                      onClick={() => setSelectedSlot(null)}
                      disabled={submitting}
                      className="flex-1 py-2.5 text-xs font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl transition-all active:scale-95 duration-100 disabled:opacity-50"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleConfirmBooking}
                      disabled={submitting || !!isQuotaExceeded}
                      className="flex-[2] py-2.5 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-lg shadow-blue-600/30 transition-all active:scale-95 duration-100 disabled:opacity-50 disabled:shadow-none flex justify-center items-center gap-2"
                    >
                      {submitting ? (
                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      ) : 'Confirm Booking'}
                    </button>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8 border-2 border-dashed border-slate-200 rounded-xl bg-slate-50/50">
                  <div className="w-10 h-10 bg-slate-100 rounded-xl flex items-center justify-center mx-auto mb-3">
                    <Monitor className="w-5 h-5 text-slate-300" />
                  </div>
                  <p className="text-xs font-semibold text-slate-400 leading-relaxed">Click any available cell<br />on the grid to begin.</p>
                </div>
              )}
            </div>
          </div>

          {/* My Itinerary */}
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden flex flex-col max-h-[460px]">
            <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
              <h2 className="font-bold text-slate-800 flex items-center gap-2 text-sm tracking-tight">
                <Calendar className="w-4 h-4 text-slate-400" />
                My Itinerary
              </h2>
              <span className="bg-slate-100 text-slate-600 text-[10px] font-black px-2 py-0.5 rounded-full">
                {myBookings.length}
              </span>
            </div>

            <div className="overflow-y-auto p-4 flex-1">
              {myBookings.length === 0 ? (
                <div className="text-center py-10">
                  <div className="w-14 h-14 bg-slate-50 rounded-2xl flex items-center justify-center mx-auto mb-3 border border-slate-100">
                    <CalendarX className="w-6 h-6 text-slate-300" />
                  </div>
                  <p className="text-xs font-semibold text-slate-400 leading-relaxed max-w-[200px] mx-auto">
                    No scheduled sessions yet. Book a workspace above to get started!
                  </p>
                </div>
              ) : (
                <div className="space-y-2.5">
                  {myBookings.map(b => {
                    const isToday = b.bookingDate === todayStr;
                    const isPastHour = isToday && currentHour >= b.startHour;
                    const isLocked = b.bookingDate < todayStr || isPastHour;

                    return (
                      <div key={b.id} className={`p-3.5 rounded-xl border transition-all duration-200 relative overflow-hidden
                        ${isLocked ? 'bg-slate-50 border-slate-200' : 'bg-white border-slate-200 hover:border-blue-200 hover:shadow-sm'}`}
                      >
                        {isLocked && (
                          <div className="absolute top-0 right-0 w-12 h-12 overflow-hidden">
                            <div className="absolute top-3 -right-4 bg-slate-300 text-slate-600 text-[8px] font-black uppercase tracking-widest px-5 py-0.5 rotate-45">
                              Locked
                            </div>
                          </div>
                        )}
                        <div className="flex justify-between items-start">
                          <div className="min-w-0 pr-2">
                            <div className="font-bold text-xs text-slate-900 truncate">{b.resource.name}</div>
                            <div className="text-[10px] text-slate-400 font-semibold mt-0.5">
                              {b.bookingDate} · {b.startHour}:00 – {b.endHour}:00
                            </div>
                          </div>
                          <button
                            onClick={() => requestCancelBooking(b)}
                            disabled={isLocked}
                            title={isLocked ? 'Cannot cancel locked bookings' : 'Cancel booking'}
                            className={`p-1.5 rounded-lg transition-all flex-shrink-0 active:scale-95 duration-100 ${
                              isLocked
                                ? 'text-slate-300 cursor-not-allowed'
                                : 'text-slate-400 hover:text-red-500 hover:bg-red-50'
                            }`}
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ── Confirmation Modal ── */}
      {confirmModal?.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => setConfirmModal(null)} />
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md relative z-10 overflow-hidden border border-slate-100">
            <div className="p-6">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-11 h-11 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0 text-red-500">
                  <AlertCircle size={20} />
                </div>
                <h3 className="text-base font-bold text-slate-900">{confirmModal.title}</h3>
              </div>
              <p className="text-slate-500 text-sm leading-relaxed mb-7">{confirmModal.message}</p>
              <div className="flex gap-3 justify-end">
                <button
                  onClick={() => setConfirmModal(null)}
                  className="px-4 py-2 text-sm font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl transition-all active:scale-95 duration-100"
                >
                  Keep Booking
                </button>
                <button
                  onClick={confirmModal.onConfirm}
                  className="px-5 py-2 text-sm font-semibold text-white bg-red-600 hover:bg-red-700 rounded-xl shadow-sm transition-all active:scale-95 duration-100"
                >
                  Confirm Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
