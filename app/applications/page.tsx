"use client";

import { useEffect, useState, useTransition } from "react";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Send, Building2, GripVertical, ExternalLink, X } from "lucide-react";
import { toast } from "sonner";
import { EmptyState } from "@/components/shared/empty-state";
import { GradeBadge } from "@/components/shared/grade-badge";
import {
  getApplications,
  updateApplicationStatus,
  deleteApplication,
} from "@/lib/actions/applications";
import {
  APPLICATION_STATUSES,
  STATUS_LABELS,
  type ApplicationStatus,
  type Grade,
} from "@/lib/constants";

type Application = Awaited<ReturnType<typeof getApplications>>[number];

// Kanban columns — group some statuses together for cleaner board
const KANBAN_COLUMNS: { status: ApplicationStatus; label: string; color: string }[] = [
  { status: "saved", label: "Saved", color: "bg-slate-400" },
  { status: "applied", label: "Applied", color: "bg-blue-500" },
  { status: "screening", label: "Screening", color: "bg-amber-500" },
  { status: "interview", label: "Interview", color: "bg-purple-500" },
  { status: "technical", label: "Technical", color: "bg-indigo-500" },
  { status: "offer", label: "Offer", color: "bg-emerald-500" },
  { status: "accepted", label: "Accepted", color: "bg-green-500" },
  { status: "rejected", label: "Rejected", color: "bg-red-400" },
  { status: "withdrawn", label: "Withdrawn", color: "bg-gray-400" },
];

export default function ApplicationsPage() {
  const [apps, setApps] = useState<Application[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [draggedApp, setDraggedApp] = useState<string | null>(null);
  const [dragOverColumn, setDragOverColumn] = useState<string | null>(null);

  useEffect(() => {
    getApplications().then((a) => {
      setApps(a);
      setLoaded(true);
    });
  }, []);

  function handleDragStart(e: React.DragEvent, appId: string) {
    setDraggedApp(appId);
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("text/plain", appId);
  }

  function handleDragOver(e: React.DragEvent, status: string) {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    setDragOverColumn(status);
  }

  function handleDragLeave() {
    setDragOverColumn(null);
  }

  function handleDrop(e: React.DragEvent, newStatus: ApplicationStatus) {
    e.preventDefault();
    setDragOverColumn(null);
    const appId = e.dataTransfer.getData("text/plain");
    if (!appId) return;

    const app = apps.find((a) => a.id === appId);
    if (!app || app.status === newStatus) {
      setDraggedApp(null);
      return;
    }

    // Optimistic update
    setApps((prev) =>
      prev.map((a) => (a.id === appId ? { ...a, status: newStatus } : a))
    );
    setDraggedApp(null);

    startTransition(async () => {
      await updateApplicationStatus(appId, newStatus);
      toast.success(`Moved to ${STATUS_LABELS[newStatus]}`);
    });
  }

  function handleRemove(appId: string) {
    setApps((prev) => prev.filter((a) => a.id !== appId));
    startTransition(async () => {
      await deleteApplication(appId);
      toast.success("Application removed");
    });
  }

  if (!loaded) return null;

  if (apps.length === 0) {
    return (
      <EmptyState
        icon={Send}
        title="No applications yet"
        description="Start tracking your job applications by saving a job and creating an application."
      />
    );
  }

  // Only show columns that have apps or are adjacent to columns with apps
  const activeStatuses = new Set(apps.map((a) => a.status));
  const columnsToShow = KANBAN_COLUMNS.filter((col) => {
    // Always show columns that have apps
    if (activeStatuses.has(col.status)) return true;
    // Show "next stage" columns for progression
    const idx = KANBAN_COLUMNS.findIndex((c) => c.status === col.status);
    if (idx > 0 && activeStatuses.has(KANBAN_COLUMNS[idx - 1].status)) return true;
    // Always show saved, applied, interview, offer
    if (["saved", "applied", "interview", "offer"].includes(col.status)) return true;
    return false;
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          {apps.length} application{apps.length !== 1 ? "s" : ""} — drag cards to change status
        </p>
      </div>

      <div className="flex gap-3 overflow-x-auto pb-4">
        {columnsToShow.map((column) => {
          const columnApps = apps.filter((a) => a.status === column.status);
          const isDragOver = dragOverColumn === column.status;

          return (
            <div
              key={column.status}
              className="flex-shrink-0 w-64"
              onDragOver={(e) => handleDragOver(e, column.status)}
              onDragLeave={handleDragLeave}
              onDrop={(e) => handleDrop(e, column.status)}
            >
              {/* Column header */}
              <div className="flex items-center gap-2 mb-3 px-1">
                <div className={`w-2.5 h-2.5 rounded-full ${column.color}`} />
                <span className="text-sm font-semibold">{column.label}</span>
                <Badge variant="secondary" className="text-[10px] ml-auto">
                  {columnApps.length}
                </Badge>
              </div>

              {/* Drop zone */}
              <div
                className={`min-h-[200px] rounded-xl p-2 space-y-2 transition-all duration-200 ${
                  isDragOver
                    ? "bg-blue-50 border-2 border-dashed border-blue-300"
                    : "bg-white/30 border border-white/20"
                }`}
              >
                {columnApps.map((app) => (
                  <div
                    key={app.id}
                    draggable
                    onDragStart={(e) => handleDragStart(e, app.id)}
                    onDragEnd={() => setDraggedApp(null)}
                    className={`group glass shadow-card border-white/30 rounded-lg p-3 cursor-grab active:cursor-grabbing transition-all duration-150 ${
                      draggedApp === app.id ? "opacity-40 scale-95" : "hover:shadow-glass"
                    }`}
                  >
                    <div className="flex items-start gap-2">
                      <GripVertical className="h-4 w-4 text-muted-foreground/40 mt-0.5 shrink-0" />
                      <div className="flex-1 min-w-0">
                        <Link
                          href={`/applications/${app.id}`}
                          className="text-sm font-medium hover:underline line-clamp-2 block"
                        >
                          {app.jobTitle}
                        </Link>
                        {app.company && (
                          <div className="flex items-center gap-1 mt-1 text-xs text-muted-foreground">
                            <Building2 className="h-3 w-3" />
                            <span className="truncate">{app.company}</span>
                          </div>
                        )}
                        <div className="flex items-center gap-1.5 mt-2">
                          {app.grade && (
                            <GradeBadge grade={app.grade as Grade} size="sm" />
                          )}
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6 opacity-0 group-hover:opacity-100 shrink-0"
                        onClick={() => handleRemove(app.id)}
                        disabled={isPending}
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                ))}

                {columnApps.length === 0 && (
                  <div className="flex items-center justify-center h-20 text-xs text-muted-foreground/50">
                    Drop here
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
