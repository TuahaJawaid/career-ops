"use server";

import { getDb } from "@/lib/db";
import { offerReviews, applications, jobs } from "@/lib/db/schema";
import { desc, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { assertMutationRequestAllowed } from "@/lib/action-auth";

export async function getOfferReviews() {
  const db = getDb();
  return db
    .select({
      id: offerReviews.id,
      applicationId: offerReviews.applicationId,
      compensationScore: offerReviews.compensationScore,
      growthScore: offerReviews.growthScore,
      flexibilityScore: offerReviews.flexibilityScore,
      stabilityScore: offerReviews.stabilityScore,
      weightedScore: offerReviews.weightedScore,
      recommendation: offerReviews.recommendation,
      notes: offerReviews.notes,
      updatedAt: offerReviews.updatedAt,
      jobTitle: jobs.title,
      company: jobs.company,
    })
    .from(offerReviews)
    .innerJoin(applications, eq(offerReviews.applicationId, applications.id))
    .innerJoin(jobs, eq(applications.jobId, jobs.id))
    .orderBy(desc(offerReviews.updatedAt));
}

function computeWeightedScore(input: {
  compensationScore: number;
  growthScore: number;
  flexibilityScore: number;
  stabilityScore: number;
}) {
  const weighted =
    input.compensationScore * 0.35 +
    input.growthScore * 0.3 +
    input.flexibilityScore * 0.2 +
    input.stabilityScore * 0.15;
  return Math.round(weighted * 10) / 10;
}

export async function upsertOfferReview(input: {
  applicationId: string;
  compensationScore: number;
  growthScore: number;
  flexibilityScore: number;
  stabilityScore: number;
  notes?: string;
}) {
  await assertMutationRequestAllowed();
  const db = getDb();
  const weightedScore = computeWeightedScore(input);
  const recommendation =
    weightedScore >= 80 ? "accept" : weightedScore >= 60 ? "negotiate" : "decline";

  const existing = await db
    .select()
    .from(offerReviews)
    .where(eq(offerReviews.applicationId, input.applicationId))
    .limit(1);

  if (existing[0]) {
    await db
      .update(offerReviews)
      .set({
        compensationScore: input.compensationScore,
        growthScore: input.growthScore,
        flexibilityScore: input.flexibilityScore,
        stabilityScore: input.stabilityScore,
        weightedScore,
        recommendation,
        notes: input.notes,
        updatedAt: new Date(),
      })
      .where(eq(offerReviews.id, existing[0].id));
  } else {
    await db.insert(offerReviews).values({
      applicationId: input.applicationId,
      compensationScore: input.compensationScore,
      growthScore: input.growthScore,
      flexibilityScore: input.flexibilityScore,
      stabilityScore: input.stabilityScore,
      weightedScore,
      recommendation,
      notes: input.notes,
    });
  }

  revalidatePath("/offers");
}
