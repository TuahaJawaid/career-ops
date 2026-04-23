"use server";

import { getDb } from "@/lib/db";
import {
  followedCompanies,
  followedCompanyAlerts,
  discoveredJobs,
} from "@/lib/db/schema";
import { and, desc, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { assertMutationRequestAllowed } from "@/lib/action-auth";

export async function getFollowedCompanies() {
  const db = getDb();
  return db.select().from(followedCompanies).orderBy(desc(followedCompanies.updatedAt));
}

export async function followCompany(input: { company: string; notes?: string }) {
  await assertMutationRequestAllowed();
  const db = getDb();
  const existing = await db
    .select()
    .from(followedCompanies)
    .where(eq(followedCompanies.company, input.company.trim()))
    .limit(1);

  if (existing[0]) {
    await db
      .update(followedCompanies)
      .set({ isActive: true, notes: input.notes, updatedAt: new Date() })
      .where(eq(followedCompanies.id, existing[0].id));
  } else {
    await db.insert(followedCompanies).values({
      company: input.company.trim(),
      notes: input.notes,
    });
  }

  revalidatePath("/discover");
}

export async function unfollowCompany(id: string) {
  await assertMutationRequestAllowed();
  const db = getDb();
  await db
    .update(followedCompanies)
    .set({ isActive: false, updatedAt: new Date() })
    .where(eq(followedCompanies.id, id));
  revalidatePath("/discover");
}

export async function getFollowedCompanyAlerts() {
  const db = getDb();
  return db
    .select({
      id: followedCompanyAlerts.id,
      isRead: followedCompanyAlerts.isRead,
      createdAt: followedCompanyAlerts.createdAt,
      company: followedCompanies.company,
      jobTitle: discoveredJobs.title,
      jobCompany: discoveredJobs.company,
      jobId: discoveredJobs.id,
    })
    .from(followedCompanyAlerts)
    .innerJoin(
      followedCompanies,
      eq(followedCompanyAlerts.followedCompanyId, followedCompanies.id)
    )
    .innerJoin(
      discoveredJobs,
      eq(followedCompanyAlerts.discoveredJobId, discoveredJobs.id)
    )
    .orderBy(desc(followedCompanyAlerts.createdAt));
}

export async function markFollowedCompanyAlertRead(id: string) {
  await assertMutationRequestAllowed();
  const db = getDb();
  await db
    .update(followedCompanyAlerts)
    .set({ isRead: true })
    .where(eq(followedCompanyAlerts.id, id));
  revalidatePath("/discover");
}

export async function createFollowedCompanyAlert(input: {
  followedCompanyId: string;
  discoveredJobId: string;
  reason?: string;
}) {
  const db = getDb();
  const existing = await db
    .select()
    .from(followedCompanyAlerts)
    .where(
      and(
        eq(followedCompanyAlerts.followedCompanyId, input.followedCompanyId),
        eq(followedCompanyAlerts.discoveredJobId, input.discoveredJobId)
      )
    )
    .limit(1);

  if (existing[0]) return;

  await db.insert(followedCompanyAlerts).values({
    followedCompanyId: input.followedCompanyId,
    discoveredJobId: input.discoveredJobId,
    reason: input.reason ?? "New role posted at followed company",
  });

  await db
    .update(followedCompanies)
    .set({ lastMatchedAt: new Date(), updatedAt: new Date() })
    .where(eq(followedCompanies.id, input.followedCompanyId));
}

export async function evaluateJobAgainstFollowedCompanies(job: {
  id: string;
  title: string;
  company?: string | null;
}) {
  if (!job.company) return;
  const db = getDb();
  const follows = await db
    .select()
    .from(followedCompanies)
    .where(eq(followedCompanies.isActive, true));

  const normalizedCompany = job.company.trim().toLowerCase();
  for (const follow of follows) {
    const normalizedFollow = follow.company.trim().toLowerCase();
    const matches =
      normalizedCompany === normalizedFollow ||
      normalizedCompany.includes(normalizedFollow) ||
      normalizedFollow.includes(normalizedCompany);

    if (!matches) continue;
    await createFollowedCompanyAlert({
      followedCompanyId: follow.id,
      discoveredJobId: job.id,
      reason: `Matched followed company "${follow.company}"`,
    });
  }
}
