import { getDb } from "@/lib/db";
import { jobs, applications, applicationEvents, reminders } from "@/lib/db/schema";
import { eq, desc, count, and, lte } from "drizzle-orm";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Briefcase, Send, Calendar, Trophy, Bell, CheckCircle } from "lucide-react";
import { StatusBadge } from "@/components/shared/status-badge";
import { type ApplicationStatus } from "@/lib/constants";
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

    const recentEvents = await db
      .select({
        id: applicationEvents.id,
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
      .limit(10);

    const gradeBreakdown = await db
      .select({ grade: jobs.grade, count: count() })
      .from(jobs)
      .where(eq(jobs.isArchived, false))
      .groupBy(jobs.grade);

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

    return { jobCount: jobCount.count, allApps, recentEvents, gradeBreakdown, dueReminders };
  } catch {
    return { jobCount: 0, allApps: [], recentEvents: [], gradeBreakdown: [], dueReminders: [] };
  }
}

const statCards = [
  { label: "Total Jobs", icon: Briefcase, gradient: "gradient-blue" },
  { label: "Applications", icon: Send, gradient: "gradient-teal" },
  { label: "Interviews", icon: Calendar, gradient: "gradient-purple" },
  { label: "Offers", icon: Trophy, gradient: "gradient-warm" },
];

export default async function DashboardPage() {
  const { jobCount, allApps, recentEvents, gradeBreakdown, dueReminders } = await getDashboardData();

  const statusMap = Object.fromEntries(allApps.map((a) => [a.status, a.count]));
  const totalApps = allApps.reduce((sum, a) => sum + a.count, 0);
  const interviews = (statusMap["interview"] ?? 0) + (statusMap["technical"] ?? 0);
  const offers = statusMap["offer"] ?? 0;
  const values = [jobCount, totalApps, interviews, offers];

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {statCards.map((stat, i) => (
          <Card key={stat.label} className="glass shadow-card border-white/30 overflow-hidden">
            <CardContent className="pt-6 relative">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">{stat.label}</p>
                  <p className="text-3xl font-bold mt-1">{values[i]}</p>
                </div>
                <div className={`h-12 w-12 rounded-xl ${stat.gradient} flex items-center justify-center shadow-card`}>
                  <stat.icon className="h-6 w-6 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Due Reminders / Action List */}
      {dueReminders.length > 0 && (
        <Card className="glass shadow-card border-white/30 border-l-4 border-l-amber-400">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Bell className="h-4 w-4 text-amber-500" />
              Action Items ({dueReminders.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {dueReminders.map((r) => (
                <div key={r.id} className="flex items-center gap-3 text-sm p-2 rounded-lg hover:bg-white/50 transition-colors">
                  <CheckCircle className="h-4 w-4 text-muted-foreground shrink-0" />
                  <div className="flex-1 min-w-0">
                    <span className="font-medium">{r.title}</span>
                    <span className="text-muted-foreground ml-2 truncate">
                      {r.jobTitle} at {r.company}
                    </span>
                  </div>
                  <span className="text-xs text-muted-foreground font-mono shrink-0">
                    {formatDistanceToNow(new Date(r.dueDate), { addSuffix: true })}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="glass shadow-card border-white/30">
          <CardHeader>
            <CardTitle className="text-base">Recent Activity</CardTitle>
          </CardHeader>
          <CardContent>
            {recentEvents.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-sm text-muted-foreground">
                  No activity yet. Start by adding jobs and creating applications.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {recentEvents.map((event) => (
                  <div key={event.id} className="flex items-center justify-between text-sm p-2 rounded-lg hover:bg-white/50 transition-colors">
                    <div className="flex items-center gap-2">
                      <StatusBadge status={event.toStatus as ApplicationStatus} />
                      <span className="text-muted-foreground truncate max-w-48">
                        {event.jobTitle} at {event.company}
                      </span>
                    </div>
                    <span className="text-xs text-muted-foreground font-mono">
                      {formatDistanceToNow(new Date(event.createdAt), { addSuffix: true })}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="glass shadow-card border-white/30">
          <CardHeader>
            <CardTitle className="text-base">Jobs by Grade</CardTitle>
          </CardHeader>
          <CardContent>
            {gradeBreakdown.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-sm text-muted-foreground">
                  No jobs evaluated yet. Add a job and run AI evaluation.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {gradeBreakdown
                  .filter((g) => g.grade)
                  .sort((a, b) => (a.grade ?? "").localeCompare(b.grade ?? ""))
                  .map((g) => (
                    <div key={g.grade} className="flex items-center justify-between p-2 rounded-lg hover:bg-white/50 transition-colors">
                      <Badge variant="outline" className="font-bold">{g.grade}</Badge>
                      <span className="text-sm font-mono font-semibold">{g.count}</span>
                    </div>
                  ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
