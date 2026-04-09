/**
 * WeWorkRemotely — Free RSS feed, no auth required.
 * One of the largest remote job boards.
 * https://weworkremotely.com/remote-jobs.rss
 *
 * Category feeds available:
 * - Management and Finance (most relevant for accounting)
 * - Full-Stack, Back-End, Front-End Programming
 * - Customer Support, Design, DevOps, Sales & Marketing
 */

interface WWRJob {
  title: string;
  company: string;
  url: string;
  description: string;
  pubDate: string;
  region: string;
}

// RSS categories relevant to accounting roles
const RELEVANT_FEEDS = [
  "https://weworkremotely.com/categories/remote-management-and-finance-jobs.rss",
  "https://weworkremotely.com/remote-jobs.rss",
];

export async function searchWeWorkRemotelyJobs(params: {
  query: string;
}) {
  const allJobs: WWRJob[] = [];

  for (const feedUrl of RELEVANT_FEEDS) {
    try {
      const response = await fetch(feedUrl, {
        headers: { "User-Agent": "CareerOps/1.0" },
      });

      if (!response.ok) continue;

      const xml = await response.text();
      const jobs = parseRSS(xml);
      allJobs.push(...jobs);
    } catch (err) {
      console.error(`WWR feed failed for ${feedUrl}:`, err);
    }
  }

  // Deduplicate by URL
  const seen = new Set<string>();
  const unique = allJobs.filter((j) => {
    if (seen.has(j.url)) return false;
    seen.add(j.url);
    return true;
  });

  // Strict title filter
  const queryLower = params.query.toLowerCase().trim();
  const keyWords = queryLower
    .split(/\s+/)
    .filter((w) => !["senior", "junior", "lead", "staff", "principal", "associate", "manager"].includes(w));

  return unique
    .filter((job) => {
      const titleLower = job.title.toLowerCase();
      if (titleLower.includes(queryLower)) return true;
      if (keyWords.length > 0 && keyWords.every((word) => titleLower.includes(word))) return true;
      return false;
    })
    .map(normalizeJob);
}

function parseRSS(xml: string): WWRJob[] {
  const jobs: WWRJob[] = [];
  const itemRegex = /<item>([\s\S]*?)<\/item>/g;
  let match;

  while ((match = itemRegex.exec(xml)) !== null) {
    const item = match[1];
    const title = extractTag(item, "title")?.replace(/<!\[CDATA\[(.*?)\]\]>/, "$1") ?? "";
    const link = extractTag(item, "link") ?? "";
    const pubDate = extractTag(item, "pubDate") ?? "";
    const description = extractTag(item, "description")?.replace(/<!\[CDATA\[([\s\S]*?)\]\]>/, "$1")?.replace(/<[^>]*>/g, "").slice(0, 3000) ?? "";

    // Parse company from title (usually "Title: Company")
    // WWR titles are often just the job title, company is separate
    const region = extractTag(item, "region") ?? "Anywhere";

    // Try to extract company name from title pattern "Company: Title"
    const companyMatch = title.match(/^(.+?):\s+(.+)$/);
    const company = companyMatch ? companyMatch[1].trim() : "";
    const jobTitle = companyMatch ? companyMatch[2].trim() : title;

    if (link) {
      jobs.push({
        title: jobTitle || title,
        company,
        url: link,
        description,
        pubDate,
        region,
      });
    }
  }

  return jobs;
}

function extractTag(xml: string, tag: string): string | null {
  const regex = new RegExp(`<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`);
  const match = xml.match(regex);
  return match ? match[1].trim() : null;
}

function normalizeJob(job: WWRJob) {
  return {
    externalId: `wwr-${Buffer.from(job.url).toString("base64").slice(0, 32)}`,
    title: job.title,
    company: job.company || undefined,
    location: job.region || "Remote",
    locationType: "remote" as const,
    url: job.url,
    description: job.description,
    salary: undefined,
    source: "weworkremotely",
    postedDate: job.pubDate ? new Date(job.pubDate).toISOString() : undefined,
  };
}
