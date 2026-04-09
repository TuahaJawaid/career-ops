const JSEARCH_BASE_URL = "https://jsearch.p.rapidapi.com";

interface JSearchJob {
  job_id: string;
  job_title: string;
  employer_name: string;
  job_city: string;
  job_state: string;
  job_country: string;
  job_apply_link: string;
  job_description: string;
  job_min_salary: number | null;
  job_max_salary: number | null;
  job_salary_currency: string | null;
  job_is_remote: boolean;
  job_posted_at_datetime_utc: string;
  job_employment_type: string;
  employer_logo: string | null;
}

interface JSearchResponse {
  status: string;
  data: JSearchJob[];
}

export async function searchJobs(params: {
  query: string;
  page?: number;
  numPages?: number;
  datePosted?: "all" | "today" | "3days" | "week" | "month";
  remoteOnly?: boolean;
  country?: string;
  employmentTypes?: string;
}) {
  const apiKey = process.env.JSEARCH_API_KEY;
  if (!apiKey) {
    throw new Error("JSEARCH_API_KEY is not configured");
  }

  const searchParams = new URLSearchParams({
    query: params.query,
    page: String(params.page ?? 1),
    num_pages: String(params.numPages ?? 1),
    date_posted: params.datePosted ?? "week",
  });

  if (params.remoteOnly) {
    searchParams.set("remote_jobs_only", "true");
  }
  if (params.country) {
    searchParams.set("country", params.country);
  }
  if (params.employmentTypes) {
    searchParams.set("employment_types", params.employmentTypes);
  }

  const response = await fetch(
    `${JSEARCH_BASE_URL}/search?${searchParams.toString()}`,
    {
      headers: {
        "x-rapidapi-host": "jsearch.p.rapidapi.com",
        "x-rapidapi-key": apiKey,
      },
    }
  );

  if (!response.ok) {
    throw new Error(`JSearch API error: ${response.status}`);
  }

  const data: JSearchResponse = await response.json();
  return data.data.map(normalizeJob);
}

function normalizeJob(job: JSearchJob) {
  const locationParts = [job.job_city, job.job_state, job.job_country].filter(Boolean);
  const salaryParts: string[] = [];
  if (job.job_min_salary) salaryParts.push(String(job.job_min_salary));
  if (job.job_max_salary) salaryParts.push(String(job.job_max_salary));
  const salary =
    salaryParts.length > 0
      ? `${job.job_salary_currency ?? "$"}${salaryParts.join(" - ")}`
      : undefined;

  return {
    externalId: job.job_id,
    title: job.job_title,
    company: job.employer_name,
    location: locationParts.join(", "),
    locationType: job.job_is_remote ? ("remote" as const) : ("onsite" as const),
    url: job.job_apply_link,
    description: job.job_description,
    salary,
    source: "jsearch",
    postedDate: job.job_posted_at_datetime_utc,
  };
}
