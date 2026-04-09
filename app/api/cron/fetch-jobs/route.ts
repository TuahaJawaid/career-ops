import { NextResponse } from "next/server";
import { searchJobs } from "@/lib/services/jsearch";
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

  const allJobs: Awaited<ReturnType<typeof searchJobs>> = [];

  for (const role of targetRoles) {
    try {
      const results = await searchJobs({
        query: role,
        datePosted: "week",
        numPages: 1,
      });
      allJobs.push(...results);
    } catch (error) {
      console.error(`Failed to search for "${role}":`, error);
    }
  }

  if (allJobs.length > 0) {
    await insertDiscoveredJobs(allJobs);
  }

  return NextResponse.json({
    ok: true,
    fetched: allJobs.length,
    roles: targetRoles,
  });
}
