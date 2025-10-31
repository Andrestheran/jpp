"use client";

import { useMemo, useState, useEffect } from "react";
import { loadDomains, invalidateDomainsCache, type UIDomain } from "@/data/instrument";

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

    // Invalidar caché al iniciar para evitar datos duplicados
    invalidateDomainsCache();

    // Timeout de seguridad para evitar carga infinita
    const timeoutId = setTimeout(() => {
      if (isMounted && loading) {
        console.warn("⚠️ Loading timeout reached");
        setLoading(false);
        setInitialized(true);
      }
    }, 6000); // 6 segundos timeout

    const loadData = async () => {
      try {
        const domainsData = await loadDomains();
        if (isMounted) {
          setDomains(domainsData);

          // Inicializar respuestas
          const allItemsTemp = domainsData.flatMap((d) =>
            d.subsections.flatMap((s) => s.items.map((i) => ({ ...i })))
          );

          console.log(`📊 Total items cargados: ${allItemsTemp.length}`);

          // Verificar códigos duplicados (normal en diferentes dominios)
          const codeMap = new Map<string, number>();
          allItemsTemp.forEach(item => {
            codeMap.set(item.code, (codeMap.get(item.code) || 0) + 1);
          });
          
          const duplicates = Array.from(codeMap.entries()).filter(([_, count]) => count > 1);
          if (duplicates.length > 0) {
            console.log("ℹ️ Códigos repetidos en diferentes dominios (esto es normal):");
            duplicates.forEach(([code, count]) => {
              console.log(`  - Código "${code}" aparece ${count} veces en diferentes dominios`);
            });
          }

          if (allItemsTemp.length > 0) {
            const initialAnswers = Object.fromEntries(
              allItemsTemp.map((i) => [
                i.id, // Usar ID único en lugar de code
                {
                  value: null,
                  notApplicable: false,
                  evidence: "",
                  observations: "",
                },
              ])
            );
            setAnswers(initialAnswers);
            console.log(`📝 Inicializadas ${Object.keys(initialAnswers).length} respuestas con IDs únicos`);
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
    const items = domains.flatMap((d) =>
      d.subsections.flatMap((s) => s.items.map((i) => ({ ...i })))
    );
    console.log(`📊 Total allItems: ${items.length}`);
    return items;
  }, [domains]);

  const pageCount = domains.length;
  const currentDomain = domains[page - 1];

  const domainItems = useMemo(() => {
    if (!currentDomain) return [];
    const items = currentDomain.subsections.flatMap((s) => s.items);
    console.log(`📊 Domain ${page} tiene ${items.length} items`);
    console.log(`📋 Códigos del dominio ${page}:`, items.map(i => i.code));
    
    // Verificar el estado actual de estas preguntas
    items.forEach(item => {
      const state = answers[item.code];
      if (state && state.value !== null) {
        console.warn(`⚠️ Item ${item.code} ya tiene valor: ${state.value}`);
      }
    });
    
    return items;
  }, [currentDomain, page, answers]);

  const totalAnswered = Object.values(answers).filter(
    (a) => a.notApplicable || a.value !== null
  ).length;
  const progressValue =
    allItems.length > 0
      ? Math.round((totalAnswered / allItems.length) * 100)
      : 0;

  const pageComplete = domainItems.every(
    (i) => answers[i.id]?.notApplicable || answers[i.id]?.value !== null
  );

  const update = (itemId: string, patch: Partial<State>) =>
    setAnswers((prev) => ({ ...prev, [itemId]: { ...prev[itemId], ...patch } }));

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
        (i) => !(answers[i.id].notApplicable || answers[i.id].value !== null)
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
          context: { 
            submittedAt: new Date().toISOString(),
            userId: user?.id || null,
            userEmail: user?.email || null,
            userName: user?.profile?.full_name || null,
          },
        },
        answers: allItems.map((i) => ({
          itemCode: i.code,
          domainCode: i.domainCode,
          score: answers[i.id].notApplicable ? null : answers[i.id].value,
          notApplicable: answers[i.id].notApplicable,
          evidence: answers[i.id].evidence || undefined,
          observations: answers[i.id].observations || undefined,
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
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 text-center">
              <h2 className="text-xl font-semibold text-yellow-900 mb-2">
                ⚠️ No se pudieron cargar las preguntas
              </h2>
              <p className="text-yellow-800 mb-4">
                Puede ser un problema de permisos en la base de datos.
              </p>
              <details className="text-left text-sm text-yellow-700 bg-yellow-100 p-4 rounded">
                <summary className="cursor-pointer font-semibold mb-2">
                  🔧 Información para el administrador
                </summary>
                <p className="mb-2">
                  Si eres el administrador del sistema, ejecuta el script SQL:
                </p>
                <code className="block bg-yellow-200 p-2 rounded text-xs">
                  sql/fix_infinite_recursion.sql
                </code>
                <p className="mt-2 text-xs">
                  Este script arregla los permisos de lectura de las preguntas.
                  Revisa la consola del navegador (F12) para más detalles.
                </p>
              </details>
              <Button 
                onClick={() => window.location.reload()} 
                className="mt-4"
              >
                🔄 Reintentar
              </Button>
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
              const st = answers[it.id];
              if (!st) return null; // Evitar error si aún no se han cargado las respuestas

              return (
                <QuestionItem
                  key={it.id}
                  index={i}
                  itemCode={it.code}
                  displayNumber={it.displayNumber}
                  question={it.title}
                  value={st.value}
                  notApplicable={st.notApplicable}
                  evidence={st.evidence}
                  observations={st.observations}
                  evidenceFiles={it.evidenceFiles}
                  onChange={(patch) => update(it.id, patch)}
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
