"use client";

import { useTransition } from "react";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { archiveJob } from "@/lib/actions/jobs";
import { toast } from "sonner";

export function RemoveJobButton({ jobId }: { jobId: string }) {
  const [isPending, startTransition] = useTransition();

  function handleRemove(e: React.MouseEvent) {
    e.preventDefault(); // Prevent navigating to job detail via parent Link
    e.stopPropagation();
    startTransition(async () => {
      await archiveJob(jobId);
      toast.success("Job removed");
    });
  }

  return (
    <Button
      variant="ghost"
      size="icon"
      className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-destructive"
      onClick={handleRemove}
      disabled={isPending}
      title="Remove job"
    >
      <X className="h-3.5 w-3.5" />
    </Button>
  );
}
