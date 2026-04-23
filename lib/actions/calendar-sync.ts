"use server";

import { getDb } from "@/lib/db";
import {
  applications,
  calendarSyncEvents,
  calendarSyncSettings,
  jobs,
  reminders,
} from "@/lib/db/schema";
import { and, eq, isNotNull, lte } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { assertMutationRequestAllowed } from "@/lib/action-auth";

function getGoogleConfig() {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  const redirectUri = process.env.GOOGLE_REDIRECT_URI;
  if (!clientId || !clientSecret || !redirectUri) {
    throw new Error("Google calendar env vars are missing");
  }
  return { clientId, clientSecret, redirectUri };
}

async function getSettingsRecord() {
  const db = getDb();
  const rows = await db.select().from(calendarSyncSettings).limit(1);
  return rows[0] ?? null;
}

async function refreshGoogleTokenIfNeeded() {
  const db = getDb();
  const settings = await getSettingsRecord();
  if (!settings?.refreshToken) return settings;

  if (settings.tokenExpiresAt && new Date(settings.tokenExpiresAt).getTime() > Date.now() + 60_000) {
    return settings;
  }

  const { clientId, clientSecret } = getGoogleConfig();
  const tokenResp = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      grant_type: "refresh_token",
      refresh_token: settings.refreshToken,
    }),
  });
  if (!tokenResp.ok) {
    throw new Error("Failed to refresh Google token");
  }
  const tokenData = (await tokenResp.json()) as {
    access_token: string;
    expires_in: number;
  };

  const [updated] = await db
    .update(calendarSyncSettings)
    .set({
      accessToken: tokenData.access_token,
      tokenExpiresAt: new Date(Date.now() + tokenData.expires_in * 1000),
      updatedAt: new Date(),
    })
    .where(eq(calendarSyncSettings.id, settings.id))
    .returning();

  return updated;
}

export async function getCalendarSyncSettings() {
  return getSettingsRecord();
}

export async function getGoogleAuthUrl() {
  const { clientId, redirectUri } = getGoogleConfig();
  const scope = "https://www.googleapis.com/auth/calendar.events";
  const state = crypto.randomUUID();
  const url = new URL("https://accounts.google.com/o/oauth2/v2/auth");
  url.searchParams.set("client_id", clientId);
  url.searchParams.set("redirect_uri", redirectUri);
  url.searchParams.set("response_type", "code");
  url.searchParams.set("access_type", "offline");
  url.searchParams.set("prompt", "consent");
  url.searchParams.set("scope", scope);
  url.searchParams.set("state", state);
  return { url: url.toString(), state };
}

export async function saveGoogleOAuthTokens(input: {
  accessToken: string;
  refreshToken?: string;
  expiresIn: number;
}) {
  await assertMutationRequestAllowed();
  return saveGoogleOAuthTokensFromSystem(input);
}

export async function saveGoogleOAuthTokensFromSystem(input: {
  accessToken: string;
  refreshToken?: string;
  expiresIn: number;
}) {
  const db = getDb();
  const existing = await getSettingsRecord();
  const tokenExpiresAt = new Date(Date.now() + input.expiresIn * 1000);
  if (existing) {
    await db
      .update(calendarSyncSettings)
      .set({
        accessToken: input.accessToken,
        refreshToken: input.refreshToken ?? existing.refreshToken,
        tokenExpiresAt,
        isEnabled: true,
        updatedAt: new Date(),
      })
      .where(eq(calendarSyncSettings.id, existing.id));
  } else {
    await db.insert(calendarSyncSettings).values({
      provider: "google",
      accessToken: input.accessToken,
      refreshToken: input.refreshToken,
      tokenExpiresAt,
      isEnabled: true,
      calendarId: "primary",
    });
  }
  revalidatePath("/settings");
}

