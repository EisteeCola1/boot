"use client";

import { useEffect, useMemo, useState } from "react";
import { useAdminContext } from "../admin-context";

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

export default function AdminUsersPage() {
  const { token } = useAdminContext();
  const [users, setUsers] = useState<User[]>([]);
  const [licences, setLicences] = useState<Licence[]>([]);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [newEmail, setNewEmail] = useState("");
  const [newFirstName, setNewFirstName] = useState("");
  const [newLastName, setNewLastName] = useState("");
  const [newIsAdmin, setNewIsAdmin] = useState(false);
  const [newLicenceIds, setNewLicenceIds] = useState<number[]>([]);

  useEffect(() => {
    fetchUsers(token);
    fetchLicences(token);
  }, [token]);

  function fetchUsers(activeToken: string) {
    fetch(`${API_BASE}/auth/users`, {
      headers: { Authorization: `Bearer ${activeToken}` },
    })
      .then((res) => {
        if (!res.ok) throw new Error("failed");
        return res.json();
      })
      .then((data: User[]) => setUsers(data))
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

  async function handleCreateUser(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setNotice(null);
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/auth/register`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: newEmail,
          firstName: newFirstName,
          lastName: newLastName,
          isAdmin: newIsAdmin,
          licenceIds: newLicenceIds,
        }),
      });
      if (!res.ok) throw new Error("failed");
      const data = (await res.json()) as { passwordSent: boolean };
      setNotice(
        data.passwordSent
          ? "Benutzer erstellt. Passwort wurde per Mail versendet."
          : "Benutzer erstellt, aber keine Mail versendet (SMTP prüfen).",
      );
      setNewEmail("");
      setNewFirstName("");
      setNewLastName("");
      setNewIsAdmin(false);
      setNewLicenceIds([]);
      fetchUsers(token);
    } catch {
      setError("Benutzer konnte nicht erstellt werden.");
    } finally {
      setLoading(false);
    }
  }

  const filteredUsers = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    if (!normalized) return users;
    return users.filter((entry) => {
      const haystack = `${entry.firstName} ${entry.lastName} ${entry.email}`
        .toLowerCase()
        .trim();
      return haystack.includes(normalized);
    });
  }, [query, users]);

  return (
    <div className="space-y-6">
      <header className="space-y-1">
        <h1 className="text-2xl font-semibold">Benutzer</h1>
        <p className="text-sm text-zinc-600">
          Benutzer verwalten und neue Accounts anlegen.
        </p>
      </header>

      <section className="rounded border border-zinc-200 bg-white p-4">
        <h2 className="text-lg font-semibold">Benutzer anlegen</h2>
        <form onSubmit={handleCreateUser} className="mt-3 space-y-3">
          <div className="grid gap-3 sm:grid-cols-2">
            <input
              className="w-full rounded border border-zinc-300 px-3 py-2"
              value={newFirstName}
              onChange={(event) => setNewFirstName(event.target.value)}
              placeholder="Vorname"
              required
            />
            <input
              className="w-full rounded border border-zinc-300 px-3 py-2"
              value={newLastName}
              onChange={(event) => setNewLastName(event.target.value)}
              placeholder="Nachname"
              required
            />
          </div>
          <input
            className="w-full rounded border border-zinc-300 px-3 py-2"
            value={newEmail}
            onChange={(event) => setNewEmail(event.target.value)}
            placeholder="Email"
            type="email"
            required
          />
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={newIsAdmin}
              onChange={(event) => setNewIsAdmin(event.target.checked)}
            />
            Admin
          </label>
          <div className="space-y-2 text-sm">
            <p className="font-semibold text-zinc-700">
              Führerscheine zuweisen
            </p>
            <div className="flex flex-wrap gap-2">
              {licences.map((licence) => (
                <label
                  key={`licence-select-${licence.id}`}
                  className="flex items-center gap-2 rounded border border-zinc-200 px-2 py-1"
                >
                  <input
                    type="checkbox"
                    checked={newLicenceIds.includes(licence.id)}
                    onChange={(event) => {
                      if (event.target.checked) {
                        setNewLicenceIds([...newLicenceIds, licence.id]);
                      } else {
                        setNewLicenceIds(
                          newLicenceIds.filter((id) => id !== licence.id),
                        );
                      }
                    }}
                  />
                  {licence.title}
                </label>
              ))}
            </div>
          </div>
          <button
            type="submit"
            className="rounded bg-black px-4 py-2 text-white disabled:opacity-60"
            disabled={loading}
          >
            {loading ? "..." : "Benutzer erstellen"}
          </button>
          {error ? <p className="text-sm text-red-600">{error}</p> : null}
          {notice ? (
            <p className="text-sm text-green-600">{notice}</p>
          ) : null}
        </form>
      </section>

      <section className="rounded border border-zinc-200 bg-white p-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <h2 className="text-lg font-semibold">Alle Benutzer</h2>
          <input
            className="w-full rounded border border-zinc-300 px-3 py-2 text-sm sm:max-w-xs"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Suche nach Name oder Email"
          />
        </div>
        <div className="mt-4 space-y-3">
          {filteredUsers.length === 0 ? (
            <p className="text-sm text-zinc-600">
              Keine passenden Benutzer gefunden.
            </p>
          ) : (
            filteredUsers.map((entry) => (
              <a
                key={`user-${entry.id}`}
                className="block rounded border border-zinc-200 bg-zinc-50 p-3 hover:bg-white"
                href={`/admin/users/${entry.id}`}
              >
                <p className="font-semibold">
                  {entry.firstName} {entry.lastName}
                </p>
                <p className="text-sm text-zinc-600">{entry.email}</p>
                <p className="text-xs text-zinc-500">
                  ID: {entry.id} · {entry.isAdmin ? "Admin" : "User"} ·{" "}
                  {entry.licences.length} Führerscheine
                </p>
              </a>
            ))
          )}
        </div>
      </section>
    </div>
  );
}
