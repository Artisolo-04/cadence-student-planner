import axios from "axios";

export const API_ORIGIN = "http://localhost:4000";

const api = axios.create({
  baseURL: `${API_ORIGIN}/api`,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("cadence_token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default api;
