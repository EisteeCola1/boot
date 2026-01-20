"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useHomeContext } from "./home-context";

type ModuleSummary = {
  id: number;
  title: string;
  questionCount: number;
  answeredCount: number;
};

type ModuleGroup = {
  id: number;
  title: string;
  modules: ModuleSummary[];
};

const API_BASE =
  process.env.NEXT_PUBLIC_API_BASE?.replace(/\/$/, "") ||
  "http://localhost:3001";

export default function HomePage() {
  const { user, token } = useHomeContext();
  const [moduleGroups, setModuleGroups] = useState<ModuleGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    let cancelled = false;

    async function fetchModuleGroups() {
      try {
        setLoading(true);
        const res = await fetch(`${API_BASE}/learning/module-groups`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) throw new Error("failed");
        const data = (await res.json()) as ModuleGroup[];
        if (!cancelled) {
          setModuleGroups(data);
          setError(null);
        }
      } catch {
        if (!cancelled) {
          setError("Modulgruppen konnten nicht geladen werden.");
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    fetchModuleGroups();

    return () => {
      cancelled = true;
    };
  }, [token]);

  const displayName = useMemo(() => {
    return `${user.firstName} ${user.lastName}`.trim();
  }, [user]);

  return (
    <main className="min-h-screen bg-zinc-50 text-zinc-900">
      <div className="mx-auto max-w-4xl space-y-6 p-6">
        <header className="space-y-1">
          <h1 className="text-2xl font-semibold">Deine Module</h1>
          <p>Willkommen, {displayName || user.email}.</p>
        </header>

        {loading ? <p>Lade Module...</p> : null}
        {error ? <p className="text-sm text-red-600">{error}</p> : null}
        {!loading && !error && moduleGroups.length === 0 ? (
          <p className="text-sm text-zinc-600">
            Es sind noch keine Module hinterlegt.
          </p>
        ) : null}

        {moduleGroups.map((group) => (
          <details
            key={group.id}
            className="rounded border border-zinc-200 bg-white p-4"
          >
            <summary className="cursor-pointer text-base font-semibold">
              <span>{group.title}</span>
              <span className="ml-2 text-xs font-normal text-zinc-500">
                {(() => {
                  const total = group.modules.reduce(
                    (sum, module) => sum + module.questionCount,
                    0,
                  );
                  const answered = group.modules.reduce(
                    (sum, module) => sum + module.answeredCount,
                    0,
                  );
                  const percent = total ? Math.round((answered / total) * 100) : 0;
                  return `${percent}% abgeschlossen`;
                })()}
              </span>
            </summary>
            <div className="mt-3 space-y-2">
              {group.modules.length ? (
                group.modules.map((module) => (
                  <div
                    key={module.id}
                    className="flex flex-wrap items-center justify-between gap-3 rounded border border-zinc-200 bg-zinc-50 p-3"
                  >
                    <div>
                      <p className="text-sm font-semibold">{module.title}</p>
                      <p className="text-xs text-zinc-600">
                        {module.questionCount} Fragen ·{" "}
                        {module.questionCount
                          ? Math.round(
                              (module.answeredCount / module.questionCount) * 100,
                            )
                          : 0}
                        % abgeschlossen
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => router.push(`/home/modules/${module.id}`)}
                      className="rounded bg-zinc-900 px-4 py-2 text-xs font-semibold text-white"
                    >
                      Starten
                    </button>
                  </div>
                ))
              ) : (
                <p className="text-sm text-zinc-600">
                  Keine Module vorhanden.
                </p>
              )}
            </div>
          </details>
        ))}
      </div>
    </main>
  );
}
