import {
  pgTable,
  uuid,
  varchar,
  text,
  boolean,
  real,
  integer,
  timestamp,
  jsonb,
  pgEnum,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

// Enums
export const gradeEnum = pgEnum("grade", ["A", "B", "C", "D", "F"]);

export const applicationStatusEnum = pgEnum("application_status", [
  "saved",
  "applied",
  "screening",
  "interview",
  "technical",
  "offer",
  "accepted",
  "rejected",
  "withdrawn",
]);

export const locationTypeEnum = pgEnum("location_type", [
  "remote",
  "hybrid",
  "onsite",
]);

// Tables
export const profiles = pgTable("profiles", {
  id: uuid("id").primaryKey().defaultRandom(),
  fullName: varchar("full_name", { length: 255 }).notNull(),
  email: varchar("email", { length: 255 }),
  phone: varchar("phone", { length: 50 }),
  location: varchar("location", { length: 255 }),
  targetRoles: jsonb("target_roles").$type<string[]>().default([
    "Senior Accountant",
    "Senior Revenue Accountant",
    "Revenue Accountant",
  ]),
  targetRegions: jsonb("target_regions").$type<string[]>().default([]),
  preferences: jsonb("preferences").$type<Record<string, unknown>>().default({}),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const discoveredJobs = pgTable("discovered_jobs", {
  id: uuid("id").primaryKey().defaultRandom(),
  externalId: varchar("external_id", { length: 255 }),
  title: varchar("title", { length: 500 }).notNull(),
  company: varchar("company", { length: 255 }),
  location: varchar("location", { length: 255 }),
  locationType: locationTypeEnum("location_type"),
  url: text("url"),
  description: text("description"),
  salary: varchar("salary", { length: 255 }),
  source: varchar("source", { length: 100 }),
  postedDate: varchar("posted_date", { length: 100 }),
  isSaved: boolean("is_saved").default(false).notNull(),
  discoveredAt: timestamp("discovered_at").defaultNow().notNull(),
});

export const jobs = pgTable("jobs", {
  id: uuid("id").primaryKey().defaultRandom(),
  title: varchar("title", { length: 500 }).notNull(),
  company: varchar("company", { length: 255 }),
  location: varchar("location", { length: 255 }),
  locationType: locationTypeEnum("location_type"),
  url: text("url"),
  description: text("description"),
  salary: varchar("salary", { length: 255 }),
  seniority: varchar("seniority", { length: 100 }),
  postedDate: varchar("posted_date", { length: 100 }),
  source: varchar("source", { length: 100 }),
  // AI evaluation fields
  grade: gradeEnum("grade"),
  gradeScore: real("grade_score"),
  evaluationSummary: text("evaluation_summary"),
  evaluationDetails: jsonb("evaluation_details").$type<{
    resumeFit: number;
    seniorityMatch: number;
    locationMatch: number;
    compensationMatch: number;
    keywordOverlap: number;
    strengths: string[];
    concerns: string[];
  }>(),
  keywords: jsonb("keywords").$type<string[]>().default([]),
  isArchived: boolean("is_archived").default(false).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const applications = pgTable("applications", {
  id: uuid("id").primaryKey().defaultRandom(),
  jobId: uuid("job_id")
    .references(() => jobs.id, { onDelete: "cascade" })
    .notNull(),
  status: applicationStatusEnum("status").default("saved").notNull(),
  appliedDate: timestamp("applied_date"),
  notes: text("notes"),
  nextStep: varchar("next_step", { length: 500 }),
  nextStepDate: timestamp("next_step_date"),
  tailoredResumeId: uuid("tailored_resume_id").references(() => resumes.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const applicationEvents = pgTable("application_events", {
  id: uuid("id").primaryKey().defaultRandom(),
  applicationId: uuid("application_id")
    .references(() => applications.id, { onDelete: "cascade" })
    .notNull(),
  fromStatus: varchar("from_status", { length: 50 }),
  toStatus: varchar("to_status", { length: 50 }).notNull(),
  note: text("note"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const resumes = pgTable("resumes", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: varchar("name", { length: 255 }).notNull(),
  isBase: boolean("is_base").default(false).notNull(),
  content: text("content").notNull(),
  jobId: uuid("job_id").references(() => jobs.id),
  tailoringNotes: text("tailoring_notes"),
  keywordsAdded: jsonb("keywords_added").$type<string[]>().default([]),
  matchScore: real("match_score"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const aiGenerations = pgTable("ai_generations", {
  id: uuid("id").primaryKey().defaultRandom(),
  type: varchar("type", { length: 50 }).notNull(),
  jobId: uuid("job_id").references(() => jobs.id),
  resumeId: uuid("resume_id").references(() => resumes.id),
  model: varchar("model", { length: 100 }),
  input: jsonb("input"),
  output: jsonb("output"),
  promptTokens: integer("prompt_tokens"),
  completionTokens: integer("completion_tokens"),
  totalTokens: integer("total_tokens"),
  durationMs: integer("duration_ms"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const companyCareerPages = pgTable("company_career_pages", {
  id: uuid("id").primaryKey().defaultRandom(),
  company: varchar("company", { length: 255 }).notNull(),
  url: text("url").notNull(),
  category: varchar("category", { length: 100 }),
  isCustom: boolean("is_custom").default(false).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Feature 1: Follow-up reminders
export const reminders = pgTable("reminders", {
  id: uuid("id").primaryKey().defaultRandom(),
  applicationId: uuid("application_id")
    .references(() => applications.id, { onDelete: "cascade" })
    .notNull(),
  title: varchar("title", { length: 500 }).notNull(),
  dueDate: timestamp("due_date").notNull(),
  isCompleted: boolean("is_completed").default(false).notNull(),
  note: text("note"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Feature 4: Networking CRM
export const contacts = pgTable("contacts", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: varchar("name", { length: 255 }).notNull(),
  role: varchar("role", { length: 255 }),
  company: varchar("company", { length: 255 }),
  email: varchar("email", { length: 255 }),
  linkedin: text("linkedin"),
  phone: varchar("phone", { length: 50 }),
  notes: text("notes"),
  jobId: uuid("job_id").references(() => jobs.id),
  applicationId: uuid("application_id").references(() => applications.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const contactInteractions = pgTable("contact_interactions", {
  id: uuid("id").primaryKey().defaultRandom(),
  contactId: uuid("contact_id")
    .references(() => contacts.id, { onDelete: "cascade" })
    .notNull(),
  type: varchar("type", { length: 50 }).notNull(), // email, linkedin, call, meeting, referral
  note: text("note"),
  date: timestamp("date").defaultNow().notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const followedCompanies = pgTable("followed_companies", {
  id: uuid("id").primaryKey().defaultRandom(),
  company: varchar("company", { length: 255 }).notNull(),
  notes: text("notes"),
  isActive: boolean("is_active").default(true).notNull(),
  lastMatchedAt: timestamp("last_matched_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const roleSubscriptions = pgTable("role_subscriptions", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: varchar("name", { length: 255 }).notNull(),
  query: varchar("query", { length: 500 }).notNull(),
  matchMode: varchar("match_mode", { length: 20 }).default("balanced").notNull(), // focused | balanced | broad
  excludedCountries: jsonb("excluded_countries").$type<string[]>().default(["us", "il"]),
  isActive: boolean("is_active").default(true).notNull(),
  lastRunAt: timestamp("last_run_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const roleAlerts = pgTable("role_alerts", {
  id: uuid("id").primaryKey().defaultRandom(),
  subscriptionId: uuid("subscription_id")
    .references(() => roleSubscriptions.id, { onDelete: "cascade" })
    .notNull(),
  discoveredJobId: uuid("discovered_job_id")
    .references(() => discoveredJobs.id, { onDelete: "cascade" })
    .notNull(),
  reason: varchar("reason", { length: 255 }),
  isRead: boolean("is_read").default(false).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const followedCompanyAlerts = pgTable("followed_company_alerts", {
  id: uuid("id").primaryKey().defaultRandom(),
  followedCompanyId: uuid("followed_company_id")
    .references(() => followedCompanies.id, { onDelete: "cascade" })
    .notNull(),
  discoveredJobId: uuid("discovered_job_id")
    .references(() => discoveredJobs.id, { onDelete: "cascade" })
    .notNull(),
  reason: varchar("reason", { length: 255 }),
  isRead: boolean("is_read").default(false).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const offerReviews = pgTable("offer_reviews", {
  id: uuid("id").primaryKey().defaultRandom(),
  applicationId: uuid("application_id")
    .references(() => applications.id, { onDelete: "cascade" })
    .notNull(),
  compensationScore: integer("compensation_score").default(0).notNull(),
  growthScore: integer("growth_score").default(0).notNull(),
  flexibilityScore: integer("flexibility_score").default(0).notNull(),
  stabilityScore: integer("stability_score").default(0).notNull(),
  weightedScore: real("weighted_score").default(0),
  notes: text("notes"),
  recommendation: varchar("recommendation", { length: 50 }), // accept | negotiate | decline
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const applicationQualityChecks = pgTable("application_quality_checks", {
  id: uuid("id").primaryKey().defaultRandom(),
  applicationId: uuid("application_id")
    .references(() => applications.id, { onDelete: "cascade" })
    .notNull(),
  score: integer("score").notNull(),
  status: varchar("status", { length: 20 }).notNull(), // pass | warn | fail
  criteria: jsonb("criteria")
    .$type<
      {
        id: string;
        label: string;
        passed: boolean;
        note?: string;
      }[]
    >()
    .default([]),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const interviewPrepPacks = pgTable("interview_prep_packs", {
  id: uuid("id").primaryKey().defaultRandom(),
  applicationId: uuid("application_id")
    .references(() => applications.id, { onDelete: "cascade" })
    .notNull(),
  summary: text("summary"),
  likelyQuestions: jsonb("likely_questions").$type<string[]>().default([]),
  starPrompts: jsonb("star_prompts").$type<string[]>().default([]),
  accountingScenarios: jsonb("accounting_scenarios").$type<string[]>().default([]),
  generatedByModel: varchar("generated_by_model", { length: 100 }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const calendarSyncSettings = pgTable("calendar_sync_settings", {
  id: uuid("id").primaryKey().defaultRandom(),
  provider: varchar("provider", { length: 50 }).default("google").notNull(),
  accessToken: text("access_token"),
  refreshToken: text("refresh_token"),
  tokenExpiresAt: timestamp("token_expires_at"),
  calendarId: varchar("calendar_id", { length: 255 }).default("primary"),
  isEnabled: boolean("is_enabled").default(false).notNull(),
  lastSyncAt: timestamp("last_sync_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const calendarSyncEvents = pgTable("calendar_sync_events", {
  id: uuid("id").primaryKey().defaultRandom(),
  reminderId: uuid("reminder_id").references(() => reminders.id, { onDelete: "cascade" }),
  externalEventId: varchar("external_event_id", { length: 255 }).notNull(),
  provider: varchar("provider", { length: 50 }).default("google").notNull(),
  lastSyncedAt: timestamp("last_synced_at").defaultNow().notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Relations
export const jobsRelations = relations(jobs, ({ many }) => ({
  applications: many(applications),
  resumes: many(resumes),
}));

export const applicationsRelations = relations(applications, ({ one, many }) => ({
  job: one(jobs, { fields: [applications.jobId], references: [jobs.id] }),
  tailoredResume: one(resumes, {
    fields: [applications.tailoredResumeId],
    references: [resumes.id],
  }),
  events: many(applicationEvents),
  offerReviews: many(offerReviews),
  qualityChecks: many(applicationQualityChecks),
  interviewPrepPacks: many(interviewPrepPacks),
}));

export const applicationEventsRelations = relations(applicationEvents, ({ one }) => ({
  application: one(applications, {
    fields: [applicationEvents.applicationId],
    references: [applications.id],
  }),
}));

export const resumesRelations = relations(resumes, ({ one }) => ({
  job: one(jobs, { fields: [resumes.jobId], references: [jobs.id] }),
}));

export const roleSubscriptionsRelations = relations(roleSubscriptions, ({ many }) => ({
  alerts: many(roleAlerts),
}));

export const roleAlertsRelations = relations(roleAlerts, ({ one }) => ({
  subscription: one(roleSubscriptions, {
    fields: [roleAlerts.subscriptionId],
    references: [roleSubscriptions.id],
  }),
  discoveredJob: one(discoveredJobs, {
    fields: [roleAlerts.discoveredJobId],
    references: [discoveredJobs.id],
  }),
}));

export const followedCompaniesRelations = relations(followedCompanies, ({ many }) => ({
  alerts: many(followedCompanyAlerts),
}));

export const followedCompanyAlertsRelations = relations(followedCompanyAlerts, ({ one }) => ({
  followedCompany: one(followedCompanies, {
    fields: [followedCompanyAlerts.followedCompanyId],
    references: [followedCompanies.id],
  }),
  discoveredJob: one(discoveredJobs, {
    fields: [followedCompanyAlerts.discoveredJobId],
    references: [discoveredJobs.id],
  }),
}));
