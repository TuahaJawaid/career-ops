"use server";

import { getDb } from "@/lib/db";
import { contacts, contactInteractions } from "@/lib/db/schema";
import { eq, desc } from "drizzle-orm";
import { revalidatePath } from "next/cache";

export async function getContacts() {
  const db = getDb();
  return db.select().from(contacts).orderBy(desc(contacts.updatedAt));
}

export async function getContactsForJob(jobId: string) {
  const db = getDb();
  return db
    .select()
    .from(contacts)
    .where(eq(contacts.jobId, jobId))
    .orderBy(desc(contacts.updatedAt));
}

export async function getContact(id: string) {
  const db = getDb();
  const result = await db.select().from(contacts).where(eq(contacts.id, id)).limit(1);
  return result[0] ?? null;
}

export async function createContact(data: {
  name: string;
  role?: string;
  company?: string;
  email?: string;
  linkedin?: string;
  phone?: string;
  notes?: string;
  jobId?: string;
  applicationId?: string;
}) {
  const db = getDb();
  const result = await db.insert(contacts).values(data).returning();
  revalidatePath("/contacts");
  return result[0];
}

export async function updateContact(
  id: string,
  data: Partial<{
    name: string;
    role: string;
    company: string;
    email: string;
    linkedin: string;
    phone: string;
    notes: string;
  }>
) {
  const db = getDb();
  await db
    .update(contacts)
    .set({ ...data, updatedAt: new Date() })
    .where(eq(contacts.id, id));
  revalidatePath("/contacts");
}

export async function deleteContact(id: string) {
  const db = getDb();
  await db.delete(contacts).where(eq(contacts.id, id));
  revalidatePath("/contacts");
}

export async function getInteractionsForContact(contactId: string) {
  const db = getDb();
  return db
    .select()
    .from(contactInteractions)
    .where(eq(contactInteractions.contactId, contactId))
    .orderBy(desc(contactInteractions.date));
}

export async function addInteraction(data: {
  contactId: string;
  type: string;
  note?: string;
  date?: Date;
}) {
  const db = getDb();
  await db.insert(contactInteractions).values({
    ...data,
    date: data.date ?? new Date(),
  });
  // Update contact's updatedAt
  await db
    .update(contacts)
    .set({ updatedAt: new Date() })
    .where(eq(contacts.id, data.contactId));
  revalidatePath("/contacts");
}
