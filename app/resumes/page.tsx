"use client";

import { useEffect, useState, useTransition } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { FileText, Plus, Upload, Trash2, Paintbrush } from "lucide-react";
import { toast } from "sonner";
import { getResumes, createBaseResume, deleteResume } from "@/lib/actions/resumes";
import { EmptyState } from "@/components/shared/empty-state";
import Link from "next/link";

type Resume = Awaited<ReturnType<typeof getResumes>>[number];

export default function ResumesPage() {
  const [resumes, setResumes] = useState<Resume[]>([]);
  const [isPending, startTransition] = useTransition();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [name, setName] = useState("");
  const [content, setContent] = useState("");
  const [loaded, setLoaded] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const r = await getResumes();
        if (!mounted) return;
        setResumes(r);
      } catch {
        if (!mounted) return;
        setLoadError("Failed to load resumes.");
      } finally {
        if (mounted) setLoaded(true);
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  function handleUpload() {
    if (!name.trim() || !content.trim()) {
      toast.error("Name and content are required");
      return;
    }
    startTransition(async () => {
      await createBaseResume({ name: name.trim(), content: content.trim() });
      const updated = await getResumes();
      setResumes(updated);
      setDialogOpen(false);
      setName("");
      setContent("");
      toast.success("Resume uploaded");
    });
  }

  function handleDelete(id: string) {
    startTransition(async () => {
      await deleteResume(id);
      setResumes(resumes.filter((r) => r.id !== id));
      toast.success("Resume deleted");
    });
  }

  if (!loaded) return <div className="text-sm text-muted-foreground">Loading resumes...</div>;
  if (loadError) {
    return (
      <EmptyState
        icon={FileText}
        title="Could not load resumes"
        description={loadError}
      />
    );
  }

  const baseResumes = resumes.filter((r) => r.isBase);
  const tailoredResumes = resumes.filter((r) => !r.isBase);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          {baseResumes.length} base, {tailoredResumes.length} tailored
        </p>
        <div className="flex gap-2">
          <Link href="/resumes/builder">
            <Button className="gap-2">
              <Paintbrush className="h-4 w-4" />
              Resume Builder
            </Button>
          </Link>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger className="inline-flex items-center justify-center gap-2 rounded-md border border-input bg-background px-4 py-2 text-sm font-medium hover:bg-accent hover:text-accent-foreground">
              <Upload className="h-4 w-4" />
              Upload Text
            </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] flex flex-col">
            <DialogHeader>
              <DialogTitle>Upload Base Resume</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 overflow-y-auto flex-1 pr-2">
              <div className="space-y-2">
                <Label>Resume Name</Label>
                <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Main Resume 2024" />
              </div>
              <div className="space-y-2">
                <Label>Content (paste your resume text)</Label>
                <Textarea value={content} onChange={(e) => setContent(e.target.value)} placeholder="Paste your resume content here..." rows={15} />
              </div>
            </div>
            <div className="pt-4 border-t border-border">
              <Button onClick={handleUpload} disabled={isPending}>
                {isPending ? "Uploading..." : "Upload"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
        </div>
      </div>

      {resumes.length === 0 ? (
        <EmptyState
          icon={FileText}
          title="No resumes yet"
          description="Upload your base resume to start tailoring it for specific jobs."
        />
      ) : (
        <div className="space-y-6">
          {baseResumes.length > 0 && (
            <div>
              <h3 className="text-sm font-semibold mb-3 text-muted-foreground uppercase tracking-wide">Base Resumes</h3>
              <div className="grid gap-4 md:grid-cols-2">
                {baseResumes.map((r) => (
                  <Card key={r.id}>
                    <CardContent className="pt-6">
                      <div className="flex items-start justify-between">
                        <div>
                          <h4 className="font-semibold">{r.name}</h4>
                          <p className="text-xs text-muted-foreground mt-1">
                            {r.content.length} characters
                          </p>
                        </div>
                        <div className="flex gap-1">
                          <Link href={`/resumes/${r.id}`}>
                            <Button variant="ghost" size="icon"><FileText className="h-4 w-4" /></Button>
                          </Link>
                          <Button variant="ghost" size="icon" onClick={() => handleDelete(r.id)} disabled={isPending}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                      <Badge className="mt-2">Base</Badge>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {tailoredResumes.length > 0 && (
            <div>
              <h3 className="text-sm font-semibold mb-3 text-muted-foreground uppercase tracking-wide">Tailored Resumes</h3>
              <div className="grid gap-4 md:grid-cols-2">
                {tailoredResumes.map((r) => (
                  <Card key={r.id}>
                    <CardContent className="pt-6">
                      <div className="flex items-start justify-between">
                        <div>
                          <h4 className="font-semibold">{r.name}</h4>
                          {r.matchScore && (
                            <p className="text-xs text-muted-foreground mt-1">
                              Match: {r.matchScore.toFixed(0)}%
                            </p>
                          )}
                        </div>
                        <Link href={`/resumes/${r.id}`}>
                          <Button variant="ghost" size="icon"><FileText className="h-4 w-4" /></Button>
                        </Link>
                      </div>
                      <div className="flex gap-2 mt-2 flex-wrap">
                        <Badge variant="secondary">Tailored</Badge>
                        {(r.keywordsAdded as string[])?.slice(0, 3).map((kw) => (
                          <Badge key={kw} variant="outline" className="text-[10px]">{kw}</Badge>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
