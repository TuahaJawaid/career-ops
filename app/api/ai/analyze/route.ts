import { NextResponse } from "next/server";
import { analyzeDescription } from "@/lib/ai/analyze-description";
import { updateJob, logAiGeneration } from "@/lib/actions/jobs";
import { validateInternalRequest } from "@/lib/api-auth";

export async function POST(request: Request) {
  if (!(await validateInternalRequest())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  const body = await request.json();
  const jobId = typeof body?.jobId === "string" ? body.jobId : null;
  const description = typeof body?.description === "string" ? body.description : null;
  if (!description || description.length > 50000) {
    return NextResponse.json({ error: "Valid description is required (max 50k chars)" }, { status: 400 });
  }

  const { analysis, usage, durationMs } = await analyzeDescription(description);

  if (analysis && jobId) {
    await updateJob(jobId, {
      keywords: analysis.atsKeywords,
    });

    await logAiGeneration({
      type: "analysis",
      jobId,
      model: "anthropic/claude-sonnet-4.6",
      input: { description: description.slice(0, 500) },
      output: analysis,
      promptTokens: usage?.inputTokens ?? undefined,
      completionTokens: usage?.outputTokens ?? undefined,
      totalTokens: (usage?.inputTokens ?? 0) + (usage?.outputTokens ?? 0) || undefined,
      durationMs,
    });
  }

  return NextResponse.json({ analysis });
}
