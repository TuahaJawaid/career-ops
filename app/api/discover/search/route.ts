import { NextResponse } from "next/server";
import { searchJobs } from "@/lib/services/jsearch";
import { insertDiscoveredJobs } from "@/lib/actions/discover";
import { validateInternalRequest } from "@/lib/api-auth";

export async function POST(request: Request) {
  if (!(await validateInternalRequest())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  const body = await request.json();
  const query = typeof body?.query === "string" ? body.query.slice(0, 200) : "Senior Accountant";
  const country = typeof body?.country === "string" ? body.country.slice(0, 10) : undefined;
  const remoteOnly = body?.remoteOnly === true;
  const datePosted = typeof body?.datePosted === "string" ? body.datePosted : "week";

  try {
    const results = await searchJobs({
      query,
      country,
      remoteOnly,
      datePosted: datePosted as "all" | "today" | "3days" | "week" | "month",
    });

    if (results.length > 0) {
      await insertDiscoveredJobs(results);
    }

    return NextResponse.json({ ok: true, count: results.length });
  } catch (error) {
    console.error("Search failed:", error);
    return NextResponse.json(
      { error: "Failed to search for jobs" },
      { status: 500 }
    );
  }
}
