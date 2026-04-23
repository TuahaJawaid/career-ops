const ROLE_STOP_WORDS = new Set([
  "senior",
  "junior",
  "lead",
  "staff",
  "principal",
  "associate",
  "manager",
  "and",
  "or",
  "the",
  "a",
  "an",
  "for",
  "to",
  "of",
]);

const ACCOUNTING_ROLE_TERMS = [
  "accountant",
  "accounting",
  "controller",
  "bookkeeper",
  "cpa",
  "finance manager",
  "financial accountant",
  "revenue accountant",
  "revenue recognition",
  "general ledger",
  "record to report",
  "order to cash",
];

const NON_ACCOUNTING_SIGNAL_TERMS = [
  "copywriter",
  "content writer",
  "software engineer",
  "developer",
  "it support",
  "systems engineer",
  "sysadmin",
  "data engineer",
  "ui designer",
  "graphic designer",
  "social media manager",
];

function normalizeText(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9\s]/g, " ").replace(/\s+/g, " ").trim();
}

export function extractQueryTerms(query: string): string[] {
  const normalized = normalizeText(query);
  if (!normalized) return [];
  return normalized
    .split(" ")
    .filter((term) => term.length > 1 && !ROLE_STOP_WORDS.has(term));
}

function hasAnyTerm(text: string, terms: string[]) {
  return terms.some((term) => text.includes(term));
}

export function jobMatchesQuery(args: {
  query: string;
  title: string;
  description?: string;
  tags?: string[];
}) {
  const normalizedQuery = normalizeText(args.query);
  const normalizedTitle = normalizeText(args.title);
  const normalizedDescription = normalizeText(args.description ?? "");
  const normalizedTags = normalizeText((args.tags ?? []).join(" "));
  const haystack = `${normalizedTitle} ${normalizedDescription} ${normalizedTags}`.trim();
  const hasAccountingIntent = ["accountant", "accounting", "revenue", "controller", "bookkeeper"].some(
    (term) => normalizedQuery.includes(term)
  );

  if (!normalizedQuery || !normalizedTitle) return false;
  if (hasAccountingIntent) {
    const titleLooksAccounting = hasAnyTerm(normalizedTitle, ACCOUNTING_ROLE_TERMS);
    const obviouslyOtherFunction = hasAnyTerm(normalizedTitle, NON_ACCOUNTING_SIGNAL_TERMS);
    if (!titleLooksAccounting) return false;
    if (obviouslyOtherFunction) return false;
  }

  if (normalizedTitle.includes(normalizedQuery)) return true;

  const terms = extractQueryTerms(normalizedQuery);
  if (terms.length === 0) return false;

  const titleMatches = terms.filter((term) => normalizedTitle.includes(term)).length;
  const haystackMatches = terms.filter((term) => haystack.includes(term)).length;

  if (terms.length === 1) return titleMatches >= 1;
  if (terms.length === 2) return haystackMatches >= 2;

  // For longer queries, require strong overlap, but not exact phrase.
  return titleMatches >= 2 || haystackMatches >= Math.min(3, terms.length);
}
