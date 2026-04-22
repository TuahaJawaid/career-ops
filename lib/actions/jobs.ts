"use server";

import { getDb } from "@/lib/db";
import { jobs, aiGenerations } from "@/lib/db/schema";
import { eq, desc } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { assertMutationRequestAllowed } from "@/lib/action-auth";

export async function getJobs(showArchived = false) {
  const db = getDb();
  const conditions = showArchived ? undefined : eq(jobs.isArchived, false);
  return db
    .select()
    .from(jobs)
    .where(conditions)
    .orderBy(desc(jobs.createdAt));
}

export async function getJob(id: string) {
  const db = getDb();
  const result = await db.select().from(jobs).where(eq(jobs.id, id)).limit(1);
  return result[0] ?? null;
}

export async function createJob(data: {
  title: string;
  company?: string;
  location?: string;
  locationType?: "remote" | "hybrid" | "onsite";
  url?: string;
  description?: string;
  salary?: string;
  source?: string;
}) {
  await assertMutationRequestAllowed();
  const db = getDb();
  const result = await db.insert(jobs).values(data).returning();
  revalidatePath("/jobs");
  revalidatePath("/dashboard");
  return result[0];
}

export async function updateJob(
  id: string,
  data: Partial<{
    title: string;
    company: string;
    location: string;
    locationType: "remote" | "hybrid" | "onsite";
    url: string;
    description: string;
    salary: string;
    grade: "A" | "B" | "C" | "D" | "F";
    gradeScore: number;
    evaluationSummary: string;
    evaluationDetails: {
      resumeFit: number;
      seniorityMatch: number;
      locationMatch: number;
      compensationMatch: number;
      keywordOverlap: number;
      strengths: string[];
      concerns: string[];
    };
    keywords: string[];
  }>
) {
  await assertMutationRequestAllowed();
  const db = getDb();
  await db
    .update(jobs)
    .set({ ...data, updatedAt: new Date() })
    .where(eq(jobs.id, id));
  revalidatePath("/jobs");
  revalidatePath(`/jobs/${id}`);
  revalidatePath("/dashboard");
}

export async function archiveJob(id: string) {
  await assertMutationRequestAllowed();
  const db = getDb();
  await db
    .update(jobs)
    .set({ isArchived: true, updatedAt: new Date() })
    .where(eq(jobs.id, id));
  revalidatePath("/jobs");
  revalidatePath("/dashboard");
}

export async function logAiGeneration(data: {
  type: string;
  jobId?: string;
  resumeId?: string;
  model?: string;
  input?: unknown;
  output?: unknown;
  promptTokens?: number;
  completionTokens?: number;
  totalTokens?: number;
  durationMs?: number;
}) {
  await assertMutationRequestAllowed();
  const db = getDb();
  await db.insert(aiGenerations).values(data);
}
