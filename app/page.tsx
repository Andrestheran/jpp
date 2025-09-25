"use client";

import { useMemo, useState } from "react";
import { DOMAINS } from "@/data/instrument";

import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { UserHeader } from "@/components/auth/UserHeader";

import { QuestionItem } from "./components/QuestionItem";

type State = {
  value: 0 | 1 | 2 | null;
  notApplicable: boolean;
  evidence: string;
  observations: string;
};

export default function HomePage() {
  const [page, setPage] = useState(1); // 1..N dominios

  // Estado por itemCode
  const allItems = DOMAINS.flatMap((d) =>
    d.subsections.flatMap((s) => s.items.map((i) => ({ ...i })))
  );

  const [answers, setAnswers] = useState<Record<string, State>>(
    Object.fromEntries(
      allItems.map((i) => [
        i.code,
        { value: null, notApplicable: false, evidence: "", observations: "" },
      ])
    )
  );

  const pageCount = DOMAINS.length;
  const currentDomain = DOMAINS[page - 1];

  const domainItems = useMemo(
    () => currentDomain.subsections.flatMap((s) => s.items),
    [currentDomain]
  );

  const totalAnswered = Object.values(answers).filter(
    (a) => a.notApplicable || a.value !== null
  ).length;
  const progressValue = Math.round((totalAnswered / allItems.length) * 100);

  const pageComplete = domainItems.every(
    (i) => answers[i.code].notApplicable || answers[i.code].value !== null
  );

  const update = (code: string, patch: Partial<State>) =>
    setAnswers((prev) => ({ ...prev, [code]: { ...prev[code], ...patch } }));

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    console.log("🚀 Submit function called");

    // Validación global
    const incomplete = allItems.some(
      (i) => !(answers[i.code].notApplicable || answers[i.code].value !== null)
    );
    console.log("❓ Incomplete answers:", incomplete);
    console.log("📊 All answers:", answers);

    if (incomplete) {
      alert("Faltan respuestas");
      return;
    }

    const payload = {
      evaluation: {
        instrumentKey: "centro-sim-qa",
        context: { submittedAt: new Date().toISOString() },
      },
      answers: allItems.map((i) => ({
        itemCode: i.code,
        domainCode: i.domainCode,
        score: answers[i.code].notApplicable ? null : answers[i.code].value,
        notApplicable: answers[i.code].notApplicable,
        evidence: answers[i.code].evidence || undefined,
        observations: answers[i.code].observations || undefined,
      })),
    };

    console.log("📦 Payload to send:", payload);

    try {
      console.log("🌐 Sending request to /api/submit");
      const res = await fetch("/api/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      console.log("📡 Response status:", res.status);
      const responseText = await res.text();
      console.log("📄 Response text:", responseText);

      if (!res.ok) {
        throw new Error(responseText);
      }

      alert("✅ ¡Respuestas enviadas correctamente!");
    } catch (err) {
      console.error("❌ Error in submit:", err);
      alert(`Error al enviar las respuestas: ${err}`);
    }
  }

  return (
    <ProtectedRoute>
      <UserHeader />
      <main className="min-h-screen bg-gray-50">
        <div className="mx-auto max-w-3xl p-6 space-y-6">
          <header className="space-y-3">
            <h1 className="text-2xl font-bold">Encuesta</h1>
            <div className="flex items-center justify-between">
              <p className="text-sm text-gray-600">
                Dominio {page} de {pageCount} • {totalAnswered}/
                {allItems.length} respondidas
              </p>
              <div className="w-40">
                <Progress value={progressValue} />
              </div>
            </div>
            <h2 className="text-lg font-semibold">
              {currentDomain.code}. {currentDomain.title}
            </h2>
          </header>

          <form onSubmit={submit} className="space-y-6">
            {domainItems.map((it, i) => {
              const st = answers[it.code];
              return (
                <QuestionItem
                  key={it.code}
                  index={i}
                  itemCode={it.code}
                  question={it.title}
                  value={st.value}
                  notApplicable={st.notApplicable}
                  evidence={st.evidence}
                  observations={st.observations}
                  onChange={(patch) => update(it.code, patch)}
                />
              );
            })}

            <div className="flex items-center justify-between pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
              >
                Anterior
              </Button>

              {page < pageCount ? (
                <Button
                  type="button"
                  onClick={() => setPage((p) => Math.min(pageCount, p + 1))}
                  disabled={!pageComplete}
                >
                  Siguiente
                </Button>
              ) : (
                <Button type="submit" disabled={!pageComplete}>
                  Enviar
                </Button>
              )}
            </div>
          </form>
        </div>
      </main>
    </ProtectedRoute>
  );
}
