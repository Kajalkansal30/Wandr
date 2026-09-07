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
  isOwner: boolean;
};

const AuthContext = createContext<AuthContextValue | null>(null);

function decodeUserFromJwt(token: string): Partial<User> | null {
  try {
    const payload = JSON.parse(atob(token.split(".")[1].replace(/-/g, "+").replace(/_/g, "/")));
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
    (async () => {
      try {
        const token = await getAccessToken();
        if (!token) {
          await persistUser(null);
          return;
        }
        const cached = await AsyncStorage.getItem(USER_KEY);
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
      } finally {
        setLoading(false);
      }
    })();
  }, []);

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

  const value = useMemo(
    () => ({
      user,
      loading,
      login,
      signup,
      signOut,
      isOwner: user?.role === "OWNER" || user?.role === "ADMIN",
    }),
    [user, loading, login, signup, signOut]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
