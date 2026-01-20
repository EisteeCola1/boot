"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  clearTokens,
  getRefreshToken,
  getStoredTokens,
  setAccessToken as setStoredAccessToken,
  setTokens,
} from "./lib/auth";

type AuthUser = {
  id: number;
  email: string;
  firstName: string;
  lastName: string;
  isAdmin: boolean;
};

type LoginResponse = {
  accessToken: string;
  refreshToken: string;
  user: AuthUser;
};

const API_BASE =
  process.env.NEXT_PUBLIC_API_BASE?.replace(/\/$/, "") ||
  "http://localhost:3001";

export default function Home() {
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(true);

  const router = useRouter();

  useEffect(() => {
    const stored = getStoredTokens();
    if (stored.accessToken) {
      setAccessToken(stored.accessToken);
    } else if (stored.refreshToken) {
      refreshSession(stored.refreshToken, stored.storage);
    }
  }, []);

  useEffect(() => {
    if (accessToken) {
      fetchMe(accessToken);
    }
  }, [accessToken]);

  async function fetchMe(token: string) {
    try {
      const res = await fetch(`${API_BASE}/auth/me`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) {
        throw new Error("Session expired");
      }
      const data = (await res.json()) as AuthUser;
      router.replace(data.isAdmin ? "/admin" : "/home");
    } catch (err) {
      const refreshed = await tryRefresh();
      if (!refreshed) {
        clearSession();
      }
    }
  }

  function clearSession() {
    setAccessToken(null);
    clearTokens();
  }

  async function refreshSession(
    refreshToken: string,
    storage: "local" | "session" | null,
  ) {
    if (!storage) return;
    try {
      const res = await fetch(`${API_BASE}/auth/refresh`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ refreshToken }),
      });
      if (!res.ok) throw new Error("failed");
      const data = (await res.json()) as { accessToken: string };
      setAccessToken(data.accessToken);
      setStoredAccessToken(data.accessToken, storage);
    } catch {
      clearSession();
    }
  }

  async function tryRefresh() {
    const { token, storage } = getRefreshToken();
    if (!token || !storage) return false;
    try {
      const res = await fetch(`${API_BASE}/auth/refresh`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ refreshToken: token }),
      });
      if (!res.ok) return false;
      const data = (await res.json()) as { accessToken: string };
      setAccessToken(data.accessToken);
      setStoredAccessToken(data.accessToken, storage);
      return true;
    } catch {
      return false;
    }
  }

  async function handleLogin(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      if (!res.ok) {
        throw new Error("Login fehlgeschlagen");
      }
      const data = (await res.json()) as LoginResponse;
      setAccessToken(data.accessToken);
      setTokens({
        accessToken: data.accessToken,
        refreshToken: data.refreshToken,
        remember: rememberMe,
      });
      setEmail("");
      setPassword("");
      setRememberMe(true);
      router.replace(data.user.isAdmin ? "/admin" : "/home");
    } catch (err) {
      setError("Login fehlgeschlagen. Bitte prüfe deine Daten.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-zinc-50 text-zinc-900">
      <div className="mx-auto max-w-md p-6">
        <h1 className="text-2xl font-semibold">Login</h1>

        <form onSubmit={handleLogin} className="mt-6 space-y-4">
          <div className="space-y-1">
            <label className="text-sm" htmlFor="email">
              Email
            </label>
            <input
              id="email"
              type="email"
              className="w-full rounded border border-zinc-300 bg-white px-3 py-2"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              required
            />
          </div>
          <div className="space-y-1">
            <label className="text-sm" htmlFor="password">
              Passwort
            </label>
            <input
              id="password"
              type="password"
              className="w-full rounded border border-zinc-300 bg-white px-3 py-2"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              required
            />
          </div>
          <button
            type="submit"
            className="rounded bg-black px-4 py-2 text-white disabled:opacity-60"
            disabled={loading}
          >
            {loading ? "..." : "Login"}
          </button>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={rememberMe}
              onChange={(event) => setRememberMe(event.target.checked)}
            />
            Angemeldet bleiben
          </label>
        </form>

        {error ? <p className="mt-4 text-sm text-red-600">{error}</p> : null}
      </div>
    </main>
  );
}
