"use client";

import { useTransition } from "react";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { deleteApplication } from "@/lib/actions/applications";
import { toast } from "sonner";

export function RemoveApplicationButton({ applicationId }: { applicationId: string }) {
  const [isPending, startTransition] = useTransition();

  function handleRemove() {
    startTransition(async () => {
      await deleteApplication(applicationId);
      toast.success("Application removed");
    });
  }

  return (
    <Button
      variant="ghost"
      size="icon"
      className="h-7 w-7 text-muted-foreground hover:text-destructive"
      onClick={handleRemove}
      disabled={isPending}
      title="Remove application"
    >
      <X className="h-3.5 w-3.5" />
    </Button>
  );
}
