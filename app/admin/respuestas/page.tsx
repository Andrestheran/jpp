"use client";

import { useState, useEffect } from "react";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { UserHeader } from "@/components/auth/UserHeader";
import { Button } from "@/components/ui/button";
import { supabase } from "@/lib/auth";
import Link from "next/link";
import { ArrowLeft, Download, Eye, Trash2, CheckSquare, Square } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";

interface Evaluation {
  id: string;
  created_at: string;
  context: Record<string, unknown>;
  instrument_id: string;
  instruments?: {
    name: string;
    key: string;
  } | null;
}

interface Answer {
  id: string;
  evaluation_id: string;
  score: number | null;
  not_applicable: boolean;
  evidence: string | null;
  observations: string | null;
  items?: {
    code: string;
    title: string;
  } | null;
}

export default function RespuestasPage() {
  const [evaluations, setEvaluations] = useState<Evaluation[]>([]);
  const [selectedEvaluation, setSelectedEvaluation] = useState<string | null>(null);
  const [selectedForExport, setSelectedForExport] = useState<Set<string>>(new Set());
  const [answers, setAnswers] = useState<Answer[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingAnswers, setLoadingAnswers] = useState(false);
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    loadEvaluations();
  }, []);

  const toggleSelectEvaluation = (evaluationId: string) => {
    setSelectedForExport((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(evaluationId)) {
        newSet.delete(evaluationId);
      } else {
        newSet.add(evaluationId);
      }
      return newSet;
    });
  };

  const toggleSelectAll = () => {
    if (selectedForExport.size === evaluations.length) {
      setSelectedForExport(new Set());
    } else {
      setSelectedForExport(new Set(evaluations.map((e) => e.id)));
    }
  };

  const allSelected = evaluations.length > 0 && selectedForExport.size === evaluations.length;

  const loadEvaluations = async () => {
    try {
      const { data, error } = await supabase
        .from("evaluations")
        .select(`
          id,
          created_at,
          context,
          instrument_id,
          instruments!inner (
            name,
            key
          )
        `)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setEvaluations((data || []) as unknown as Evaluation[]);
    } catch (error) {
      console.error("Error loading evaluations:", error);
      alert("Error al cargar las evaluaciones");
    } finally {
      setLoading(false);
    }
  };

  const loadAnswers = async (evaluationId: string) => {
    setLoadingAnswers(true);
    try {
      const { data, error } = await supabase
        .from("answers")
        .select(`
          id,
          evaluation_id,
          score,
          not_applicable,
          evidence,
          observations,
          items!inner (
            code,
            title
          )
        `)
        .eq("evaluation_id", evaluationId)
        .order("id", { ascending: true });

      if (error) throw error;
      setAnswers((data || []) as unknown as Answer[]);
      setSelectedEvaluation(evaluationId);
    } catch (error) {
      console.error("Error loading answers:", error);
      alert("Error al cargar las respuestas");
    } finally {
      setLoadingAnswers(false);
    }
  };

  const deleteEvaluation = async (evaluationId: string) => {
    if (!confirm("¿Estás seguro de que quieres eliminar esta evaluación y todas sus respuestas?")) {
      return;
    }

    try {
      // Primero eliminar las respuestas
      const { error: answersError } = await supabase
        .from("answers")
        .delete()
        .eq("evaluation_id", evaluationId);

      if (answersError) throw answersError;

      // Luego eliminar la evaluación
      const { error: evalError } = await supabase
        .from("evaluations")
        .delete()
        .eq("id", evaluationId);

      if (evalError) throw evalError;

      alert("Evaluación eliminada exitosamente");
      setSelectedEvaluation(null);
      setAnswers([]);
      loadEvaluations();
    } catch (error) {
      console.error("Error deleting evaluation:", error);
      alert("Error al eliminar la evaluación");
    }
  };

  const exportToCsv = async () => {
    if (selectedForExport.size === 0) {
      alert("Selecciona al menos una evaluación para exportar");
      return;
    }

    setExporting(true);
    try {
      const ids = Array.from(selectedForExport).join(",");
      const response = await fetch(`/api/export/csv?ids=${ids}`);
      if (!response.ok) {
        throw new Error("Error al exportar");
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `respuestas_${new Date().toISOString().split("T")[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error("Error exporting CSV:", error);
      alert("Error al exportar las respuestas");
    } finally {
      setExporting(false);
    }
  };

  const getScoreLabel = (score: number | null, notApplicable: boolean) => {
    if (notApplicable) return "N/A";
    if (score === null) return "Sin respuesta";
    return score.toString();
  };

  const getScoreColor = (score: number | null, notApplicable: boolean) => {
    if (notApplicable) return "bg-gray-100 text-gray-600";
    if (score === null) return "bg-yellow-100 text-yellow-800";
    if (score === 0) return "bg-red-100 text-red-800";
    if (score === 1) return "bg-orange-100 text-orange-800";
    return "bg-green-100 text-green-800";
  };

  return (
    <ProtectedRoute requiredRole="admin">
      <UserHeader />
      <main className="min-h-screen bg-gray-50">
        <div className="mx-auto max-w-7xl p-6 space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Link href="/admin">
                <Button variant="outline" size="sm">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Volver
                </Button>
              </Link>
              <div>
                <h1 className="text-2xl font-bold">Respuestas Guardadas</h1>
                {selectedForExport.size > 0 && (
                  <p className="text-sm text-gray-600 mt-1">
                    {selectedForExport.size} evaluación{selectedForExport.size !== 1 ? 'es' : ''} seleccionada{selectedForExport.size !== 1 ? 's' : ''}
                  </p>
                )}
              </div>
            </div>
            <Button
              onClick={exportToCsv}
              disabled={exporting || selectedForExport.size === 0}
              className="flex items-center space-x-2"
            >
              <Download className="h-4 w-4" />
              <span>{exporting ? "Exportando..." : "Exportar CSV"}</span>
            </Button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Lista de Evaluaciones */}
            <div className="bg-white rounded-lg shadow">
              <div className="px-6 py-4 border-b flex items-center justify-between">
                <h2 className="text-lg font-semibold">
                  Evaluaciones ({evaluations.length})
                </h2>
                {evaluations.length > 0 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={toggleSelectAll}
                    className="flex items-center space-x-2"
                  >
                    {allSelected ? (
                      <CheckSquare className="h-4 w-4" />
                    ) : (
                      <Square className="h-4 w-4" />
                    )}
                    <span className="text-sm">
                      {allSelected ? "Deseleccionar todas" : "Seleccionar todas"}
                    </span>
                  </Button>
                )}
              </div>

              {loading ? (
                <div className="p-6 text-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto"></div>
                  <p className="mt-2 text-gray-600">Cargando evaluaciones...</p>
                </div>
              ) : evaluations.length === 0 ? (
                <div className="p-6 text-center text-gray-500">
                  No hay evaluaciones guardadas
                </div>
              ) : (
                <div className="divide-y max-h-[600px] overflow-y-auto">
                  {evaluations.map((evaluation) => {
                    const context = evaluation.context || {};
                    const userName = typeof context.userName === 'string' ? context.userName : null;
                    const userEmail = typeof context.userEmail === 'string' ? context.userEmail : null;
                    const submittedAt = typeof context.submittedAt === 'string' ? context.submittedAt : null;
                    
                    return (
                      <div
                        key={evaluation.id}
                        className={`p-4 hover:bg-gray-50 transition ${
                          selectedEvaluation === evaluation.id ? "bg-blue-50" : ""
                        }`}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex items-start space-x-3 flex-1">
                            <Checkbox
                              checked={selectedForExport.has(evaluation.id)}
                              onCheckedChange={() => toggleSelectEvaluation(evaluation.id)}
                              className="mt-1"
                            />
                            <div className="flex-1 cursor-pointer" onClick={() => loadAnswers(evaluation.id)}>
                              <div className="flex items-center space-x-2">
                                <span className="text-xs font-mono text-gray-500">
                                  #{evaluation.id.slice(0, 8)}
                                </span>
                                <span className="text-xs text-gray-500">
                                  {new Date(evaluation.created_at).toLocaleDateString("es-ES")}
                                </span>
                              </div>
                              <div className="mt-1">
                                <p className="text-sm font-medium text-gray-900">
                                  {userName || userEmail || "Usuario anónimo"}
                                </p>
                                {userEmail && (
                                  <p className="text-xs text-gray-600">
                                    Email: {userEmail}
                                  </p>
                                )}
                                {submittedAt && (
                                  <p className="text-xs text-gray-500">
                                    {new Date(submittedAt).toLocaleString("es-ES")}
                                  </p>
                                )}
                              </div>
                            </div>
                          </div>
                          <div className="flex space-x-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                loadAnswers(evaluation.id);
                              }}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                deleteEvaluation(evaluation.id);
                              }}
                            >
                              <Trash2 className="h-4 w-4 text-red-600" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Detalle de Respuestas */}
            <div className="bg-white rounded-lg shadow">
              <div className="px-6 py-4 border-b">
                <h2 className="text-lg font-semibold">
                  Detalle de Respuestas
                </h2>
              </div>

              {!selectedEvaluation ? (
                <div className="p-6 text-center text-gray-500">
                  Selecciona una evaluación para ver sus respuestas
                </div>
              ) : loadingAnswers ? (
                <div className="p-6 text-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto"></div>
                  <p className="mt-2 text-gray-600">Cargando respuestas...</p>
                </div>
              ) : (
                <div className="divide-y max-h-[600px] overflow-y-auto">
                  {answers.map((answer) => (
                    <div key={answer.id} className="p-4">
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex-1">
                          <div className="flex items-center space-x-2 mb-1">
                            <span className="text-xs font-mono text-gray-500">
                              {answer.items?.code}
                            </span>
                            <span
                              className={`inline-flex px-2 py-0.5 text-xs font-semibold rounded ${getScoreColor(
                                answer.score,
                                answer.not_applicable
                              )}`}
                            >
                              {getScoreLabel(answer.score, answer.not_applicable)}
                            </span>
                          </div>
                          <p className="text-sm text-gray-900">
                            {answer.items?.title}
                          </p>
                        </div>
                      </div>

                      {answer.evidence && (
                        <div className="mt-2 p-2 bg-blue-50 rounded text-xs">
                          <span className="font-semibold text-blue-900">Evidencia:</span>
                          <p className="text-blue-800 mt-1">{answer.evidence}</p>
                        </div>
                      )}

                      {answer.observations && (
                        <div className="mt-2 p-2 bg-yellow-50 rounded text-xs">
                          <span className="font-semibold text-yellow-900">Observaciones:</span>
                          <p className="text-yellow-800 mt-1">{answer.observations}</p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </ProtectedRoute>
  );
}

