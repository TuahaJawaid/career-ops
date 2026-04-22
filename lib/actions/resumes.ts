"use server";

import { getDb } from "@/lib/db";
import { resumes } from "@/lib/db/schema";
import { eq, desc, and } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { assertMutationRequestAllowed } from "@/lib/action-auth";

export async function getResumes() {
  const db = getDb();
  return db.select().from(resumes).orderBy(desc(resumes.createdAt));
}

export async function getBaseResumes() {
  const db = getDb();
  return db
    .select()
    .from(resumes)
    .where(eq(resumes.isBase, true))
    .orderBy(desc(resumes.createdAt));
}

export async function getResume(id: string) {
  const db = getDb();
  const result = await db.select().from(resumes).where(eq(resumes.id, id)).limit(1);
  return result[0] ?? null;
}

export async function getTailoredResumesForJob(jobId: string) {
  const db = getDb();
  return db
    .select()
    .from(resumes)
    .where(and(eq(resumes.jobId, jobId), eq(resumes.isBase, false)))
    .orderBy(desc(resumes.createdAt));
}

export async function createBaseResume(data: { name: string; content: string }) {
  await assertMutationRequestAllowed();
  const db = getDb();
  const result = await db
    .insert(resumes)
    .values({ ...data, isBase: true })
    .returning();
  revalidatePath("/resumes");
  return result[0];
}

export async function saveTailoredResume(data: {
  name: string;
  content: string;
  jobId: string;
  tailoringNotes?: string;
  keywordsAdded?: string[];
  matchScore?: number;
}) {
  await assertMutationRequestAllowed();
  const db = getDb();
  const result = await db
    .insert(resumes)
    .values({ ...data, isBase: false })
    .returning();
  revalidatePath("/resumes");
  return result[0];
}

export async function deleteResume(id: string) {
  await assertMutationRequestAllowed();
  const db = getDb();
  await db.delete(resumes).where(eq(resumes.id, id));
  revalidatePath("/resumes");
}
