"use client";

import { useEffect, useState, useTransition, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Brain,
  FileText,
  ExternalLink,
  Send,
  Trash2,
  MapPin,
  Building2,
  Sparkles,
  Copy,
  Check,
  Download,
} from "lucide-react";
import { toast } from "sonner";
import { getJob, archiveJob } from "@/lib/actions/jobs";
import { createApplication } from "@/lib/actions/applications";
import { getBaseResumes } from "@/lib/actions/resumes";
import { saveTailoredResume } from "@/lib/actions/resumes";
import { GradeBadge } from "@/components/shared/grade-badge";
import { type Grade } from "@/lib/constants";

type Job = Awaited<ReturnType<typeof getJob>>;
type Resume = Awaited<ReturnType<typeof getBaseResumes>>[number];

export default function JobDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [job, setJob] = useState<Job | null>(null);
  const [isPending, startTransition] = useTransition();
  const [evaluating, setEvaluating] = useState(false);

  // Tailoring state
  const [baseResumes, setBaseResumes] = useState<Resume[]>([]);
  const [selectedResumeId, setSelectedResumeId] = useState<string>("");
  const [tailoring, setTailoring] = useState(false);
  const [tailoredContent, setTailoredContent] = useState("");
  const [resumeSection, setResumeSection] = useState("");
  const [coverLetterSection, setCoverLetterSection] = useState("");
  const [notesSection, setNotesSection] = useState("");
  const [copiedResume, setCopiedResume] = useState(false);
  const [copiedCover, setCopiedCover] = useState(false);

  useEffect(() => {
    const id = params.jobId as string;
    getJob(id).then(setJob);
    getBaseResumes().then((resumes) => {
      setBaseResumes(resumes);
      if (resumes.length > 0) setSelectedResumeId(resumes[0].id);
    });
  }, [params.jobId]);

  // Parse sections from streamed content
  const parseSections = useCallback((content: string) => {
    const resumeMatch = content.match(/---RESUME---([\s\S]*?)(?=---COVER LETTER---|$)/);
    const coverMatch = content.match(/---COVER LETTER---([\s\S]*?)(?=---TAILORING NOTES---|$)/);
    const notesMatch = content.match(/---TAILORING NOTES---([\s\S]*?)$/);

    setResumeSection((resumeMatch?.[1] ?? content).trim());
    setCoverLetterSection((coverMatch?.[1] ?? "").trim());
    setNotesSection((notesMatch?.[1] ?? "").trim());
  }, []);

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

  async function handleTailor() {
    if (!selectedResumeId) {
      toast.error("Please upload a base resume first (go to Resumes tab)");
      return;
    }
    setTailoring(true);
    setTailoredContent("");
    setResumeSection("");
    setCoverLetterSection("");
    setNotesSection("");

    try {
      const res = await fetch("/api/ai/tailor", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ jobId: job!.id, baseResumeId: selectedResumeId }),
      });

      if (!res.ok) {
        toast.error("Tailoring failed");
        setTailoring(false);
        return;
      }

      const reader = res.body?.getReader();
      const decoder = new TextDecoder();
      let full = "";

      if (reader) {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          const chunk = decoder.decode(value, { stream: true });
          full += chunk;
          setTailoredContent(full);
          parseSections(full);
        }
      }

      // Save the tailored resume
      await saveTailoredResume({
        name: `Tailored for ${job!.title} at ${job!.company ?? "Company"}`,
        content: full,
        jobId: job!.id,
        tailoringNotes: notesSection || undefined,
        keywordsAdded: (job!.keywords as string[]) ?? [],
      });

      toast.success("Resume tailored & saved");
    } catch {
      toast.error("Tailoring failed");
    } finally {
      setTailoring(false);
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

  function downloadAsPdf(content: string, title: string) {
    // Convert markdown-style content to basic HTML for professional PDF
    const htmlContent = content
      .replace(/^### (.+)$/gm, '<h3 style="margin:16px 0 8px;font-size:14px;font-weight:700;text-transform:uppercase;letter-spacing:1px;color:#2c3e50;border-bottom:2px solid #4F7DF3;padding-bottom:4px;">$1</h3>')
      .replace(/^## (.+)$/gm, '<h2 style="margin:20px 0 8px;font-size:16px;font-weight:700;color:#1a1a2e;">$1</h2>')
      .replace(/^# (.+)$/gm, '<h1 style="margin:0 0 4px;font-size:22px;font-weight:700;color:#1a1a2e;">$1</h1>')
      .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.+?)\*/g, '<em>$1</em>')
      .replace(/^[-•] (.+)$/gm, '<li style="margin:3px 0;padding-left:4px;">$1</li>')
      .replace(/(<li.*<\/li>\n?)+/g, '<ul style="margin:4px 0 12px 16px;padding:0;list-style-type:disc;">$&</ul>')
      .replace(/\n\n/g, '<br/>')
      .replace(/\n/g, '<br/>');

    const printWindow = window.open("", "_blank");
    if (!printWindow) {
      toast.error("Please allow popups to download PDF");
      return;
    }

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>${title}</title>
        <style>
          @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
          @page { margin: 0.6in 0.7in; size: letter; }
          body {
            font-family: 'Inter', -apple-system, sans-serif;
            font-size: 11px;
            line-height: 1.5;
            color: #2c2c2c;
            max-width: 100%;
            margin: 0;
            padding: 0;
          }
          h1 { font-size: 22px; margin: 0 0 2px; color: #1a1a2e; }
          h2 { font-size: 15px; margin: 18px 0 6px; color: #1a1a2e; border-bottom: 1.5px solid #4F7DF3; padding-bottom: 3px; text-transform: uppercase; letter-spacing: 0.5px; }
          h3 { font-size: 13px; margin: 14px 0 4px; color: #2c3e50; }
          ul { margin: 4px 0 10px 16px; padding: 0; }
          li { margin: 2px 0; }
          strong { font-weight: 600; }
          p { margin: 6px 0; }
          a { color: #4F7DF3; text-decoration: none; }
        </style>
      </head>
      <body>${htmlContent}</body>
      </html>
    `);
    printWindow.document.close();
    setTimeout(() => {
      printWindow.print();
    }, 500);
  }

  function copyToClipboard(text: string, type: "resume" | "cover") {
    navigator.clipboard.writeText(text);
    if (type === "resume") {
      setCopiedResume(true);
      setTimeout(() => setCopiedResume(false), 2000);
    } else {
      setCopiedCover(true);
      setTimeout(() => setCopiedCover(false), 2000);
    }
    toast.success("Copied to clipboard");
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

      <div className="flex gap-2 flex-wrap">
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
          <TabsTrigger value="tailor" className="gap-1">
            <Sparkles className="h-3.5 w-3.5" /> Tailor Resume
          </TabsTrigger>
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

        <TabsContent value="tailor" className="mt-4 space-y-4">
          {/* Resume selector + generate button */}
          <Card>
            <CardContent className="pt-6 space-y-4">
              {baseResumes.length === 0 ? (
                <div className="text-center py-4">
                  <p className="text-sm text-muted-foreground mb-3">
                    Upload a base resume first to generate tailored versions.
                  </p>
                  <Button variant="outline" onClick={() => router.push("/resumes")}>
                    Go to Resumes
                  </Button>
                </div>
              ) : (
                <>
                  <div className="flex gap-3 items-end">
                    <div className="flex-1 space-y-1.5">
                      <label className="text-sm font-medium">Base Resume</label>
                      <Select
                        value={selectedResumeId}
                        onValueChange={(v) => setSelectedResumeId(v ?? "")}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select a resume" />
                        </SelectTrigger>
                        <SelectContent>
                          {baseResumes.map((r) => (
                            <SelectItem key={r.id} value={r.id}>
                              {r.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <Button
                      onClick={handleTailor}
                      disabled={tailoring || !selectedResumeId}
                      className="gap-2"
                    >
                      <Sparkles className="h-4 w-4" />
                      {tailoring ? "Generating..." : "Generate Resume & Cover Letter"}
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    AI will create a tailored resume optimized for ATS + a personalized cover letter for this role.
                  </p>
                </>
              )}
            </CardContent>
          </Card>

          {/* Tailored Resume Output */}
          {(resumeSection || tailoring) && (
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base flex items-center gap-2">
                    <FileText className="h-4 w-4" />
                    Tailored Resume
                  </CardTitle>
                  {resumeSection && !tailoring && (
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        className="gap-1"
                        onClick={() => downloadAsPdf(
                          resumeSection,
                          `Resume - ${job!.title} at ${job!.company ?? "Company"}`
                        )}
                      >
                        <Download className="h-3.5 w-3.5" /> Download PDF
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="gap-1"
                        onClick={() => copyToClipboard(resumeSection, "resume")}
                      >
                        {copiedResume ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                        {copiedResume ? "Copied" : "Copy"}
                      </Button>
                    </div>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                <div className="whitespace-pre-wrap text-sm font-mono bg-muted/50 rounded-lg p-4 max-h-[500px] overflow-y-auto">
                  {resumeSection || (tailoring ? "Generating tailored resume..." : "")}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Cover Letter Output */}
          {(coverLetterSection || (tailoring && resumeSection)) && (
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base flex items-center gap-2">
                    <FileText className="h-4 w-4" />
                    Cover Letter
                  </CardTitle>
                  {coverLetterSection && !tailoring && (
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        className="gap-1"
                        onClick={() => downloadAsPdf(
                          coverLetterSection,
                          `Cover Letter - ${job!.title} at ${job!.company ?? "Company"}`
                        )}
                      >
                        <Download className="h-3.5 w-3.5" /> Download PDF
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="gap-1"
                        onClick={() => copyToClipboard(coverLetterSection, "cover")}
                      >
                        {copiedCover ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                        {copiedCover ? "Copied" : "Copy"}
                      </Button>
                    </div>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                <div className="whitespace-pre-wrap text-sm bg-muted/50 rounded-lg p-4 max-h-[400px] overflow-y-auto">
                  {coverLetterSection || (tailoring ? "Generating cover letter..." : "")}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Tailoring Notes */}
          {notesSection && !tailoring && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Tailoring Notes</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="whitespace-pre-wrap text-sm text-muted-foreground">
                  {notesSection}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
