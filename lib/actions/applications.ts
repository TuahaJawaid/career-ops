"use server";

import { getDb } from "@/lib/db";
import { applications, applicationEvents, jobs, reminders } from "@/lib/db/schema";
import { eq, desc } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { addBusinessDays } from "date-fns";

export async function getApplications() {
  const db = getDb();
  return db
    .select({
      id: applications.id,
      status: applications.status,
      appliedDate: applications.appliedDate,
      notes: applications.notes,
      nextStep: applications.nextStep,
      nextStepDate: applications.nextStepDate,
      createdAt: applications.createdAt,
      jobId: applications.jobId,
      jobTitle: jobs.title,
      company: jobs.company,
      location: jobs.location,
      grade: jobs.grade,
    })
    .from(applications)
    .innerJoin(jobs, eq(applications.jobId, jobs.id))
    .orderBy(desc(applications.updatedAt));
}

export async function getApplication(id: string) {
  const db = getDb();
  const result = await db
    .select({
      id: applications.id,
      status: applications.status,
      appliedDate: applications.appliedDate,
      notes: applications.notes,
      nextStep: applications.nextStep,
      nextStepDate: applications.nextStepDate,
      tailoredResumeId: applications.tailoredResumeId,
      createdAt: applications.createdAt,
      jobId: applications.jobId,
      jobTitle: jobs.title,
      company: jobs.company,
      location: jobs.location,
      grade: jobs.grade,
      url: jobs.url,
    })
    .from(applications)
    .innerJoin(jobs, eq(applications.jobId, jobs.id))
    .where(eq(applications.id, id))
    .limit(1);
  return result[0] ?? null;
}

export async function getApplicationEvents(applicationId: string) {
  const db = getDb();
  return db
    .select()
    .from(applicationEvents)
    .where(eq(applicationEvents.applicationId, applicationId))
    .orderBy(desc(applicationEvents.createdAt));
}

export async function createApplication(jobId: string) {
  const db = getDb();
  const result = await db
    .insert(applications)
    .values({ jobId, status: "saved" })
    .returning();

  await db.insert(applicationEvents).values({
    applicationId: result[0].id,
    toStatus: "saved",
    note: "Application created",
  });

  revalidatePath("/applications");
  revalidatePath("/dashboard");
  return result[0];
}

export async function updateApplicationStatus(
  id: string,
  newStatus: string,
  note?: string
) {
  const db = getDb();
  const existing = await db
    .select()
    .from(applications)
    .where(eq(applications.id, id))
    .limit(1);

  if (!existing[0]) return;

  const fromStatus = existing[0].status;

  await db
    .update(applications)
    .set({
      status: newStatus as typeof existing[0]["status"],
      appliedDate:
        newStatus === "applied" && !existing[0].appliedDate
          ? new Date()
          : existing[0].appliedDate,
      updatedAt: new Date(),
    })
    .where(eq(applications.id, id));

  await db.insert(applicationEvents).values({
    applicationId: id,
    fromStatus,
    toStatus: newStatus,
    note,
  });

  // Auto-create follow-up reminder when moving to "applied"
  if (newStatus === "applied" && fromStatus !== "applied") {
    await db.insert(reminders).values({
      applicationId: id,
      title: "Follow up on application",
      dueDate: addBusinessDays(new Date(), 5),
    });
  }

  // Auto-create thank-you reminder after interview
  if (newStatus === "interview" && fromStatus !== "interview") {
    await db.insert(reminders).values({
      applicationId: id,
      title: "Send thank-you email after interview",
      dueDate: addBusinessDays(new Date(), 1),
    });
  }

  revalidatePath("/applications");
  revalidatePath(`/applications/${id}`);
  revalidatePath("/dashboard");
}

export async function updateApplicationNotes(
  id: string,
  data: { notes?: string; nextStep?: string; nextStepDate?: Date | null }
) {
  const db = getDb();
  await db
    .update(applications)
    .set({ ...data, updatedAt: new Date() })
    .where(eq(applications.id, id));
  revalidatePath(`/applications/${id}`);
}

export async function deleteApplication(id: string) {
  const db = getDb();
  await db.delete(applications).where(eq(applications.id, id));
  revalidatePath("/applications");
  revalidatePath("/dashboard");
}
