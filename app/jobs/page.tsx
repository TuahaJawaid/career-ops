import Link from "next/link";
import { getJobs } from "@/lib/actions/jobs";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Plus, Briefcase, MapPin, Building2 } from "lucide-react";
import { EmptyState } from "@/components/shared/empty-state";
import { GradeBadge } from "@/components/shared/grade-badge";
import { RemoveJobButton } from "@/components/jobs/remove-job-button";
import { type Grade } from "@/lib/constants";

export default async function JobsPage() {
  const allJobs = await getJobs();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          {allJobs.length} job{allJobs.length !== 1 ? "s" : ""} tracked
        </p>
        <Link href="/jobs/new">
          <Button className="gap-2">
            <Plus className="h-4 w-4" />
            Add Job
          </Button>
        </Link>
      </div>

      {allJobs.length === 0 ? (
        <EmptyState
          icon={Briefcase}
          title="No jobs yet"
          description="Start by adding a job listing to evaluate and track."
        >
          <Link href="/jobs/new">
            <Button>Add Your First Job</Button>
          </Link>
        </EmptyState>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {allJobs.map((job) => (
            <Link key={job.id} href={`/jobs/${job.id}`}>
              <Card className="group glass shadow-card border-white/30 hover:shadow-glass transition-all duration-200 cursor-pointer h-full">
                <CardContent className="pt-6 space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="font-semibold text-sm leading-tight line-clamp-2 flex-1">
                      {job.title}
                    </h3>
                    <div className="flex items-center gap-1 shrink-0">
                      {job.grade && (
                        <GradeBadge
                          grade={job.grade as Grade}
                          score={job.gradeScore ?? undefined}
                          size="sm"
                        />
                      )}
                      <RemoveJobButton jobId={job.id} />
                    </div>
                  </div>
                  {job.company && (
                    <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                      <Building2 className="h-3.5 w-3.5" />
                      {job.company}
                    </div>
                  )}
                  {job.location && (
                    <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                      <MapPin className="h-3.5 w-3.5" />
                      {job.location}
                      {job.locationType && (
                        <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                          {job.locationType}
                        </Badge>
                      )}
                    </div>
                  )}
                  {job.salary && (
                    <p className="text-xs text-muted-foreground">{job.salary}</p>
                  )}
                  <div className="flex items-center gap-2 flex-wrap">
                    {(job.keywords as string[])?.slice(0, 3).map((kw) => (
                      <Badge key={kw} variant="secondary" className="text-[10px]">
                        {kw}
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
