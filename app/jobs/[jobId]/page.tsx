"use client";

import { useEffect, useState, useTransition } from "react";
import { useParams, useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { Brain, FileText, ExternalLink, Send, Trash2, MapPin, Building2 } from "lucide-react";
import { toast } from "sonner";
import { getJob, archiveJob } from "@/lib/actions/jobs";
import { createApplication } from "@/lib/actions/applications";
import { GradeBadge } from "@/components/shared/grade-badge";
import { type Grade } from "@/lib/constants";

type Job = Awaited<ReturnType<typeof getJob>>;

export default function JobDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [job, setJob] = useState<Job | null>(null);
  const [isPending, startTransition] = useTransition();
  const [evaluating, setEvaluating] = useState(false);

  useEffect(() => {
    getJob(params.jobId as string).then(setJob);
  }, [params.jobId]);

  if (!job) return null;

  async function handleEvaluate() {
    setEvaluating(true);
    try {
      const res = await fetch("/api/ai/evaluate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ jobId: job!.id }),
      });
      if (res.ok) {
        toast.success("Evaluation complete");
        const updated = await getJob(job!.id);
        setJob(updated);
      } else {
        toast.error("Evaluation failed");
      }
    } catch {
      toast.error("Evaluation failed");
    } finally {
      setEvaluating(false);
    }
  }

  function handleCreateApp() {
    startTransition(async () => {
      await createApplication(job!.id);
      toast.success("Application created");
      router.push("/applications");
    });
  }

  function handleArchive() {
    startTransition(async () => {
      await archiveJob(job!.id);
      toast.success("Job archived");
      router.push("/jobs");
    });
  }

  const details = job.evaluationDetails as {
    resumeFit: number;
    seniorityMatch: number;
    locationMatch: number;
    compensationMatch: number;
    keywordOverlap: number;
    strengths: string[];
    concerns: string[];
  } | null;

  return (
    <div className="max-w-4xl space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <h2 className="text-xl font-bold">{job.title}</h2>
            {job.grade && (
              <GradeBadge grade={job.grade as Grade} score={job.gradeScore ?? undefined} />
            )}
          </div>
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            {job.company && (
              <span className="flex items-center gap-1">
                <Building2 className="h-3.5 w-3.5" /> {job.company}
              </span>
            )}
            {job.location && (
              <span className="flex items-center gap-1">
                <MapPin className="h-3.5 w-3.5" /> {job.location}
              </span>
            )}
            {job.locationType && <Badge variant="outline">{job.locationType}</Badge>}
          </div>
          {job.salary && <p className="text-sm text-muted-foreground mt-1">{job.salary}</p>}
        </div>
        <div className="flex gap-2">
          {job.url && (
            <a href={job.url} target="_blank" rel="noopener noreferrer">
              <Button variant="outline" size="sm" className="gap-1">
                <ExternalLink className="h-3.5 w-3.5" /> Open
              </Button>
            </a>
          )}
          <Button size="sm" className="gap-1" onClick={handleCreateApp} disabled={isPending}>
            <Send className="h-3.5 w-3.5" /> Track Application
          </Button>
        </div>
      </div>

      <div className="flex gap-2">
        <Button onClick={handleEvaluate} disabled={evaluating} variant="outline" className="gap-2">
          <Brain className="h-4 w-4" />
          {evaluating ? "Evaluating..." : job.grade ? "Re-evaluate" : "AI Evaluate"}
        </Button>
        <Button variant="ghost" size="sm" onClick={handleArchive} disabled={isPending}>
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>

      <Tabs defaultValue="description">
        <TabsList>
          <TabsTrigger value="description">Description</TabsTrigger>
          <TabsTrigger value="evaluation">AI Evaluation</TabsTrigger>
          <TabsTrigger value="keywords">Keywords</TabsTrigger>
        </TabsList>

        <TabsContent value="description" className="mt-4">
          <Card>
            <CardContent className="pt-6">
              {job.description ? (
                <div className="whitespace-pre-wrap text-sm">{job.description}</div>
              ) : (
                <p className="text-sm text-muted-foreground">No description provided.</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="evaluation" className="mt-4">
          {!job.grade ? (
            <Card>
              <CardContent className="pt-6">
                <p className="text-sm text-muted-foreground">
                  Click &quot;AI Evaluate&quot; to get an assessment of this job.
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Summary</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm">{job.evaluationSummary}</p>
                </CardContent>
              </Card>

              {details && (
                <>
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base">Scores</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                        {[
                          { label: "Resume Fit", value: details.resumeFit },
                          { label: "Seniority", value: details.seniorityMatch },
                          { label: "Location", value: details.locationMatch },
                          { label: "Compensation", value: details.compensationMatch },
                          { label: "Keywords", value: details.keywordOverlap },
                        ].map((s) => (
                          <div key={s.label} className="text-center">
                            <div className="text-2xl font-bold font-mono">{s.value}</div>
                            <div className="text-xs text-muted-foreground">{s.label}</div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>

                  <div className="grid md:grid-cols-2 gap-4">
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-base text-emerald-400">Strengths</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <ul className="space-y-1 text-sm">
                          {details.strengths.map((s, i) => (
                            <li key={i}>+ {s}</li>
                          ))}
                        </ul>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-base text-red-400">Concerns</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <ul className="space-y-1 text-sm">
                          {details.concerns.map((c, i) => (
                            <li key={i}>- {c}</li>
                          ))}
                        </ul>
                      </CardContent>
                    </Card>
                  </div>
                </>
              )}
            </div>
          )}
        </TabsContent>

        <TabsContent value="keywords" className="mt-4">
          <Card>
            <CardContent className="pt-6">
              {(job.keywords as string[])?.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {(job.keywords as string[]).map((kw) => (
                    <Badge key={kw} variant="secondary">{kw}</Badge>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">
                  Keywords will appear after AI evaluation.
                </p>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
