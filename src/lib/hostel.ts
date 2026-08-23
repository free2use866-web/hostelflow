import type { Category, HostelRole, TicketStatus } from "@/convex/schema";

export const CATEGORY_META: Record<
  Category,
  { label: string; emoji: string; chip: string }
> = {
  mess: {
    label: "Mess",
    emoji: "🍽️",
    chip: "bg-[oklch(0.89_0.075_168)] text-[oklch(0.33_0.06_170)]",
  },
  general: {
    label: "General",
    emoji: "📋",
    chip: "bg-[oklch(0.9_0.075_55)] text-[oklch(0.38_0.07_50)]",
  },
  maintenance: {
    label: "Maintenance",
    emoji: "🔧",
    chip: "bg-[oklch(0.88_0.07_230)] text-[oklch(0.34_0.07_235)]",
  },
  suggestion: {
    label: "Suggestion",
    emoji: "💡",
    chip: "bg-[oklch(0.87_0.09_295)] text-[oklch(0.36_0.09_295)]",
  },
};

export const CATEGORIES: Category[] = [
  "mess",
  "general",
  "maintenance",
  "suggestion",
];

export const STATUS_META: Record<
  TicketStatus,
  { label: string; chip: string; dot: string }
> = {
  open: {
    label: "Open",
    chip: "bg-primary/10 text-primary",
    dot: "bg-primary",
  },
  in_progress: {
    label: "In Progress",
    chip: "bg-[oklch(0.9_0.075_55)] text-[oklch(0.38_0.07_50)]",
    dot: "bg-[oklch(0.72_0.14_65)]",
  },
  resolved: {
    label: "Resolved",
    chip: "bg-secondary/40 text-[oklch(0.33_0.06_170)]",
    dot: "bg-emerald-500",
  },
  rejected: {
    label: "Rejected / Can't act",
    chip: "bg-destructive/10 text-destructive",
    dot: "bg-destructive",
  },
};

export const ROLE_META: Record<HostelRole, { label: string; emoji: string }> = {
  student: { label: "Student", emoji: "🎓" },
  mess_secy: { label: "Mess Secretary", emoji: "🍽️" },
  general_secy: { label: "General Secretary", emoji: "📋" },
  maintenance_secy: { label: "Maintenance Secretary", emoji: "🔧" },
  suggestion_secy: { label: "Suggestion Secretary", emoji: "💡" },
  assistant_warden: { label: "Assistant Warden", emoji: "🧑‍💼" },
  chief_warden: { label: "Chief Warden", emoji: "👨‍🍳" },
  warden: { label: "Warden", emoji: "🛡️" },
};

export const STAFF_ROLES: HostelRole[] = [
  "warden",
  "assistant_warden",
  "chief_warden",
];

export function isStaffRole(role?: HostelRole) {
  return !!role && STAFF_ROLES.includes(role);
}

export function categoryForSecy(role?: HostelRole): Category | null {
  switch (role) {
    case "mess_secy":
      return "mess";
    case "general_secy":
      return "general";
    case "maintenance_secy":
      return "maintenance";
    case "suggestion_secy":
      return "suggestion";
    default:
      return null;
  }
}

/** A ticket is "stale" if untagged, or untouched for over 48h while unresolved. */
export const REMINDER_MS = 48 * 60 * 60 * 1000;

export function ticketNeedsAttention(t: {
  status: TicketStatus;
  assignedTo?: string;
  updatedAt: number;
}) {
  if (t.status === "resolved" || t.status === "rejected") return null;
  if (!t.assignedTo) return "Untagged — no secretary assigned";
  if (Date.now() - t.updatedAt > REMINDER_MS)
    return "No update for 48+ hours";
  return null;
}

export function timeAgo(ts: number) {
  const diff = Date.now() - ts;
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
}
