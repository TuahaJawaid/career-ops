"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Download, Copy, Check } from "lucide-react";
import { toast } from "sonner";
import { getResume } from "@/lib/actions/resumes";

type Resume = Awaited<ReturnType<typeof getResume>>;

export default function ResumeDetailPage() {
  const params = useParams();
  const [resume, setResume] = useState<Resume | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    getResume(params.resumeId as string).then(setResume);
  }, [params.resumeId]);

  if (!resume) return null;

  function downloadAsPdf() {
    const content = resume!.content;
    const printWindow = window.open("", "_blank");
    if (!printWindow) {
      toast.error("Please allow popups to download PDF");
      return;
    }

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

    printWindow.document.write(`<!DOCTYPE html><html><head><title>${resume!.name}</title>
<style>
@page { margin: 0.4in 0.5in; size: letter; }
* { margin: 0; padding: 0; box-sizing: border-box; }
body { font-family: Calibri, Arial, sans-serif; font-size: 10px; line-height: 1.35; color: #000; }
.name { font-size: 16px; font-weight: 700; text-transform: uppercase; letter-spacing: 1px; text-align: center; margin-bottom: 1px; }
.contact { text-align: center; font-size: 9.5px; color: #333; margin-bottom: 6px; }
.summary { font-size: 9.5px; line-height: 1.4; margin-bottom: 4px; }
.section-head { font-size: 10.5px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.8px; border-bottom: 1.5px solid #000; padding-bottom: 1px; margin: 7px 0 4px; }
.job-title { font-size: 10px; font-weight: 700; margin-top: 4px; }
ul { margin: 1px 0 3px 14px; padding: 0; }
li { font-size: 9.5px; line-height: 1.35; margin: 1px 0; }
strong { font-weight: 700; }
</style></head><body>${htmlContent}</body></html>`);
    printWindow.document.close();
    setTimeout(() => { printWindow.print(); }, 500);
  }

  function copyContent() {
    navigator.clipboard.writeText(resume!.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    toast.success("Copied to clipboard");
  }

  return (
    <div className="max-w-3xl space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-xl font-bold">{resume.name}</h2>
          <div className="flex gap-2 mt-2">
            <Badge>{resume.isBase ? "Base" : "Tailored"}</Badge>
            {resume.matchScore && (
              <Badge variant="outline">Match: {resume.matchScore.toFixed(0)}%</Badge>
            )}
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" className="gap-1" onClick={downloadAsPdf}>
            <Download className="h-3.5 w-3.5" /> Download PDF
          </Button>
          <Button variant="outline" size="sm" className="gap-1" onClick={copyContent}>
            {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
            {copied ? "Copied" : "Copy"}
          </Button>
        </div>
      </div>

      {resume.tailoringNotes && (
        <Card className="glass shadow-card border-white/30">
          <CardHeader>
            <CardTitle className="text-base">Tailoring Notes</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm">{resume.tailoringNotes}</p>
          </CardContent>
        </Card>
      )}

      {(resume.keywordsAdded as string[])?.length > 0 && (
        <Card className="glass shadow-card border-white/30">
          <CardHeader>
            <CardTitle className="text-base">Keywords Added</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {(resume.keywordsAdded as string[]).map((kw) => (
                <Badge key={kw} variant="secondary">{kw}</Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <Card className="glass shadow-card border-white/30">
        <CardHeader>
          <CardTitle className="text-base">Content</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="whitespace-pre-wrap text-sm font-mono bg-muted/50 rounded-lg p-4">
            {resume.content}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
