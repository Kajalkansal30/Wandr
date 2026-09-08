import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { getAccessToken, clearTokens } from "../api/client";
import * as authApi from "../api/auth";

const USER_KEY = "wandr_user";

type User = {
  userId: number;
  email: string;
  displayName: string;
  role: string;
  emailVerified: boolean;
};

type AuthContextValue = {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  signup: (email: string, password: string, displayName: string) => Promise<void>;
  signOut: () => Promise<void>;
  markEmailVerified: () => Promise<void>;
  isOwner: boolean;
};

const AuthContext = createContext<AuthContextValue | null>(null);

/** Hermes has no atob — decode JWT payload with a small base64url helper. */
function base64UrlToJson(segment: string): any {
  const b64 = segment.replace(/-/g, "+").replace(/_/g, "/");
  const pad = b64.length % 4 === 0 ? "" : "=".repeat(4 - (b64.length % 4));
  const input = b64 + pad;
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";
  let str = "";
  for (let i = 0; i < input.length; i += 4) {
    const a = chars.indexOf(input[i]);
    const b = chars.indexOf(input[i + 1]);
    const c = chars.indexOf(input[i + 2]);
    const d = chars.indexOf(input[i + 3]);
    const n = (a << 18) | (b << 12) | ((c & 63) << 6) | (d & 63);
    str += String.fromCharCode((n >> 16) & 255);
    if (input[i + 2] !== "=") str += String.fromCharCode((n >> 8) & 255);
    if (input[i + 3] !== "=") str += String.fromCharCode(n & 255);
  }
  // JWT payloads are typically ASCII JSON
  return JSON.parse(str);
}

function decodeUserFromJwt(token: string): Partial<User> | null {
  try {
    const payload = base64UrlToJson(token.split(".")[1]);
    return {
      userId: Number(payload.sub),
      email: payload.email || "",
      displayName: payload.displayName || payload.email || "User",
      role: String(payload.role || "USER").toUpperCase(),
      emailVerified: Boolean(payload.emailVerified ?? true),
    };
  } catch {
    return null;
  }
}

async function persistUser(user: User | null) {
  if (user) await AsyncStorage.setItem(USER_KEY, JSON.stringify(user));
  else await AsyncStorage.removeItem(USER_KEY);
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const token = await getAccessToken();
        if (cancelled) return;
        if (!token) {
          await persistUser(null);
          return;
        }
        const cached = await AsyncStorage.getItem(USER_KEY);
        if (cancelled) return;
        const fromJwt = decodeUserFromJwt(token);
        if (cached) {
          try {
            const parsed = JSON.parse(cached) as User;
            setUser({
              ...parsed,
              ...fromJwt,
              displayName: parsed.displayName || fromJwt?.displayName || parsed.email,
              emailVerified: parsed.emailVerified ?? fromJwt?.emailVerified ?? true,
              role: String(parsed.role || fromJwt?.role || "USER").toUpperCase(),
            });
            return;
          } catch {
            /* fall through */
          }
        }
        if (fromJwt?.userId) {
          setUser(fromJwt as User);
        } else {
          await clearTokens();
          await persistUser(null);
        }
      } catch {
        /* treat as logged out */
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!user) return;
    void import("../push").then((m) => m.registerForPushNotificationsAsync()).catch(() => undefined);
  }, [user?.userId]);

  const applySession = useCallback(async (session: authApi.AuthSession) => {
    const next: User = {
      userId: session.userId,
      email: session.email,
      displayName: session.displayName,
      role: String(session.role || "USER").toUpperCase(),
      emailVerified: session.emailVerified,
    };
    setUser(next);
    await persistUser(next);
  }, []);

  const login = useCallback(
    async (email: string, password: string) => {
      const session = await authApi.login(email, password);
      await applySession(session);
    },
    [applySession]
  );

  const signup = useCallback(
    async (email: string, password: string, displayName: string) => {
      const session = await authApi.signup(email, password, displayName);
      await applySession(session);
    },
    [applySession]
  );

  const signOut = useCallback(async () => {
    await authApi.logout();
    setUser(null);
    await persistUser(null);
  }, []);

  const markEmailVerified = useCallback(async () => {
    setUser((prev) => {
      if (!prev) return prev;
      const next = { ...prev, emailVerified: true };
      void persistUser(next);
      return next;
    });
  }, []);

  const value = useMemo(
    () => ({
      user,
      loading,
      login,
      signup,
      signOut,
      markEmailVerified,
      isOwner: user?.role === "OWNER" || user?.role === "ADMIN",
    }),
    [user, loading, login, signup, signOut, markEmailVerified]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
