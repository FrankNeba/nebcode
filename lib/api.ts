import axios from 'axios';
import Cookies from 'js-cookie';

const BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

export const api = axios.create({
  baseURL: `${BASE}/api/v1`,
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.request.use((cfg) => {
  const token = Cookies.get('access_token');
  if (token) cfg.headers.Authorization = `Bearer ${token}`;
  
  if (typeof window !== 'undefined') {
    const deviceId = localStorage.getItem('nebcode_device_id');
    if (deviceId) {
      cfg.headers['X-Device-ID'] = deviceId;
    }
  }
  return cfg;
});

api.interceptors.response.use(
  (r) => r,
  async (err) => {
    const orig = err.config;
    if (err.response?.status === 401 && !orig._retry) {
      orig._retry = true;
      const refresh = Cookies.get('refresh_token');
      if (refresh) {
        try {
          const { data } = await axios.post(`${BASE}/api/v1/auth/token/refresh/`, { refresh });
          Cookies.set('access_token', data.access, { expires: 1 });
          orig.headers.Authorization = `Bearer ${data.access}`;
          return api(orig);
        } catch {
          handleLogout();
        }
      } else {
        handleLogout();
      }
    }
    return Promise.reject(err);
  }
);

function handleLogout() {
  Cookies.remove('access_token');
  Cookies.remove('refresh_token');
  if (typeof window !== 'undefined' && !window.location.pathname.includes('/auth/login')) {
    window.location.href = '/auth/login';
  }
}

export const getWsUrl = (path: string) => {
  const token = Cookies.get('access_token');
  const base = (process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:8000').replace(/\/$/, '');
  return `${base}${path}?token=${token}`;
};

export default api;
