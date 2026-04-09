export const maxDuration = 60;

import { NextResponse } from "next/server";
import { searchAllSources } from "@/lib/services/job-search";
import { insertDiscoveredJobs } from "@/lib/actions/discover";
import { getProfile } from "@/lib/actions/settings";

export async function GET(request: Request) {
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return new Response("Unauthorized", { status: 401 });
  }

  const profile = await getProfile();
  const targetRoles = (profile?.targetRoles as string[]) ?? [
    "Senior Accountant",
    "Senior Revenue Accountant",
    "Revenue Accountant",
  ];

  let totalFetched = 0;
  const allSources: { name: string; count: number }[] = [];

  for (const role of targetRoles) {
    try {
      const result = await searchAllSources({
        query: role,
        datePosted: "week",
        numPages: 3,
      });

      if (result.jobs.length > 0) {
        await insertDiscoveredJobs(result.jobs);
        totalFetched += result.jobs.length;
      }

      for (const source of result.sources) {
        const existing = allSources.find((s) => s.name === source.name);
        if (existing) {
          existing.count += source.count;
        } else {
          allSources.push({ ...source });
        }
      }
    } catch (error) {
      console.error(`Failed to search for "${role}":`, error);
    }
  }

  console.log(`Cron fetch complete: ${totalFetched} jobs from ${allSources.length} sources`);

  return NextResponse.json({
    ok: true,
    fetched: totalFetched,
    roles: targetRoles,
    sources: allSources,
  });
}
