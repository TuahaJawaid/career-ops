import Link from "next/link";
import { getApplications } from "@/lib/actions/applications";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Send } from "lucide-react";
import { EmptyState } from "@/components/shared/empty-state";
import { StatusBadge } from "@/components/shared/status-badge";
import { GradeBadge } from "@/components/shared/grade-badge";
import { type ApplicationStatus, type Grade } from "@/lib/constants";
import { formatDistanceToNow } from "date-fns";

export default async function ApplicationsPage() {
  const apps = await getApplications();

  if (apps.length === 0) {
    return (
      <EmptyState
        icon={Send}
        title="No applications yet"
        description="Start tracking your job applications by saving a job and creating an application."
      />
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">
          {apps.length} application{apps.length !== 1 ? "s" : ""}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Job</TableHead>
              <TableHead>Company</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Grade</TableHead>
              <TableHead>Added</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {apps.map((app) => (
              <TableRow key={app.id} className="cursor-pointer">
                <TableCell>
                  <Link href={`/applications/${app.id}`} className="font-medium hover:underline">
                    {app.jobTitle}
                  </Link>
                </TableCell>
                <TableCell className="text-muted-foreground">{app.company}</TableCell>
                <TableCell>
                  <StatusBadge status={app.status as ApplicationStatus} />
                </TableCell>
                <TableCell>
                  {app.grade && <GradeBadge grade={app.grade as Grade} size="sm" />}
                </TableCell>
                <TableCell className="text-muted-foreground text-xs font-mono">
                  {formatDistanceToNow(new Date(app.createdAt), { addSuffix: true })}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
