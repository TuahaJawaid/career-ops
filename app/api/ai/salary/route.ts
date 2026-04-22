export const maxDuration = 60;

import { NextResponse } from "next/server";
import { generateText, Output } from "ai";
import { z } from "zod";
import { getJob } from "@/lib/actions/jobs";
import { validateInternalRequest } from "@/lib/api-auth";
import { checkRateLimit, getClientIdentifier } from "@/lib/rate-limit";

const salarySchema = z.object({
  estimatedMin: z.number(),
  estimatedMax: z.number(),
  currency: z.string(),
  confidence: z.enum(["high", "medium", "low"]),
  marketMedian: z.number(),
  notes: z.string(),
  factors: z.array(z.string()),
});

export async function POST(request: Request) {
  if (!(await validateInternalRequest(request))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }
  const limiter = checkRateLimit({
    key: `ai:salary:${getClientIdentifier(request)}`,
    maxRequests: 20,
    windowMs: 60_000,
  });
  if (!limiter.allowed) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }

  const body = await request.json();
  const jobId = typeof body?.jobId === "string" ? body.jobId : null;
  if (!jobId) {
    return NextResponse.json({ error: "jobId required" }, { status: 400 });
  }

  const job = await getJob(jobId);
  if (!job) return NextResponse.json({ error: "Job not found" }, { status: 404 });

  const { output } = await generateText({
    model: "anthropic/claude-haiku-4.5",
    output: Output.object({ schema: salarySchema }),
    prompt: `Estimate the salary range for this job posting based on the role, location, seniority, and industry. Use current 2026 market data.

## Job Details
- Title: ${job.title}
- Company: ${job.company ?? "Unknown"}
- Location: ${job.location ?? "Not specified"}
- Posted Salary: ${job.salary ?? "Not disclosed"}

## Job Description
${job.description?.slice(0, 3000) ?? "No description"}

## Instructions
1. Estimate minimum and maximum annual salary
2. Use the appropriate currency for the location (USD for US, GBP for UK, AED for UAE, etc.)
3. Rate your confidence (high if salary is posted or role/location are very specific, low if vague)
4. Estimate the market median for this exact role+location combination
5. List 3-4 factors that influence this salary range (location, industry, seniority, certifications)
6. Add a brief note explaining your reasoning`,
  });

  return NextResponse.json({ salary: output });
}
