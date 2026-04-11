/**
 * Multi-source job search orchestrator.
 * Calls all available job APIs in parallel, normalizes, and deduplicates.
 */

import { searchJobs as searchJSearch } from "./jsearch";
import { searchRemotiveJobs } from "./remotive";
import { searchArbeitnowJobs } from "./arbeitnow";
import { searchAdzunaJobs, isAdzunaConfigured } from "./adzuna";
import { searchWeWorkRemotelyJobs } from "./weworkremotely";

export interface NormalizedJob {
  externalId?: string;
  title: string;
  company?: string;
  location?: string;
  locationType?: "remote" | "hybrid" | "onsite";
  url?: string;
  description?: string;
  salary?: string;
  source?: string;
  postedDate?: string;
}

export interface SearchParams {
  query: string;
  country?: string;
  remoteOnly?: boolean;
  datePosted?: "all" | "today" | "3days" | "week" | "month";
  employmentTypes?: string;
  numPages?: number;
}

export interface SearchResult {
  jobs: NormalizedJob[];
  sources: { name: string; count: number; error?: string }[];
  total: number;
}

export async function searchAllSources(params: SearchParams): Promise<SearchResult> {
  const sources: { name: string; count: number; error?: string }[] = [];
  const allJobs: NormalizedJob[] = [];

  // Build promises for all sources
  const promises: Promise<{ name: string; jobs: NormalizedJob[] }>[] = [];

  // 1. JSearch (primary — requires API key)
  if (process.env.JSEARCH_API_KEY) {
    promises.push(
      searchJSearch({
        query: params.query,
        country: params.country,
        remoteOnly: params.remoteOnly,
        datePosted: params.datePosted,
        employmentTypes: params.employmentTypes,
        numPages: params.numPages ?? 5,
      })
        .then((jobs) => ({ name: "jsearch", jobs }))
        .catch((err) => {
          console.error("JSearch failed:", err);
          return { name: "jsearch", jobs: [] as NormalizedJob[] };
        })
    );
  }

  // 2. Remotive (free, no auth — remote jobs only)
  promises.push(
    searchRemotiveJobs({ query: params.query, limit: 50 })
      .then((jobs) => ({ name: "remotive", jobs }))
      .catch((err) => {
        console.error("Remotive failed:", err);
        return { name: "remotive", jobs: [] as NormalizedJob[] };
      })
  );

  // 3. Arbeitnow (free, no auth — EU + remote)
  promises.push(
    searchArbeitnowJobs({ query: params.query })
      .then((jobs) => ({ name: "arbeitnow", jobs }))
      .catch((err) => {
        console.error("Arbeitnow failed:", err);
        return { name: "arbeitnow", jobs: [] as NormalizedJob[] };
      })
  );

  // 4. WeWorkRemotely (free, no auth — RSS feed)
  promises.push(
    searchWeWorkRemotelyJobs({ query: params.query })
      .then((jobs) => ({ name: "weworkremotely", jobs }))
      .catch((err) => {
        console.error("WeWorkRemotely failed:", err);
        return { name: "weworkremotely", jobs: [] as NormalizedJob[] };
      })
  );

  // 5. Adzuna (optional — needs API key)
  if (isAdzunaConfigured()) {
    promises.push(
      searchAdzunaJobs({
        query: params.query,
        country: params.country,
        resultsPerPage: 20,
      })
        .then((jobs) => ({ name: "adzuna", jobs }))
        .catch((err) => {
          console.error("Adzuna failed:", err);
          return { name: "adzuna", jobs: [] as NormalizedJob[] };
        })
    );
  }

  // Execute all in parallel
  const results = await Promise.allSettled(promises);

  for (const result of results) {
    if (result.status === "fulfilled") {
      const { name, jobs } = result.value;
      sources.push({ name, count: jobs.length });
      allJobs.push(...jobs);
    } else {
      console.error("Source failed:", result.reason);
    }
  }

  // Deduplicate by URL
  const seen = new Set<string>();
  const dedupedJobs = allJobs.filter((job) => {
    if (!job.url) return true; // Keep jobs without URLs
    const normalized = job.url.split("?")[0].toLowerCase(); // Strip tracking params
    if (seen.has(normalized)) return false;
    seen.add(normalized);
    return true;
  });

  // Exclude US-based jobs
  const US_PATTERNS = /\bUS\b|\bUSA\b|United States|, AL\b|, AK\b|, AZ\b|, AR\b|, CA\b|, CO\b|, CT\b|, DE\b|, FL\b|, GA\b|, HI\b|, ID\b|, IL\b|, IN\b|, IA\b|, KS\b|, KY\b|, LA\b|, ME\b|, MD\b|, MA\b|, MI\b|, MN\b|, MS\b|, MO\b|, MT\b|, NE\b|, NV\b|, NH\b|, NJ\b|, NM\b|, NY\b|, NC\b|, ND\b|, OH\b|, OK\b|, OR\b|, PA\b|, RI\b|, SC\b|, SD\b|, TN\b|, TX\b|, UT\b|, VT\b|, VA\b|, WA\b|, WV\b|, WI\b|, WY\b|, DC\b/;
  const nonUsJobs = dedupedJobs.filter((job) => {
    if (!job.location) return true; // Keep jobs with no location
    return !US_PATTERNS.test(job.location);
  });

  // Apply remote filter if requested
  const filteredJobs = params.remoteOnly
    ? nonUsJobs.filter((j) => j.locationType === "remote")
    : nonUsJobs;

  return {
    jobs: filteredJobs,
    sources,
    total: filteredJobs.length,
  };
}
