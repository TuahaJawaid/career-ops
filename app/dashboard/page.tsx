import { getDb } from "@/lib/db";
import { jobs, applications, applicationEvents, reminders, discoveredJobs } from "@/lib/db/schema";
import { eq, desc, count, and, lte } from "drizzle-orm";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Bell, CheckCircle, BarChart3, TrendingUp, Clock, Target } from "lucide-react";
import { StatusBadge } from "@/components/shared/status-badge";
import { APPLICATION_STATUSES, STATUS_COLORS, STATUS_LABELS, type ApplicationStatus } from "@/lib/constants";
import { formatDistanceToNow } from "date-fns";

async function getDashboardData() {
  try {
    const db = getDb();

    const [jobCount] = await db
      .select({ count: count() })
      .from(jobs)
      .where(eq(jobs.isArchived, false));

    const allApps = await db
      .select({ status: applications.status, count: count() })
      .from(applications)
      .groupBy(applications.status);

    const appRows = await db
      .select({
        id: applications.id,
        status: applications.status,
        updatedAt: applications.updatedAt,
        nextStep: applications.nextStep,
        nextStepDate: applications.nextStepDate,
        appliedDate: applications.appliedDate,
        jobTitle: jobs.title,
        company: jobs.company,
        source: jobs.source,
      })
      .from(applications)
      .innerJoin(jobs, eq(applications.jobId, jobs.id))
      .orderBy(desc(applications.updatedAt));

    const recentEvents = await db
      .select({
        id: applicationEvents.id,
        applicationId: applicationEvents.applicationId,
        toStatus: applicationEvents.toStatus,
        note: applicationEvents.note,
        createdAt: applicationEvents.createdAt,
        jobTitle: jobs.title,
        company: jobs.company,
      })
      .from(applicationEvents)
      .innerJoin(applications, eq(applicationEvents.applicationId, applications.id))
      .innerJoin(jobs, eq(applications.jobId, jobs.id))
      .orderBy(desc(applicationEvents.createdAt))
      .limit(20);

    const gradeBreakdown = await db
      .select({ grade: jobs.grade, count: count() })
      .from(jobs)
      .where(eq(jobs.isArchived, false))
      .groupBy(jobs.grade);

    const [discoveredCount] = await db
      .select({ count: count() })
      .from(discoveredJobs)
      .where(eq(discoveredJobs.isSaved, false));

    // Due reminders
    const today = new Date();
    const dueReminders = await db
      .select({
        id: reminders.id,
        title: reminders.title,
        dueDate: reminders.dueDate,
        jobTitle: jobs.title,
        company: jobs.company,
      })
      .from(reminders)
      .innerJoin(applications, eq(reminders.applicationId, applications.id))
      .innerJoin(jobs, eq(applications.jobId, jobs.id))
      .where(
        and(eq(reminders.isCompleted, false), lte(reminders.dueDate, new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000)))
      )
      .orderBy(reminders.dueDate)
      .limit(10);

    return {
      jobCount: jobCount.count,
      discoveredCount: discoveredCount.count,
      allApps,
      appRows,
      recentEvents,
      gradeBreakdown,
      dueReminders,
    };
  } catch {
    return {
      jobCount: 0,
      discoveredCount: 0,
      allApps: [],
      appRows: [],
      recentEvents: [],
      gradeBreakdown: [],
      dueReminders: [],
    };
  }
}

