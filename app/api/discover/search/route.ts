export const maxDuration = 60;

import { NextResponse } from "next/server";
import { searchAllSources } from "@/lib/services/job-search";
import { insertDiscoveredJobs } from "@/lib/actions/discover";
import { validateInternalRequest } from "@/lib/api-auth";

export async function POST(request: Request) {
  if (!(await validateInternalRequest())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  const body = await request.json();
  const query = typeof body?.query === "string" ? body.query.slice(0, 200) : "Senior Accountant";
  const country = typeof body?.country === "string" && body.country !== "all" ? body.country.slice(0, 10) : undefined;
  const remoteOnly = body?.remoteOnly === true;
  const datePosted = typeof body?.datePosted === "string" ? body.datePosted : "week";
  const employmentTypes = typeof body?.employmentTypes === "string" && body.employmentTypes !== "all" ? body.employmentTypes : undefined;

  try {
    const result = await searchAllSources({
      query,
      country,
      remoteOnly,
      datePosted: datePosted as "all" | "today" | "3days" | "week" | "month",
      employmentTypes,
    });

    if (result.jobs.length > 0) {
      await insertDiscoveredJobs(result.jobs);
    }

    return NextResponse.json({
      ok: true,
      count: result.total,
      sources: result.sources,
    });
  } catch (error) {
    console.error("Search failed:", error);
    return NextResponse.json(
      { error: "Failed to search for jobs" },
      { status: 500 }
    );
  }
}
