"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { BarChart3, TrendingUp, Clock, Target } from "lucide-react";
import { getApplications } from "@/lib/actions/applications";
import { getJobs } from "@/lib/actions/jobs";
import { getDiscoveredJobs } from "@/lib/actions/discover";
import { APPLICATION_STATUSES, STATUS_LABELS, STATUS_COLORS } from "@/lib/constants";

type Application = Awaited<ReturnType<typeof getApplications>>[number];

export default function AnalyticsPage() {
  const [apps, setApps] = useState<Application[]>([]);
  const [jobCount, setJobCount] = useState(0);
  const [discoveredCount, setDiscoveredCount] = useState(0);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    Promise.all([getApplications(), getJobs(), getDiscoveredJobs()]).then(
      ([a, j, d]) => {
        setApps(a);
        setJobCount(j.length);
        setDiscoveredCount(d.length);
        setLoaded(true);
      }
    );
  }, []);

  if (!loaded) return null;

  // Funnel data
  const statusCounts: Record<string, number> = {};
  APPLICATION_STATUSES.forEach((s) => { statusCounts[s] = 0; });
  apps.forEach((a) => { statusCounts[a.status] = (statusCounts[a.status] || 0) + 1; });

  const totalApps = apps.length;
  const applied = statusCounts["applied"] + statusCounts["screening"] + statusCounts["interview"] + statusCounts["technical"] + statusCounts["offer"] + statusCounts["accepted"];
  const interviews = statusCounts["interview"] + statusCounts["technical"];
  const offers = statusCounts["offer"] + statusCounts["accepted"];

  const responded = statusCounts["screening"] + statusCounts["interview"] + statusCounts["technical"] + statusCounts["offer"] + statusCounts["accepted"] + statusCounts["rejected"] + statusCounts["withdrawn"];
  const responseRate = applied > 0 ? Math.min(100, Math.max(0, Math.round((responded / applied) * 100))) : 0;
  const interviewRate = applied > 0 ? Math.round((interviews / applied) * 100) : 0;
  const offerRate = interviews > 0 ? Math.round((offers / Math.max(interviews, 1)) * 100) : 0;

  // Source breakdown from jobs
  const funnelStages = [
    { label: "Discovered", count: discoveredCount + jobCount, color: "bg-slate-300" },
    { label: "Saved to Pipeline", count: jobCount, color: "bg-blue-300" },
    { label: "Applications", count: totalApps, color: "bg-blue-400" },
    { label: "Applied", count: applied, color: "bg-blue-500" },
    { label: "Interviews", count: interviews, color: "bg-purple-500" },
    { label: "Offers", count: offers, color: "bg-emerald-500" },
  ];
  const maxFunnel = Math.max(...funnelStages.map((s) => s.count), 1);

  return (
    <div className="space-y-6">
      {/* Key metrics */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card className="glass shadow-card border-white/30">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">Response Rate</p>
                <p className="text-3xl font-bold">{responseRate}%</p>
              </div>
              <div className="h-10 w-10 rounded-xl gradient-blue flex items-center justify-center">
                <TrendingUp className="h-5 w-5 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="glass shadow-card border-white/30">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">Interview Rate</p>
                <p className="text-3xl font-bold">{interviewRate}%</p>
              </div>
              <div className="h-10 w-10 rounded-xl gradient-purple flex items-center justify-center">
                <Target className="h-5 w-5 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="glass shadow-card border-white/30">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">Offer Rate</p>
                <p className="text-3xl font-bold">{offerRate}%</p>
              </div>
              <div className="h-10 w-10 rounded-xl gradient-teal flex items-center justify-center">
                <BarChart3 className="h-5 w-5 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="glass shadow-card border-white/30">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">Total Applications</p>
                <p className="text-3xl font-bold">{totalApps}</p>
              </div>
              <div className="h-10 w-10 rounded-xl gradient-warm flex items-center justify-center">
                <Clock className="h-5 w-5 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Conversion Funnel */}
      <Card className="glass shadow-card border-white/30">
        <CardHeader>
          <CardTitle className="text-base">Conversion Funnel</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {funnelStages.map((stage) => (
              <div key={stage.label} className="flex items-center gap-3">
                <span className="text-sm w-36 shrink-0 text-right">{stage.label}</span>
                <div className="flex-1 h-8 bg-muted/50 rounded-lg overflow-hidden">
                  <div
                    className={`h-full ${stage.color} rounded-lg transition-all duration-500 flex items-center px-3`}
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

      {/* Status breakdown */}
      <Card className="glass shadow-card border-white/30">
        <CardHeader>
          <CardTitle className="text-base">Applications by Status</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 md:grid-cols-5 gap-3">
            {APPLICATION_STATUSES.map((status) => (
              <div key={status} className="text-center p-3 rounded-xl bg-white/40">
                <div className="text-2xl font-bold">{statusCounts[status]}</div>
                <Badge className={`text-[10px] mt-1 ${STATUS_COLORS[status]}`}>
                  {STATUS_LABELS[status]}
                </Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Weekly insight */}
      <Card className="glass shadow-card border-white/30">
        <CardHeader>
          <CardTitle className="text-base">Weekly Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-sm space-y-2">
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
    </div>
  );
}
