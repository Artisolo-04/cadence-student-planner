import { createContext, useState, useEffect, useCallback } from "react";
import api from "../lib/api";

export const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  const loadCurrentUser = useCallback(async () => {
    const token = localStorage.getItem("cadence_token");
    if (!token) {
      setLoading(false);
      return;
    }
    try {
      const res = await api.get("/auth/me");
      setUser(res.data.user);
      setProfile(res.data.profile);
    } catch (err) {
      localStorage.removeItem("cadence_token");
      setUser(null);
      setProfile(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadCurrentUser();
  }, [loadCurrentUser]);

  async function signup(email, password) {
    const res = await api.post("/auth/signup", { email, password });
    localStorage.setItem("cadence_token", res.data.token);
    setUser(res.data.user);
    setProfile(null);
    return res.data;
  }

  async function login(email, password) {
    const res = await api.post("/auth/login", { email, password });
    localStorage.setItem("cadence_token", res.data.token);
    setUser(res.data.user);
    await loadCurrentUser();
    return res.data;
  }

  function logout() {
    localStorage.removeItem("cadence_token");
    setUser(null);
    setProfile(null);
  }

  return (
    <AuthContext.Provider
      value={{ user, profile, loading, signup, login, logout, setProfile }}
    >
      {children}
    </AuthContext.Provider>
  );
}
