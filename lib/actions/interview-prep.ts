"use server";

import { generateText, Output } from "ai";
import { z } from "zod";
import { getDb } from "@/lib/db";
import { applications, interviewPrepPacks, jobs } from "@/lib/db/schema";
import { desc, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { assertMutationRequestAllowed } from "@/lib/action-auth";

const prepSchema = z.object({
  summary: z.string(),
  likelyQuestions: z.array(z.string()),
  starPrompts: z.array(z.string()),
  accountingScenarios: z.array(z.string()),
});

export async function getLatestInterviewPrepPack(applicationId: string) {
  const db = getDb();
  const rows = await db
    .select()
    .from(interviewPrepPacks)
    .where(eq(interviewPrepPacks.applicationId, applicationId))
    .orderBy(desc(interviewPrepPacks.updatedAt))
    .limit(1);
  return rows[0] ?? null;
}

export async function generateInterviewPrepPack(applicationId: string) {
  await assertMutationRequestAllowed();
  const db = getDb();
  const rows = await db
    .select({
      applicationId: applications.id,
      jobTitle: jobs.title,
      company: jobs.company,
      description: jobs.description,
      notes: applications.notes,
      status: applications.status,
    })
    .from(applications)
    .innerJoin(jobs, eq(applications.jobId, jobs.id))
    .where(eq(applications.id, applicationId))
    .limit(1);

  const app = rows[0];
  if (!app) throw new Error("Application not found");

  const prompt = `You are an interview coach for accounting candidates.

Target role: ${app.jobTitle}
Company: ${app.company ?? "Unknown"}
Current status: ${app.status}
Job description: ${app.description ?? "Not provided"}
Candidate notes: ${app.notes ?? "No notes"}

Generate:
1) concise interview strategy summary (4-6 bullets)
2) 8 likely interview questions for this role
3) 6 STAR prompts tailored to accounting/revenue work
4) 5 accounting scenarios/case prompts relevant to this role

Keep practical, specific, and non-generic.`;

  const { output } = await generateText({
    model: "anthropic/claude-haiku-4.5",
    output: Output.object({ schema: prepSchema }),
    prompt,
  });

  const existing = await db
    .select()
    .from(interviewPrepPacks)
    .where(eq(interviewPrepPacks.applicationId, applicationId))
    .limit(1);

  if (existing[0]) {
    const [updated] = await db
      .update(interviewPrepPacks)
      .set({
        summary: output.summary,
        likelyQuestions: output.likelyQuestions,
        starPrompts: output.starPrompts,
        accountingScenarios: output.accountingScenarios,
        generatedByModel: "anthropic/claude-haiku-4.5",
        updatedAt: new Date(),
      })
      .where(eq(interviewPrepPacks.id, existing[0].id))
      .returning();
    revalidatePath(`/applications/${applicationId}`);
    return updated;
  }

  const [created] = await db
    .insert(interviewPrepPacks)
    .values({
      applicationId,
      summary: output.summary,
      likelyQuestions: output.likelyQuestions,
      starPrompts: output.starPrompts,
      accountingScenarios: output.accountingScenarios,
      generatedByModel: "anthropic/claude-haiku-4.5",
    })
    .returning();
  revalidatePath(`/applications/${applicationId}`);
  return created;
}
