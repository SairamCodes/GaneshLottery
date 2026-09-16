import axios from 'axios';

// Ensure this matches the backend URL
let rawUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';
// Remove trailing slashes
rawUrl = rawUrl.replace(/\/+$/, '');
// Ensure it ends with /api
export const API_URL = rawUrl.endsWith('/api') ? rawUrl : `${rawUrl}/api`;

const api = axios.create({
  baseURL: API_URL,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('admin_token');
  if (token && config.url?.startsWith('/admin')) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default api;
