const ROLE_SYNONYMS: Record<string, string[]> = {
  "senior accountant": [
    "senior accountant",
    "accounting manager",
    "senior financial accountant",
    "general ledger accountant",
  ],
  "revenue accountant": [
    "revenue accountant",
    "revenue accounting specialist",
    "revenue recognition accountant",
    "order to cash accountant",
  ],
  "senior revenue accountant": [
    "senior revenue accountant",
    "senior revenue accounting specialist",
    "senior revenue recognition accountant",
    "senior order to cash accountant",
  ],
};

export type MatchMode = "focused" | "balanced" | "broad";

function dedupeCaseInsensitive(values: string[]) {
  const seen = new Set<string>();
  const unique: string[] = [];
  for (const value of values) {
    const key = value.trim().toLowerCase();
    if (!key || seen.has(key)) continue;
    seen.add(key);
    unique.push(value.trim());
  }
  return unique;
}

export function expandRoleQueries(
  baseQueries: string[],
  mode: MatchMode = "balanced",
  limit = 16
) {
  if (mode === "focused") {
    return dedupeCaseInsensitive(baseQueries).slice(0, Math.min(limit, 8));
  }

  const expanded: string[] = [];
  for (const baseQuery of baseQueries) {
    const normalized = baseQuery.trim().toLowerCase();
    expanded.push(baseQuery);
    for (const [anchorRole, synonyms] of Object.entries(ROLE_SYNONYMS)) {
      if (normalized.includes(anchorRole)) {
        if (mode === "broad") {
          expanded.push(...synonyms);
        } else {
          expanded.push(...synonyms.slice(0, 2));
        }
      }
    }
  }
  return dedupeCaseInsensitive(expanded).slice(0, limit);
}

