"use server";

import { getDb } from "@/lib/db";
import {
  discoveredJobs,
  roleAlerts,
  roleSubscriptions,
} from "@/lib/db/schema";
import { and, desc, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { assertMutationRequestAllowed } from "@/lib/action-auth";
import { jobMatchesQuery } from "@/lib/services/search-match";
import { passesLocationExclusions } from "@/lib/services/exclusion-match";
import { type MatchMode } from "@/lib/services/role-query-expansion";

export async function getRoleSubscriptions() {
  const db = getDb();
  return db.select().from(roleSubscriptions).orderBy(desc(roleSubscriptions.updatedAt));
}

export async function createRoleSubscription(input: {
  name: string;
  query: string;
  matchMode?: MatchMode;
  excludedCountries?: string[];
}) {
  await assertMutationRequestAllowed();
  const db = getDb();
  await db.insert(roleSubscriptions).values({
    name: input.name.trim(),
    query: input.query.trim(),
    matchMode: input.matchMode ?? "balanced",
    excludedCountries: input.excludedCountries ?? ["us", "il"],
  });
  revalidatePath("/discover");
  revalidatePath("/settings");
}

export async function updateRoleSubscription(
  id: string,
  patch: Partial<{
    name: string;
    query: string;
    matchMode: MatchMode;
    excludedCountries: string[];
    isActive: boolean;
  }>
) {
  await assertMutationRequestAllowed();
  const db = getDb();
  await db
    .update(roleSubscriptions)
    .set({ ...patch, updatedAt: new Date() })
    .where(eq(roleSubscriptions.id, id));
  revalidatePath("/discover");
  revalidatePath("/settings");
}

export async function deleteRoleSubscription(id: string) {
  await assertMutationRequestAllowed();
  const db = getDb();
  await db.delete(roleSubscriptions).where(eq(roleSubscriptions.id, id));
  revalidatePath("/discover");
  revalidatePath("/settings");
}

export async function getRoleAlerts() {
  const db = getDb();
  return db
    .select({
      id: roleAlerts.id,
      createdAt: roleAlerts.createdAt,
      isRead: roleAlerts.isRead,
      reason: roleAlerts.reason,
      subscriptionName: roleSubscriptions.name,
      jobTitle: discoveredJobs.title,
      jobCompany: discoveredJobs.company,
      jobId: discoveredJobs.id,
    })
    .from(roleAlerts)
    .innerJoin(roleSubscriptions, eq(roleAlerts.subscriptionId, roleSubscriptions.id))
    .innerJoin(discoveredJobs, eq(roleAlerts.discoveredJobId, discoveredJobs.id))
    .orderBy(desc(roleAlerts.createdAt));
}

export async function markRoleAlertRead(id: string) {
  await assertMutationRequestAllowed();
  const db = getDb();
  await db.update(roleAlerts).set({ isRead: true }).where(eq(roleAlerts.id, id));
  revalidatePath("/discover");
}

export async function createRoleAlert(input: {
  subscriptionId: string;
  discoveredJobId: string;
  reason?: string;
}) {
  const db = getDb();
  const existing = await db
    .select()
    .from(roleAlerts)
    .where(
      and(
        eq(roleAlerts.subscriptionId, input.subscriptionId),
        eq(roleAlerts.discoveredJobId, input.discoveredJobId)
      )
    )
    .limit(1);

  if (existing[0]) return;

  await db.insert(roleAlerts).values({
    subscriptionId: input.subscriptionId,
    discoveredJobId: input.discoveredJobId,
    reason: input.reason ?? "Matched your role subscription",
  });
}

export async function evaluateJobAgainstSubscriptions(job: {
  id: string;
  title: string;
  description?: string | null;
  source?: string | null;
  location?: string | null;
  locationType?: string | null;
}) {
  const db = getDb();
  const subscriptions = await db
    .select()
    .from(roleSubscriptions)
    .where(eq(roleSubscriptions.isActive, true));

  for (const sub of subscriptions) {
    if (!passesLocationExclusions(job.location, sub.excludedCountries)) continue;
    const matches = jobMatchesQuery({
      query: sub.query,
      title: job.title,
      description: job.description ?? undefined,
      tags: [job.source ?? "", job.locationType ?? ""],
    });
    if (!matches) continue;

    await createRoleAlert({
      subscriptionId: sub.id,
      discoveredJobId: job.id,
      reason: `Matched "${sub.name}"`,
    });

    await db
      .update(roleSubscriptions)
      .set({ lastRunAt: new Date(), updatedAt: new Date() })
      .where(eq(roleSubscriptions.id, sub.id));
  }
}
