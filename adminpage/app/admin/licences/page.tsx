"use client";

import { useEffect, useState } from "react";
import { useAdminContext } from "../admin-context";

type Licence = {
  id: number;
  title: string;
};

const API_BASE =
  process.env.NEXT_PUBLIC_API_BASE?.replace(/\/$/, "") ||
  "http://localhost:3001";

export default function AdminLicencesPage() {
  const { token } = useAdminContext();
  const [licences, setLicences] = useState<Licence[]>([]);
  const [licenceTitle, setLicenceTitle] = useState("");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchLicences(token);
  }, [token]);

  function fetchLicences(activeToken: string) {
    fetch(`${API_BASE}/licences`, {
      headers: { Authorization: `Bearer ${activeToken}` },
    })
      .then((res) => {
        if (!res.ok) throw new Error("failed");
        return res.json();
      })
      .then((data: Licence[]) => setLicences(data))
      .catch(() => {
        // ignore
      });
  }

  async function createLicence(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    try {
      const res = await fetch(`${API_BASE}/licences`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ title: licenceTitle }),
      });
      if (!res.ok) throw new Error("failed");
      setLicenceTitle("");
      fetchLicences(token);
    } catch {
      setError("Licence konnte nicht erstellt werden.");
    }
  }

  return (
    <div className="space-y-6">
      <header className="space-y-1">
        <h1 className="text-2xl font-semibold">Licences</h1>
      </header>

      <section className="rounded border border-zinc-200 bg-white p-4">
        <h2 className="text-lg font-semibold">Licence erstellen</h2>
        <form onSubmit={createLicence} className="mt-3 space-y-2">
          <input
            className="w-full rounded border border-zinc-300 px-3 py-2"
            value={licenceTitle}
            onChange={(event) => setLicenceTitle(event.target.value)}
            placeholder="z.B. SBF See"
            required
          />
          <button className="rounded bg-black px-3 py-2 text-white">
            Speichern
          </button>
          {error ? <p className="text-sm text-red-600">{error}</p> : null}
        </form>
      </section>

      <section className="rounded border border-zinc-200 bg-white p-4">
        <h2 className="text-lg font-semibold">Alle Licences</h2>
        {licences.length === 0 ? (
          <p className="text-sm text-zinc-600">Keine Licences vorhanden.</p>
        ) : (
          <ul className="mt-3 space-y-2 text-sm">
            {licences.map((licence) => (
              <li key={`licence-${licence.id}`}>
                <a
                  className="text-blue-600 underline"
                  href={`/admin/licences/${licence.id}`}
                >
                  {licence.title}
                </a>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
