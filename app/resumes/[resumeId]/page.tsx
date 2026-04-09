"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { getResume } from "@/lib/actions/resumes";

type Resume = Awaited<ReturnType<typeof getResume>>;

export default function ResumeDetailPage() {
  const params = useParams();
  const [resume, setResume] = useState<Resume | null>(null);

  useEffect(() => {
    getResume(params.resumeId as string).then(setResume);
  }, [params.resumeId]);

  if (!resume) return null;

  return (
    <div className="max-w-3xl space-y-6">
      <div>
        <h2 className="text-xl font-bold">{resume.name}</h2>
        <div className="flex gap-2 mt-2">
          <Badge>{resume.isBase ? "Base" : "Tailored"}</Badge>
          {resume.matchScore && (
            <Badge variant="outline">Match: {resume.matchScore.toFixed(0)}%</Badge>
          )}
        </div>
      </div>

      {resume.tailoringNotes && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Tailoring Notes</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm">{resume.tailoringNotes}</p>
          </CardContent>
        </Card>
      )}

      {(resume.keywordsAdded as string[])?.length > 0 && (
        <Card>
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

      <Card>
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
