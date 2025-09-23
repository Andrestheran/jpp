import { NextResponse } from "next/server";
import { z } from "zod";
import { supabaseAdmin } from "@/lib/supabaseServer";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const AnswerSchema = z.object({
  itemCode: z.string(), // "1.1", "1.2", ...
  domainCode: z.string(), // "1", "2", ...
  score: z.number().int().min(0).max(2).nullable().optional(),
  notApplicable: z.boolean().optional(),
  evidence: z.string().optional(),
  observations: z.string().optional(),
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

  // 3) Mapear itemCode -> item_id
  const codes = Array.from(new Set(body.answers.map((a) => a.itemCode)));
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
  const codeToId = new Map(items.map((i) => [i.code, i.id]));
  const missing = codes.filter((c) => !codeToId.get(c));
  if (missing.length) {
    return NextResponse.json(
      { error: "Ítems inexistentes en DB", missing },
      { status: 400 }
    );
  }

  // 4) Insert masivo de respuestas
  const rows = body.answers.map((a) => ({
    evaluation_id: evalRow.id,
    item_id: codeToId.get(a.itemCode)!,
    score: a.notApplicable ? null : a.score ?? null,
    not_applicable: !!a.notApplicable,
    evidence: a.evidence ?? null,
    observations: a.observations ?? null,
  }));

  const { error: insErr } = await sb.from("answers").insert(rows);
  if (insErr) {
    return NextResponse.json(
      { error: "Error guardando respuestas", details: insErr.message },
      { status: 500 }
    );
  }

  return NextResponse.json({ ok: true, evaluationId: evalRow.id });
}
