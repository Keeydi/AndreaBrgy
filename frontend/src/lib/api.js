import axios from 'axios';

const API_URL = process.env.REACT_APP_BACKEND_URL || 'http://localhost:8000/api';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add auth token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle 401 errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Auth
export const authAPI = {
  register: (data) => api.post('/auth/register', data),
  login: (data) => api.post('/auth/login', data),
  getMe: () => api.get('/auth/me'),
};

// Alerts
export const alertsAPI = {
  getAll: () => api.get('/alerts'),
  getNew: (since) => api.get('/alerts/new', { params: { since } }),
  create: (data) => api.post('/alerts', data),
};

// Reports
export const reportsAPI = {
  getAll: () => api.get('/reports'),
  create: (data) => api.post('/reports', data),
  updateStatus: (id, data) => api.put(`/reports/${id}/status`, data),
};

// Users (Admin)
export const usersAPI = {
  getAll: () => api.get('/users'),
  updateRole: (id, data) => api.put(`/users/${id}/role`, data),
};

// Chatbot
export const chatbotAPI = {
  query: (data) => api.post('/chatbot/query', data),
};

// Dashboard Stats
export const statsAPI = {
  getDashboard: () => api.get('/stats/dashboard'),
};

// System Logs
export const logsAPI = {
  getAll: () => api.get('/logs'),
};

// Seed Data
export const seedAPI = {
  seed: () => api.post('/seed'),
};

export default api;
