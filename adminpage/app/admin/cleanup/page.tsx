"use client";

import { useState } from "react";
import { useAdminContext } from "../admin-context";

const API_BASE =
  process.env.NEXT_PUBLIC_API_BASE?.replace(/\/$/, "") ||
  "http://localhost:3001";

export default function AdminCleanupPage() {
  const { token } = useAdminContext();
  const [clearing, setClearing] = useState(false);
  const [result, setResult] = useState<unknown | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function clearCatalog() {
    if (!window.confirm("Wirklich alle Katalogdaten löschen?")) return;
    setError(null);
    setResult(null);
    setClearing(true);
    try {
      const res = await fetch(`${API_BASE}/admin/clear-catalog`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("failed");
      const data = await res.json();
      setResult(data);
    } catch {
      setError("Katalogdaten konnten nicht gelöscht werden.");
    } finally {
      setClearing(false);
    }
  }

  return (
    <div className="space-y-6">
      <header className="space-y-1">
        <h1 className="text-2xl font-semibold">Daten löschen</h1>
        <p className="text-sm text-zinc-600">
          Löscht alle Katalogdaten, Benutzer und Auth bleiben erhalten.
        </p>
      </header>

      <section className="rounded border border-red-200 bg-white p-4">
        <button
          type="button"
          className="rounded border border-red-300 px-3 py-2 text-red-600 disabled:opacity-60"
          onClick={clearCatalog}
          disabled={clearing}
        >
          {clearing ? "Lösche..." : "Katalogdaten löschen"}
        </button>
        {error ? <p className="mt-2 text-sm text-red-600">{error}</p> : null}
        {result ? (
          <pre className="mt-3 max-h-48 overflow-auto rounded bg-zinc-100 p-3 text-xs">
            {JSON.stringify(result, null, 2)}
          </pre>
        ) : null}
      </section>
    </div>
  );
}
