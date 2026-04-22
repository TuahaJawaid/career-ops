"use server";

import { getDb } from "@/lib/db";
import { reminders, applications, jobs } from "@/lib/db/schema";
import { eq, desc, and, lte, gte } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { addBusinessDays, startOfDay, endOfDay } from "date-fns";
import { assertMutationRequestAllowed } from "@/lib/action-auth";

export async function getRemindersForApplication(applicationId: string) {
  const db = getDb();
  return db
    .select()
    .from(reminders)
    .where(eq(reminders.applicationId, applicationId))
    .orderBy(reminders.dueDate);
}

export async function getDueReminders() {
  const db = getDb();
  const today = new Date();
  return db
    .select({
      id: reminders.id,
      title: reminders.title,
      dueDate: reminders.dueDate,
      isCompleted: reminders.isCompleted,
      note: reminders.note,
      applicationId: reminders.applicationId,
      jobTitle: jobs.title,
      company: jobs.company,
    })
    .from(reminders)
    .innerJoin(applications, eq(reminders.applicationId, applications.id))
    .innerJoin(jobs, eq(applications.jobId, jobs.id))
    .where(
      and(
        eq(reminders.isCompleted, false),
        lte(reminders.dueDate, endOfDay(today))
      )
    )
    .orderBy(reminders.dueDate);
}

export async function getUpcomingReminders(days: number = 7) {
  const db = getDb();
  const today = new Date();
  const futureDate = new Date(today.getTime() + days * 24 * 60 * 60 * 1000);
  return db
    .select({
      id: reminders.id,
      title: reminders.title,
      dueDate: reminders.dueDate,
      isCompleted: reminders.isCompleted,
      note: reminders.note,
      applicationId: reminders.applicationId,
      jobTitle: jobs.title,
      company: jobs.company,
    })
    .from(reminders)
    .innerJoin(applications, eq(reminders.applicationId, applications.id))
    .innerJoin(jobs, eq(applications.jobId, jobs.id))
    .where(
      and(
        eq(reminders.isCompleted, false),
        lte(reminders.dueDate, futureDate)
      )
    )
    .orderBy(reminders.dueDate);
}

export async function createReminder(data: {
  applicationId: string;
  title: string;
  dueDate: Date;
  note?: string;
}) {
  await assertMutationRequestAllowed();
  const db = getDb();
  await db.insert(reminders).values(data);
  revalidatePath("/dashboard");
  revalidatePath(`/applications/${data.applicationId}`);
}

export async function createAutoFollowUp(applicationId: string) {
  await assertMutationRequestAllowed();
  const db = getDb();
  const dueDate = addBusinessDays(new Date(), 5);
  await db.insert(reminders).values({
    applicationId,
    title: "Follow up on application",
    dueDate,
  });
  revalidatePath("/dashboard");
}

export async function completeReminder(id: string) {
  await assertMutationRequestAllowed();
  const db = getDb();
  await db
    .update(reminders)
    .set({ isCompleted: true })
    .where(eq(reminders.id, id));
  revalidatePath("/dashboard");
}

export async function deleteReminder(id: string) {
  await assertMutationRequestAllowed();
  const db = getDb();
  await db.delete(reminders).where(eq(reminders.id, id));
  revalidatePath("/dashboard");
}
