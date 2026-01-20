"use client";

import { HomeProvider } from "./home-context";
import { useAuthGuard } from "../lib/use-auth-guard";

export default function HomeLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, token, loading } = useAuthGuard();

  if (loading || !user || !token) {
    return (
      <main className="min-h-screen bg-zinc-50 text-zinc-900">
        <div className="mx-auto max-w-4xl p-6 text-sm text-zinc-600">
          Lade Lernbereich...
        </div>
      </main>
    );
  }

  return <HomeProvider value={{ user, token }}>{children}</HomeProvider>;
}
