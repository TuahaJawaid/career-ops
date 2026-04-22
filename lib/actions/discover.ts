"use server";

import { getDb } from "@/lib/db";
import { discoveredJobs, jobs, companyCareerPages, resumes, aiGenerations } from "@/lib/db/schema";
import { eq, desc } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { isUsLocation } from "@/lib/us-filter";
import { assertMutationRequestAllowed } from "@/lib/action-auth";

export async function getDiscoveredJobs() {
  const db = getDb();
  const allJobs = await db
    .select()
    .from(discoveredJobs)
    .where(eq(discoveredJobs.isSaved, false))
    .orderBy(desc(discoveredJobs.discoveredAt));
  // Filter out any US-based jobs that slipped through
  return allJobs.filter((j) => !isUsLocation(j.location));
}

export async function saveDiscoveredJob(discoveredJobId: string) {
  await assertMutationRequestAllowed();
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
  await assertMutationRequestAllowed();
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
  await assertMutationRequestAllowed();
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

  const newJobs = jobsData
    .filter((j) => !j.url || !existingUrls.has(j.url))
    .filter((j) => !isUsLocation(j.location)); // Never insert US jobs
  if (newJobs.length === 0) return;

  await db.insert(discoveredJobs).values(newJobs);
  revalidatePath("/discover");
}

// Purge all US-based jobs from discovered_jobs and jobs tables
export async function purgeUsJobs() {
  await assertMutationRequestAllowed();
  const db = getDb();

  // Get all discovered jobs with US locations
  const allDiscovered = await db.select({ id: discoveredJobs.id, location: discoveredJobs.location }).from(discoveredJobs);
  const usDiscoveredIds = allDiscovered.filter((j) => isUsLocation(j.location)).map((j) => j.id);

  // Get all saved jobs with US locations
  const allSaved = await db.select({ id: jobs.id, location: jobs.location }).from(jobs);
  const usSavedIds = allSaved.filter((j) => isUsLocation(j.location)).map((j) => j.id);

  let deletedDiscovered = 0;
  let deletedSaved = 0;

  for (const id of usDiscoveredIds) {
    await db.delete(discoveredJobs).where(eq(discoveredJobs.id, id));
    deletedDiscovered++;
  }
  for (const id of usSavedIds) {
    // Delete dependents that lack onDelete cascade
    await db.delete(resumes).where(eq(resumes.jobId, id));
    await db.delete(aiGenerations).where(eq(aiGenerations.jobId, id));
    // applications cascade automatically
    await db.delete(jobs).where(eq(jobs.id, id));
    deletedSaved++;
  }

  revalidatePath("/discover");
  revalidatePath("/jobs");
  revalidatePath("/dashboard");

  return { deletedDiscovered, deletedSaved };
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
  await assertMutationRequestAllowed();
  const db = getDb();
  await db.insert(companyCareerPages).values({ ...data, isCustom: true });
  revalidatePath("/discover");
}

export async function removeCareerPage(id: string) {
  await assertMutationRequestAllowed();
  const db = getDb();
  await db.delete(companyCareerPages).where(eq(companyCareerPages.id, id));
  revalidatePath("/discover");
}

const SEED_VERSION = 2; // Bump this to re-seed with updated list

