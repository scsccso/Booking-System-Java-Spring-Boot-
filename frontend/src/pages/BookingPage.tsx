import { useState } from 'react';
import { Monitor, Users, AlertCircle, CheckCircle, Clock, Trash2, Calendar, CalendarX, ChevronRight, ChevronLeft } from 'lucide-react';
import { useUserBooking } from '../hooks/useUserBooking';

const HOURS = Array.from({ length: 9 }, (_, i) => i + 9); // 9 to 17

// 2. RESOURCE_METADATA_MAP
const RESOURCE_METADATA_MAP: Record<string, { icon: React.ReactNode, meta: string, bgClass: string, textClass: string }> = {
  'ROOM': {
    icon: <Users size={20} />,
    meta: '👥 8 人间 · 🖥️ 4K 投影',
    bgClass: 'bg-indigo-50 group-hover:bg-indigo-100',
    textClass: 'text-indigo-600'
  },
  'DESK': {
    icon: <Monitor size={20} />,
    meta: '🔌 独立双插 · 🪟 靠窗',
    bgClass: 'bg-emerald-50 group-hover:bg-emerald-100',
    textClass: 'text-emerald-600'
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

  // Modal State
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

  // 1. Generate next 7 days for the date slider
  const next7Days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() + i);
    return {
      dateStr: d.toLocaleDateString('en-CA'),
      dayName: i === 0 ? '今天' : i === 1 ? '明天' : d.toLocaleDateString('zh-CN', { weekday: 'short' }),
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
    if (success) {
      setSelectedSlot(null);
    }
  };

  const selectedResource = selectedSlot ? resources.find(r => r.id === selectedSlot.resourceId) : null;
  const isQuotaExceeded = selectedSlot && (selectedDate === todayStr && selectedSlot.duration > remainingQuota);

  return (
    <div className="max-w-[1400px] mx-auto p-4 sm:p-6 my-4">
      
      <div className="flex flex-col xl:flex-row gap-6 items-start">
        
        {/* LEFT PANE: 70% GRID */}
        <div className="w-full xl:w-[70%]">
          
          {/* Header & 7-Day Date Slider */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden mb-6 p-5">
            <h1 className="text-2xl font-extrabold text-gray-900 tracking-tight mb-4">Workspace Grid</h1>
            <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
              {next7Days.map(day => {
                const isSelected = selectedDate === day.dateStr;
                
                // Capacity logic calculation (rough estimate for the dot)
                // In a real app we might fetch this aggregate from backend, but here we estimate based on loaded bookings if it's the selected day
                // Actually since `bookings` is only for `selectedDate`, we can only show real dot for selectedDate, or fake it for others. 
                // We'll calculate accurately for the selected date, and assume green for others just for visual demonstration, or fetch per day.
                let dotColor = 'bg-gray-300';
                if (isSelected && resources.length > 0) {
                    const totalSlots = resources.length * HOURS.length;
                    const bookedSlots = bookings.length;
                    const ratio = bookedSlots / totalSlots;
                    if (ratio > 0.8) dotColor = 'bg-red-500';
                    else if (ratio > 0.5) dotColor = 'bg-yellow-400';
                    else dotColor = 'bg-green-500';
                } else {
                    // Placeholder for non-loaded dates
                    dotColor = 'bg-green-400';
                }

                return (
                  <button
                    key={day.dateStr}
                    onClick={() => { setSelectedDate(day.dateStr); setSelectedSlot(null); }}
                    className={`
                      flex-shrink-0 w-20 py-3 rounded-xl flex flex-col items-center justify-center transition-all duration-300 border-2
                      ${isSelected ? 'border-orange-500 bg-orange-50 shadow-sm shadow-orange-500/20' : 'border-transparent hover:bg-gray-50 hover:border-gray-200 bg-white'}
                    `}
                  >
                    <span className={`text-[11px] font-bold tracking-widest uppercase ${isSelected ? 'text-orange-600' : 'text-gray-400'}`}>
                      {day.dayName}
                    </span>
                    <span className={`text-xl font-black mt-1 ${isSelected ? 'text-orange-700' : 'text-gray-700'}`}>
                      {day.dayNum}
                    </span>
                    <div className={`w-1.5 h-1.5 rounded-full mt-2 transition-colors ${dotColor}`}></div>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
            {loading ? (
              /* 3. SKELETON LOADER */
              <div className="p-6">
                 <div className="flex border-b border-gray-100 pb-4 mb-4">
                  <div className="w-56 text-xs font-bold text-gray-300 uppercase tracking-widest px-2">Resource</div>
                  {HOURS.map(h => <div key={h} className="flex-1 text-center text-xs font-bold text-gray-300">{h}:00</div>)}
                 </div>
                 <div className="space-y-4">
                   {Array.from({length: 5}).map((_, idx) => (
                     <div key={idx} className="flex items-center">
                       <div className="w-56 flex items-center pr-4">
                         <div className="w-10 h-10 bg-gray-200 rounded-xl mr-3 animate-pulse"></div>
                         <div className="space-y-2 flex-1">
                           <div className="h-4 bg-gray-200 rounded w-2/3 animate-pulse"></div>
                           <div className="h-2 bg-gray-100 rounded w-1/2 animate-pulse"></div>
                         </div>
                       </div>
                       {HOURS.map(h => (
                          <div key={h} className="flex-1 px-1 h-12">
                            <div className="w-full h-full bg-gray-100 rounded-xl animate-pulse delay-75"></div>
                          </div>
                       ))}
                     </div>
                   ))}
                 </div>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <div className="min-w-[800px] p-6">
                  {/* Header row */}
                  <div className="flex border-b border-gray-100 pb-4 mb-4">
                    <div className="w-64 text-xs font-bold text-gray-400 uppercase tracking-widest px-2">Resource Asset</div>
                    {HOURS.map(h => (
                      <div key={h} className="flex-1 text-center text-xs font-bold text-gray-400">
                        {h}:00
                      </div>
                    ))}
                  </div>

                  {/* Grid rows */}
                  <div className="space-y-4">
                    {resources.length === 0 && (
                       <div className="text-center py-10 text-gray-400 text-sm font-medium">No active resources available for booking.</div>
                    )}
                    {resources.map(resource => {
                      const meta = RESOURCE_METADATA_MAP[resource.type] || RESOURCE_METADATA_MAP['DESK'];
                      return (
                      <div key={resource.id} className="flex items-center group transition-opacity duration-500">
                        <div className="w-64 flex items-center pr-4">
                          <div className={`p-2.5 rounded-xl mr-3 shadow-sm transition-colors ${meta.bgClass} ${meta.textClass}`}>
                            {meta.icon}
                          </div>
                          <div>
                            <div className="text-sm font-bold text-gray-800">{resource.name}</div>
                            <div className="text-[10px] font-bold text-gray-400 mt-0.5">{meta.meta}</div>
                          </div>
                        </div>
                        
                        {HOURS.map(h => {
                          const booked = isBooked(resource.id, h);
                          const isSelected = selectedSlot?.resourceId === resource.id && 
                                             h >= selectedSlot.hour && 
                                             h < selectedSlot.hour + selectedSlot.duration;
                                             
                          // 4. FLASH HIGHLIGHT LOGIC
                          const flashEntry = flashSlots.find(f => f.resourceId === resource.id && f.hour === h);
                          const flashClass = flashEntry 
                              ? (flashEntry.type === 'booked' ? 'animate-flash-red' : 'animate-flash-green') 
                              : '';
                          
                          return (
                            <div key={h} className="flex-1 px-1 h-12">
                              <button
                                onClick={() => handleSlotClick(resource.id, h)}
                                disabled={booked}
                                className={`
                                  w-full h-full rounded-xl border transition-all duration-300 relative overflow-hidden focus:outline-none
                                  ${flashClass}
                                  ${booked 
                                    ? (flashEntry?.type === 'booked' ? '' : 'bg-gray-100/80 border-gray-200/60 cursor-not-allowed')
                                    : isSelected 
                                      ? 'bg-orange-500 border-orange-500 shadow-lg shadow-orange-500/30 scale-105 z-10 text-white' 
                                      : (flashEntry?.type === 'freed' ? '' : 'bg-gray-50/50 border-gray-200 hover:border-orange-300 hover:bg-orange-50 hover:shadow-sm cursor-pointer')}
                                `}
                              >
                                {booked && !flashClass && (
                                  <div className="absolute inset-0 opacity-[0.15] bg-[repeating-linear-gradient(45deg,#000,#000_2px,transparent_2px,transparent_8px)]"></div>
                                )}
                              </button>
                            </div>
                          );
                        })}
                      </div>
                    )})}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* RIGHT PANE: 30% CONSOLE */}
        <div className="w-full xl:w-[30%] space-y-6 mt-6 xl:mt-0">
          
          {/* Intelligent Console Card */}
          <div className="bg-white rounded-2xl shadow-xl shadow-gray-200/50 border border-gray-100 overflow-hidden">
            <div className="bg-gradient-to-r from-orange-600 to-amber-500 p-5 text-white">
              <h2 className="font-bold text-lg flex items-center tracking-wide">
                <Clock className="w-5 h-5 mr-2" />
                Booking Console
              </h2>
            </div>
            
            <div className="p-6">
              {/* Daily Quota Indicator */}
              <div className="mb-6 bg-gray-50 rounded-xl p-4 border border-gray-100">
                <div className="flex justify-between items-end mb-2">
                  <span className="text-xs font-bold text-gray-500 uppercase tracking-wide">Daily Quota (Today)</span>
                  <span className="text-sm font-bold text-gray-900">{remainingQuota}h / {dailyQuota}h Left</span>
                </div>
                <div className="h-2 w-full bg-gray-200 rounded-full overflow-hidden">
                  <div 
                    className={`h-full transition-all duration-500 ${remainingQuota <= 1 ? 'bg-red-500' : 'bg-green-500'}`}
                    style={{ width: `${((dailyQuota - remainingQuota) / dailyQuota) * 100}%` }}
                  ></div>
                </div>
              </div>

              {errorMsg && (
                <div className="mb-4 p-3 bg-red-50 border border-red-100 text-red-600 rounded-lg text-sm font-medium flex items-start animate-in fade-in">
                  <AlertCircle className="w-4 h-4 mr-2 mt-0.5 flex-shrink-0" />
                  {errorMsg}
                </div>
              )}

              {successMsg && (
                <div className="mb-4 p-3 bg-green-50 border border-green-100 text-green-600 rounded-lg text-sm font-medium flex items-start animate-in fade-in">
                  <CheckCircle className="w-4 h-4 mr-2 mt-0.5 flex-shrink-0" />
                  {successMsg}
                </div>
              )}

              {selectedSlot ? (
                <div className="space-y-5 animate-in fade-in slide-in-from-bottom-2">
                  <div className="flex items-center gap-3 p-3 bg-orange-50 text-orange-800 rounded-xl border border-orange-100">
                    <div className="p-2 bg-white rounded-lg shadow-sm">
                      {selectedResource?.type === 'ROOM' ? <Users size={16} className="text-orange-600"/> : <Monitor size={16} className="text-orange-600"/>}
                    </div>
                    <div>
                      <div className="font-bold text-sm">{selectedResource?.name}</div>
                      <div className="text-xs opacity-80">{selectedSlot.hour}:00 Start Time</div>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-2">Duration (Hours)</label>
                    <select 
                      value={selectedSlot.duration}
                      onChange={(e) => setSelectedSlot({...selectedSlot, duration: parseInt(e.target.value)})}
                      className="w-full bg-white border border-gray-300 rounded-xl py-2.5 px-3 text-sm font-medium text-gray-700 focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none transition-all shadow-sm"
                    >
                      <option value={1}>1 Hour</option>
                      <option value={2}>2 Hours</option>
                      <option value={3}>3 Hours</option>
                      <option value={4}>4 Hours</option>
                    </select>
                  </div>

                  {isQuotaExceeded && (
                    <p className="text-xs font-bold text-red-500">
                      You only have {remainingQuota} hours left today. Please reduce duration.
                    </p>
                  )}

                  <div className="flex gap-3 pt-2">
                    <button 
                      onClick={() => setSelectedSlot(null)}
                      className="flex-1 py-2.5 text-sm font-bold text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-xl transition-colors"
                      disabled={submitting}
                    >
                      Cancel
                    </button>
                    <button 
                      onClick={handleConfirmBooking}
                      disabled={submitting || !!isQuotaExceeded}
                      className="flex-[2] py-2.5 text-sm font-bold text-white bg-orange-600 hover:bg-orange-700 rounded-xl shadow-lg shadow-orange-600/30 transition-all disabled:opacity-50 disabled:shadow-none flex justify-center items-center"
                    >
                      {submitting ? (
                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                      ) : (
                        'Confirm Booking'
                      )}
                    </button>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8 text-gray-400 border-2 border-dashed border-gray-200 rounded-xl bg-gray-50/50">
                  <Monitor className="w-8 h-8 mx-auto mb-2 opacity-30" />
                  <p className="text-sm font-medium">Select a slot on the grid to book.</p>
                </div>
              )}
            </div>
          </div>

          {/* My Itinerary Card */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden flex flex-col max-h-[500px]">
            <div className="p-5 border-b border-gray-100 flex items-center justify-between bg-gray-50">
              <h2 className="font-bold text-gray-800 flex items-center tracking-wide">
                <Calendar className="w-4 h-4 mr-2 text-gray-500" />
                My Itinerary
              </h2>
              <span className="bg-gray-200 text-gray-600 text-xs font-bold px-2.5 py-1 rounded-full">
                {myBookings.length}
              </span>
            </div>
            
            <div className="overflow-y-auto p-4 flex-1">
              {myBookings.length === 0 ? (
                /* 3. EMPTY STATE */
                <div className="text-center py-10 animate-in fade-in duration-500">
                  <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4 border border-gray-100">
                     <CalendarX className="w-8 h-8 text-gray-300" />
                  </div>
                  <p className="text-sm font-medium text-gray-500 leading-relaxed max-w-[200px] mx-auto">
                    今日暂无行程，从左侧网格中挑选一个工位开启高效一天吧！
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {myBookings.map(b => {
                    // Lock logic
                    const isToday = b.bookingDate === todayStr;
                    const isPastHour = isToday && currentHour >= b.startHour;
                    const isLocked = b.bookingDate < todayStr || isPastHour;

                    return (
                      <div key={b.id} className="p-4 bg-white border border-gray-100 hover:border-orange-200 rounded-xl shadow-sm hover:shadow-md transition-all group relative overflow-hidden">
                        {isLocked && (
                          <div className="absolute top-0 right-0 w-16 h-16 overflow-hidden">
                            <div className="absolute top-4 -right-5 bg-gray-200 text-gray-500 text-[9px] font-bold uppercase tracking-widest px-6 py-0.5 rotate-45 shadow-sm">
                              Locked
                            </div>
                          </div>
                        )}
                        <div className="flex justify-between items-start">
                          <div>
                            <div className="font-bold text-sm text-gray-900">{b.resource.name}</div>
                            <div className="text-xs text-gray-500 font-medium mt-1">
                              {b.bookingDate} &bull; {b.startHour}:00 - {b.endHour}:00
                            </div>
                          </div>
                          <button
                            onClick={() => requestCancelBooking(b)}
                            disabled={isLocked}
                            title={isLocked ? "Cannot cancel past or locked bookings" : "Cancel booking"}
                            className={`p-2 rounded-lg transition-colors ${
                              isLocked 
                                ? 'text-gray-300 cursor-not-allowed' 
                                : 'text-gray-400 hover:text-red-500 hover:bg-red-50'
                            }`}
                          >
                            <Trash2 size={16} />
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
      
      {/* Confirmation Modal */}
      {confirmModal && confirmModal.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-gray-900/40 backdrop-blur-sm" onClick={() => setConfirmModal(null)}></div>
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md relative z-10 overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-6">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0 text-red-600">
                  <AlertCircle size={24} />
                </div>
                <h3 className="text-xl font-bold text-gray-900">{confirmModal.title}</h3>
              </div>
              <p className="text-gray-600 text-sm leading-relaxed mb-8">{confirmModal.message}</p>
              
              <div className="flex gap-3 justify-end">
                <button 
                  onClick={() => setConfirmModal(null)}
                  className="px-4 py-2 font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                >
                  Keep Booking
                </button>
                <button 
                  onClick={confirmModal.onConfirm}
                  className="px-5 py-2 font-medium text-white bg-red-600 hover:bg-red-700 rounded-lg shadow-sm transition-colors"
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
