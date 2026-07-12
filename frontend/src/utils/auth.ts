import api from '../api';

export const logout = (navigate: (path: string) => void, isAdmin: boolean = false) => {
  // Clear local storage items
  localStorage.removeItem('token');
  localStorage.removeItem('role');
  localStorage.removeItem('username');

  // Explicitly delete any common Authorization headers from Axios
  if (api.defaults.headers.common) {
    delete api.defaults.headers.common['Authorization'];
  }

  // Navigate back to the corresponding login page
  navigate(isAdmin ? '/admin/login' : '/login');
};
