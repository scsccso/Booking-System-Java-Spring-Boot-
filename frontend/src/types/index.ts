export interface Resource {
  id: number;
  name: string;
  type: 'DESK' | 'ROOM';
  status: 'ACTIVE' | 'MAINTENANCE';
}

export interface Booking {
  id: number;
  resource: Resource;
  userId: string;
  bookingDate: string;
  startHour: number;
  endHour: number;
  status: 'CONFIRMED' | 'CANCELLED';
}

export interface DashboardStats {
  totalBookings: number;
  occupancyRates: Record<number, ResourceStat>;
}

export interface ResourceStat {
  name: string;
  rate: number;
}

export interface ApiResponse<T> {
  code: number;
  message: string;
  data: T;
}

export interface User {
  username: string;
  role: 'USER' | 'ADMIN';
}

export interface LoginResponse {
  token: string;
  username: string;
  role: 'USER' | 'ADMIN';
}
