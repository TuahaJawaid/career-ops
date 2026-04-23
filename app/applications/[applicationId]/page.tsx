"use client";

import { useEffect, useState, useTransition } from "react";
import { useParams } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ExternalLink, Building2, MapPin } from "lucide-react";
import { toast } from "sonner";
import {
  getApplication,
  getApplicationEvents,
  updateApplicationStatus,
  updateApplicationNotes,
} from "@/lib/actions/applications";
import {
  getLatestQualityCheck,
  runApplicationQualityCheck,
} from "@/lib/actions/quality-checks";
import {
  generateInterviewPrepPack,
  getLatestInterviewPrepPack,
} from "@/lib/actions/interview-prep";
import { StatusBadge } from "@/components/shared/status-badge";
import { GradeBadge } from "@/components/shared/grade-badge";
import { APPLICATION_STATUSES, STATUS_LABELS, type ApplicationStatus, type Grade } from "@/lib/constants";
import { formatDistanceToNow } from "date-fns";

type Application = Awaited<ReturnType<typeof getApplication>>;
type Event = Awaited<ReturnType<typeof getApplicationEvents>>[number];

export default function ApplicationDetailPage() {
  const params = useParams();
  const [app, setApp] = useState<Application | null>(null);
  const [events, setEvents] = useState<Event[]>([]);
  const [notes, setNotes] = useState("");
  const [isPending, startTransition] = useTransition();
  const [qualityCheck, setQualityCheck] = useState<
    Awaited<ReturnType<typeof getLatestQualityCheck>> | null
  >(null);
  const [prepPack, setPrepPack] = useState<
    Awaited<ReturnType<typeof getLatestInterviewPrepPack>> | null
  >(null);

  useEffect(() => {
    const id = params.applicationId as string;
    getApplication(id).then((a) => {
      setApp(a);
      setNotes(a?.notes ?? "");
    });
    getApplicationEvents(id).then(setEvents);
    getLatestQualityCheck(id).then(setQualityCheck).catch(() => setQualityCheck(null));
    getLatestInterviewPrepPack(id).then(setPrepPack).catch(() => setPrepPack(null));
  }, [params.applicationId]);

  if (!app) return null;

  function handleStatusChange(newStatus: string | null) {
    if (!newStatus) return;
    startTransition(async () => {
      await updateApplicationStatus(app!.id, newStatus);
      const updated = await getApplication(app!.id);
      setApp(updated);
      const updatedEvents = await getApplicationEvents(app!.id);
      setEvents(updatedEvents);
      toast.success(`Status updated to ${STATUS_LABELS[newStatus as ApplicationStatus]}`);
    });
  }

  function handleSaveNotes() {
    startTransition(async () => {
      await updateApplicationNotes(app!.id, { notes });
      toast.success("Notes saved");
    });
  }

  function handleRunQualityCheck() {
    startTransition(async () => {
      try {
        const result = await runApplicationQualityCheck(app!.id);
        setQualityCheck(result);
        toast.success(`Checklist score: ${result.score}`);
      } catch {
        toast.error("Checklist is temporarily unavailable.");
      }
    });
  }

  function handleGeneratePrepPack() {
    startTransition(async () => {
      try {
        const result = await generateInterviewPrepPack(app!.id);
        setPrepPack(result);
        toast.success("Interview prep pack generated");
      } catch {
        toast.error("Interview prep is temporarily unavailable.");
      }
    });
  }

  return (
    <div className="max-w-3xl space-y-6">
      <div>
        <div className="flex items-center gap-3 mb-1">
          <h2 className="text-xl font-bold">{app.jobTitle}</h2>
          {app.grade && <GradeBadge grade={app.grade as Grade} size="sm" />}
        </div>
        <div className="flex items-center gap-4 text-sm text-muted-foreground">
          {app.company && (
            <span className="flex items-center gap-1">
              <Building2 className="h-3.5 w-3.5" /> {app.company}
            </span>
          )}
          {app.location && (
            <span className="flex items-center gap-1">
              <MapPin className="h-3.5 w-3.5" /> {app.location}
            </span>
          )}
          {app.url && (
            <a href={app.url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 hover:underline">
              <ExternalLink className="h-3.5 w-3.5" /> View listing
            </a>
          )}
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Status</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-4">
            <StatusBadge status={app.status as ApplicationStatus} />
            <Select value={app.status} onValueChange={handleStatusChange} disabled={isPending}>
              <SelectTrigger className="w-48">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {APPLICATION_STATUSES.map((s) => (
                  <SelectItem key={s} value={s}>
                    {STATUS_LABELS[s]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Notes</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <Textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Add notes about this application..."
            rows={4}
          />
          <Button size="sm" onClick={handleSaveNotes} disabled={isPending}>
            Save Notes
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Timeline</CardTitle>
        </CardHeader>
        <CardContent>
          {events.length === 0 ? (
            <p className="text-sm text-muted-foreground">No events yet.</p>
          ) : (
            <div className="space-y-3">
              {events.map((event) => (
                <div key={event.id} className="flex items-center gap-3 text-sm">
                  <div className="w-2 h-2 rounded-full bg-primary shrink-0" />
                  <div className="flex-1">
                    <span className="font-medium">
                      {event.fromStatus
                        ? `${STATUS_LABELS[event.fromStatus as ApplicationStatus]} → ${STATUS_LABELS[event.toStatus as ApplicationStatus]}`
                        : STATUS_LABELS[event.toStatus as ApplicationStatus]}
                    </span>
                    {event.note && (
                      <span className="text-muted-foreground ml-2">{event.note}</span>
                    )}
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

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Application Quality Checklist</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <Button size="sm" onClick={handleRunQualityCheck} disabled={isPending}>
            Run Checklist
          </Button>
          {qualityCheck ? (
            <div className="space-y-2">
              <p className="text-sm font-medium">
                Score {qualityCheck.score} · Status {qualityCheck.status}
              </p>
              {(qualityCheck.criteria ?? []).map((item) => (
                <div key={item.id} className="rounded-md border p-2 text-sm">
                  <p className="font-medium">
                    {item.passed ? "PASS" : "WARN"} — {item.label}
                  </p>
                  {item.note && (
                    <p className="text-xs text-muted-foreground">{item.note}</p>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">
              Run checklist to assess submission readiness.
            </p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Interview Prep Pack</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <Button size="sm" onClick={handleGeneratePrepPack} disabled={isPending}>
            Generate Prep Pack
          </Button>
          {prepPack ? (
            <div className="space-y-3">
              {prepPack.summary && (
                <p className="text-sm whitespace-pre-wrap">{prepPack.summary}</p>
              )}
              <div>
                <p className="text-sm font-medium">Likely Questions</p>
                <ul className="list-disc pl-5 text-sm">
                  {(prepPack.likelyQuestions ?? []).map((q, idx) => (
                    <li key={idx}>{q}</li>
                  ))}
                </ul>
              </div>
              <div>
                <p className="text-sm font-medium">STAR Prompts</p>
                <ul className="list-disc pl-5 text-sm">
                  {(prepPack.starPrompts ?? []).map((q, idx) => (
                    <li key={idx}>{q}</li>
                  ))}
                </ul>
              </div>
              <div>
                <p className="text-sm font-medium">Accounting Scenarios</p>
                <ul className="list-disc pl-5 text-sm">
                  {(prepPack.accountingScenarios ?? []).map((q, idx) => (
                    <li key={idx}>{q}</li>
                  ))}
                </ul>
              </div>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">
              Generate a role-specific interview prep pack.
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
