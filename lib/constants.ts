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
  saved: "bg-slate-100 text-slate-600 border border-slate-200",
  applied: "bg-blue-50 text-blue-700 border border-blue-200",
  screening: "bg-amber-50 text-amber-700 border border-amber-200",
  interview: "bg-purple-50 text-purple-700 border border-purple-200",
  technical: "bg-indigo-50 text-indigo-700 border border-indigo-200",
  offer: "bg-emerald-50 text-emerald-700 border border-emerald-200",
  accepted: "bg-green-50 text-green-700 border border-green-200",
  rejected: "bg-red-50 text-red-700 border border-red-200",
  withdrawn: "bg-gray-50 text-gray-500 border border-gray-200",
};

export const GRADES = ["A", "B", "C", "D", "F"] as const;
export type Grade = (typeof GRADES)[number];

export const GRADE_COLORS: Record<Grade, string> = {
  A: "bg-emerald-50 text-emerald-700 border-emerald-200",
  B: "bg-blue-50 text-blue-700 border-blue-200",
  C: "bg-amber-50 text-amber-700 border-amber-200",
  D: "bg-orange-50 text-orange-700 border-orange-200",
  F: "bg-red-50 text-red-700 border-red-200",
};

export const DEFAULT_TARGET_ROLES = [
  "Senior Accountant",
  "Senior Revenue Accountant",
  "Revenue Accountant",
];

export const LOCATION_TYPES = ["remote", "hybrid", "onsite"] as const;