export async function seedDefaultCareerPages() {
  await assertMutationRequestAllowed();
  const db = getDb();

  // Check if we need to re-seed (version check via count)
  const existing = await db.select().from(companyCareerPages).where(eq(companyCareerPages.isCustom, false));
  if (existing.length >= 100) return; // v2 has 100+ entries, skip if already seeded

  // Delete old defaults (keep custom user-added ones)
  if (existing.length > 0) {
    await db.delete(companyCareerPages).where(eq(companyCareerPages.isCustom, false));
  }

  const defaults = [
    // === Big 4 / Accounting Firms ===
    { company: "Deloitte", url: "https://apply.deloitte.com/careers/SearchJobs/?524=12646&524_format=1482&listFilterMode=1", category: "Big 4 & Accounting" },
    { company: "PwC", url: "https://www.pwc.com/gx/en/careers.html", category: "Big 4 & Accounting" },
    { company: "EY", url: "https://careers.ey.com/ey/search/?q=accountant", category: "Big 4 & Accounting" },
    { company: "KPMG", url: "https://www.kpmgcareers.com/jobs/?k=accountant", category: "Big 4 & Accounting" },
    { company: "BDO", url: "https://www.bdo.com/careers/experienced-professionals", category: "Big 4 & Accounting" },
    { company: "Grant Thornton", url: "https://www.grantthornton.com/careers", category: "Big 4 & Accounting" },
    { company: "RSM", url: "https://rsmus.com/careers.html", category: "Big 4 & Accounting" },
    { company: "Crowe", url: "https://www.crowe.com/careers", category: "Big 4 & Accounting" },
    { company: "Baker Tilly", url: "https://careers.bakertilly.com/jobs", category: "Big 4 & Accounting" },
    { company: "Mazars", url: "https://www.mazars.com/Home/Join-us", category: "Big 4 & Accounting" },

    // === Tech — Global ===
    { company: "Google", url: "https://www.google.com/about/careers/applications/jobs/results/?q=accountant", category: "Tech (Global)" },
    { company: "Amazon", url: "https://www.amazon.jobs/en/search?base_query=accountant", category: "Tech (Global)" },
    { company: "Microsoft", url: "https://careers.microsoft.com/v2/global/en/search?q=accountant", category: "Tech (Global)" },
    { company: "Meta", url: "https://www.metacareers.com/jobs/?q=accountant", category: "Tech (Global)" },
    { company: "Netflix", url: "https://jobs.netflix.com/search?q=accountant", category: "Tech (Global)" },
    { company: "Salesforce", url: "https://careers.salesforce.com/en/jobs/?search=accountant", category: "Tech (Global)" },
    { company: "Adobe", url: "https://careers.adobe.com/us/en/search-results?keywords=accountant", category: "Tech (Global)" },
    { company: "Oracle", url: "https://careers.oracle.com/jobs/#en/sites/jobsearch/requisitions?keyword=accountant", category: "Tech (Global)" },
    { company: "Stripe", url: "https://stripe.com/jobs/search?query=accountant", category: "Tech (Global)" },
    { company: "PayPal", url: "https://paypal.eightfold.ai/careers?query=accountant", category: "Tech (Global)" },
    { company: "Shopify", url: "https://www.shopify.com/careers/search?query=accountant", category: "Tech (Global)" },

    // === Finance & Banking — Global ===
    { company: "JPMorgan Chase", url: "https://careers.jpmorgan.com/global/en/search-results?keywords=accountant", category: "Finance (Global)" },
    { company: "Goldman Sachs", url: "https://higher.gs.com/roles/search?q=accountant", category: "Finance (Global)" },
    { company: "Citi", url: "https://jobs.citi.com/search-jobs/accountant", category: "Finance (Global)" },
    { company: "Visa", url: "https://corporate.visa.com/en/careers.html", category: "Finance (Global)" },
    { company: "Mastercard", url: "https://careers.mastercard.com/us/en/search-results?keywords=accountant", category: "Finance (Global)" },
    { company: "BlackRock", url: "https://careers.blackrock.com/job-search-results/?keyword=accountant", category: "Finance (Global)" },

    // === Finance & Banking — UK ===
    { company: "HSBC", url: "https://mycareer.hsbc.com/en_GB/external/SearchJobs/?q=accountant", category: "Finance (UK)" },
    { company: "Barclays", url: "https://search.jobs.barclays/search-jobs/accountant", category: "Finance (UK)" },
    { company: "Lloyds Banking Group", url: "https://www.lloydsbankinggrouptalent.com/search/?q=accountant", category: "Finance (UK)" },
    { company: "Standard Chartered", url: "https://scb.taleo.net/careersection/ex/jobsearch.ftl?lang=en&keyword=accountant", category: "Finance (UK)" },
    { company: "NatWest Group", url: "https://jobs.natwestgroup.com/search/?q=accountant", category: "Finance (UK)" },
    { company: "Revolut", url: "https://www.revolut.com/careers/?query=accountant", category: "Finance (UK)" },

    // === UK Companies ===
    { company: "Unilever", url: "https://careers.unilever.com/search-jobs?k=accountant", category: "UK & Europe" },
    { company: "BP", url: "https://www.bp.com/en/global/corporate/careers/search-and-apply.html", category: "UK & Europe" },
    { company: "Shell", url: "https://www.shell.com/careers/browse-jobs.html?q=accountant", category: "UK & Europe" },
    { company: "GSK", url: "https://jobs.gsk.com/en-gb/jobs?keywords=accountant", category: "UK & Europe" },
    { company: "AstraZeneca", url: "https://careers.astrazeneca.com/search-jobs?k=accountant", category: "UK & Europe" },
    { company: "Rolls-Royce", url: "https://careers.rolls-royce.com/search-jobs?k=accountant", category: "UK & Europe" },
    { company: "BBC", url: "https://careerssearch.bbc.co.uk/jobs/search?q=accountant", category: "UK & Europe" },
    { company: "Tesco", url: "https://www.tesco-careers.com/search/?q=accountant", category: "UK & Europe" },

    // === Europe ===
    { company: "Siemens", url: "https://jobs.siemens.com/careers?query=accountant", category: "UK & Europe" },
    { company: "SAP", url: "https://jobs.sap.com/search/?q=accountant", category: "UK & Europe" },
    { company: "Nestlé", url: "https://www.nestle.com/jobs/search?query=accountant", category: "UK & Europe" },
    { company: "Novartis", url: "https://www.novartis.com/careers/career-search?search_api_fulltext=accountant", category: "UK & Europe" },
    { company: "Roche", url: "https://careers.roche.com/global/en/search-results?keywords=accountant", category: "UK & Europe" },
    { company: "BMW", url: "https://www.bmwgroup.jobs/en.html?keyword=accountant", category: "UK & Europe" },
    { company: "L'Oréal", url: "https://careers.loreal.com/en_US/jobs?keywords=accountant", category: "UK & Europe" },
    { company: "Philips", url: "https://www.careers.philips.com/global/en/search-results?keywords=accountant", category: "UK & Europe" },
    { company: "IKEA", url: "https://about.ikea.com/en/work-with-us/job-opportunities", category: "UK & Europe" },
    { company: "Spotify", url: "https://www.lifeatspotify.com/jobs?query=accountant", category: "UK & Europe" },

    // === Canada ===
    { company: "RBC", url: "https://jobs.rbc.com/ca/en/search-results?keywords=accountant", category: "Canada" },
    { company: "TD Bank", url: "https://jobs.td.com/en/job-search-results/?keyword=accountant", category: "Canada" },
    { company: "Scotiabank", url: "https://jobs.scotiabank.com/search/?q=accountant", category: "Canada" },
    { company: "BMO", url: "https://jobs.bmo.com/search?q=accountant", category: "Canada" },
    { company: "Manulife", url: "https://careers.manulife.com/global/en/search-results?keywords=accountant", category: "Canada" },
    { company: "Sun Life", url: "https://www.sunlife.com/en/careers/search-jobs/?q=accountant", category: "Canada" },
    { company: "Telus", url: "https://careers.telus.com/search/?q=accountant", category: "Canada" },
    { company: "Loblaws", url: "https://myview.wd3.myworkdayjobs.com/loblaw_careers?q=accountant", category: "Canada" },

    // === Middle East (UAE, Saudi, Qatar) ===
    { company: "Emirates Group", url: "https://www.emiratesgroupcareers.com/search/?q=accountant", category: "Middle East" },
    { company: "Etihad Airways", url: "https://careers.etihad.com/search/?q=accountant", category: "Middle East" },
    { company: "ADNOC", url: "https://careers.adnoc.ae/search/?q=accountant", category: "Middle East" },
    { company: "Emirates NBD", url: "https://www.emiratesnbd.com/en/careers", category: "Middle East" },
    { company: "Majid Al Futtaim", url: "https://careers.majidalfuttaim.com/search/?q=accountant", category: "Middle East" },
    { company: "Emaar", url: "https://www.emaar.com/en/careers", category: "Middle East" },
    { company: "SABIC", url: "https://www.sabic.com/en/careers", category: "Middle East" },
    { company: "Saudi Aramco", url: "https://www.aramco.com/en/careers/job-search?keyword=accountant", category: "Middle East" },
    { company: "QatarEnergy", url: "https://careers.qatarenergy.qa/search/?q=accountant", category: "Middle East" },
    { company: "DP World", url: "https://careers.dpworld.com/search/?q=accountant", category: "Middle East" },
    { company: "Noon", url: "https://careers.noon.com/en/search/?q=accountant", category: "Middle East" },
    { company: "Chalhoub Group", url: "https://careers.chalhoubgroup.com/search/?q=accountant", category: "Middle East" },
    { company: "Al Futtaim Group", url: "https://www.alfuttaim.com/careers/search-jobs?query=accountant", category: "Middle East" },
    { company: "Aldar Properties", url: "https://www.aldar.com/en/careers", category: "Middle East" },

    // === Singapore & Malaysia ===
    { company: "DBS Bank", url: "https://www.dbs.com/careers/search.html?keyword=accountant", category: "Singapore & Malaysia" },
    { company: "OCBC Bank", url: "https://www.ocbc.com/group/careers/search.html?keyword=accountant", category: "Singapore & Malaysia" },
    { company: "UOB", url: "https://careers.uobgroup.com/search/?q=accountant", category: "Singapore & Malaysia" },
    { company: "Grab", url: "https://grab.careers/jobs/?search=accountant", category: "Singapore & Malaysia" },
    { company: "Sea Group (Shopee)", url: "https://career.seagroup.com/search?query=accountant", category: "Singapore & Malaysia" },
    { company: "Singapore Airlines", url: "https://www.singaporeair.com/en_UK/sg/careers/", category: "Singapore & Malaysia" },
    { company: "Singtel", url: "https://careers.singtel.com/search/?q=accountant", category: "Singapore & Malaysia" },
    { company: "Petronas", url: "https://www.petronas.com/careers", category: "Singapore & Malaysia" },
    { company: "Maybank", url: "https://www.maybank.com/en/career.page", category: "Singapore & Malaysia" },
    { company: "CIMB", url: "https://www.cimb.com/en/careers.html", category: "Singapore & Malaysia" },
    { company: "Genting Group", url: "https://career.genting.com/search/?q=accountant", category: "Singapore & Malaysia" },
    { company: "AirAsia", url: "https://careers.airasia.com/search/?q=accountant", category: "Singapore & Malaysia" },

    // === Consumer / Industrial — Global ===
    { company: "Johnson & Johnson", url: "https://jobs.jnj.com/en/jobs/?q=accountant", category: "Global Consumer" },
    { company: "Procter & Gamble", url: "https://www.pgcareers.com/search-jobs?k=accountant", category: "Global Consumer" },
    { company: "Coca-Cola", url: "https://careers.coca-colacompany.com/search-jobs/accountant", category: "Global Consumer" },
    { company: "PepsiCo", url: "https://www.pepsicojobs.com/search-jobs/accountant", category: "Global Consumer" },
    { company: "Nike", url: "https://jobs.nike.com/search?q=accountant", category: "Global Consumer" },
    { company: "LVMH", url: "https://www.lvmh.com/join-us/our-job-offers/?search=accountant", category: "Global Consumer" },
    { company: "Disney", url: "https://jobs.disneycareers.com/search-jobs/accountant", category: "Global Consumer" },
    { company: "3M", url: "https://careers.3m.com/search-jobs/accountant", category: "Global Consumer" },
    { company: "General Electric", url: "https://jobs.gecareers.com/global/en/search-results?keywords=accountant", category: "Global Consumer" },
    { company: "Caterpillar", url: "https://careers.caterpillar.com/en/jobs/?q=accountant", category: "Global Consumer" },

    // === Pharma & Healthcare ===
    { company: "Pfizer", url: "https://www.pfizer.com/about/careers/search-results?keyword=accountant", category: "Healthcare & Pharma" },
    { company: "Merck", url: "https://jobs.merck.com/search-jobs/accountant", category: "Healthcare & Pharma" },
    { company: "Abbott", url: "https://www.jobs.abbott/search-jobs/accountant", category: "Healthcare & Pharma" },
    { company: "Medtronic", url: "https://jobs.medtronic.com/search-jobs/accountant", category: "Healthcare & Pharma" },
    { company: "UnitedHealth Group", url: "https://careers.unitedhealthgroup.com/search-jobs/accountant", category: "Healthcare & Pharma" },
  ];

  await db.insert(companyCareerPages).values(defaults);
}
