import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5001/api',
});

// Request interceptor to automatically attach JWT token if present
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Scan APIs
export async function analyzeMessage(message) {
  const { data } = await api.post('/scans/analyze', { message });
  return data;
}

export async function getScanHistory(page = 1, limit = 30) {
  const { data } = await api.get('/scans/history', {
    params: { page, limit },
  });
  return data;
}

export async function deleteScan(id) {
  const { data } = await api.delete(`/scans/${id}`);
  return data;
}

// Auth APIs
export async function loginUser(credentials) {
  const { data } = await api.post('/auth/login', credentials);
  return data;
}

export async function registerUser(userData) {
  const { data } = await api.post('/auth/register', userData);
  return data;
}

export async function getCurrentUser() {
  const { data } = await api.get('/auth/me');
  return data;
}

// Feedback APIs
export async function submitFeedback({ scanId, isCorrect, userCorrection, comment }) {
  const { data } = await api.post('/feedback', {
    scanId,
    isCorrect,
    userCorrection,
    comment,
  });
  return data;
}

export async function getFeedbackStats() {
  const { data } = await api.get('/feedback/stats');
  return data;
}

export async function getAllFeedback(page = 1, limit = 25, isCorrect = '') {
  const { data } = await api.get('/feedback', {
    params: {
      page,
      limit,
      isCorrect: isCorrect !== '' ? isCorrect : undefined,
    },
  });
  return data;
}

export async function deleteFeedback(id) {
  const { data } = await api.delete(`/feedback/${id}`);
  return data;
}

// Admin APIs
export async function getAdminAnalytics(days = 14) {
  const { data } = await api.get('/admin/analytics', { params: { days } });
  return data;
}

export async function getAdminUsers(page = 1, limit = 20, search = '') {
  const { data } = await api.get('/admin/users', { params: { page, limit, search } });
  return data;
}

export async function updateUserRole(id, role) {
  const { data } = await api.patch(`/admin/users/${id}/role`, { role });
  return data;
}

export async function deleteUser(id) {
  const { data } = await api.delete(`/admin/users/${id}`);
  return data;
}

export async function getAdminScans(page = 1, limit = 25, filters = {}) {
  const { data } = await api.get('/admin/scans', { params: { page, limit, ...filters } });
  return data;
}

export async function exportAdminReport() {
  const { data } = await api.get('/admin/export/report');
  return data;
}

export async function seedAdminDemoData() {
  const { data } = await api.post('/admin/seed-demo');
  return data;
}

export async function elevateDemoAdmin() {
  const { data } = await api.post('/auth/elevate-demo-admin');
  return data;
}

export default api;

