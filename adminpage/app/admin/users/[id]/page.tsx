"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import { useAdminContext } from "../../admin-context";

type Licence = {
  id: number;
  title: string;
};

type User = {
  id: number;
  email: string;
  firstName: string;
  lastName: string;
  isAdmin: boolean;
  licences: Array<{
    licence: Licence;
  }>;
};

const API_BASE =
  process.env.NEXT_PUBLIC_API_BASE?.replace(/\/$/, "") ||
  "http://localhost:3001";

export default function AdminUserDetailPage() {
  const { token } = useAdminContext();
  const [targetUser, setTargetUser] = useState<User | null>(null);
  const [licences, setLicences] = useState<Licence[]>([]);
  const [selectedLicenceId, setSelectedLicenceId] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const params = useParams<{ id: string }>();
  const userId = Number(params?.id);

  useEffect(() => {
    fetchUsers(token);
    fetchLicences(token);
  }, [token, userId]);

  function fetchUsers(activeToken: string) {
    fetch(`${API_BASE}/auth/users`, {
      headers: { Authorization: `Bearer ${activeToken}` },
    })
      .then((res) => {
        if (!res.ok) throw new Error("failed");
        return res.json();
      })
      .then((data: User[]) => {
        const selected = data.find((entry) => entry.id === userId) ?? null;
        setTargetUser(selected);
      })
      .catch(() => {
        // ignore
      });
  }

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

  const assignedLicenceIds = useMemo(() => {
    return new Set(
      targetUser?.licences.map((link) => link.licence.id) ?? [],
    );
  }, [targetUser]);

  const availableLicences = useMemo(
    () => licences.filter((licence) => !assignedLicenceIds.has(licence.id)),
    [licences, assignedLicenceIds],
  );

  async function handleAssignLicence() {
    if (!selectedLicenceId || !targetUser) return;
    setSaving(true);
    setError(null);
    try {
      const res = await fetch(
        `${API_BASE}/auth/users/${targetUser.id}/licences`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            licenceIds: [Number(selectedLicenceId)],
          }),
        },
      );
      if (!res.ok) throw new Error("failed");
      setSelectedLicenceId("");
      fetchUsers(token);
    } catch {
      setError("Führerschein konnte nicht zugewiesen werden.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-6">
      <header className="space-y-1">
        <h1 className="text-2xl font-semibold">Benutzer</h1>
        <a className="text-sm text-blue-600 underline" href="/admin/users">
          Zurück zur Liste
        </a>
      </header>

      {!targetUser ? (
        <div className="rounded border border-zinc-200 bg-white p-4">
          Benutzer nicht gefunden.
        </div>
      ) : (
        <div className="space-y-4">
          <section className="rounded border border-zinc-200 bg-white p-4">
            <h2 className="text-lg font-semibold">
              {targetUser.firstName} {targetUser.lastName}
            </h2>
            <p className="text-sm text-zinc-600">{targetUser.email}</p>
            <p className="text-sm text-zinc-600">
              Rolle: {targetUser.isAdmin ? "Admin" : "User"}
            </p>
          </section>

          <section className="rounded border border-zinc-200 bg-white p-4">
            <h3 className="text-lg font-semibold">Führerschein zuweisen</h3>
            <div className="mt-3 flex flex-wrap gap-2">
              <select
                className="flex-1 rounded border border-zinc-300 px-3 py-2"
                value={selectedLicenceId}
                onChange={(event) => setSelectedLicenceId(event.target.value)}
              >
                <option value="">Licence wählen</option>
                {availableLicences.map((licence) => (
                  <option key={`licence-${licence.id}`} value={licence.id}>
                    {licence.title}
                  </option>
                ))}
              </select>
              <button
                type="button"
                className="rounded bg-black px-4 py-2 text-white disabled:opacity-60"
                onClick={handleAssignLicence}
                disabled={!selectedLicenceId || saving}
              >
                Zuweisen
              </button>
            </div>
            {error ? <p className="mt-2 text-sm text-red-600">{error}</p> : null}
          </section>

          <section className="rounded border border-zinc-200 bg-white p-4">
            <h3 className="text-lg font-semibold">Zugewiesene Licences</h3>
            {targetUser.licences.length === 0 ? (
              <p className="text-sm text-zinc-600">
                Keine Licences zugewiesen.
              </p>
            ) : (
              <ul className="mt-2 space-y-1 text-sm">
                {targetUser.licences.map((link) => (
                  <li key={`licence-${link.licence.id}`}>
                    {link.licence.title}
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>
      )}
    </div>
  );
}
