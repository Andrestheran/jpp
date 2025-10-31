import { NextResponse } from "next/server";
import { z } from "zod";
import { supabaseAdmin } from "@/lib/supabaseServer";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const AnswerSchema = z.object({
  itemId: z.string().optional(), // ID único del item (preferido)
  itemCode: z.string().optional(), // Código del item (fallback para compatibilidad)
  domainCode: z.string(), // "1", "2", ...
  score: z.number().int().min(0).max(2).nullable().optional(),
  notApplicable: z.boolean().optional(),
  evidence: z.string().optional(),
  observations: z.string().optional(),
}).refine((data) => data.itemId || data.itemCode, {
  message: "Se requiere itemId o itemCode",
});

const BodySchema = z.object({
  evaluation: z.object({
    instrumentKey: z.string().default("centro-sim-qa"),
    context: z.record(z.any()).default({}), // {centro, evaluador, fecha, ...}
  }),
  answers: z.array(AnswerSchema).min(1),
});

export async function POST(req: Request) {
  const sb = supabaseAdmin();

  // Validar payload
  const parsed = BodySchema.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Solicitud inválida", details: parsed.error.flatten() },
      { status: 400 }
    );
  }
  const body = parsed.data;

  // 1) Instrumento
  const { data: inst, error: instErr } = await sb
    .from("instruments")
    .select("id")
    .eq("key", body.evaluation.instrumentKey)
    .single();

  if (instErr || !inst) {
    return NextResponse.json(
      { error: "Instrumento no encontrado" },
      { status: 400 }
    );
  }

  // 2) Evaluation
  const { data: evalRow, error: evalErr } = await sb
    .from("evaluations")
    .insert({ instrument_id: inst.id, context: body.evaluation.context })
    .select("id")
    .single();

  if (evalErr) {
    return NextResponse.json(
      { error: "No se pudo crear la evaluación", details: evalErr.message },
      { status: 500 }
    );
  }

  // 3) Obtener item_ids
  // Preferir itemId si está disponible, sino buscar por código
  const itemIds: string[] = [];
  const codesToLookup: string[] = [];
  
  body.answers.forEach((a) => {
    if (a.itemId) {
      itemIds.push(a.itemId);
    } else if (a.itemCode) {
      codesToLookup.push(a.itemCode);
    }
  });

  // Si hay códigos que buscar, obtener sus IDs
  let codeToId = new Map<string, string>();
  if (codesToLookup.length > 0) {
    const codes = Array.from(new Set(codesToLookup));
    const { data: items, error: itemsErr } = await sb
      .from("items")
      .select("id, code")
      .in("code", codes);

    if (itemsErr) {
      return NextResponse.json(
        { error: "Error obteniendo ítems", details: itemsErr.message },
        { status: 500 }
      );
    }
    
    // ADVERTENCIA: Si hay códigos duplicados, esto puede causar problemas
    codeToId = new Map(items.map((i) => [i.code, i.id]));
    
    const missing = codes.filter((c) => !codeToId.get(c));
    if (missing.length) {
      return NextResponse.json(
        { error: "Ítems inexistentes en DB", missing },
        { status: 400 }
      );
    }
  }

  // 4) Insert masivo de respuestas
  const rows = body.answers
    .map((a) => {
      const item_id = a.itemId || codeToId.get(a.itemCode!);
      
      if (!item_id) {
        console.error(`No se encontró item_id para:`, a);
        return null;
      }

      return {
        evaluation_id: evalRow.id,
        item_id: item_id,
        score: a.notApplicable ? null : a.score ?? null,
        not_applicable: !!a.notApplicable,
        evidence: a.evidence ?? null,
        observations: a.observations ?? null,
      };
    })
    .filter((row): row is NonNullable<typeof row> => row !== null);
  
  // Deduplicar por item_id para evitar duplicados
  const uniqueRows = Array.from(
    new Map(rows.map(row => [row.item_id, row])).values()
  );
  
  if (uniqueRows.length < rows.length) {
    console.warn(`⚠️ Se eliminaron ${rows.length - uniqueRows.length} respuestas duplicadas`);
  }

  if (uniqueRows.length === 0) {
    return NextResponse.json(
      { error: "No hay respuestas válidas para guardar" },
      { status: 400 }
    );
  }

  const { error: insErr } = await sb.from("answers").insert(uniqueRows);
  if (insErr) {
    console.error("Error insertando respuestas:", insErr);
    return NextResponse.json(
      { error: "Error guardando respuestas", details: insErr.message },
      { status: 500 }
    );
  }

  return NextResponse.json({ 
    ok: true, 
    evaluationId: evalRow.id,
    answersCount: uniqueRows.length 
  });
}
