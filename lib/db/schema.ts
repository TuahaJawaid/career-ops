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
