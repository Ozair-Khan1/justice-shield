"use client";

import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { LoadingScreen } from "@/components/LoadingScreen";

interface User {
  id: string;
  email: string;
  role: string;
  full_name: string;
  phone: string;
  membership_tier: string;
  billing_period?: string | null;
  emergency_contact_name?: string | null;
  emergency_contact_phone?: string | null;
  city?: string | null;
  country?: string | null;
  seen_notification_ids?: string[];
  stripe_customer_id?: string | null;
  stripe_subscription_id?: string | null;
  subscription_cancel_at?: string | null;
  trial_started_at?: string | null;
  used_trial_tiers?: string[] | null;
}

interface AuthContextValue {
  user: User | null;
  loading: boolean;
  signOut: () => Promise<void>;
  refreshUser: () => Promise<User | null>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  const fetchUser = async () => {
    try {
      const start = Date.now();
      const res = await fetch("/api/auth/me");
      const elapsed = Date.now() - start;
      const minDelay = 1000; // 1 second

      if (elapsed < minDelay) {
        await new Promise(resolve => setTimeout(resolve, minDelay - elapsed));
      }

      if (res.ok) {
        const data = await res.json();
        setUser(data.user);
        return data.user;
      } else {
        setUser(null);
        return null;
      }
    } catch (err) {
      setUser(null);
      return null;
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUser();
  }, []);

  const signOut = async () => {
    await fetch("/api/auth/me", { method: "POST" });
    setUser(null);
    router.push("/auth");
  };

  if (loading) {
    return <LoadingScreen />;
  }

  return (
    <AuthContext.Provider value={{ user, loading, signOut, refreshUser: fetchUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