export default async function DashboardPage() {
  const {
    jobCount,
    discoveredCount,
    allApps,
    appRows,
    recentEvents,
    gradeBreakdown,
    dueReminders,
  } = await getDashboardData();

  const statusMap = Object.fromEntries(allApps.map((a) => [a.status, a.count]));
  const totalApps = allApps.reduce((sum, a) => sum + a.count, 0);
  const interviews = (statusMap.interview ?? 0) + (statusMap.technical ?? 0);
  const offers = (statusMap.offer ?? 0) + (statusMap.accepted ?? 0);
  const applied = totalApps - (statusMap.saved ?? 0);
  const responded =
    (statusMap.screening ?? 0) +
    (statusMap.interview ?? 0) +
    (statusMap.technical ?? 0) +
    (statusMap.offer ?? 0) +
    (statusMap.accepted ?? 0) +
    (statusMap.rejected ?? 0) +
    (statusMap.withdrawn ?? 0);
  const responseRate = applied > 0 ? Math.round((responded / applied) * 100) : 0;
  const interviewRate = applied > 0 ? Math.round((interviews / applied) * 100) : 0;
  const offerRate = interviews > 0 ? Math.round((offers / interviews) * 100) : 0;
  const activePipeline = appRows.filter(
    (row) => !["accepted", "rejected", "withdrawn"].includes(row.status)
  );

  const now = Date.now();
  const staleThreshold = now - 14 * 24 * 60 * 60 * 1000;
  const staleApps = activePipeline.filter((row) => {
    const updated = row.updatedAt ? new Date(row.updatedAt).getTime() : now;
    return updated < staleThreshold;
  });

  const averageDaysInStage =
    activePipeline.length > 0
      ? Math.round(
          activePipeline.reduce((acc, row) => {
            const updated = row.updatedAt ? new Date(row.updatedAt).getTime() : now;
            return acc + (now - updated) / (24 * 60 * 60 * 1000);
          }, 0) / activePipeline.length
        )
      : 0;

  const pipelineRows = activePipeline
    .slice()
    .sort((a, b) => {
      const aDate = a.nextStepDate ? new Date(a.nextStepDate).getTime() : new Date(a.updatedAt).getTime();
      const bDate = b.nextStepDate ? new Date(b.nextStepDate).getTime() : new Date(b.updatedAt).getTime();
      return aDate - bDate;
    })
    .slice(0, 8);

  const sourcePerformance = Object.entries(
    appRows.reduce<Record<string, { total: number; interview: number; offer: number }>>((acc, row) => {
      const source = row.source || "Unknown";
      acc[source] ??= { total: 0, interview: 0, offer: 0 };
      acc[source].total += 1;
      if (row.status === "interview" || row.status === "technical") acc[source].interview += 1;
      if (row.status === "offer" || row.status === "accepted") acc[source].offer += 1;
      return acc;
    }, {})
  )
    .map(([source, stats]) => ({ source, ...stats }))
    .sort((a, b) => b.total - a.total)
    .slice(0, 6);

  const gradeCounts = gradeBreakdown.reduce<Record<string, number>>((acc, row) => {
    if (row.grade) acc[row.grade] = row.count;
    return acc;
  }, {});

  const reminderStats = dueReminders.reduce(
    (acc, reminder) => {
      const due = new Date(reminder.dueDate).getTime();
      if (due < now) acc.overdue += 1;
      if (due >= now && due <= now + 24 * 60 * 60 * 1000) acc.today += 1;
      return acc;
    },
    { overdue: 0, today: 0 }
  );

  const interviewsThisWeek = recentEvents.filter((event) => {
    const created = new Date(event.createdAt).getTime();
    return (
      created >= now - 7 * 24 * 60 * 60 * 1000 &&
      (event.toStatus === "interview" || event.toStatus === "technical")
    );
  }).length;

  const statusCounts: Record<string, number> = {};
  APPLICATION_STATUSES.forEach((s) => {
    statusCounts[s] = 0;
  });
  allApps.forEach((a) => {
    statusCounts[a.status] = a.count;
  });

  const funnelStages = [
    { label: "Discovered", count: discoveredCount + jobCount, color: "bg-slate-400" },
    { label: "Saved to Pipeline", count: jobCount, color: "bg-blue-400" },
    { label: "Applications", count: totalApps, color: "bg-blue-500" },
    { label: "Applied", count: applied, color: "bg-indigo-500" },
    { label: "Interviews", count: interviews, color: "bg-violet-500" },
    { label: "Offers", count: offers, color: "bg-emerald-500" },
  ];
  const maxFunnel = Math.max(...funnelStages.map((s) => s.count), 1);

  return (
    <div className="space-y-7">
      <section className="overflow-hidden rounded-3xl border border-border/70 bg-[linear-gradient(135deg,#171a22,#101115)] p-6 shadow-card">
        <div className="flex flex-wrap items-start justify-between gap-5">
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">Career Operations</p>
            <h2 className="text-3xl font-semibold tracking-tight">Good evening, Aimun.</h2>
            <p className="max-w-xl text-sm text-muted-foreground">
              Your search is stable. Focus on interview conversion and overdue follow-ups.
            </p>
          </div>
          <div className="rounded-full border border-border/70 bg-muted/30 px-4 py-2 text-xs text-muted-foreground">
            Updated just now
          </div>
        </div>
        <div className="mt-6 grid gap-3 md:grid-cols-4">
          {[
            { label: "Open Roles", value: jobCount },
            { label: "Active Applications", value: activePipeline.length },
            { label: "Overdue Tasks", value: reminderStats.overdue },
            { label: "Interviews This Week", value: interviewsThisWeek },
          ].map((metric) => (
            <div key={metric.label} className="rounded-2xl border border-border/60 bg-muted/25 px-4 py-3">
              <p className="text-xs uppercase tracking-wide text-muted-foreground">{metric.label}</p>
              <p className="mt-1 text-2xl font-semibold">{metric.value}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-12">
        <Card className="xl:col-span-8">
          <CardHeader className="border-b border-border/70 pb-4">
            <CardTitle className="text-lg">Pipeline Health</CardTitle>
          </CardHeader>
          <CardContent className="space-y-5 pt-5">
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>Response Progress</span>
                <span>{responded}/{Math.max(applied, 0)}</span>
              </div>
              <div className="h-2 rounded-full bg-muted">
                <div className="h-2 rounded-full bg-primary" style={{ width: `${Math.min(responseRate, 100)}%` }} />
              </div>
            </div>
            <div className="grid gap-2 sm:grid-cols-2">
              {pipelineRows.slice(0, 4).map((row) => (
                <div key={row.id} className="rounded-xl border border-border/70 bg-muted/20 p-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium">{row.jobTitle}</p>
                      <p className="truncate text-xs text-muted-foreground">{row.company ?? "Unknown company"}</p>
                    </div>
                    <StatusBadge status={row.status as ApplicationStatus} />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="xl:col-span-4">
          <CardHeader className="border-b border-border/70 pb-4">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Bell className="h-4 w-4 text-primary" />
              Action Center
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 pt-5">
            <div className="flex items-center justify-between rounded-xl border border-border/70 bg-muted/20 px-4 py-3">
              <span className="text-sm text-muted-foreground">Due Today</span>
              <span className="text-lg font-semibold">{reminderStats.today}</span>
            </div>
            <div className="flex items-center justify-between rounded-xl border border-border/70 bg-muted/20 px-4 py-3">
              <span className="text-sm text-muted-foreground">Overdue</span>
              <span className="text-lg font-semibold text-destructive">{reminderStats.overdue}</span>
            </div>
            <div className="flex items-center justify-between rounded-xl border border-border/70 bg-muted/20 px-4 py-3">
              <span className="text-sm text-muted-foreground">Stale Applications</span>
              <span className="text-lg font-semibold">{staleApps.length}</span>
            </div>
            <div className="flex items-center justify-between rounded-xl border border-border/70 bg-muted/20 px-4 py-3">
              <span className="text-sm text-muted-foreground">Interviews (7d)</span>
              <span className="text-lg font-semibold">{interviewsThisWeek}</span>
            </div>
          </CardContent>
        </Card>
      </section>

      <section className="grid gap-6 xl:grid-cols-12">
        <Card className="xl:col-span-4">
          <CardHeader className="border-b border-border/70 pb-4">
            <CardTitle className="text-lg">Source Performance</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 pt-5">
            {sourcePerformance.length === 0 ? (
              <p className="text-sm text-muted-foreground">No source data yet.</p>
            ) : (
              sourcePerformance.map((source) => (
                <div key={source.source} className="rounded-xl border border-border/70 bg-muted/20 px-3 py-2.5">
                  <div className="flex items-center justify-between">
                    <p className="truncate text-sm">{source.source}</p>
                    <p className="text-sm font-semibold">{source.total}</p>
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {source.interview} interviews · {source.offer} offers
                  </p>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        <Card className="xl:col-span-4">
          <CardHeader className="border-b border-border/70 pb-4">
            <CardTitle className="text-lg">Upcoming</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 pt-5">
            {dueReminders.slice(0, 5).map((reminder) => (
              <div key={reminder.id} className="flex items-start gap-2 rounded-xl border border-border/70 bg-muted/20 p-3">
                <CheckCircle className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium">{reminder.title}</p>
                  <p className="truncate text-xs text-muted-foreground">
                    {reminder.jobTitle} at {reminder.company}
                  </p>
                </div>
              </div>
            ))}
            {dueReminders.length === 0 && (
              <p className="text-sm text-muted-foreground">No upcoming reminders.</p>
            )}
          </CardContent>
        </Card>

        <Card className="xl:col-span-4">
          <CardHeader className="border-b border-border/70 pb-4">
            <CardTitle className="text-lg">Grade Mix</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 pt-5">
            <div className="flex items-center justify-between rounded-xl border border-border/70 bg-muted/20 px-4 py-3">
              <span className="text-sm text-muted-foreground">A / B Quality Roles</span>
              <Badge variant="outline">{(gradeCounts.A ?? 0) + (gradeCounts.B ?? 0)}</Badge>
            </div>
            <div className="flex items-center justify-between rounded-xl border border-border/70 bg-muted/20 px-4 py-3">
              <span className="text-sm text-muted-foreground">C / D / F Roles</span>
              <Badge variant="outline">{(gradeCounts.C ?? 0) + (gradeCounts.D ?? 0) + (gradeCounts.F ?? 0)}</Badge>
            </div>
            <div className="flex items-center justify-between rounded-xl border border-border/70 bg-muted/20 px-4 py-3">
              <span className="text-sm text-muted-foreground">Avg Days in Stage</span>
              <span className="text-lg font-semibold">{averageDaysInStage}</span>
            </div>
          </CardContent>
        </Card>
      </section>

      <section>
        <Card>
          <CardHeader className="border-b border-border/70 pb-4">
            <CardTitle className="text-lg">Recent Activity</CardTitle>
          </CardHeader>
          <CardContent className="pt-5">
            {recentEvents.length === 0 ? (
              <p className="text-sm text-muted-foreground">No activity logged yet.</p>
            ) : (
              <div className="space-y-2">
                {recentEvents.slice(0, 8).map((event) => (
                  <div key={event.id} className="flex items-center justify-between rounded-xl border border-border/70 bg-muted/15 px-3 py-2.5">
                    <div className="flex min-w-0 items-center gap-2">
                      <StatusBadge status={event.toStatus as ApplicationStatus} />
                      <span className="truncate text-sm text-muted-foreground">
                        {event.jobTitle} at {event.company}
                      </span>
                    </div>
                    <span className="ml-4 shrink-0 text-xs text-muted-foreground">
                      {formatDistanceToNow(new Date(event.createdAt), { addSuffix: true })}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </section>

      <section className="space-y-6">
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground">Response Rate</p>
                  <p className="text-3xl font-bold">{responseRate}%</p>
                </div>
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-500/20">
                  <TrendingUp className="h-5 w-5 text-blue-300" />
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground">Interview Rate</p>
                  <p className="text-3xl font-bold">{interviewRate}%</p>
                </div>
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-500/20">
                  <Target className="h-5 w-5 text-violet-300" />
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground">Offer Rate</p>
                  <p className="text-3xl font-bold">{offerRate}%</p>
                </div>
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/20">
                  <BarChart3 className="h-5 w-5 text-emerald-300" />
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground">Total Applications</p>
                  <p className="text-3xl font-bold">{totalApps}</p>
                </div>
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-orange-500/20">
                  <Clock className="h-5 w-5 text-orange-300" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Conversion Funnel</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {funnelStages.map((stage) => (
                <div key={stage.label} className="flex items-center gap-3">
                  <span className="w-36 shrink-0 text-right text-sm">{stage.label}</span>
                  <div className="h-8 flex-1 overflow-hidden rounded-lg bg-muted/50">
                    <div
                      className={`flex h-full items-center rounded-lg px-3 transition-all duration-500 ${stage.color}`}
                      style={{ width: `${Math.max((stage.count / maxFunnel) * 100, 2)}%` }}
                    >
                      <span className="text-xs font-bold text-white drop-shadow">{stage.count}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Applications by Status</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-3 md:grid-cols-5">
              {APPLICATION_STATUSES.map((status) => (
                <div key={status} className="rounded-xl bg-muted/35 p-3 text-center">
                  <div className="text-2xl font-bold">{statusCounts[status]}</div>
                  <Badge className={`mt-1 text-[10px] ${STATUS_COLORS[status]}`}>
                    {STATUS_LABELS[status]}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Weekly Summary</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 text-sm">
              <p>
                <strong>{jobCount}</strong> jobs in your pipeline, <strong>{totalApps}</strong> applications tracked.
              </p>
              {applied > 0 && (
                <p>
                  Out of <strong>{applied}</strong> applications sent, <strong>{interviews}</strong> led to interviews ({interviewRate}% conversion).
                </p>
              )}
              {offers > 0 && (
                <p>
                  You have <strong>{offers}</strong> offer{offers !== 1 ? "s" : ""}. Offer rate from interviews: <strong>{offerRate}%</strong>.
                </p>
              )}
              {totalApps === 0 && (
                <p className="text-muted-foreground">Start applying to jobs to see your analytics here.</p>
              )}
              {totalApps > 0 && interviews === 0 && (
                <p className="text-muted-foreground">
                  Tip: Try tailoring your resume with AI for each application to improve your interview rate.
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
