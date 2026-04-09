export const maxDuration = 60;

import { tailorResume } from "@/lib/ai/tailor-resume";
import { getJob } from "@/lib/actions/jobs";
import { getResume } from "@/lib/actions/resumes";
import { validateInternalRequest } from "@/lib/api-auth";

export async function POST(request: Request) {
  if (!(await validateInternalRequest())) {
    return new Response("Unauthorized", { status: 403 });
  }

  const body = await request.json();
  const jobId = typeof body?.jobId === "string" ? body.jobId : null;
  const baseResumeId = typeof body?.baseResumeId === "string" ? body.baseResumeId : null;
  if (!jobId || !baseResumeId) {
    return new Response("jobId and baseResumeId are required", { status: 400 });
  }

  const [job, baseResume] = await Promise.all([
    getJob(jobId),
    getResume(baseResumeId),
  ]);

  if (!job || !baseResume) {
    return new Response("Job or resume not found", { status: 404 });
  }

  const result = tailorResume({
    baseResume: baseResume.content,
    jobDescription: job.description ?? "",
    jobTitle: job.title,
    company: job.company ?? "",
    keywords: (job.keywords as string[]) ?? [],
  });

  return result.toTextStreamResponse();
}
