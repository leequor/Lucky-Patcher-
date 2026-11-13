"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import {
  getSession,
  register as registerAccount,
  signIn as signInAccount,
  signOut as signOutAccount,
} from "@/lib/auth/session";
import { can } from "@/lib/domain/permissions";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [session, setSession] = useState(null);
  const [status, setStatus] = useState("loading");

  useEffect(() => {
    let active = true;

    getSession()
      .then((next) => {
        if (!active) return;
        setSession(next);
        setStatus("ready");
      })
      .catch(() => {
        if (!active) return;
        setSession(null);
        setStatus("ready");
      });

    function handleStorage(event) {
      if (event.key && !event.key.startsWith("hope-erp.session")) return;
      getSession().then((next) => {
        if (active) setSession(next);
      });
    }

    window.addEventListener("storage", handleStorage);

    return () => {
      active = false;
      window.removeEventListener("storage", handleStorage);
    };
  }, []);

  const signIn = useCallback(async (email, password) => {
    const next = await signInAccount(email, password);
    setSession(next);
    setStatus("ready");
    return next;
  }, []);

  const register = useCallback(async (input) => {
    const next = await registerAccount(input);
    setSession(next);
    setStatus("ready");
    return next;
  }, []);

  const signOut = useCallback(async () => {
    await signOutAccount();
    setSession(null);
  }, []);

  const value = useMemo(
    () => ({
      session,
      user: session?.user ?? null,
      role: session?.user?.role ?? null,
      status,
      isAuthenticated: Boolean(session?.user),
      signIn,
      register,
      signOut,
      can: (permission) => can(session?.user?.role, permission),
    }),
    [session, status, signIn, register, signOut],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used inside AuthProvider");
  }
  return context;
}
