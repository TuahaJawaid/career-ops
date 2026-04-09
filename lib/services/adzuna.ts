/**
 * Adzuna API — Free tier: 250 requests/month.
 * Global multi-country aggregator.
 * Requires ADZUNA_APP_ID + ADZUNA_API_KEY (free at developer.adzuna.com)
 * https://api.adzuna.com/v1/doc
 */

interface AdzunaJob {
  id: string;
  title: string;
  company: { display_name: string };
  location: { display_name: string; area: string[] };
  description: string;
  redirect_url: string;
  salary_min: number | null;
  salary_max: number | null;
  salary_is_predicted: string;
  contract_type: string | null;
  contract_time: string | null;
  created: string;
  category: { label: string; tag: string };
}

interface AdzunaResponse {
  results: AdzunaJob[];
  count: number;
  mean: number;
}

const ADZUNA_COUNTRIES = ["us", "gb", "ca", "au", "de", "fr", "in", "nl", "sg"] as const;
type AdzunaCountry = (typeof ADZUNA_COUNTRIES)[number];

export function isAdzunaConfigured(): boolean {
  return !!(process.env.ADZUNA_APP_ID && process.env.ADZUNA_API_KEY);
}

export async function searchAdzunaJobs(params: {
  query: string;
  country?: string;
  page?: number;
  resultsPerPage?: number;
}) {
  const appId = process.env.ADZUNA_APP_ID;
  const apiKey = process.env.ADZUNA_API_KEY;
  if (!appId || !apiKey) {
    return []; // Silently skip if not configured
  }

  // Map our country codes to Adzuna-supported ones
  const country = (params.country && ADZUNA_COUNTRIES.includes(params.country as AdzunaCountry))
    ? params.country
    : "us";

  const page = params.page ?? 1;
  const resultsPerPage = params.resultsPerPage ?? 20;

  const searchParams = new URLSearchParams({
    app_id: appId,
    app_key: apiKey,
    results_per_page: String(resultsPerPage),
    what: params.query,
    content_type: "application/json",
  });

  const response = await fetch(
    `https://api.adzuna.com/v1/api/jobs/${country}/search/${page}?${searchParams.toString()}`
  );

  if (!response.ok) {
    throw new Error(`Adzuna API error: ${response.status}`);
  }

  const data: AdzunaResponse = await response.json();
  return data.results.map(normalizeJob);
}

function normalizeJob(job: AdzunaJob) {
  const salaryParts: string[] = [];
  if (job.salary_min) salaryParts.push(String(Math.round(job.salary_min)));
  if (job.salary_max) salaryParts.push(String(Math.round(job.salary_max)));
  const salary = salaryParts.length > 0 ? `$${salaryParts.join(" - ")}` : undefined;

  return {
    externalId: `adzuna-${job.id}`,
    title: job.title,
    company: job.company?.display_name,
    location: job.location?.display_name || job.location?.area?.join(", "),
    locationType: "onsite" as const, // Adzuna doesn't have remote flag
    url: job.redirect_url,
    description: job.description?.slice(0, 5000),
    salary,
    source: "adzuna",
    postedDate: job.created,
  };
}
