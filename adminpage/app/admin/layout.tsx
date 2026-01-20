"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";
import { AdminProvider } from "./admin-context";
import { useAuthGuard } from "../lib/use-auth-guard";

const NAV_ITEMS = [
  { label: "Benutzer", href: "/admin/users" },
  { label: "Licences", href: "/admin/licences" },
  { label: "Import", href: "/admin/import" },
  { label: "Zuordnung", href: "/admin/assign" },
  { label: "Daten löschen", href: "/admin/cleanup" },
];

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, token, loading } = useAuthGuard({ requireAdmin: true });
  const pathname = usePathname();
  const [navOpen, setNavOpen] = useState(false);

  if (loading || !user || !token) {
    return (
      <main className="min-h-screen bg-zinc-50 text-zinc-900">
        <div className="mx-auto max-w-4xl p-6 text-sm text-zinc-600">
          Lade Adminbereich...
        </div>
      </main>
    );
  }

  return (
    <AdminProvider value={{ user, token }}>
      <main className="min-h-screen bg-zinc-50 text-zinc-900">
        <div className="mx-auto flex max-w-6xl gap-6 p-6">
          <aside className="w-full max-w-xs">
            <div className="flex items-center justify-start">
              <button
                type="button"
                className="rounded p-2 text-zinc-700 hover:bg-zinc-100"
                onClick={() => setNavOpen((open) => !open)}
                aria-expanded={navOpen}
                aria-controls="admin-nav"
              >
                <span className="sr-only">Navigation</span>
                <span className="relative block h-6 w-7">
                  <span className="absolute left-0 top-0 h-0.5 w-7 rounded bg-zinc-800" />
                  <span className="absolute left-0 top-2.5 h-0.5 w-7 rounded bg-zinc-800" />
                  <span className="absolute left-0 top-5 h-0.5 w-7 rounded bg-zinc-800" />
                </span>
              </button>
            </div>
            <nav
              id="admin-nav"
              className={`mt-4 space-y-2 text-sm ${navOpen ? "block" : "hidden"
                }`}
            >
              {NAV_ITEMS.map((item) => {
                const isActive =
                  pathname === item.href ||
                  pathname.startsWith(`${item.href}/`);
                return (
                  <a
                    key={item.href}
                    className={`flex items-center justify-between rounded border px-3 py-2 transition ${isActive
                        ? "border-zinc-900 bg-zinc-900 text-white"
                        : "border-zinc-200 text-zinc-700 hover:border-zinc-300 hover:bg-zinc-50 hover:text-zinc-900"
                      }`}
                    href={item.href}
                  >
                    <span>{item.label}</span>
                    <span className={`${isActive ? "text-white/70" : "text-zinc-400"}`}>
                      ›
                    </span>
                  </a>
                );
              })}
            </nav>
          </aside>
          <section className="flex-1 space-y-6">{children}</section>
        </div>
      </main>
    </AdminProvider>
  );
}
