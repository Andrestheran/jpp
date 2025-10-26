import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseServer";
import * as XLSX from "xlsx";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    const sb = supabaseAdmin();

    // Obtener IDs de evaluaciones a exportar desde query params
    const url = new URL(req.url);
    const idsParam = url.searchParams.get("ids");
    const selectedIds = idsParam ? idsParam.split(",") : null;

    // Obtener evaluaciones con información relacionada (todas o solo las seleccionadas)
    let query = sb
      .from("evaluations")
      .select(`
        id,
        created_at,
        context,
        instrument_id,
        instruments (
          key,
          name
        )
      `);
    
    if (selectedIds && selectedIds.length > 0) {
      query = query.in("id", selectedIds);
    }
    
    const { data: evaluations, error: evalError } = await query.order("created_at", { ascending: false });

    if (evalError) {
      console.error("Error fetching evaluations:", evalError);
      return NextResponse.json(
        { error: "Error al obtener evaluaciones" },
        { status: 500 }
      );
    }

    // Obtener las respuestas (filtradas por IDs de evaluaciones si aplica)
    let answersQuery = sb
      .from("answers")
      .select(`
        id,
        evaluation_id,
        item_id,
        score,
        not_applicable,
        evidence,
        observations,
        created_at,
        items (
          code,
          title,
          subsection_id,
          subsections (
            code,
            title,
            domain_id,
            domains (
              code,
              title,
              weight
            )
          )
        )
      `);
    
    if (selectedIds && selectedIds.length > 0) {
      answersQuery = answersQuery.in("evaluation_id", selectedIds);
    }
    
    const { data: answers, error: answersError } = await answersQuery;

    if (answersError) {
      console.error("Error fetching answers:", answersError);
      return NextResponse.json(
        { error: "Error al obtener respuestas" },
        { status: 500 }
      );
    }

    // Crear un mapa de evaluaciones para acceso rápido
    const evalMap = new Map(
      evaluations?.map((e) => [
        e.id,
        {
          ...e,
          instrument_name: (e.instruments as any)?.name || "N/A",
        },
      ]) || []
    );

    // Crear un contador secuencial para las evaluaciones
    const evalCounter = new Map<string, number>();
    let evalIndex = 1;
    evaluations?.forEach((e) => {
      evalCounter.set(e.id, evalIndex++);
    });

    // Preparar datos para el Excel de forma más legible
    const excelData = answers?.map((answer: any) => {
      const evaluation = evalMap.get(answer.evaluation_id);
      const item = answer.items;
      const subsection = item?.subsections;
      const domain = subsection?.domains;
      const context = evaluation?.context || {};
      const evalNumber = evalCounter.get(answer.evaluation_id) || 0;

      return {
        // Información del usuario (más importante primero)
        "Usuario": context.userName || context.userEmail || "Anónimo",
        "Email": context.userEmail || "-",
        "Fecha de Envío": context.submittedAt 
          ? new Date(context.submittedAt).toLocaleString("es-ES", {
              day: '2-digit',
              month: '2-digit',
              year: 'numeric',
              hour: '2-digit',
              minute: '2-digit'
            })
          : "N/A",
        "N° Evaluación": evalNumber,
        
        // Estructura del cuestionario (simplificada)
        "Dominio": domain?.title || "N/A",
        "Subsección": subsection?.title || "N/A",
        "Ítem": `${item?.code || ""} - ${item?.title || "N/A"}`,
        
        // Respuesta (lo más importante)
        "Respuesta": answer.not_applicable ? "No Aplica" : 
                    (answer.score === 2 ? "✓ Cumple (2)" : 
                     answer.score === 1 ? "◐ Cumple Parcialmente (1)" : 
                     answer.score === 0 ? "✗ No Cumple (0)" : 
                     "Sin respuesta"),
        "Puntos": answer.not_applicable ? "-" : (answer.score ?? "-"),
        "Evidencia": answer.evidence || "-",
        "Observaciones": answer.observations || "-",
      };
    }) || [];

    // Crear libro de Excel
    const wb = XLSX.utils.book_new();
    
    // Crear hoja de respuestas detalladas
    const ws = XLSX.utils.json_to_sheet(excelData);
    
    // Ajustar ancho de columnas (más legible)
    const colWidths = [
      { wch: 30 }, // Usuario
      { wch: 35 }, // Email
      { wch: 18 }, // Fecha de Envío
      { wch: 12 }, // N° Evaluación
      { wch: 35 }, // Dominio
      { wch: 40 }, // Subsección
      { wch: 70 }, // Ítem (código + título)
      { wch: 28 }, // Respuesta (con símbolo)
      { wch: 8 },  // Puntos
      { wch: 50 }, // Evidencia
      { wch: 50 }, // Observaciones
    ];
    ws['!cols'] = colWidths;
    
    XLSX.utils.book_append_sheet(wb, ws, "Respuestas");

    // Crear hoja de resumen por evaluación (más legible)
    const summaryData = evaluations?.map((evaluation: any, index: number) => {
      const evalAnswers = answers?.filter(a => a.evaluation_id === evaluation.id) || [];
      const totalAnswers = evalAnswers.length;
      const answeredCount = evalAnswers.filter(a => !a.not_applicable && a.score !== null).length;
      const naCount = evalAnswers.filter(a => a.not_applicable).length;
      
      // Calcular puntuación total y promedio
      const totalPoints = evalAnswers.reduce((sum, a) => sum + (a.not_applicable ? 0 : (a.score || 0)), 0);
      const maxPossiblePoints = answeredCount * 2; // Máximo 2 puntos por respuesta
      const avgScore = answeredCount > 0
        ? (totalPoints / answeredCount).toFixed(2)
        : "0";
      const percentage = maxPossiblePoints > 0
        ? `${((totalPoints / maxPossiblePoints) * 100).toFixed(1)}%`
        : "0%";

      const context = evaluation.context || {};

      return {
        "N°": index + 1,
        "Usuario": context.userName || context.userEmail || "Anónimo",
        "Email": context.userEmail || "-",
        "Fecha de Envío": context.submittedAt 
          ? new Date(context.submittedAt).toLocaleString("es-ES", {
              day: '2-digit',
              month: '2-digit',
              year: 'numeric',
              hour: '2-digit',
              minute: '2-digit'
            })
          : "N/A",
        "Total Preguntas": totalAnswers,
        "Respondidas": answeredCount,
        "No Aplica": naCount,
        "Puntos Obtenidos": totalPoints,
        "Puntos Máximos": maxPossiblePoints,
        "Promedio": avgScore,
        "% Cumplimiento": percentage,
      };
    }) || [];

    const wsSummary = XLSX.utils.json_to_sheet(summaryData);
    const summaryColWidths = [
      { wch: 6 },  // N°
      { wch: 30 }, // Usuario
      { wch: 35 }, // Email
      { wch: 18 }, // Fecha de Envío
      { wch: 16 }, // Total Preguntas
      { wch: 14 }, // Respondidas
      { wch: 12 }, // No Aplica
      { wch: 16 }, // Puntos Obtenidos
      { wch: 15 }, // Puntos Máximos
      { wch: 10 }, // Promedio
      { wch: 15 }, // % Cumplimiento
    ];
    wsSummary['!cols'] = summaryColWidths;
    
    XLSX.utils.book_append_sheet(wb, wsSummary, "Resumen");

    // Generar buffer del archivo
    const excelBuffer = XLSX.write(wb, { type: "buffer", bookType: "xlsx" });

    // Crear nombre de archivo con fecha actual
    const fileName = `respuestas_${new Date().toISOString().split("T")[0]}.xlsx`;

    // Retornar archivo Excel
    return new NextResponse(excelBuffer, {
      status: 200,
      headers: {
        "Content-Disposition": `attachment; filename="${fileName}"`,
        "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      },
    });
  } catch (error) {
    console.error("Error generating Excel:", error);
    return NextResponse.json(
      { error: "Error al generar el archivo Excel" },
      { status: 500 }
    );
  }
}

