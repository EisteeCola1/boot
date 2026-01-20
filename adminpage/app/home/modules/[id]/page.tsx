"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { clearTokens, refreshAccessToken } from "../../../lib/auth";
import { useHomeContext } from "../../home-context";

type ModuleResponse = {
  module: { id: number; title: string };
  questions: ModuleQuestion[];
};

type ModuleQuestion = {
  id: number;
  text: string;
  imageUrl?: string | null;
  answers: AnswerOption[];
  status: QuestionStatus;
};

type AnswerOption = {
  id: number;
  text: string;
};

type QuestionStatus = {
  marked: boolean;
  answered: boolean;
  answeredRight: boolean | null;
  selectedAnswerOptionId: number | null;
  correctAnswerOptionIds?: number[];
};

const API_BASE =
  process.env.NEXT_PUBLIC_API_BASE?.replace(/\/$/, "") ||
  "http://localhost:3001";

export default function ModulePage() {
  const params = useParams();
  const router = useRouter();
  const { token } = useHomeContext();
  const moduleId = Number(params.id);
  const [moduleTitle, setModuleTitle] = useState<string>("");
  const [questions, setQuestions] = useState<ModuleQuestion[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [filterMode, setFilterMode] = useState<
    "all" | "marked" | "wrong" | "unanswered" | "correct"
  >("all");
  const [filterIndex, setFilterIndex] = useState(0);
  const [selection, setSelection] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  useEffect(() => {
    if (!Number.isFinite(moduleId)) {
      setLoadError("Modul konnte nicht geladen werden.");
      setLoading(false);
      return;
    }

    let cancelled = false;

    async function loadModule() {
      try {
        setLoading(true);
        const res = await fetch(`${API_BASE}/learning/modules/${moduleId}/questions`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) throw new Error("failed");
        const data = (await res.json()) as ModuleResponse;
        if (!cancelled) {
          setModuleTitle(data.module.title);
          setQuestions(data.questions);
          setCurrentIndex(0);
          setFilterMode("all");
          setFilterIndex(0);
          setLoadError(null);
        }
      } catch {
        if (!cancelled) {
          setLoadError("Modul konnte nicht geladen werden.");
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    loadModule();

    return () => {
      cancelled = true;
    };
  }, [moduleId, token]);

  const stats = useMemo(() => {
    const correct: number[] = [];
    const wrong: number[] = [];
    const marked: number[] = [];
    const unanswered: number[] = [];

    questions.forEach((question, index) => {
      if (question.status.marked) marked.push(index);
      if (!question.status.answered) {
        unanswered.push(index);
        return;
      }
      if (question.status.answeredRight) {
        correct.push(index);
      } else {
        wrong.push(index);
      }
    });

    return { correct, wrong, marked, unanswered };
  }, [questions]);

  const filteredIndices = useMemo(() => {
    switch (filterMode) {
      case "marked":
        return stats.marked;
      case "wrong":
        return stats.wrong;
      case "unanswered":
        return stats.unanswered;
      case "correct":
        return stats.correct;
      default:
        return [];
    }
  }, [filterMode, stats]);

  useEffect(() => {
    if (filterMode === "all") return;
    setFilterIndex((prev) =>
      Math.min(prev, Math.max(filteredIndices.length - 1, 0)),
    );
  }, [filterMode, filteredIndices.length]);

  const activeIndex =
    filterMode === "all" ? currentIndex : filteredIndices[filterIndex];
  const currentQuestion =
    activeIndex !== undefined ? questions[activeIndex] : undefined;

  useEffect(() => {
    const current = currentQuestion;
    setSelection(current?.status.selectedAnswerOptionId ?? null);
    setActionError(null);
  }, [currentQuestion]);

  async function apiFetch(path: string, options?: RequestInit) {
    let currentToken = token;
    const res = await fetch(`${API_BASE}${path}`, {
      ...options,
      headers: {
        ...(options?.headers ?? {}),
        Authorization: `Bearer ${currentToken}`,
      },
    });
    if (res.status === 401) {
      const refreshed = await refreshAccessToken(API_BASE);
      if (!refreshed) {
        clearTokens();
        router.replace("/");
        return null;
      }
      currentToken = refreshed;
      return fetch(`${API_BASE}${path}`, {
        ...options,
        headers: {
          ...(options?.headers ?? {}),
          Authorization: `Bearer ${currentToken}`,
        },
      });
    }
    return res;
  }

  async function submitAnswer(answerOptionId: number) {
    if (submitting || !currentQuestion) return;
    if (currentQuestion.status.answered && currentQuestion.status.answeredRight) {
      return;
    }
    setSubmitting(true);
    setSelection(answerOptionId);
    try {
      const res = await apiFetch(`/learning/questions/${currentQuestion.id}/answer`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ answerOptionId }),
      });
      if (!res || !res.ok) throw new Error("failed");
      const data = (await res.json()) as {
        answeredRight: boolean;
        selectedAnswerOptionId: number;
        correctAnswerOptionIds?: number[];
      };
      setActionError(null);
      setQuestions((prev) =>
        prev.map((question) =>
          question.id === currentQuestion.id
            ? {
                ...question,
                status: {
                  ...question.status,
                  answered: true,
                  answeredRight: data.answeredRight,
                  selectedAnswerOptionId: data.selectedAnswerOptionId,
                  correctAnswerOptionIds: data.correctAnswerOptionIds,
                },
              }
            : question,
        ),
      );
    } catch {
      setActionError("Antwort konnte nicht gespeichert werden.");
    } finally {
      setSubmitting(false);
    }
  }

  async function toggleMarked() {
    if (!currentQuestion) return;
    try {
      const res = await apiFetch(`/learning/questions/${currentQuestion.id}/mark`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ marked: !currentQuestion.status.marked }),
      });
      if (!res || !res.ok) throw new Error("failed");
      const data = (await res.json()) as { marked: boolean };
      setActionError(null);
      setQuestions((prev) =>
        prev.map((question) =>
          question.id === currentQuestion.id
            ? {
                ...question,
                status: { ...question.status, marked: data.marked },
              }
            : question,
        ),
      );
    } catch {
      setActionError("Markierung konnte nicht gespeichert werden.");
    }
  }

  const correctAnswerText = useMemo(() => {
    if (!currentQuestion?.status.correctAnswerOptionIds?.length) return "";
    return currentQuestion.answers
      .filter((answer) =>
        currentQuestion.status.correctAnswerOptionIds?.includes(answer.id),
      )
      .map((answer) => answer.text)
      .join(", ");
  }, [currentQuestion]);
  const answeredCount = useMemo(
    () =>
      questions.filter((question) => question.status.answeredRight).length,
    [questions],
  );
  const progressPercent = useMemo(() => {
    if (!questions.length) return 0;
    return Math.round((answeredCount / questions.length) * 100);
  }, [answeredCount, questions.length]);
  const filterItems = useMemo(
    () =>
      [
        {
          key: "correct",
          label: "Richtig beantwortet",
          count: stats.correct.length,
        },
        { key: "wrong", label: "Falsch beantwortet", count: stats.wrong.length },
        { key: "marked", label: "Markiert", count: stats.marked.length },
        {
          key: "unanswered",
          label: "Unbeantwortet",
          count: stats.unanswered.length,
        },
      ] as const,
    [stats],
  );

  if (loading) {
    return (
      <main className="min-h-screen bg-zinc-50 text-zinc-900">
        <div className="mx-auto max-w-5xl p-6">
          <p>Lade Modul...</p>
        </div>
      </main>
    );
  }

  if (loadError) {
    return (
      <main className="min-h-screen bg-zinc-50 text-zinc-900">
        <div className="mx-auto max-w-5xl space-y-4 p-6">
          <p className="text-sm text-red-600">{loadError}</p>
          <button
            type="button"
            onClick={() => router.push("/home")}
            className="rounded bg-zinc-900 px-4 py-2 text-xs font-semibold text-white"
          >
            Zurück
          </button>
        </div>
      </main>
    );
  }

  if (!currentQuestion && questions.length === 0) {
    return (
      <main className="min-h-screen bg-zinc-50 text-zinc-900">
        <div className="mx-auto max-w-5xl space-y-4 p-6">
          <p>Keine Fragen vorhanden.</p>
          <button
            type="button"
            onClick={() => router.push("/home")}
            className="rounded bg-zinc-900 px-4 py-2 text-xs font-semibold text-white"
          >
            Zurück
          </button>
        </div>
      </main>
    );
  }

  const answeredRight = currentQuestion?.status.answeredRight ?? null;
  const totalQuestions =
    filterMode === "all" ? questions.length : filteredIndices.length;
  const visibleIndex = filterMode === "all" ? currentIndex : filterIndex;

  return (
    <main className="min-h-screen bg-zinc-50 text-zinc-900">
      <div className="mx-auto max-w-5xl space-y-6 p-6">
        <header className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-xs uppercase text-zinc-500">Modul</p>
            <h1 className="text-2xl font-semibold">{moduleTitle}</h1>
          </div>
          <button
            type="button"
            onClick={() => router.push("/home")}
            className="rounded border border-zinc-200 bg-white px-4 py-2 text-xs font-semibold"
          >
            Zurück zur Übersicht
          </button>
        </header>

        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_260px]">
          <section className="space-y-4 rounded border border-zinc-200 bg-white p-6">
            {filterMode !== "all" && filteredIndices.length === 0 ? (
              <div className="space-y-2">
                <p className="text-sm font-semibold">
                  Keine Fragen in dieser Kategorie.
                </p>
                <p className="text-xs text-zinc-500">
                  Klicke die Auswahl rechts erneut, um alle Fragen zu sehen.
                </p>
              </div>
            ) : (
              <>
                <div className="flex items-center justify-between text-sm text-zinc-600">
                  <span>
                    Frage {Math.min(visibleIndex + 1, totalQuestions)} von{" "}
                    {totalQuestions}
                  </span>
                  <button
                    type="button"
                    onClick={toggleMarked}
                    className="rounded border border-zinc-200 px-3 py-1 text-xs font-semibold"
                  >
                    {currentQuestion?.status.marked
                      ? "Markierung entfernen"
                      : "Frage markieren"}
                  </button>
                </div>

                <div className="space-y-3">
                  <p className="text-base font-semibold">{currentQuestion?.text}</p>
                  {currentQuestion?.imageUrl ? (
                    <img
                      src={currentQuestion.imageUrl}
                      alt="Fragebild"
                      className="max-w-full rounded border border-zinc-200 bg-white"
                      loading="lazy"
                    />
                  ) : null}
                </div>

                <div className="space-y-2">
                  {currentQuestion?.answers.map((answer) => {
                    const selectedId =
                      currentQuestion.status.selectedAnswerOptionId ?? selection;
                    const isSelected = selectedId === answer.id;
                    const isCorrect =
                      currentQuestion.status.correctAnswerOptionIds?.includes(
                        answer.id,
                      ) ?? false;
                    const isWrongSelection =
                      currentQuestion.status.answered &&
                      !currentQuestion.status.answeredRight &&
                      isSelected;
                    const isCorrectSelection =
                      currentQuestion.status.answered &&
                      currentQuestion.status.answeredRight &&
                      isSelected;
                    let answerClass = "border-zinc-200 bg-white";
                    if (isCorrectSelection || isCorrect) {
                      answerClass = "border-emerald-200 bg-emerald-50";
                    } else if (isWrongSelection) {
                      answerClass = "border-red-200 bg-red-50";
                    } else if (!currentQuestion.status.answered && isSelected) {
                      answerClass = "border-zinc-900 bg-zinc-50";
                    }

                    const interactionAllowed =
                      !currentQuestion.status.answered ||
                      !currentQuestion.status.answeredRight;

                    return (
                      <button
                        key={answer.id}
                        type="button"
                        onClick={() => submitAnswer(answer.id)}
                        disabled={submitting || !interactionAllowed}
                        className={`w-full rounded border p-3 text-left text-sm ${answerClass}`}
                      >
                        {answer.text}
                      </button>
                    );
                  })}
                </div>

                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() =>
                        filterMode === "all"
                          ? setCurrentIndex((prev) => Math.max(0, prev - 1))
                          : setFilterIndex((prev) => Math.max(0, prev - 1))
                      }
                      disabled={visibleIndex === 0}
                      className="rounded border border-zinc-200 px-4 py-2 text-xs font-semibold disabled:opacity-50"
                    >
                      Zurück
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        filterMode === "all"
                          ? setCurrentIndex((prev) =>
                              Math.min(questions.length - 1, prev + 1),
                            )
                          : setFilterIndex((prev) =>
                              Math.min(filteredIndices.length - 1, prev + 1),
                            )
                      }
                      disabled={visibleIndex >= totalQuestions - 1}
                      className="rounded border border-zinc-200 px-4 py-2 text-xs font-semibold disabled:opacity-50"
                    >
                      Weiter
                    </button>
                  </div>
                </div>

                {actionError ? (
                  <p className="text-xs text-red-600">{actionError}</p>
                ) : null}
                {currentQuestion?.status.answered ? (
                  <div
                    className={`rounded border px-4 py-3 text-sm ${
                      answeredRight
                        ? "border-emerald-200 bg-emerald-50 text-emerald-900"
                        : "border-red-200 bg-red-50 text-red-900"
                    }`}
                  >
                    {answeredRight
                      ? "Richtig beantwortet."
                      : "Leider falsch beantwortet."}
                    {!answeredRight && correctAnswerText ? (
                      <p className="mt-2 text-xs text-red-800">
                        Richtig wäre: {correctAnswerText}
                      </p>
                    ) : null}
                  </div>
                ) : null}
              </>
            )}
          </section>

          <aside className="space-y-4">
            <div className="rounded border border-zinc-200 bg-white p-4">
              <h2 className="text-sm font-semibold">Fortschritt</h2>
              <div className="mt-3 space-y-2 text-sm">
                <div className="flex items-center justify-between text-xs text-zinc-600">
                  <span>{answeredCount} von {questions.length} beantwortet</span>
                  <span className="font-semibold text-zinc-900">{progressPercent}%</span>
                </div>
                <div className="h-2 w-full rounded-full bg-zinc-100">
                  <div
                    className="h-2 rounded-full bg-zinc-900"
                    style={{ width: `${progressPercent}%` }}
                  />
                </div>
              </div>
              <div className="mt-4 grid gap-3 text-sm">
                {filterItems.map((item) => {
                  const isActive = filterMode === item.key;
                  return (
                    <div
                      key={item.key}
                      role="button"
                      tabIndex={0}
                      onClick={() => {
                        const nextMode =
                          isActive || item.count === 0
                            ? "all"
                            : item.key;
                        setFilterMode(nextMode);
                        setFilterIndex(0);
                      }}
                      onKeyDown={(event) => {
                        if (event.key === "Enter" || event.key === " ") {
                          event.preventDefault();
                          const nextMode =
                            isActive || item.count === 0
                              ? "all"
                              : item.key;
                          setFilterMode(nextMode);
                          setFilterIndex(0);
                        }
                      }}
                      className={`cursor-pointer rounded-full border px-4 py-3 text-sm font-semibold transition ${
                        isActive
                          ? "border-zinc-900 bg-zinc-900 text-white"
                          : "border-zinc-200 bg-zinc-50 text-zinc-800 hover:border-zinc-300"
                      } ${item.count === 0 ? "opacity-60" : ""}`}
                    >
                      {item.label} {item.count}
                    </div>
                  );
                })}
              </div>
            </div>
          </aside>
        </div>
      </div>
    </main>
  );
}
