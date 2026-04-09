export const maxDuration = 60;

import { NextResponse } from "next/server";
import { generateText, Output } from "ai";
import { z } from "zod";
import { getJob } from "@/lib/actions/jobs";
import { getBaseResumes } from "@/lib/actions/resumes";
import { validateInternalRequest } from "@/lib/api-auth";

const matchSchema = z.object({
  matchScore: z.number().min(0).max(100),
  presentKeywords: z.array(z.string()),
  missingKeywords: z.array(z.string()),
  presentSkills: z.array(z.string()),
  missingSkills: z.array(z.string()),
  suggestions: z.array(z.string()),
  summary: z.string(),
});

export async function POST(request: Request) {
  if (!(await validateInternalRequest())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  const body = await request.json();
  const jobId = typeof body?.jobId === "string" ? body.jobId : null;
  if (!jobId) {
    return NextResponse.json({ error: "jobId required" }, { status: 400 });
  }

  const [job, baseResumes] = await Promise.all([getJob(jobId), getBaseResumes()]);
  if (!job) return NextResponse.json({ error: "Job not found" }, { status: 404 });

  const resume = baseResumes[0]?.content ?? "";

  const { output } = await generateText({
    model: "anthropic/claude-sonnet-4.6",
    output: Output.object({ schema: matchSchema }),
    prompt: `Compare this resume against this job description. Calculate a match score (0-100%) based on keyword overlap, skills alignment, and experience relevance.

## Resume
${resume}

## Job Description
Title: ${job.title}
Company: ${job.company ?? ""}
${job.description ?? ""}

## Instructions
1. Identify all accounting/finance keywords in the job description
2. Check which are present in the resume and which are missing
3. Identify required skills present vs missing
4. Calculate an overall match percentage
5. Provide 3-5 specific bullet point suggestions to improve the match`,
  });

  return NextResponse.json({ match: output });
}
