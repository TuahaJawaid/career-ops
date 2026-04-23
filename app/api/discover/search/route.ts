export const maxDuration = 60;

import { NextResponse } from "next/server";
import { searchAllSources } from "@/lib/services/job-search";
import {
  insertDiscoveredJobsFromSystem,
  pruneDiscoveredJobsByQueriesFromSystem,
} from "@/lib/actions/discover";
import { validateInternalRequest } from "@/lib/api-auth";
import { checkRateLimit, getClientIdentifier } from "@/lib/rate-limit";
import { getProfile } from "@/lib/actions/settings";
import { expandRoleQueries, type MatchMode } from "@/lib/services/role-query-expansion";

function normalizeRoleQueries(
  rawQuery: string,
  profileRoles: string[],
  matchMode: MatchMode
) {
  const userQueries = rawQuery
    .split(/[\n,;|]+/)
    .map((q) => q.trim())
    .filter(Boolean);

  const merged = [...userQueries, ...profileRoles]
    .map((q) => q.trim())
    .filter(Boolean);

  const unique = Array.from(new Set(merged.map((q) => q.toLowerCase()))).map(
    (normalized) => merged.find((q) => q.toLowerCase() === normalized)!
  );

  return expandRoleQueries(unique.slice(0, 8), matchMode, matchMode === "broad" ? 20 : 12);
}

export async function POST(request: Request) {
  if (!(await validateInternalRequest(request))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }
  const limiter = checkRateLimit({
    key: `discover:search:${getClientIdentifier(request)}`,
    maxRequests: 12,
    windowMs: 60_000,
  });
  if (!limiter.allowed) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }

  const body = await request.json();
  const query = typeof body?.query === "string" ? body.query.slice(0, 500) : "Senior Accountant";
  const country = typeof body?.country === "string" && body.country !== "all" ? body.country.slice(0, 10) : undefined;
  const remoteOnly = body?.remoteOnly === true;
  const datePosted = typeof body?.datePosted === "string" ? body.datePosted : "week";
  const employmentTypes = typeof body?.employmentTypes === "string" && body.employmentTypes !== "all" ? body.employmentTypes : undefined;
  const matchMode: MatchMode =
    body?.matchMode === "focused" || body?.matchMode === "broad"
      ? body.matchMode
      : "balanced";

  try {
    const profile = await getProfile();
    const profileRoles =
      (profile?.targetRoles as string[] | undefined) ?? [
        "Senior Accountant",
        "Revenue Accountant",
        "Senior Revenue Accountant",
      ];

    const roleQueries = normalizeRoleQueries(query, profileRoles, matchMode);
    const resultByRole = await Promise.all(
      roleQueries.map((roleQuery) =>
        searchAllSources({
          query: roleQuery,
          country,
          remoteOnly,
          datePosted: datePosted as "all" | "today" | "3days" | "week" | "month",
          employmentTypes,
        })
      )
    );

    const combinedJobs = resultByRole.flatMap((result) => result.jobs);
    const dedupedByUrl = new Map<string, (typeof combinedJobs)[number]>();
    for (const job of combinedJobs) {
      const key = (job.url ?? `${job.source ?? "unknown"}:${job.title}:${job.company ?? ""}`).toLowerCase();
      if (!dedupedByUrl.has(key)) {
        dedupedByUrl.set(key, job);
      }
    }
    const dedupedJobs = Array.from(dedupedByUrl.values());

    if (dedupedJobs.length > 0) {
      await insertDiscoveredJobsFromSystem(dedupedJobs);
    }

    // Keep Discover list tightly aligned with current search intent.
    const pruneResult = await pruneDiscoveredJobsByQueriesFromSystem(roleQueries);

    const sourceTotals = new Map<string, number>();
    for (const result of resultByRole) {
      for (const source of result.sources) {
        sourceTotals.set(source.name, (sourceTotals.get(source.name) ?? 0) + source.count);
      }
    }
    const mergedSources = Array.from(sourceTotals.entries()).map(([name, count]) => ({ name, count }));

    return NextResponse.json({
      ok: true,
      count: dedupedJobs.length,
      sources: mergedSources,
      queries: roleQueries,
      removed: pruneResult.removed,
    });
  } catch (error) {
    console.error("Search failed:", error);
    return NextResponse.json(
      { error: "Failed to search for jobs" },
      { status: 500 }
    );
  }
}
