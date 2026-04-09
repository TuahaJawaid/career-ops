import { NextResponse } from "next/server";
import { evaluateJob } from "@/lib/ai/evaluate-job";
import { getJob, updateJob, logAiGeneration } from "@/lib/actions/jobs";
import { getBaseResumes } from "@/lib/actions/resumes";
import { getProfile } from "@/lib/actions/settings";
import { validateInternalRequest } from "@/lib/api-auth";

export async function POST(request: Request) {
  if (!(await validateInternalRequest())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  const body = await request.json();
  const jobId = typeof body?.jobId === "string" ? body.jobId : null;
  if (!jobId) {
    return NextResponse.json({ error: "jobId is required" }, { status: 400 });
  }

  const [job, baseResumes, profile] = await Promise.all([
    getJob(jobId),
    getBaseResumes(),
    getProfile(),
  ]);

  if (!job) {
    return NextResponse.json({ error: "Job not found" }, { status: 404 });
  }

  const baseResume = baseResumes[0]?.content ?? "No resume uploaded yet.";

  const { evaluation, usage, durationMs } = await evaluateJob({
    jobTitle: job.title,
    company: job.company ?? "",
    location: job.location ?? "",
    salary: job.salary ?? "",
    description: job.description ?? "",
    baseResume,
    targetRoles: (profile?.targetRoles as string[]) ?? [],
    targetRegions: (profile?.targetRegions as string[]) ?? [],
  });

  if (evaluation) {
    await updateJob(jobId, {
      grade: evaluation.grade,
      gradeScore: evaluation.score,
      evaluationSummary: evaluation.summary,
      evaluationDetails: {
        resumeFit: evaluation.resumeFit,
        seniorityMatch: evaluation.seniorityMatch,
        locationMatch: evaluation.locationMatch,
        compensationMatch: evaluation.compensationMatch,
        keywordOverlap: evaluation.keywordOverlap,
        strengths: evaluation.strengths,
        concerns: evaluation.concerns,
      },
      keywords: evaluation.keywords,
    });

    await logAiGeneration({
      type: "evaluation",
      jobId,
      model: "anthropic/claude-sonnet-4.6",
      input: { jobTitle: job.title, company: job.company },
      output: evaluation,
      promptTokens: usage?.inputTokens ?? undefined,
      completionTokens: usage?.outputTokens ?? undefined,
      totalTokens: (usage?.inputTokens ?? 0) + (usage?.outputTokens ?? 0) || undefined,
      durationMs,
    });
  }

  return NextResponse.json({ evaluation });
}
