"use client";

import { createContext, useContext, useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";

type User = {
  id: string;
  name: string;
  email: string;
  role: "SUPER_ADMIN" | "ADMIN" | "RECEPTIONIST" | "NURSE" | "LAB_TECHNICIAN";
  clinicId: string | null;
  clinicSlug: string | null;
};

export type ClinicConfig = {
  id: string;
  name: string;
  slug: string;
  abbreviation: string;
  tagline: string | null;
  phone: string | null;
  email: string | null;
  address: string | null;
  city: string | null;
  logoUrl: string | null;
  doctors: string[];
  timeSlots: string[];
  enabledFeatures: Record<string, boolean>;
};

type AuthContextType = {
  user: User | null;
  clinic: ClinicConfig | null;
  loading: boolean;
  logout: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType>({
  user: null,
  clinic: null,
  loading: true,
  logout: async () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [clinic, setClinic] = useState<ClinicConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    async function fetchUser() {
      try {
        const res = await fetch("/api/auth/me");
        if (res.ok) {
          const data = await res.json();
          setUser(data.user);
          setClinic(data.clinic ?? null);

          // Update page title with clinic name
          if (data.clinic?.name) {
            document.title = `${data.clinic.abbreviation} - ${data.clinic.name}`;
          }
        }
      } catch {
        // Not authenticated
      } finally {
        setLoading(false);
      }
    }
    fetchUser();
  }, []);

  const logout = useCallback(async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    setUser(null);
    setClinic(null);
    router.push("/login");
  }, [router]);

  return (
    <AuthContext.Provider value={{ user, clinic, loading, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
