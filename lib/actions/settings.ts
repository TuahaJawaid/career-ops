"use server";

import { getDb } from "@/lib/db";
import { profiles } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { assertMutationRequestAllowed } from "@/lib/action-auth";

export async function getProfile() {
  const db = getDb();
  const result = await db.select().from(profiles).limit(1);
  return result[0] ?? null;
}

export async function upsertProfile(data: {
  fullName: string;
  email?: string;
  phone?: string;
  location?: string;
  targetRoles?: string[];
  targetRegions?: string[];
}) {
  await assertMutationRequestAllowed();
  const db = getDb();
  const existing = await db.select().from(profiles).limit(1);

  if (existing.length > 0) {
    await db
      .update(profiles)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(profiles.id, existing[0].id));
  } else {
    await db.insert(profiles).values(data);
  }

  revalidatePath("/settings");
  revalidatePath("/dashboard");
}