export async function disconnectGoogleCalendar() {
  await assertMutationRequestAllowed();
  const db = getDb();
  const existing = await getSettingsRecord();
  if (!existing) return;
  await db
    .update(calendarSyncSettings)
    .set({
      isEnabled: false,
      accessToken: null,
      refreshToken: null,
      tokenExpiresAt: null,
      updatedAt: new Date(),
    })
    .where(eq(calendarSyncSettings.id, existing.id));
  revalidatePath("/settings");
}

type ReminderForSync = {
  id: string;
  title: string;
  note: string | null;
  dueDate: Date;
  jobTitle: string;
  company: string | null;
};

async function createOrUpdateGoogleEvent(
  reminder: ReminderForSync,
  existingExternalEventId: string | null
) {
  const settings = await refreshGoogleTokenIfNeeded();
  if (!settings?.isEnabled || !settings.accessToken) {
    throw new Error("Google calendar is not connected");
  }

  const calendarId = settings.calendarId ?? "primary";
  const start = new Date(reminder.dueDate);
  const end = new Date(start.getTime() + 30 * 60 * 1000);
  const payload = {
    summary: `${reminder.title} — ${reminder.jobTitle}`,
    description: `${reminder.company ?? "Unknown company"}\n\n${reminder.note ?? ""}`.trim(),
    start: { dateTime: start.toISOString() },
    end: { dateTime: end.toISOString() },
  };

  const url = existingExternalEventId
    ? `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calendarId)}/events/${encodeURIComponent(existingExternalEventId)}`
    : `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calendarId)}/events`;

  const method = existingExternalEventId ? "PUT" : "POST";
  const resp = await fetch(url, {
    method,
    headers: {
      Authorization: `Bearer ${settings.accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  if (!resp.ok) {
    throw new Error(`Google Calendar API error: ${resp.status}`);
  }
  const data = (await resp.json()) as { id: string };
  return data.id;
}

export async function syncUpcomingRemindersToGoogle(days = 14) {
  await assertMutationRequestAllowed();
  const db = getDb();
  const settings = await getSettingsRecord();
  if (!settings?.isEnabled) return { synced: 0, skipped: 0 };

  const horizon = new Date(Date.now() + days * 24 * 60 * 60 * 1000);
  const remindersToSync = await db
    .select({
      id: reminders.id,
      title: reminders.title,
      note: reminders.note,
      dueDate: reminders.dueDate,
      jobTitle: jobs.title,
      company: jobs.company,
    })
    .from(reminders)
    .innerJoin(applications, eq(reminders.applicationId, applications.id))
    .innerJoin(jobs, eq(applications.jobId, jobs.id))
    .where(
      and(
        eq(reminders.isCompleted, false),
        isNotNull(reminders.dueDate),
        lte(reminders.dueDate, horizon)
      )
    );

  let synced = 0;
  let skipped = 0;
  for (const reminder of remindersToSync) {
    const existingMap = await db
      .select()
      .from(calendarSyncEvents)
      .where(eq(calendarSyncEvents.reminderId, reminder.id))
      .limit(1);
    try {
      const externalEventId = await createOrUpdateGoogleEvent(
        reminder,
        existingMap[0]?.externalEventId ?? null
      );
      if (existingMap[0]) {
        await db
          .update(calendarSyncEvents)
          .set({
            externalEventId,
            lastSyncedAt: new Date(),
            updatedAt: new Date(),
          })
          .where(eq(calendarSyncEvents.id, existingMap[0].id));
      } else {
        await db.insert(calendarSyncEvents).values({
          reminderId: reminder.id,
          externalEventId,
          provider: "google",
          lastSyncedAt: new Date(),
        });
      }
      synced += 1;
    } catch {
      skipped += 1;
    }
  }

  await db
    .update(calendarSyncSettings)
    .set({ lastSyncAt: new Date(), updatedAt: new Date() })
    .where(eq(calendarSyncSettings.id, settings.id));
  revalidatePath("/dashboard");
  revalidatePath("/settings");
  return { synced, skipped };
}
