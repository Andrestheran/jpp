import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseServer";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Tipos para la respuesta de Supabase
interface Instrument {
  key: string;
  name: string;
}

interface Evaluation {
  id: string;
  created_at: string;
  context: Record<string, unknown>;
  instrument_id: string;
  instruments: Instrument | Instrument[] | null;
}

interface Domain {
  code: string;
  title: string;
  weight: number;
}

interface Subsection {
  code: string;
  title: string;
  domain_id: string;
  domains: Domain | Domain[] | null;
}

interface Item {
  code: string;
  title: string;
  subsection_id: string;
  subsections: Subsection | Subsection[] | null;
}

interface Answer {
  id: string;
  evaluation_id: string;
  item_id: string;
  score: number | null;
  not_applicable: boolean;
  evidence: string | null;
  observations: string | null;
  created_at: string;
  items: Item | Item[] | null;
}

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
      evaluations?.map((e) => {
        const instruments = Array.isArray(e.instruments) ? e.instruments[0] : e.instruments;
        return [
          e.id,
          {
            ...e,
            instrument_name: instruments?.name || "N/A",
          },
        ];
      }) || []
    );

    // Función para escapar campos CSV
    const escapeCsv = (value: string | number | null | undefined): string => {
      if (value === null || value === undefined) return "";
      const stringValue = String(value);
      // Si contiene comas, comillas o saltos de línea, encerrar en comillas y escapar comillas dobles
      if (stringValue.includes(",") || stringValue.includes('"') || stringValue.includes("\n")) {
        return `"${stringValue.replace(/"/g, '""')}"`;
      }
      return stringValue;
    };

    // Crear un contador secuencial para las evaluaciones
    const evalCounter = new Map<string, number>();
    let evalIndex = 1;
    evaluations?.forEach((e) => {
      evalCounter.set(e.id, evalIndex++);
    });

    // Preparar datos para el CSV (más legible)
    const csvRows: string[] = [];
    
    // Encabezados simplificados
    const headers = [
      "Usuario",
      "Email",
      "Fecha de Envío",
      "N° Evaluación",
      "Dominio",
      "Subsección",
      "Ítem",
      "Respuesta",
      "Puntos",
      "Evidencia",
      "Observaciones",
    ];
    csvRows.push(headers.map(h => escapeCsv(h)).join(","));

    // Datos simplificados
    answers?.forEach((answer: Answer) => {
      const evaluation = evalMap.get(answer.evaluation_id);
      const item = Array.isArray(answer.items) ? answer.items[0] : answer.items;
      const subsection = item && (Array.isArray(item.subsections) ? item.subsections[0] : item.subsections);
      const domain = subsection && (Array.isArray(subsection.domains) ? subsection.domains[0] : subsection.domains);
      const context = evaluation?.context || {};
      const evalNumber = evalCounter.get(answer.evaluation_id) || 0;

      const respuesta = answer.not_applicable ? "No Aplica" : 
                       (answer.score === 2 ? "Cumple (2)" : 
                        answer.score === 1 ? "Cumple Parcialmente (1)" : 
                        answer.score === 0 ? "No Cumple (0)" : 
                        "Sin respuesta");

      const userName = typeof context.userName === 'string' ? context.userName : null;
      const userEmail = typeof context.userEmail === 'string' ? context.userEmail : null;
      const submittedAt = typeof context.submittedAt === 'string' ? context.submittedAt : null;

      const row = [
        escapeCsv(userName || userEmail || "Anónimo"),
        escapeCsv(userEmail || "-"),
        escapeCsv(submittedAt 
          ? new Date(submittedAt).toLocaleString("es-ES", {
              day: '2-digit',
              month: '2-digit',
              year: 'numeric',
              hour: '2-digit',
              minute: '2-digit'
            })
          : "N/A"),
        escapeCsv(evalNumber),
        escapeCsv(domain?.title || "N/A"),
        escapeCsv(subsection?.title || "N/A"),
        escapeCsv(`${item?.code || ""} - ${item?.title || "N/A"}`),
        escapeCsv(respuesta),
        escapeCsv(answer.not_applicable ? "-" : (answer.score ?? "-")),
        escapeCsv(answer.evidence || "-"),
        escapeCsv(answer.observations || "-"),
      ];
      csvRows.push(row.join(","));
    });

    // Unir todas las filas
    const csvContent = csvRows.join("\n");

    // Agregar BOM para que Excel reconozca UTF-8
    const BOM = "\uFEFF";
    const csvWithBOM = BOM + csvContent;

    // Crear nombre de archivo con fecha actual
    const fileName = `respuestas_${new Date().toISOString().split("T")[0]}.csv`;

    // Retornar archivo CSV
    return new NextResponse(csvWithBOM, {
      status: 200,
      headers: {
        "Content-Disposition": `attachment; filename="${fileName}"`,
        "Content-Type": "text/csv; charset=utf-8",
      },
    });
  } catch (error) {
    console.error("Error generating CSV:", error);
    return NextResponse.json(
      { error: "Error al generar el archivo CSV" },
      { status: 500 }
    );
  }
}

