import axios from 'axios';

const api = axios.create({
  baseURL: '', // Proxied through Vite
  headers: {
    'Content-Type': 'application/json'
  }
});

// Request Interceptor: Attach Auth Token if present
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('rv_access_token');
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response Interceptor: Handle JWT Expirations & refreshes
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      try {
        const refreshToken = localStorage.getItem('rv_refresh_token');
        if (!refreshToken) {
          throw new Error('No refresh token available');
        }

        const res = await axios.post('/api/auth/refresh', { refreshToken });
        const { accessToken, refreshToken: newRefresh } = res.data;

        localStorage.setItem('rv_access_token', accessToken);
        localStorage.setItem('rv_refresh_token', newRefresh);

        originalRequest.headers.Authorization = `Bearer ${accessToken}`;
        return api(originalRequest);
      } catch (err) {
        console.warn('Authentication token refresh failed - logging out user');
        localStorage.removeItem('rv_access_token');
        localStorage.removeItem('rv_refresh_token');
        localStorage.removeItem('rv_user');
        window.location.reload();
      }
    }
    return Promise.reject(error);
  }
);

export default api;
