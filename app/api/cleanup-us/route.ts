import { NextResponse } from "next/server";
import { purgeUsJobs } from "@/lib/actions/discover";
import { validateInternalRequest } from "@/lib/api-auth";

export async function POST() {
  if (!(await validateInternalRequest())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  const result = await purgeUsJobs();
  return NextResponse.json(result);
}
