// src/app/context/AuthContext.tsx
import { createContext, useContext, useState, useEffect, type ReactNode } from "react";

export interface User {
  id: string;
  name: string;
  email: string;
  plan: "FREE" | "PRO" | "ELITE";
  scansUsed: number;
  scansLimit: number;
  joinedAt: string;
}

interface AuthCtx {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<string | null>;
  register: (name: string, email: string, password: string) => Promise<string | null>;
  logout: () => void;
  incrementScan: () => void;
  upgradePlan: (plan: "PRO" | "ELITE") => void;
}

const AuthContext = createContext<AuthCtx | null>(null);

const STORAGE_KEY = "robocop_users";
const SESSION_KEY = "robocop_session";

const SCAN_LIMITS: Record<string, number> = {
  FREE: 5,
  PRO: 200,
  ELITE: 999999,
};

export function getStoredUsers(): Record<string, { password: string; user: User }> {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}"); }
  catch { return {}; }
}

function saveUsers(users: Record<string, { password: string; user: User }>) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(users));
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const sessionEmail = localStorage.getItem(SESSION_KEY);
    if (sessionEmail) {
      const users = getStoredUsers();
      if (users[sessionEmail]) setUser({ ...users[sessionEmail].user });
    }
    setLoading(false);
  }, []);

  const persistUser = (updated: User) => {
    const users = getStoredUsers();
    const email = updated.email;
    if (users[email]) {
      users[email].user = updated;
      saveUsers(users);
    }
    setUser({ ...updated });
  };

  const login = async (email: string, password: string): Promise<string | null> => {
    await new Promise(r => setTimeout(r, 700));
    const users = getStoredUsers();
    const entry = users[email.toLowerCase()];
    if (!entry) return "No account found with this email.";
    if (entry.password !== password) return "Incorrect password.";
    setUser({ ...entry.user });
    localStorage.setItem(SESSION_KEY, email.toLowerCase());
    return null;
  };

  const register = async (name: string, email: string, password: string): Promise<string | null> => {
    await new Promise(r => setTimeout(r, 900));
    const users = getStoredUsers();
    const key = email.toLowerCase();
    if (users[key]) return "An account with this email already exists.";
    const newUser: User = {
      id: Math.random().toString(36).slice(2),
      name: name.trim(),
      email: key,
      plan: "FREE",
      scansUsed: 0,
      scansLimit: SCAN_LIMITS.FREE,
      joinedAt: new Date().toISOString(),
    };
    users[key] = { password, user: newUser };
    saveUsers(users);
    setUser({ ...newUser });
    localStorage.setItem(SESSION_KEY, key);
    return null;
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem(SESSION_KEY);
  };

  const incrementScan = () => {
    if (!user) return;
    const updated: User = { ...user, scansUsed: user.scansUsed + 1 };
    persistUser(updated);
  };

  const upgradePlan = (plan: "PRO" | "ELITE") => {
    if (!user) return;
    const updated: User = { ...user, plan, scansLimit: SCAN_LIMITS[plan], scansUsed: 0 };
    persistUser(updated);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, incrementScan, upgradePlan }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be inside AuthProvider");
  return ctx;
}