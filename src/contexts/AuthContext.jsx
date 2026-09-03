import { createContext, useContext, useState, useEffect } from "react";
import { loginRequest, signupRequest } from "../api/auth";
import { getToken, setToken } from "../api/client";

const AuthContext = createContext(null);
const SESSION_KEY = "wandr_session";

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}

function saveSession(user, role) {
  localStorage.setItem(SESSION_KEY, JSON.stringify({ user, role }));
}

function loadSession() {
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    if (!raw || !getToken()) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

function clearSession() {
  localStorage.removeItem(SESSION_KEY);
  setToken(null);
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [role, setRole] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const session = loadSession();
    if (session?.user) {
      setUser(session.user);
      setRole(session.role || "user");
    }
    setLoading(false);
  }, []);

  async function signup(email, password, displayName, selectedRole = "user") {
    const result = await signupRequest(email, password, displayName, selectedRole);
    setUser(result.user);
    setRole(result.role);
    saveSession(result.user, result.role);
    return result;
  }

  async function login(email, password) {
    const result = await loginRequest(email, password);
    setUser(result.user);
    setRole(result.role);
    saveSession(result.user, result.role);
    return result;
  }

  async function signOut() {
    clearSession();
    setUser(null);
    setRole(null);
    window.location.href = "/";
  }

  const value = {
    user,
    role,
    loading,
    signup,
    login,
    signOut,
    /** Test accounts still shown on login; backed by Spring Boot seed */
    isDemoMode: true,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
