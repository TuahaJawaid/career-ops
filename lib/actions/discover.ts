"use server";

import { getDb } from "@/lib/db";
import { discoveredJobs, jobs, companyCareerPages } from "@/lib/db/schema";
import { eq, desc } from "drizzle-orm";
import { revalidatePath } from "next/cache";

export async function getDiscoveredJobs() {
  const db = getDb();
  return db
    .select()
    .from(discoveredJobs)
    .where(eq(discoveredJobs.isSaved, false))
    .orderBy(desc(discoveredJobs.discoveredAt));
}

export async function saveDiscoveredJob(discoveredJobId: string) {
  const db = getDb();
  const discovered = await db
    .select()
    .from(discoveredJobs)
    .where(eq(discoveredJobs.id, discoveredJobId))
    .limit(1);

  if (!discovered[0]) return null;

  const d = discovered[0];
  const newJob = await db
    .insert(jobs)
    .values({
      title: d.title,
      company: d.company,
      location: d.location,
      locationType: d.locationType,
      url: d.url,
      description: d.description,
      salary: d.salary,
      source: d.source,
      postedDate: d.postedDate,
    })
    .returning();

  await db
    .update(discoveredJobs)
    .set({ isSaved: true })
    .where(eq(discoveredJobs.id, discoveredJobId));

  revalidatePath("/discover");
  revalidatePath("/jobs");
  revalidatePath("/dashboard");
  return newJob[0];
}

export async function dismissDiscoveredJob(id: string) {
  const db = getDb();
  await db.delete(discoveredJobs).where(eq(discoveredJobs.id, id));
  revalidatePath("/discover");
}

export async function insertDiscoveredJobs(
  jobsData: {
    externalId?: string;
    title: string;
    company?: string;
    location?: string;
    locationType?: "remote" | "hybrid" | "onsite";
    url?: string;
    description?: string;
    salary?: string;
    source?: string;
    postedDate?: string;
  }[]
) {
  if (jobsData.length === 0) return;
  const db = getDb();

  // Deduplicate by URL against existing discovered + saved jobs
  const existingUrls = new Set<string>();

  const existingDiscovered = await db
    .select({ url: discoveredJobs.url })
    .from(discoveredJobs);
  existingDiscovered.forEach((j) => j.url && existingUrls.add(j.url));

  const existingSaved = await db.select({ url: jobs.url }).from(jobs);
  existingSaved.forEach((j) => j.url && existingUrls.add(j.url));

  const newJobs = jobsData.filter((j) => !j.url || !existingUrls.has(j.url));
  if (newJobs.length === 0) return;

  await db.insert(discoveredJobs).values(newJobs);
  revalidatePath("/discover");
}

// Company Career Pages
export async function getCareerPages() {
  const db = getDb();
  return db
    .select()
    .from(companyCareerPages)
    .orderBy(companyCareerPages.category, companyCareerPages.company);
}

export async function addCareerPage(data: {
  company: string;
  url: string;
  category?: string;
}) {
  const db = getDb();
  await db.insert(companyCareerPages).values({ ...data, isCustom: true });
  revalidatePath("/discover");
}

export async function removeCareerPage(id: string) {
  const db = getDb();
  await db.delete(companyCareerPages).where(eq(companyCareerPages.id, id));
  revalidatePath("/discover");
}

export async function seedDefaultCareerPages() {
  const db = getDb();
  const existing = await db.select().from(companyCareerPages).limit(1);
  if (existing.length > 0) return; // Already seeded

  const defaults = [
    // Big 4
    { company: "Deloitte", url: "https://apply.deloitte.com/careers/SearchJobs/?524=12646&524_format=1482&listFilterMode=1", category: "Big 4" },
    { company: "PwC", url: "https://www.pwc.com/gx/en/careers.html", category: "Big 4" },
    { company: "EY", url: "https://careers.ey.com/ey/search/?q=accountant", category: "Big 4" },
    { company: "KPMG", url: "https://www.kpmgcareers.com/jobs/?k=accountant", category: "Big 4" },
    // Tech
    { company: "Google", url: "https://www.google.com/about/careers/applications/jobs/results/?q=accountant", category: "Tech" },
    { company: "Amazon", url: "https://www.amazon.jobs/en/search?base_query=accountant", category: "Tech" },
    { company: "Microsoft", url: "https://careers.microsoft.com/v2/global/en/search?q=accountant", category: "Tech" },
    { company: "Apple", url: "https://jobs.apple.com/en-us/search?search=accountant", category: "Tech" },
    { company: "Meta", url: "https://www.metacareers.com/jobs/?q=accountant", category: "Tech" },
    // Finance
    { company: "JPMorgan Chase", url: "https://careers.jpmorgan.com/us/en/search-results?keywords=accountant", category: "Finance" },
    { company: "Goldman Sachs", url: "https://higher.gs.com/roles/search?q=accountant", category: "Finance" },
    { company: "Morgan Stanley", url: "https://ms.taleo.net/careersection/2/jobsearch.ftl?lang=en&keyword=accountant", category: "Finance" },
    { company: "Citi", url: "https://jobs.citi.com/search-jobs/accountant", category: "Finance" },
    { company: "Bank of America", url: "https://careers.bankofamerica.com/en-us/search-results?keywords=accountant", category: "Finance" },
    // Consumer / Industrial
    { company: "Johnson & Johnson", url: "https://jobs.jnj.com/en/jobs/?q=accountant", category: "Consumer" },
    { company: "Procter & Gamble", url: "https://www.pgcareers.com/search-jobs?k=accountant", category: "Consumer" },
    { company: "Unilever", url: "https://careers.unilever.com/search-jobs?k=accountant", category: "Consumer" },
    { company: "Tesla", url: "https://www.tesla.com/careers/search/?query=accountant", category: "Consumer" },
    { company: "Netflix", url: "https://jobs.netflix.com/search?q=accountant", category: "Tech" },
  ];

  await db.insert(companyCareerPages).values(defaults);
}
