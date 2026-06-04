import axios from "axios";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000";

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: { "Content-Type": "application/json" }
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("gullak_token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export const authApi = {
  register: (data) => api.post("/auth/register", data).then((res) => res.data),
  login: (data) => api.post("/auth/login", data).then((res) => res.data)
};

export const dashboardApi = {
  summary: () => api.get("/dashboard/summary").then((res) => res.data)
};

export const goalsApi = {
  list: () => api.get("/goals").then((res) => res.data),
  create: (data) => api.post("/goals", data).then((res) => res.data),
  update: (id, data) => api.patch(`/goals/${id}`, data).then((res) => res.data),
  remove: (id) => api.delete(`/goals/${id}`).then((res) => res.data),
  addSavings: (id, amount) => api.patch(`/goals/${id}/add-savings`, { amount }).then((res) => res.data)
};

export const groupGoalsApi = {
  list: () => api.get("/group-goals").then((res) => res.data),
  get: (id) => api.get(`/group-goals/${id}`).then((res) => res.data),
  create: (data) => api.post("/group-goals", data).then((res) => res.data),
  update: (id, data) => api.patch(`/group-goals/${id}`, data).then((res) => res.data),
  remove: (id) => api.delete(`/group-goals/${id}`).then((res) => res.data),
  contribute: (id, amount) => api.post(`/group-goals/${id}/contribute`, { amount }).then((res) => res.data),
  nudge: (id, member_user_id) => api.post(`/group-goals/${id}/nudge`, { member_user_id }).then((res) => res.data)
};

export const friendsApi = {
  list: () => api.get("/friends").then((res) => res.data),
  search: (q) => api.get("/friends/search", { params: { q } }).then((res) => res.data),
  request: (user_id) => api.post("/friends/request", { user_id }).then((res) => res.data),
  accept: (requestId) => api.post(`/friends/accept/${requestId}`).then((res) => res.data),
  reject: (requestId) => api.post(`/friends/reject/${requestId}`).then((res) => res.data),
  remove: (userId) => api.delete(`/friends/${userId}`).then((res) => res.data),
  pending: () => api.get("/friends/requests/pending").then((res) => res.data)
};

export const checkinsApi = {
  create: (data) => api.post("/checkins", data).then((res) => res.data),
  history: () => api.get("/checkins/history").then((res) => res.data),
  weeklySummary: () => api.get("/checkins/weekly-summary").then((res) => res.data)
};

export default api;
