/**
 * Remotive API — Free, no auth required.
 * Specializes in remote jobs globally.
 * https://remotive.com/api/remote-jobs
 */

interface RemotiveJob {
  id: number;
  url: string;
  title: string;
  company_name: string;
  company_logo: string;
  category: string;
  tags: string[];
  job_type: string;
  publication_date: string;
  candidate_required_location: string;
  salary: string;
  description: string;
}

interface RemotiveResponse {
  "job-count": number;
  jobs: RemotiveJob[];
}

import { jobMatchesQuery } from "./search-match";

export async function searchRemotiveJobs(params: {
  query: string;
  limit?: number;
}) {
  const searchParams = new URLSearchParams({
    search: params.query,
    limit: String(params.limit ?? 50),
  });

  const response = await fetch(
    `https://remotive.com/api/remote-jobs?${searchParams.toString()}`,
    { next: { revalidate: 3600 } } // Cache for 1 hour
  );

  if (!response.ok) {
    throw new Error(`Remotive API error: ${response.status}`);
  }

  const data: RemotiveResponse = await response.json();

  return data.jobs
    .filter((job) =>
      jobMatchesQuery({
        query: params.query,
        title: job.title,
        description: job.description,
        tags: [job.category, ...job.tags],
      })
    )
    .map(normalizeJob);
}

function normalizeJob(job: RemotiveJob) {
  return {
    externalId: `remotive-${job.id}`,
    title: job.title,
    company: job.company_name,
    location: job.candidate_required_location || "Worldwide",
    locationType: "remote" as const,
    url: job.url,
    description: job.description?.slice(0, 5000),
    salary: job.salary || undefined,
    source: "remotive",
    postedDate: job.publication_date,
  };
}
