"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import { useAdminContext } from "../../admin-context";

type Module = {
  id: number;
  title: string;
  moduleGroupId: number;
};

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

const API_BASE =
  process.env.NEXT_PUBLIC_API_BASE?.replace(/\/$/, "") ||
  "http://localhost:3001";

export default function ModuleDetailPage() {
  const { token } = useAdminContext();
  const [module, setModule] = useState<Module | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [activeIndex, setActiveIndex] = useState(0);
  const [jumpValue, setJumpValue] = useState("");
  const [isUpdating, setIsUpdating] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const params = useParams<{ id: string }>();
  const moduleId = Number(params?.id);

  useEffect(() => {
    fetchModule(token);
    fetchQuestions(token);
  }, [token, moduleId]);

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

  useEffect(() => {
    setActiveIndex((index) =>
      Math.min(Math.max(index, 0), Math.max(visibleQuestions.length - 1, 0)),
    );
  }, [visibleQuestions.length]);

  function fetchModule(activeToken: string) {
    fetch(`${API_BASE}/modules`, {
      headers: { Authorization: `Bearer ${activeToken}` },
    })
      .then((res) => {
        if (!res.ok) throw new Error("failed");
        return res.json();
      })
      .then((data: Module[]) => {
        const selected = data.find((entry) => entry.id === moduleId) ?? null;
        setModule(selected);
      })
      .catch(() => {
        // ignore
      });
  }

  function handleJumpSubmit() {
    const raw = Number(jumpValue);
    if (!Number.isFinite(raw)) return;
    const targetIndex = Math.min(
      Math.max(Math.floor(raw) - 1, 0),
      visibleQuestions.length - 1,
    );
    if (targetIndex >= 0 && visibleQuestions[targetIndex]) {
      setActiveIndex(targetIndex);
    }
  }

  function handleUnassign(questionId: number) {
    if (!token) return;
    setIsUpdating(true);
    fetch(`${API_BASE}/questions/${questionId}/assign`, {
      method: "PATCH",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ moduleId: null }),
      })
      .then((res) => {
        if (!res.ok) throw new Error("failed");
        setQuestions((prev) => prev.filter((item) => item.id !== questionId));
      })
      .catch(() => {
        // ignore
      })
      .finally(() => setIsUpdating(false));
  }

  function fetchQuestions(activeToken: string) {
    fetch(`${API_BASE}/questions?moduleId=${moduleId}`, {
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

  const currentQuestion = useMemo(
    () => visibleQuestions[activeIndex],
    [visibleQuestions, activeIndex],
  );

  return (
    <div className="space-y-6">
      <header className="space-y-2">
        <h1 className="text-2xl font-semibold">
          Modul: {module?.title ?? "Unbekannt"}
        </h1>
        <a className="text-sm text-blue-600 underline" href="/admin/licences">
          Zurück zur Übersicht
        </a>
      </header>

      <section className="rounded border border-zinc-200 bg-white p-4">
        <label className="text-sm text-zinc-600" htmlFor="module-question-search">
          Suche nach Frage oder Antwort
        </label>
        <input
          id="module-question-search"
          value={searchTerm}
          onChange={(event) => {
            setSearchTerm(event.target.value);
            setActiveIndex(0);
          }}
          placeholder="z.B. Lichter, Vorfahrt, Sicht"
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
              ? "Keine Fragen in diesem Modul."
              : "Keine Treffer für diese Suche."}
          </p>
        </section>
      ) : (
        <section className="space-y-4 rounded border border-zinc-200 bg-white p-6">
          <div className="flex items-center justify-between text-sm text-zinc-600">
            <span>
              Frage {activeIndex + 1} von {visibleQuestions.length}
            </span>
            <div className="flex flex-wrap items-center gap-2">
              <div className="flex items-center gap-2">
                <label className="text-xs text-zinc-500" htmlFor="jump-to">
                  Zu Frage
                </label>
                <input
                  id="jump-to"
                  type="number"
                  min={1}
                  max={visibleQuestions.length}
                  value={jumpValue}
                  onChange={(event) => setJumpValue(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter") {
                      handleJumpSubmit();
                    }
                  }}
                  className="w-20 rounded border border-zinc-300 px-2 py-1 text-sm"
                />
                <button
                  type="button"
                  className="rounded border border-zinc-300 px-2 py-1 text-sm disabled:opacity-50"
                  onClick={handleJumpSubmit}
                  disabled={!jumpValue || visibleQuestions.length === 0}
                >
                  Springen
                </button>
              </div>
              <div className="flex items-center gap-2">
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
          <button
            type="button"
            className="rounded border border-red-200 px-3 py-1 text-sm text-red-600 disabled:opacity-50"
            onClick={() => handleUnassign(currentQuestion.id)}
            disabled={isUpdating}
          >
            Zuweisung entfernen
          </button>
        </section>
      )}
    </div>
  );
}
