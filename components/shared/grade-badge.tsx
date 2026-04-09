import { cn } from "@/lib/utils";
import { GRADE_COLORS, type Grade } from "@/lib/constants";

interface GradeBadgeProps {
  grade: Grade;
  score?: number;
  size?: "sm" | "md" | "lg";
}

export function GradeBadge({ grade, score, size = "md" }: GradeBadgeProps) {
  const sizeClasses = {
    sm: "h-6 w-6 text-xs",
    md: "h-8 w-8 text-sm",
    lg: "h-12 w-12 text-lg",
  };

  return (
    <div className="flex items-center gap-2">
      <div
        className={cn(
          "flex items-center justify-center rounded-md border font-bold",
          GRADE_COLORS[grade],
          sizeClasses[size]
        )}
      >
        {grade}
      </div>
      {score !== undefined && (
        <span className="text-xs text-muted-foreground font-mono">
          {score.toFixed(0)}
        </span>
      )}
    </div>
  );
}
