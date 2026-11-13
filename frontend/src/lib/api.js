import axios from "axios";
import { clearUserData } from "./clearUserData";

export const API_ORIGIN = import.meta.env.VITE_API_URL || `http://${window.location.hostname}:4000`;

const api = axios.create({
  baseURL: `${API_ORIGIN}/api`,
  timeout: 15000,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("cadence_token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Expired or invalid token: wipe the session and reload.
// With no token, the app falls back to the login screen.
// Login/signup are excluded because they return 401 on wrong credentials.
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const url = error.config?.url ?? "";
    const isAuthForm = url.includes("/auth/login") || url.includes("/auth/signup");
    if (error.response?.status === 401 && !isAuthForm && localStorage.getItem("cadence_token")) {
      clearUserData();
      window.location.reload();
    }
    return Promise.reject(error);
  }
);

export default api;
