import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:8081/api',
  timeout: 10000,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const config = error.config;
    
    // 401 Unauthorized handling
    if (error.response && error.response.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('role');
      localStorage.removeItem('username');
      if (api.defaults.headers.common) {
        delete api.defaults.headers.common['Authorization'];
      }
      window.location.href = '/login';
      return Promise.reject(error);
    }

    // 5xx Retry logic (Retry exactly once)
    if (error.response && error.response.status >= 500 && !config._retry) {
      config._retry = true;
      // Brief delay before retrying (e.g., 500ms)
      await new Promise(resolve => setTimeout(resolve, 500));
      return api(config);
    }

    return Promise.reject(error);
  }
);

export default api;
