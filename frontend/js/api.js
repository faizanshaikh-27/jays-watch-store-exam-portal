// api.js — Centralized API calls
const API_BASE = '/api';

async function apiFetch(path, options = {}) {
  const token = localStorage.getItem('token');
  const headers = { 'Content-Type': 'application/json', ...(options.headers || {}) };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const res = await fetch(API_BASE + path, { ...options, headers });
  const data = await res.json().catch(() => ({}));

  if (!res.ok) throw new Error(data.error || `HTTP ${res.status}`);
  return data;
}

function requireId(id, resourceName = 'resource') {
  if (id === undefined || id === null || id === '') {
    throw new Error(`Missing ${resourceName} id`);
  }

  return id;
}

const API = {
  // Auth
  login: (credentials) => apiFetch('/auth/login', { method: 'POST', body: JSON.stringify(credentials) }),
  me: () => apiFetch('/auth/me'),
  getStaff: () => apiFetch('/auth/users'),
  createStaff: (data) => apiFetch('/auth/users', { method: 'POST', body: JSON.stringify(data) }),
  deleteStaff: (id) => apiFetch(`/auth/users/${id}`, { method: 'DELETE' }),

  // Exams
  getExams: () => apiFetch('/exams'),
  getExam: (id) => apiFetch(`/exams/${requireId(id, 'exam')}`),
  createExam: (data) => apiFetch('/exams', { method: 'POST', body: JSON.stringify(data) }),
  updateExam: (id, data) => apiFetch(`/exams/${requireId(id, 'exam')}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteExam: (id) => apiFetch(`/exams/${requireId(id, 'exam')}`, { method: 'DELETE' }),

  // Results
  submitExam: (data) => apiFetch('/results/submit', { method: 'POST', body: JSON.stringify(data) }),
  getAllResults: () => apiFetch('/results'),
  getResultsByExam: (examId) => apiFetch(`/results/exam/${requireId(examId, 'exam')}`),
  getResult: (id) => apiFetch(`/results/${requireId(id, 'result')}`),
  getMyResults: () => apiFetch('/results/my'),
  getLeaderboard: (examId) => apiFetch(examId ? `/results/leaderboard/${requireId(examId, 'exam')}` : '/results/leaderboard'),
};
