/**
 * Arbeitnow API — Free, no auth required.
 * EU + remote job focus, visa sponsorship filtering.
 * https://www.arbeitnow.com/api/job-board-api
 */

interface ArbeitnowJob {
  slug: string;
  company_name: string;
  title: string;
  description: string;
  remote: boolean;
  url: string;
  tags: string[];
  job_types: string[];
  location: string;
  created_at: number; // Unix timestamp
}

interface ArbeitnowResponse {
  data: ArbeitnowJob[];
  links: { next: string | null };
  meta: { current_page: number; last_page: number };
}

import { jobMatchesQuery } from "./search-match";

export async function searchArbeitnowJobs(params: {
  query: string;
  page?: number;
}) {
  const searchParams = new URLSearchParams();
  if (params.page) searchParams.set("page", String(params.page));

  const response = await fetch(
    `https://www.arbeitnow.com/api/job-board-api?${searchParams.toString()}`,
    { next: { revalidate: 3600 } }
  );

  if (!response.ok) {
    throw new Error(`Arbeitnow API error: ${response.status}`);
  }

  const data: ArbeitnowResponse = await response.json();

  return data.data
    .filter((job) =>
      jobMatchesQuery({
        query: params.query,
        title: job.title,
        description: job.description,
        tags: [...job.tags, ...job.job_types],
      })
    )
    .map(normalizeJob);
}

function normalizeJob(job: ArbeitnowJob) {
  return {
    externalId: `arbeitnow-${job.slug}`,
    title: job.title,
    company: job.company_name,
    location: job.location || "Europe",
    locationType: job.remote ? ("remote" as const) : ("onsite" as const),
    url: job.url,
    description: job.description?.slice(0, 5000),
    salary: undefined,
    source: "arbeitnow",
    postedDate: new Date(job.created_at * 1000).toISOString(),
  };
}
