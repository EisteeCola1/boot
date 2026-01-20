"use client";

import { useEffect, useMemo, useState } from "react";
import { useAdminContext } from "../admin-context";

type AnswerOption = {
  id: number;
  text: string;
};

type AnswerLink = {
  answerOption: AnswerOption;
  correct: boolean;
};

type Question = {
  id: number;
  text: string;
  imageUrl?: string | null;
  answerLinks: AnswerLink[];
};

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

export default function AssignQuestionsPage() {
  const { token } = useAdminContext();
  const [licences, setLicences] = useState<Licence[]>([]);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [activeIndex, setActiveIndex] = useState(0);
  const [licenceId, setLicenceId] = useState("");
  const [moduleGroupId, setModuleGroupId] = useState("");
  const [moduleId, setModuleId] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [rangeStart, setRangeStart] = useState("");
  const [rangeEnd, setRangeEnd] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchLicences(token);
    fetchUnassigned(token);
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

  function fetchUnassigned(activeToken: string) {
    fetch(`${API_BASE}/questions/unassigned`, {
      headers: { Authorization: `Bearer ${activeToken}` },
    })
      .then((res) => {
        if (!res.ok) throw new Error("failed");
        return res.json();
      })
      .then((data: Question[]) => setQuestions(data))
      .catch(() => {
        // ignore
      });
  }

  function filterQuestions(list: Question[], term: string) {
    const normalized = term.trim().toLowerCase();
    if (!normalized) return list;
    return list.filter((question) => {
      if (question.text.toLowerCase().includes(normalized)) return true;
      return question.answerLinks.some((answer) =>
        answer.answerOption.text.toLowerCase().includes(normalized),
      );
    });
  }

  const visibleQuestions = useMemo(
    () => filterQuestions(questions, searchTerm),
    [questions, searchTerm],
  );

  const currentQuestion = visibleQuestions[activeIndex];

  const selectedLicence = useMemo(
    () => licences.find((item) => String(item.id) === licenceId),
    [licenceId, licences],
  );

  const availableModuleGroups = selectedLicence?.moduleGroups ?? [];
  const selectedModuleGroup = availableModuleGroups.find(
    (group) => String(group.id) === moduleGroupId,
  );
  const availableModules = selectedModuleGroup?.modules ?? [];

  useEffect(() => {
    setModuleGroupId("");
    setModuleId("");
  }, [licenceId]);

  useEffect(() => {
    setModuleId("");
  }, [moduleGroupId]);

  async function handleAssign() {
    if (!currentQuestion || !moduleId) return;
    setSaving(true);
    setError(null);
    try {
      const res = await fetch(
        `${API_BASE}/questions/${currentQuestion.id}/assign`,
        {
          method: "PATCH",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ moduleId: Number(moduleId) }),
        },
      );
      if (!res.ok) throw new Error("failed");
      const nextQuestions = questions.filter(
        (question) => question.id !== currentQuestion.id,
      );
      const nextVisible = filterQuestions(nextQuestions, searchTerm);
      setQuestions(nextQuestions);
      setActiveIndex((index) =>
        Math.min(index, Math.max(nextVisible.length - 1, 0)),
      );
    } catch {
      setError("Zuordnung fehlgeschlagen.");
    } finally {
      setSaving(false);
    }
  }

  async function handleAssignRange() {
    if (!moduleId) return;
    const start = Number(rangeStart);
    const end = Number(rangeEnd);
    if (!start || !end || start > end) {
      setError("Bitte gültigen Bereich angeben.");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const slice = visibleQuestions.slice(start - 1, end);
      if (slice.length === 0) {
        setError("Keine Fragen im ausgewählten Bereich.");
        return;
      }
      await Promise.all(
        slice.map((question) =>
          fetch(`${API_BASE}/questions/${question.id}/assign`, {
            method: "PATCH",
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ moduleId: Number(moduleId) }),
          }).then((res) => {
            if (!res.ok) throw new Error("failed");
          }),
        ),
      );
      const assignedIds = new Set(slice.map((question) => question.id));
      const nextQuestions = questions.filter(
        (question) => !assignedIds.has(question.id),
      );
      const nextVisible = filterQuestions(nextQuestions, searchTerm);
      setQuestions(nextQuestions);
      setActiveIndex((index) =>
        Math.min(index, Math.max(nextVisible.length - 1, 0)),
      );
      setRangeStart("");
      setRangeEnd("");
    } catch {
      setError("Bereich konnte nicht zugeordnet werden.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-6">
      <header className="space-y-2">
        <h1 className="text-2xl font-semibold">Fragen zuordnen</h1>
        <p className="text-sm text-zinc-600">
          {questions.length} Fragen warten auf Zuordnung.
        </p>
      </header>

      <section className="rounded border border-zinc-200 bg-white p-4">
        <label className="text-sm text-zinc-600" htmlFor="question-search">
          Suche nach Frage oder Antwort
        </label>
        <input
          id="question-search"
          value={searchTerm}
          onChange={(event) => {
            setSearchTerm(event.target.value);
            setActiveIndex(0);
          }}
          placeholder="z.B. Schallsignal, Anker, Fahrt"
          className="mt-2 w-full rounded border border-zinc-300 px-3 py-2"
        />
        <p className="mt-2 text-xs text-zinc-500">
          {visibleQuestions.length} von {questions.length} Fragen sichtbar.
        </p>
      </section>

      {!currentQuestion ? (
        <section className="rounded border border-zinc-200 bg-white p-6">
          <p>
            {questions.length === 0
              ? "Keine offenen Fragen mehr."
              : "Keine Treffer für diese Suche."}
          </p>
        </section>
      ) : (
        <section className="space-y-4 rounded border border-zinc-200 bg-white p-6">
          <div className="flex items-center justify-between text-sm text-zinc-600">
            <span>
              Frage {activeIndex + 1} von {visibleQuestions.length}
            </span>
            <div className="space-x-2">
              <button
                type="button"
                className="rounded border border-zinc-300 px-2 py-1 disabled:opacity-50"
                onClick={() =>
                  setActiveIndex((index) => Math.max(index - 1, 0))
                }
                disabled={activeIndex === 0}
              >
                Zurück
              </button>
              <button
                type="button"
                className="rounded border border-zinc-300 px-2 py-1 disabled:opacity-50"
                onClick={() =>
                  setActiveIndex((index) =>
                    Math.min(index + 1, visibleQuestions.length - 1),
                  )
                }
                disabled={activeIndex >= visibleQuestions.length - 1}
              >
                Weiter
              </button>
            </div>
          </div>

          <div className="space-y-3">
            <p className="text-base font-semibold">{currentQuestion.text}</p>
            {currentQuestion.imageUrl ? (
              <img
                src={currentQuestion.imageUrl}
                alt="Fragebild"
                className="max-w-full rounded border border-zinc-200"
              />
            ) : null}
            <ol className="list-decimal space-y-1 pl-5 text-sm text-zinc-700">
              {currentQuestion.answerLinks.map((answer, index) => (
                <li key={`${currentQuestion.id}-answer-${index}`}>
                  <span className={answer.correct ? "font-semibold" : undefined}>
                    {answer.answerOption.text}
                  </span>{" "}
                  {answer.correct ? (
                    <span className="text-xs text-emerald-600">(richtig)</span>
                  ) : null}
                </li>
              ))}
            </ol>
          </div>

          <div className="grid gap-3 sm:grid-cols-3">
            <select
              className="w-full rounded border border-zinc-300 px-3 py-2"
              value={licenceId}
              onChange={(event) => setLicenceId(event.target.value)}
            >
              <option value="">Licence wählen</option>
              {licences.map((licence) => (
                <option key={`licence-${licence.id}`} value={licence.id}>
                  {licence.title}
                </option>
              ))}
            </select>
            <select
              className="w-full rounded border border-zinc-300 px-3 py-2"
              value={moduleGroupId}
              onChange={(event) => setModuleGroupId(event.target.value)}
              disabled={!licenceId}
            >
              <option value="">Modulgruppe wählen</option>
              {availableModuleGroups.map((group) => (
                <option key={`group-${group.id}`} value={group.id}>
                  {group.title}
                </option>
              ))}
            </select>
            <select
              className="w-full rounded border border-zinc-300 px-3 py-2"
              value={moduleId}
              onChange={(event) => setModuleId(event.target.value)}
              disabled={!moduleGroupId}
            >
              <option value="">Modul wählen</option>
              {availableModules.map((module) => (
                <option key={`module-${module.id}`} value={module.id}>
                  {module.title}
                </option>
              ))}
            </select>
          </div>

          {error ? <p className="text-sm text-red-600">{error}</p> : null}

          <button
            type="button"
            className="rounded bg-black px-4 py-2 text-white disabled:opacity-60"
            onClick={handleAssign}
            disabled={!moduleId || saving}
          >
            {saving ? "Speichern..." : "Zuweisen"}
          </button>

          <div className="mt-4 space-y-2 border-t border-zinc-200 pt-4">
            <p className="text-sm text-zinc-600">
              Bereich zuweisen (z.B. 1 bis 72)
            </p>
            <div className="grid gap-2 sm:grid-cols-3">
              <input
                className="w-full rounded border border-zinc-300 px-3 py-2"
                value={rangeStart}
                onChange={(event) => setRangeStart(event.target.value)}
                placeholder="Start"
              />
              <input
                className="w-full rounded border border-zinc-300 px-3 py-2"
                value={rangeEnd}
                onChange={(event) => setRangeEnd(event.target.value)}
                placeholder="Ende"
              />
              <button
                type="button"
                className="rounded border border-zinc-300 px-3 py-2 text-sm disabled:opacity-60"
                onClick={handleAssignRange}
                disabled={!moduleId || saving}
              >
                Bereich zuweisen
              </button>
            </div>
          </div>
        </section>
      )}
    </div>
  );
}
