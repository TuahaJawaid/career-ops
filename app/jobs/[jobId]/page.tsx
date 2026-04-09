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
  Target,
  DollarSign,
} from "lucide-react";
import { toast } from "sonner";
import { getJob, archiveJob } from "@/lib/actions/jobs";
import { createApplication } from "@/lib/actions/applications";
import { getBaseResumes, getTailoredResumesForJob, saveTailoredResume } from "@/lib/actions/resumes";
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

  // Match score + salary state
  const [matchData, setMatchData] = useState<{ matchScore: number; presentKeywords: string[]; missingKeywords: string[]; suggestions: string[]; summary: string } | null>(null);
  const [salaryData, setSalaryData] = useState<{ estimatedMin: number; estimatedMax: number; currency: string; confidence: string; marketMedian: number; notes: string; factors: string[] } | null>(null);
  const [loadingMatch, setLoadingMatch] = useState(false);
  const [loadingSalary, setLoadingSalary] = useState(false);

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

  // Parse sections from streamed content
  const parseSections = useCallback((content: string) => {
    const resumeMatch = content.match(/---RESUME---([\s\S]*?)(?=---COVER LETTER---|$)/);
    const coverMatch = content.match(/---COVER LETTER---([\s\S]*?)(?=---TAILORING NOTES---|$)/);
    const notesMatch = content.match(/---TAILORING NOTES---([\s\S]*?)$/);

    setResumeSection((resumeMatch?.[1] ?? content).trim());
    setCoverLetterSection((coverMatch?.[1] ?? "").trim());
    setNotesSection((notesMatch?.[1] ?? "").trim());
  }, []);

  useEffect(() => {
    const id = params.jobId as string;
    getJob(id).then(setJob);
    getBaseResumes().then((resumes) => {
      setBaseResumes(resumes);
      if (resumes.length > 0) setSelectedResumeId(resumes[0].id);
    });
    // Load existing tailored resume for this job
    getTailoredResumesForJob(id).then((tailored) => {
      if (tailored.length > 0) {
        const latest = tailored[0];
        setTailoredContent(latest.content);
        parseSections(latest.content);
      }
    });
  }, [params.jobId, parseSections]);

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

  async function handleMatchScore() {
    setLoadingMatch(true);
    try {
      const res = await fetch("/api/ai/match", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ jobId: job!.id }),
      });
      if (res.ok) {
        const data = await res.json();
        setMatchData(data.match);
        toast.success("Match score calculated");
      } else {
        toast.error("Match analysis failed");
      }
    } catch {
      toast.error("Match analysis failed");
    } finally {
      setLoadingMatch(false);
    }
  }

  async function handleSalaryEstimate() {
    setLoadingSalary(true);
    try {
      const res = await fetch("/api/ai/salary", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ jobId: job!.id }),
      });
      if (res.ok) {
        const data = await res.json();
        setSalaryData(data.salary);
        toast.success("Salary estimated");
      } else {
        toast.error("Salary estimation failed");
      }
    } catch {
      toast.error("Salary estimation failed");
    } finally {
      setLoadingSalary(false);
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

  function downloadAsPdf(content: string, title: string, type: "resume" | "cover" = "resume") {
    const printWindow = window.open("", "_blank");
    if (!printWindow) {
      toast.error("Please allow popups to download PDF");
      return;
    }

    if (type === "resume") {
      // Match Aimun's exact resume template — single page, compact, professional
      const htmlContent = content
        .replace(/^### (.+)$/gm, '<div class="section-head">$1</div>')
        .replace(/^## (.+)$/gm, '<div class="section-head">$1</div>')
        .replace(/^# (.+)$/gm, '<div class="name">$1</div>')
        .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
        .replace(/\*(.+?)\*/g, '<em>$1</em>')
        .replace(/^[-•] (.+)$/gm, '<li>$1</li>')
        .replace(/(<li>.*<\/li>\n?)+/g, '<ul>$&</ul>')
        .replace(/\n\n/g, '<br/>')
        .replace(/\n/g, ' ');

      printWindow.document.write(`<!DOCTYPE html><html><head><title>${title}</title>
<style>
@import url('https://fonts.googleapis.com/css2?family=Calibri:wght@400;700&family=Arial:wght@400;700&display=swap');
@page { margin: 0.4in 0.5in; size: letter; }
* { margin: 0; padding: 0; box-sizing: border-box; }
body { font-family: Calibri, Arial, sans-serif; font-size: 10px; line-height: 1.35; color: #000; }
.name { font-size: 16px; font-weight: 700; text-transform: uppercase; letter-spacing: 1px; text-align: center; margin-bottom: 1px; }
.contact { text-align: center; font-size: 9.5px; color: #333; margin-bottom: 6px; }
.contact a { color: #333; text-decoration: none; }
.summary { font-size: 9.5px; line-height: 1.4; margin-bottom: 4px; }
.skills-grid { display: flex; flex-wrap: wrap; gap: 0; margin-bottom: 2px; }
.skills-grid span { width: 33.33%; font-size: 9px; padding: 1px 0; }
.skills-grid span::before { content: "• "; }
.section-head { font-size: 10.5px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.8px; border-bottom: 1.5px solid #000; padding-bottom: 1px; margin: 7px 0 4px; }
.job-title { font-size: 10px; font-weight: 700; margin-top: 4px; }
.job-meta { font-size: 9px; color: #444; margin-bottom: 2px; }
ul { margin: 1px 0 3px 14px; padding: 0; }
li { font-size: 9.5px; line-height: 1.35; margin: 1px 0; }
strong { font-weight: 700; }
.edu { font-size: 9.5px; margin: 2px 0; }
</style></head><body>${htmlContent}</body></html>`);
    } else {
      // Cover letter — clean, professional letter format
      const htmlContent = content
        .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
        .replace(/\n\n/g, '</p><p>')
        .replace(/\n/g, '<br/>');

      printWindow.document.write(`<!DOCTYPE html><html><head><title>${title}</title>
<style>
@import url('https://fonts.googleapis.com/css2?family=Calibri:wght@400;700&display=swap');
@page { margin: 1in; size: letter; }
body { font-family: Calibri, Arial, sans-serif; font-size: 11px; line-height: 1.6; color: #1a1a1a; }
p { margin: 0 0 10px; }
strong { font-weight: 700; }
</style></head><body><p>${htmlContent}</p></body></html>`);
    }

    printWindow.document.close();
    setTimeout(() => { printWindow.print(); }, 500);
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
          <TabsTrigger value="match">Match Score</TabsTrigger>
          <TabsTrigger value="salary">Salary</TabsTrigger>
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
                          `Resume - ${job!.title} at ${job!.company ?? "Company"}`,
                          "resume"
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
                          `Cover Letter - ${job!.title} at ${job!.company ?? "Company"}`,
                          "cover"
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

        {/* Match Score Tab */}
        <TabsContent value="match" className="mt-4 space-y-4">
          <Card className="glass shadow-card border-white/30">
            <CardContent className="pt-6">
              {!matchData ? (
                <div className="text-center py-6">
                  <p className="text-sm text-muted-foreground mb-4">
                    Compare your resume against this job to see how well you match.
                  </p>
                  <Button onClick={handleMatchScore} disabled={loadingMatch} className="gap-2">
                    <Target className="h-4 w-4" />
                    {loadingMatch ? "Analyzing..." : "Calculate Match Score"}
                  </Button>
                </div>
              ) : (
                <div className="space-y-6">
                  {/* Score display */}
                  <div className="text-center">
                    <div className={`text-5xl font-bold ${matchData.matchScore >= 75 ? "text-emerald-600" : matchData.matchScore >= 50 ? "text-amber-600" : "text-red-500"}`}>
                      {matchData.matchScore}%
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">Resume Match Score</p>
                    <p className="text-sm mt-2">{matchData.summary}</p>
                  </div>

                  {/* Keywords */}
                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm font-medium text-emerald-600 mb-2">Present Keywords ({matchData.presentKeywords.length})</p>
                      <div className="flex flex-wrap gap-1.5">
                        {matchData.presentKeywords.map((kw) => (
                          <Badge key={kw} className="bg-emerald-50 text-emerald-700 border-emerald-200 text-[10px]">{kw}</Badge>
                        ))}
                      </div>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-red-500 mb-2">Missing Keywords ({matchData.missingKeywords.length})</p>
                      <div className="flex flex-wrap gap-1.5">
                        {matchData.missingKeywords.map((kw) => (
                          <Badge key={kw} className="bg-red-50 text-red-600 border-red-200 text-[10px]">{kw}</Badge>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Suggestions */}
                  {matchData.suggestions.length > 0 && (
                    <div>
                      <p className="text-sm font-medium mb-2">Suggestions to Improve</p>
                      <ul className="space-y-1.5 text-sm text-muted-foreground">
                        {matchData.suggestions.map((s, i) => (
                          <li key={i} className="flex items-start gap-2">
                            <span className="text-primary mt-0.5">+</span> {s}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  <Button variant="outline" size="sm" onClick={handleMatchScore} disabled={loadingMatch}>
                    {loadingMatch ? "Recalculating..." : "Recalculate"}
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Salary Tab */}
        <TabsContent value="salary" className="mt-4 space-y-4">
          <Card className="glass shadow-card border-white/30">
            <CardContent className="pt-6">
              {!salaryData ? (
                <div className="text-center py-6">
                  <p className="text-sm text-muted-foreground mb-4">
                    Get an AI-estimated salary range for this role based on title, location, and market data.
                  </p>
                  <Button onClick={handleSalaryEstimate} disabled={loadingSalary} className="gap-2">
                    <DollarSign className="h-4 w-4" />
                    {loadingSalary ? "Estimating..." : "Estimate Salary"}
                  </Button>
                </div>
              ) : (
                <div className="space-y-6">
                  <div className="text-center">
                    <p className="text-sm text-muted-foreground">Estimated Range</p>
                    <div className="text-3xl font-bold mt-1">
                      {salaryData.currency} {salaryData.estimatedMin.toLocaleString()} - {salaryData.estimatedMax.toLocaleString()}
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">
                      Market median: {salaryData.currency} {salaryData.marketMedian.toLocaleString()}
                    </p>
                    <Badge variant="outline" className="mt-2">
                      Confidence: {salaryData.confidence}
                    </Badge>
                  </div>

                  <p className="text-sm text-muted-foreground">{salaryData.notes}</p>

                  {salaryData.factors.length > 0 && (
                    <div>
                      <p className="text-sm font-medium mb-2">Factors</p>
                      <div className="flex flex-wrap gap-2">
                        {salaryData.factors.map((f, i) => (
                          <Badge key={i} variant="secondary" className="text-xs">{f}</Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  <Button variant="outline" size="sm" onClick={handleSalaryEstimate} disabled={loadingSalary}>
                    {loadingSalary ? "Re-estimating..." : "Re-estimate"}
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
