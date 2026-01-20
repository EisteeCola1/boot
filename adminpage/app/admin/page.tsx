"use client";

import { useMemo } from "react";
import { useAdminContext } from "./admin-context";

export default function AdminPage() {
  const { user } = useAdminContext();

  const displayName = useMemo(() => {
    return `${user.firstName} ${user.lastName}`.trim();
  }, [user]);

  return (
    <div className="space-y-4">
      <header className="space-y-1">
        <h1 className="text-2xl font-semibold">Admin</h1>
        <p className="text-sm text-zinc-600">
          Eingeloggt als {displayName || user.email}
        </p>
      </header>
      <div className="rounded border border-zinc-200 bg-white p-4 text-sm text-zinc-700">
        Wähle links einen Bereich aus.
      </div>
    </div>
  );
}
