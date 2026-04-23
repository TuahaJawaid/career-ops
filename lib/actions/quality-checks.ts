"use server";

import { getDb } from "@/lib/db";
import {
  applicationQualityChecks,
  applications,
  jobs,
  resumes,
} from "@/lib/db/schema";
import { desc, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { assertMutationRequestAllowed } from "@/lib/action-auth";
import { type ApplicationStatus } from "@/lib/constants";

type ChecklistItem = {
  id: string;
  label: string;
  passed: boolean;
  note?: string;
};

export async function getLatestQualityCheck(applicationId: string) {
  const db = getDb();
  const rows = await db
    .select()
    .from(applicationQualityChecks)
    .where(eq(applicationQualityChecks.applicationId, applicationId))
    .orderBy(desc(applicationQualityChecks.createdAt))
    .limit(1);
  return rows[0] ?? null;
}

export async function runApplicationQualityCheck(applicationId: string) {
  await assertMutationRequestAllowed();
  const db = getDb();
  const appRows = await db
    .select({
      id: applications.id,
      status: applications.status,
      notes: applications.notes,
      nextStep: applications.nextStep,
      tailoredResumeId: applications.tailoredResumeId,
      jobTitle: jobs.title,
      description: jobs.description,
    })
    .from(applications)
    .innerJoin(jobs, eq(applications.jobId, jobs.id))
    .where(eq(applications.id, applicationId))
    .limit(1);

  const app = appRows[0];
  if (!app) throw new Error("Application not found");

  const tailoredResume =
    app.tailoredResumeId
      ? await db
          .select()
          .from(resumes)
          .where(eq(resumes.id, app.tailoredResumeId))
          .limit(1)
      : [];

  const status = app.status as ApplicationStatus;
  const criteria: ChecklistItem[] = [
    {
      id: "resume-tailored",
      label: "Tailored resume attached",
      passed: Boolean(app.tailoredResumeId && tailoredResume[0]),
      note: app.tailoredResumeId ? undefined : "Attach a tailored resume for this role",
    },
    {
      id: "notes-added",
      label: "Application notes present",
      passed: Boolean(app.notes && app.notes.trim().length >= 20),
      note: app.notes ? undefined : "Add interview prep or application context notes",
    },
    {
      id: "next-step",
      label: "Next step defined",
      passed: Boolean(app.nextStep && app.nextStep.trim().length > 0),
      note: app.nextStep ? undefined : "Set explicit next follow-up action",
    },
    {
      id: "status-progress",
      label: "Status progressed past Saved",
      passed: status !== "saved",
      note: status === "saved" ? "Move to Applied once submission is done" : undefined,
    },
    {
      id: "job-description",
      label: "Job description captured",
      passed: Boolean(app.description && app.description.trim().length > 0),
      note: app.description ? undefined : "Capture full job description for prep and tailoring",
    },
  ];

  const passed = criteria.filter((c) => c.passed).length;
  const score = Math.round((passed / criteria.length) * 100);
  const statusResult = score >= 80 ? "pass" : score >= 60 ? "warn" : "fail";

  const [saved] = await db
    .insert(applicationQualityChecks)
    .values({
      applicationId,
      score,
      status: statusResult,
      criteria,
    })
    .returning();

  revalidatePath(`/applications/${applicationId}`);
  return saved;
}
