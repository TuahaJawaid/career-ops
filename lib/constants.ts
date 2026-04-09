export const APPLICATION_STATUSES = [
  "saved",
  "applied",
  "screening",
  "interview",
  "technical",
  "offer",
  "accepted",
  "rejected",
  "withdrawn",
] as const;

export type ApplicationStatus = (typeof APPLICATION_STATUSES)[number];

export const STATUS_LABELS: Record<ApplicationStatus, string> = {
  saved: "Saved",
  applied: "Applied",
  screening: "Screening",
  interview: "Interview",
  technical: "Technical",
  offer: "Offer",
  accepted: "Accepted",
  rejected: "Rejected",
  withdrawn: "Withdrawn",
};

export const STATUS_COLORS: Record<ApplicationStatus, string> = {
  saved: "bg-zinc-500/20 text-zinc-400",
  applied: "bg-blue-500/20 text-blue-400",
  screening: "bg-yellow-500/20 text-yellow-400",
  interview: "bg-purple-500/20 text-purple-400",
  technical: "bg-indigo-500/20 text-indigo-400",
  offer: "bg-green-500/20 text-green-400",
  accepted: "bg-emerald-500/20 text-emerald-400",
  rejected: "bg-red-500/20 text-red-400",
  withdrawn: "bg-zinc-500/20 text-zinc-500",
};

export const GRADES = ["A", "B", "C", "D", "F"] as const;
export type Grade = (typeof GRADES)[number];

export const GRADE_COLORS: Record<Grade, string> = {
  A: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
  B: "bg-blue-500/20 text-blue-400 border-blue-500/30",
  C: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
  D: "bg-orange-500/20 text-orange-400 border-orange-500/30",
  F: "bg-red-500/20 text-red-400 border-red-500/30",
};

export const DEFAULT_TARGET_ROLES = [
  "Senior Accountant",
  "Senior Revenue Accountant",
  "Revenue Accountant",
];

export const LOCATION_TYPES = ["remote", "hybrid", "onsite"] as const;
