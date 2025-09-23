// lib/scoring.ts
export type Score = 0 | 1 | 2;
export function computeScores(
  answers: {
    domainCode: string;
    score: number | null;
    notApplicable?: boolean;
  }[],
  weights: Record<string, number>
) {
  const agg: Record<string, { sum: number; max: number }> = {};
  for (const a of answers) {
    if (a.notApplicable) continue;
    const d = (agg[a.domainCode] ??= { sum: 0, max: 0 });
    d.sum += a.score ?? 0;
    d.max += 2;
  }
  const domain = Object.entries(agg).map(([code, v]) => {
    const raw = v.max ? v.sum / v.max : 0;
    return { code, raw, weighted: raw * (weights[code] ?? 0) };
  });
  const total = Math.round(domain.reduce((t, d) => t + d.weighted, 0) * 100);
  return { domain, totalPercent: total };
}
