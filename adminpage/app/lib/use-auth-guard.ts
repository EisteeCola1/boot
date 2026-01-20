"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { clearTokens, getAccessToken, refreshAccessToken } from "./auth";

type AuthUser = {
  id: number;
  email: string;
  firstName: string;
  lastName: string;
  isAdmin: boolean;
};

const API_BASE =
  process.env.NEXT_PUBLIC_API_BASE?.replace(/\/$/, "") ||
  "http://localhost:3001";

export function useAuthGuard(options?: { requireAdmin?: boolean }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    let cancelled = false;

    async function bootstrap() {
      setLoading(true);
      const initialToken =
        getAccessToken() ?? (await refreshAccessToken(API_BASE));
      if (!initialToken) {
        clearTokens();
        router.replace("/");
        setLoading(false);
        return;
      }

      let activeToken = initialToken;
      let res = await fetch(`${API_BASE}/auth/me`, {
        headers: { Authorization: `Bearer ${activeToken}` },
      });

      if (!res.ok) {
        const refreshed = await refreshAccessToken(API_BASE);
        if (!refreshed) {
          clearTokens();
          router.replace("/");
          setLoading(false);
          return;
        }
        activeToken = refreshed;
        res = await fetch(`${API_BASE}/auth/me`, {
          headers: { Authorization: `Bearer ${activeToken}` },
        });
        if (!res.ok) {
          clearTokens();
          router.replace("/");
          setLoading(false);
          return;
        }
      }

      const data = (await res.json()) as AuthUser;
      if (options?.requireAdmin && !data.isAdmin) {
        router.replace("/home");
        setLoading(false);
        return;
      }

      if (!cancelled) {
        setUser(data);
        setToken(activeToken);
      }
      setLoading(false);
    }

    bootstrap();

    return () => {
      cancelled = true;
    };
  }, [router, options?.requireAdmin]);

  return { user, token, loading };
}
