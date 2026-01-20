"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { useAdminContext } from "../../admin-context";

type Module = {
  id: number;
  title: string;
};

type ModuleGroup = {
  id: number;
  title: string;
  modules: Module[];
};

const API_BASE =
  process.env.NEXT_PUBLIC_API_BASE?.replace(/\/$/, "") ||
  "http://localhost:3001";

export default function ModuleGroupDetailPage() {
  const { token } = useAdminContext();
  const [moduleGroup, setModuleGroup] = useState<ModuleGroup | null>(null);
  const [moduleTitle, setModuleTitle] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const params = useParams<{ id: string }>();
  const moduleGroupId = Number(params?.id);

  useEffect(() => {
    fetchModuleGroup(token);
  }, [token, moduleGroupId]);

  function fetchModuleGroup(activeToken: string) {
    fetch(`${API_BASE}/module-groups`, {
      headers: { Authorization: `Bearer ${activeToken}` },
    })
      .then((res) => {
        if (!res.ok) throw new Error("failed");
        return res.json();
      })
      .then((data: ModuleGroup[]) => {
        const selected =
          data.find((entry) => entry.id === moduleGroupId) ?? null;
        setModuleGroup(selected);
      })
      .catch(() => {
        // ignore
      });
  }

  async function createModule(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!moduleGroup) return;
    setSaving(true);
    setError(null);
    try {
      const res = await fetch(`${API_BASE}/modules`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title: moduleTitle,
          moduleGroupId: moduleGroup.id,
        }),
      });
      if (!res.ok) throw new Error("failed");
      setModuleTitle("");
      fetchModuleGroup(token);
    } catch {
      setError("Modul konnte nicht erstellt werden.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-6">
      <header className="space-y-2">
        <h1 className="text-2xl font-semibold">
          Modulgruppe: {moduleGroup?.title ?? "Unbekannt"}
        </h1>
        <a className="text-sm text-blue-600 underline" href="/admin/licences">
          Zurück zur Übersicht
        </a>
      </header>

      <section className="space-y-3 rounded border border-zinc-200 bg-white p-4">
        <h2 className="text-lg font-semibold">Neues Modul</h2>
        <form onSubmit={createModule} className="space-y-2">
          <input
            className="w-full rounded border border-zinc-300 px-3 py-2"
            value={moduleTitle}
            onChange={(event) => setModuleTitle(event.target.value)}
            placeholder="Modul Titel"
            required
          />
          <button
            className="rounded bg-black px-3 py-2 text-white disabled:opacity-60"
            disabled={saving}
          >
            Modul erstellen
          </button>
        </form>
        {error ? <p className="text-sm text-red-600">{error}</p> : null}
      </section>

      <section className="space-y-2 rounded border border-zinc-200 bg-white p-4">
        <h2 className="text-lg font-semibold">Module</h2>
        {moduleGroup?.modules?.length ? (
          <ul className="space-y-1 text-sm">
            {moduleGroup.modules.map((module) => (
              <li key={`module-${module.id}`}>
                <a
                  className="text-blue-600 underline"
                  href={`/admin/modules/${module.id}`}
                >
                  {module.title}
                </a>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-zinc-600">Keine Module vorhanden.</p>
        )}
      </section>
    </div>
  );
}
