import { useState, useEffect } from 'react';
import api from '../api';
import type { ApiResponse, DashboardStats, Resource } from '../types';

export function useAdminManagement() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [resources, setResources] = useState<Resource[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  useEffect(() => {
    fetchStats();
    fetchResources();
  }, [selectedDate]);

  useEffect(() => {
    const eventSource = new EventSource('http://localhost:8081/api/bookings/stream');
    
    eventSource.addEventListener('message', (event) => {
      const data = JSON.parse(event.data);
      
      if (data.id === -1) {
          // Resource status update
          setResources(prev => prev.map(r => 
              r.id === data.resourceId 
                ? { ...r, status: data.status === 'CONFIRMED' ? 'ACTIVE' : 'MAINTENANCE' } 
                : r
          ));
          return;
      }

      if (data.bookingDate === selectedDate) {
        setStats(prevStats => {
          if (!prevStats) return prevStats;
          
          const newStats = { 
             ...prevStats,
             occupancyRates: { ...prevStats.occupancyRates }
          };
          
          const hours = data.endHour - data.startHour;
          
          if (newStats.occupancyRates[data.resourceId]) {
            const currentStat = newStats.occupancyRates[data.resourceId];
            
            const currentBookedHours = Math.round((currentStat.rate / 100) * 9.0);
            let newBookedHours = currentBookedHours;
            
            if (data.status === 'CONFIRMED') {
                newBookedHours += hours;
                newStats.totalBookings += 1;
            } else if (data.status === 'CANCELLED') {
                newBookedHours -= hours;
                newStats.totalBookings -= 1;
            }
            
            const newRate = (newBookedHours / 9.0) * 100;
            newStats.occupancyRates[data.resourceId] = {
               ...currentStat,
               rate: Math.max(0, newRate)
            };
          }
          
          return newStats;
        });
      }
    });

    return () => eventSource.close();
  }, [selectedDate]);

  const fetchStats = async () => {
    setLoading(true);
    setErrorMsg(null);
    try {
      const res = await api.get<ApiResponse<DashboardStats>>(`/admin/dashboard?date=${selectedDate}`);
      setStats(res.data.data);
    } catch (err) {
      console.error(err);
      setErrorMsg('Failed to load dashboard data.');
    } finally {
      setLoading(false);
    }
  };

  const fetchResources = async () => {
    try {
      const res = await api.get<ApiResponse<Resource[]>>('/bookings/resources');
      setResources(res.data.data);
    } catch (err) {
      console.error(err);
    }
  };

  const cancelBooking = async (id: number) => {
    setErrorMsg(null);
    setSuccessMsg(null);
    try {
      await api.delete(`/admin/bookings/${id}`);
      setSuccessMsg('Booking cancelled successfully.');
      // SSE will handle local state update
    } catch (err: any) {
      setErrorMsg(err.response?.data?.message || 'Failed to cancel booking.');
    }
  };

  const toggleResourceStatus = async (id: number, currentStatus: 'ACTIVE' | 'MAINTENANCE') => {
    setErrorMsg(null);
    setSuccessMsg(null);
    const newStatus = currentStatus === 'ACTIVE' ? 'MAINTENANCE' : 'ACTIVE';
    try {
      await api.put(`/admin/resources/${id}/status`, { status: newStatus });
      setSuccessMsg(`Resource status updated to ${newStatus}.`);
      // SSE will handle local state update
    } catch (err: any) {
      setErrorMsg(err.response?.data?.message || 'Failed to update resource status.');
    }
  };

  return {
    stats,
    resources,
    selectedDate,
    setSelectedDate,
    loading,
    errorMsg,
    successMsg,
    cancelBooking,
    toggleResourceStatus,
    clearMessages: () => { setErrorMsg(null); setSuccessMsg(null); }
  };
}
