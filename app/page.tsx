"use client";

import { useMemo, useState, useEffect } from "react";
import { loadDomains, type UIDomain } from "@/data/instrument";

import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { UserHeader } from "@/components/auth/UserHeader";
import { useAuth } from "@/contexts/AuthContext";

import { QuestionItem } from "./components/QuestionItem";

type State = {
  value: 0 | 1 | 2 | null;
  notApplicable: boolean;
  evidence: string;
  observations: string;
};

export default function HomePage() {
  const { user } = useAuth();
  const [page, setPage] = useState(1); // 1..N dominios
  const [domains, setDomains] = useState<UIDomain[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const [answers, setAnswers] = useState<Record<string, State>>({});
  const [initialized, setInitialized] = useState(false);

  // Cargar dominios desde la base de datos
  useEffect(() => {
    let isMounted = true;

    // Timeout de seguridad para evitar carga infinita
    const timeoutId = setTimeout(() => {
      if (isMounted && loading) {
        console.warn("⚠️ Loading timeout reached");
        setLoading(false);
        setInitialized(true);
      }
    }, 10000); // 10 segundos timeout

    const loadData = async () => {
      try {
        const domainsData = await loadDomains();
        if (isMounted) {
          setDomains(domainsData);

          // Inicializar respuestas
          const allItems = domainsData.flatMap((d) =>
            d.subsections.flatMap((s) => s.items.map((i) => ({ ...i })))
          );

          if (allItems.length > 0) {
            const initialAnswers = Object.fromEntries(
              allItems.map((i) => [
                i.code,
                {
                  value: null,
                  notApplicable: false,
                  evidence: "",
                  observations: "",
                },
              ])
            );
            setAnswers(initialAnswers);
          }

          setInitialized(true);
          clearTimeout(timeoutId);
        }
      } catch (error) {
        console.error("Error loading domains:", error);
        if (isMounted) {
          setInitialized(true);
          clearTimeout(timeoutId);
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    loadData();

    return () => {
      isMounted = false;
      clearTimeout(timeoutId);
    };
  }, []);

  // Estado por itemCode - usar useMemo para evitar recálculos innecesarios
  const allItems = useMemo(() => {
    return domains.flatMap((d) =>
      d.subsections.flatMap((s) => s.items.map((i) => ({ ...i })))
    );
  }, [domains]);

  const pageCount = domains.length;
  const currentDomain = domains[page - 1];

  const domainItems = useMemo(
    () => currentDomain?.subsections.flatMap((s) => s.items) || [],
    [currentDomain]
  );

  const totalAnswered = Object.values(answers).filter(
    (a) => a.notApplicable || a.value !== null
  ).length;
  const progressValue =
    allItems.length > 0
      ? Math.round((totalAnswered / allItems.length) * 100)
      : 0;

  const pageComplete = domainItems.every(
    (i) => answers[i.code]?.notApplicable || answers[i.code]?.value !== null
  );

  const update = (code: string, patch: Partial<State>) =>
    setAnswers((prev) => ({ ...prev, [code]: { ...prev[code], ...patch } }));

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    
    // Evitar doble envío
    if (submitting) {
      console.log("⏳ Ya se está enviando, ignorando...");
      return;
    }
    
    setSubmitting(true);
    console.log("🚀 Submit function called");

    try {
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

      // Deduplicar items por código (por si acaso)
      const uniqueItems = Array.from(
        new Map(allItems.map(item => [item.code, item])).values()
      );

      const payload = {
        evaluation: {
          instrumentKey: "centro-sim-qa",
          context: { 
            submittedAt: new Date().toISOString(),
            userId: user?.id || null,
            userEmail: user?.email || null,
            userName: user?.profile?.full_name || null,
          },
        },
        answers: uniqueItems.map((i) => ({
          itemCode: i.code,
          domainCode: i.domainCode,
          score: answers[i.code].notApplicable ? null : answers[i.code].value,
          notApplicable: answers[i.code].notApplicable,
          evidence: answers[i.code].evidence || undefined,
          observations: answers[i.code].observations || undefined,
        })),
      };

      console.log("📦 Payload to send:", payload);
      console.log(`📊 Enviando ${payload.answers.length} respuestas únicas`);

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
      
      // Opcionalmente, limpiar el formulario o redirigir
      // window.location.href = "/";
    } catch (err) {
      console.error("❌ Error in submit:", err);
      alert(`Error al enviar las respuestas: ${err}`);
    } finally {
      setSubmitting(false);
    }
  }

  if (loading || !initialized) {
    return (
      <ProtectedRoute>
        <UserHeader />
        <main className="min-h-screen bg-gray-50">
          <div className="mx-auto max-w-3xl p-6 space-y-6">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
              <p className="mt-4 text-gray-600">Cargando preguntas...</p>
            </div>
          </div>
        </main>
      </ProtectedRoute>
    );
  }

  if (domains.length === 0) {
    return (
      <ProtectedRoute>
        <UserHeader />
        <main className="min-h-screen bg-gray-50">
          <div className="mx-auto max-w-3xl p-6 space-y-6">
            <div className="text-center">
              <p className="text-gray-600">No hay preguntas disponibles.</p>
            </div>
          </div>
        </main>
      </ProtectedRoute>
    );
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
              {currentDomain?.code}. {currentDomain?.title}
            </h2>
          </header>

          <form onSubmit={submit} className="space-y-6">
            {domainItems.map((it, i) => {
              const st = answers[it.code];
              if (!st) return null; // Evitar error si aún no se han cargado las respuestas

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
                  evidenceFiles={it.evidenceFiles}
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
                <Button 
                  type="submit" 
                  disabled={!pageComplete || submitting}
                >
                  {submitting ? "Enviando..." : "Enviar"}
                </Button>
              )}
            </div>
          </form>
        </div>
      </main>
    </ProtectedRoute>
  );
}
