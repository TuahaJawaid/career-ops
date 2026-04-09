import { cn } from "@/lib/utils";
import { GRADE_COLORS, type Grade } from "@/lib/constants";

interface GradeBadgeProps {
  grade: Grade;
  score?: number;
  size?: "sm" | "md" | "lg";
}

export function GradeBadge({ grade, score, size = "md" }: GradeBadgeProps) {
  const sizeClasses = {
    sm: "h-7 w-7 text-xs",
    md: "h-9 w-9 text-sm",
    lg: "h-14 w-14 text-xl",
  };

  return (
    <div className="flex items-center gap-2">
      <div
        className={cn(
          "flex items-center justify-center rounded-xl border-2 font-bold shadow-card",
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
