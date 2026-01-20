"use client";

import { useEffect, useMemo, useState } from "react";
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

type Licence = {
  id: number;
  title: string;
  moduleGroups: ModuleGroup[];
};

const API_BASE =
  process.env.NEXT_PUBLIC_API_BASE?.replace(/\/$/, "") ||
  "http://localhost:3001";

export default function LicenceDetailPage() {
  const { token } = useAdminContext();
  const [licence, setLicence] = useState<Licence | null>(null);
  const [allModuleGroups, setAllModuleGroups] = useState<ModuleGroup[]>([]);
  const [moduleGroupTitle, setModuleGroupTitle] = useState("");
  const [assignModuleGroupId, setAssignModuleGroupId] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const params = useParams<{ id: string }>();

  const licenceId = Number(params?.id);

  useEffect(() => {
    fetchLicence(token);
    fetchModuleGroups(token);
  }, [token, licenceId]);

  function fetchLicence(activeToken: string) {
    fetch(`${API_BASE}/licences`, {
      headers: { Authorization: `Bearer ${activeToken}` },
    })
      .then((res) => {
        if (!res.ok) throw new Error("failed");
        return res.json();
      })
      .then((data: Licence[]) => {
        const selected = data.find((entry) => entry.id === licenceId) ?? null;
        setLicence(selected);
      })
      .catch(() => {
        // ignore
      });
  }

  function fetchModuleGroups(activeToken: string) {
    fetch(`${API_BASE}/module-groups`, {
      headers: { Authorization: `Bearer ${activeToken}` },
    })
      .then((res) => {
        if (!res.ok) throw new Error("failed");
        return res.json();
      })
      .then((data: ModuleGroup[]) => setAllModuleGroups(data))
      .catch(() => {
        // ignore
      });
  }

  const assignedGroups = useMemo(
    () => licence?.moduleGroups ?? [],
    [licence],
  );

  async function createModuleGroup(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!licence) return;
    setSaving(true);
    setError(null);
    try {
      const res = await fetch(`${API_BASE}/module-groups`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ title: moduleGroupTitle }),
      });
      if (!res.ok) throw new Error("failed");
      const created = (await res.json()) as ModuleGroup;
      await fetch(`${API_BASE}/licences/${licence.id}/module-groups`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ moduleGroupId: created.id }),
      });
      setModuleGroupTitle("");
      fetchLicence(token);
      fetchModuleGroups(token);
    } catch {
      setError("Modulgruppe konnte nicht erstellt werden.");
    } finally {
      setSaving(false);
    }
  }

  async function assignModuleGroup() {
    if (!licence || !assignModuleGroupId) return;
    setSaving(true);
    setError(null);
    try {
      const res = await fetch(
        `${API_BASE}/licences/${licence.id}/module-groups`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ moduleGroupId: Number(assignModuleGroupId) }),
        },
      );
      if (!res.ok) throw new Error("failed");
      setAssignModuleGroupId("");
      fetchLicence(token);
    } catch {
      setError("Verknüpfung fehlgeschlagen.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-6">
      <header className="space-y-2">
        <h1 className="text-2xl font-semibold">
          Licence: {licence?.title ?? "Unbekannt"}
        </h1>
        <a className="text-sm text-blue-600 underline" href="/admin/licences">
          Zurück zur Übersicht
        </a>
      </header>

      <section className="space-y-3 rounded border border-zinc-200 bg-white p-4">
        <h2 className="text-lg font-semibold">Neue Modulgruppe</h2>
        <form onSubmit={createModuleGroup} className="space-y-2">
          <input
            className="w-full rounded border border-zinc-300 px-3 py-2"
            value={moduleGroupTitle}
            onChange={(event) => setModuleGroupTitle(event.target.value)}
            placeholder="Modulgruppe Titel"
            required
          />
          <button
            className="rounded bg-black px-3 py-2 text-white disabled:opacity-60"
            disabled={saving}
          >
            Speichern & zuweisen
          </button>
        </form>
      </section>

      <section className="space-y-3 rounded border border-zinc-200 bg-white p-4">
        <h2 className="text-lg font-semibold">Modulgruppen zuweisen</h2>
        <div className="flex gap-2">
          <select
            className="flex-1 rounded border border-zinc-300 px-3 py-2"
            value={assignModuleGroupId}
            onChange={(event) => setAssignModuleGroupId(event.target.value)}
          >
            <option value="">Modulgruppe wählen</option>
            {allModuleGroups.map((group) => (
              <option key={`group-${group.id}`} value={group.id}>
                {group.title}
              </option>
            ))}
          </select>
          <button
            type="button"
            className="rounded bg-black px-3 py-2 text-white disabled:opacity-60"
            onClick={assignModuleGroup}
            disabled={!assignModuleGroupId || saving}
          >
            Zuweisen
          </button>
        </div>
        {error ? <p className="text-sm text-red-600">{error}</p> : null}
      </section>

      <section className="space-y-2 rounded border border-zinc-200 bg-white p-4">
        <h2 className="text-lg font-semibold">Zugewiesene Modulgruppen</h2>
        {assignedGroups.length === 0 ? (
          <p className="text-sm text-zinc-600">
            Noch keine Modulgruppen zugewiesen.
          </p>
        ) : (
          <ul className="space-y-1 text-sm">
            {assignedGroups.map((group) => (
              <li key={`assigned-${group.id}`}>
                <a
                  className="text-blue-600 underline"
                  href={`/admin/module-groups/${group.id}`}
                >
                  {group.title}
                </a>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
