import axios from 'axios';

/*const api = axios.create({
  baseURL: '/api',
  headers: { 'Content-Type': 'application/json' },
});
*/
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api'
});

// Add auth token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('ssfowa_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle 401 responses
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('ssfowa_token');
      localStorage.removeItem('ssfowa_user');
      if (window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export default api;
