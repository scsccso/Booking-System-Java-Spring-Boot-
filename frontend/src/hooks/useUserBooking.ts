import { useState, useEffect } from 'react';
import api from '../api';
import type { Resource, Booking, ApiResponse } from '../types';

export function useUserBooking() {
  const [resources, setResources] = useState<Resource[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [myBookings, setMyBookings] = useState<Booking[]>([]);
  
  // Ensure we use local time formatted as YYYY-MM-DD
  const todayStr = new Date().toLocaleDateString('en-CA');
  const [selectedDate, setSelectedDate] = useState<string>(todayStr);
  
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [flashSlots, setFlashSlots] = useState<{resourceId: number, hour: number, type: 'booked' | 'freed'}[]>([]);

  useEffect(() => {
    fetchData();
  }, [selectedDate]);

  useEffect(() => {
    const eventSource = new EventSource('http://localhost:8081/api/bookings/stream');
    
    eventSource.addEventListener('message', (event) => {
      const data = JSON.parse(event.data);
      
      if (data.id === -1) {
          setResources(prev => prev.map(r => 
              r.id === data.resourceId 
                ? { ...r, status: data.status === 'CONFIRMED' ? 'ACTIVE' : 'MAINTENANCE' } 
                : r
          ));
          return;
      }

      if (data.bookingDate === selectedDate) {
        // Trigger Flash Animation
        for (let h = data.startHour; h < data.endHour; h++) {
           setFlashSlots(prev => [...prev, {
             resourceId: data.resourceId,
             hour: h,
             type: data.status === 'CONFIRMED' ? 'booked' : 'freed'
           }]);
           // Automatically remove the flash state after 1.5s
           setTimeout(() => {
             setFlashSlots(prev => prev.filter(f => !(f.resourceId === data.resourceId && f.hour === h)));
           }, 1500);
        }

        setBookings(prevBookings => {
          if (data.status === 'CONFIRMED') {
            if (!prevBookings.find(b => b.id === data.id)) {
              const resource = resources.find(r => r.id === data.resourceId);
              if (resource) {
                return [...prevBookings, { ...data, resource }];
              }
            }
          } else if (data.status === 'CANCELLED') {
            return prevBookings.filter(b => b.id !== data.id);
          }
          return prevBookings;
        });
      }
      
      // Sync myBookings
      const currentUsername = localStorage.getItem('username') || 'user01';
      if (data.userId === currentUsername) {
        setMyBookings(prevMyBookings => {
          if (data.status === 'CONFIRMED') {
             if (!prevMyBookings.find(b => b.id === data.id)) {
               const resource = resources.find(r => r.id === data.resourceId);
               if (resource) {
                 return [...prevMyBookings, { ...data, resource }];
               }
             }
          } else if (data.status === 'CANCELLED') {
             return prevMyBookings.filter(b => b.id !== data.id);
          }
          return prevMyBookings;
        });
      }
    });

    return () => eventSource.close();
  }, [selectedDate, resources]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const username = localStorage.getItem('username') || 'user01';
      const [resRes, bookRes, myRes] = await Promise.all([
        api.get<ApiResponse<Resource[]>>('/bookings/resources'),
        api.get<ApiResponse<Booking[]>>(`/bookings?date=${selectedDate}`),
        api.get<ApiResponse<Booking[]>>(`/bookings/my?userId=${username}`)
      ]);
      setResources(resRes.data.data);
      setBookings(bookRes.data.data);
      setMyBookings(myRes.data.data);
    } catch (err) {
      console.error(err);
      setErrorMsg('Failed to load booking data.');
    } finally {
      setLoading(false);
    }
  };

  const isBooked = (resourceId: number, hour: number) => {
    return bookings?.some(b => 
      b.resource.id === resourceId && 
      b.startHour <= hour && 
      b.endHour > hour &&
      b.status === 'CONFIRMED'
    ) ?? false;
  };
  
  // Calculate remaining quota for today
  const dailyQuota = 4;
  const totalHoursInMyBookingsForToday = myBookings
    .filter(b => b.bookingDate === todayStr && b.status === 'CONFIRMED')
    .reduce((sum, b) => sum + (b.endHour - b.startHour), 0);
  const remainingQuota = dailyQuota - totalHoursInMyBookingsForToday;

  const validateAndSubmit = async (resourceId: number, startHour: number, endHour: number) => {
    setErrorMsg(null);
    setSuccessMsg(null);
    
    // Business Rule 1: Cannot book past dates
    if (selectedDate < todayStr) {
      setErrorMsg('Cannot book resources in the past.');
      return false;
    }

    const requestedHours = endHour - startHour;

    // Business Rule 2: Enforce daily quota
    if (selectedDate === todayStr && requestedHours > remainingQuota) {
      setErrorMsg(`Daily booking limit of 4 hours exceeded. You have ${remainingQuota} hours remaining today.`);
      return false;
    }

    setSubmitting(true);
    try {
      const res = await api.post<ApiResponse<Booking>>('/bookings', {
        resourceId,
        userId: localStorage.getItem('username') || 'user01',
        bookingDate: selectedDate,
        startHour,
        endHour
      });
      
      setBookings(prev => [...prev, res.data.data]);
      setMyBookings(prev => [...prev, res.data.data]);
      setSuccessMsg('Booking confirmed successfully!');
      return true;
    } catch (err: any) {
      if (err.response?.status === 409) {
        setErrorMsg('Conflict: This slot was just booked by someone else.');
      } else if (err.response?.data?.message) {
        setErrorMsg(err.response.data.message);
      } else {
        setErrorMsg('An error occurred during booking.');
      }
      return false;
    } finally {
      setSubmitting(false);
    }
  };
  
  const cancelMyBooking = async (bookingId: number) => {
      setErrorMsg(null);
      setSuccessMsg(null);
      try {
          const username = localStorage.getItem('username') || 'user01';
          await api.put(`/bookings/${bookingId}/cancel?userId=${username}`);
          setSuccessMsg('Booking cancelled successfully.');
          
          setBookings(prev => prev.filter(b => b.id !== bookingId));
          setMyBookings(prev => prev.filter(b => b.id !== bookingId));
      } catch (err: any) {
          if (err.response?.data?.message) {
            setErrorMsg(err.response.data.message);
          } else {
            setErrorMsg('Failed to cancel booking.');
          }
      }
  };

  // Business Rule 3: Only expose ACTIVE resources
  const activeResources = resources.filter(r => r.status === 'ACTIVE');

  return {
    resources: activeResources,
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
    clearMessages: () => { setErrorMsg(null); setSuccessMsg(null); }
  };
}
