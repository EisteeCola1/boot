"use client";

import { useEffect, useState } from "react";
import { useAdminContext } from "../admin-context";

type ImportResult = {
  createdQuestions: number;
  createdAnswers: number;
};

const API_BASE =
  process.env.NEXT_PUBLIC_API_BASE?.replace(/\/$/, "") ||
  "http://localhost:3001";

export default function AdminImportPage() {
  const { token } = useAdminContext();
  const [importing, setImporting] = useState(false);
  const [importLabel, setImportLabel] = useState<string | null>(null);
  const [importSource, setImportSource] = useState("binnen");
  const [importResult, setImportResult] = useState<ImportResult | null>(null);
  const [unassignedCount, setUnassignedCount] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchUnassignedCount(token);
  }, [token]);

  function fetchUnassignedCount(activeToken: string) {
    fetch(`${API_BASE}/questions/unassigned`, {
      headers: { Authorization: `Bearer ${activeToken}` },
    })
      .then((res) => {
        if (!res.ok) throw new Error("failed");
        return res.json();
      })
      .then((data) => setUnassignedCount(Array.isArray(data) ? data.length : 0))
      .catch(() => {
        // ignore
      });
  }

  async function importElwis(path: string, label: string) {
    setError(null);
    setImportResult(null);
    setImportLabel(label);
    setImporting(true);
    try {
      const res = await fetch(`${API_BASE}${path}`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("failed");
      const data = (await res.json()) as ImportResult;
      setImportResult(data);
      fetchUnassignedCount(token);
    } catch {
      setError("Import fehlgeschlagen.");
    } finally {
      setImporting(false);
    }
  }

  return (
    <div className="space-y-6">
      <header className="space-y-1">
        <h1 className="text-2xl font-semibold">Import</h1>
        <p className="text-sm text-zinc-600">
          Fragenkataloge von ELWIS importieren (ohne Zuordnung).
        </p>
      </header>

      <section className="rounded border border-zinc-200 bg-white p-4">
        <div className="flex flex-wrap items-center gap-3">
          <label className="text-sm text-zinc-600" htmlFor="import-source">
            Katalog
          </label>
          <select
            id="import-source"
            className="rounded border border-zinc-300 px-3 py-2 text-sm"
            value={importSource}
            onChange={(event) => setImportSource(event.target.value)}
            disabled={importing}
          >
            <option value="binnen">Binnen (ELWIS)</option>
            <option value="see">See (ELWIS)</option>
          </select>
          <button
            type="button"
            className="rounded bg-black px-3 py-2 text-white disabled:opacity-60"
            onClick={() =>
              importElwis(
                importSource === "see"
                  ? "/imports/elwis-see"
                  : "/imports/elwis-binnen",
                importSource === "see" ? "See (ELWIS)" : "Binnen (ELWIS)",
              )
            }
            disabled={importing}
          >
            {importing ? "Importiere..." : "Import starten"}
          </button>
        </div>
        {error ? <p className="mt-2 text-sm text-red-600">{error}</p> : null}
        {importResult ? (
          <pre className="mt-3 max-h-48 overflow-auto rounded bg-zinc-100 p-3 text-xs">
            {JSON.stringify(
              { source: importLabel, ...importResult },
              null,
              2,
            )}
          </pre>
        ) : null}
        <p className="mt-3 text-sm text-zinc-600">
          Nach dem Import müssen die Fragen einem Modul zugeordnet werden.
        </p>
        <div className="mt-3 text-sm">
          <a className="text-blue-600 underline" href="/admin/assign">
            {unassignedCount === null
              ? "Fragen zuordnen"
              : `${unassignedCount} Fragen müssen zugeordnet werden`}
          </a>
        </div>
      </section>
    </div>
  );
}
