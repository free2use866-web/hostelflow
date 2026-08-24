/**
 * SINGLE SOURCE OF TRUTH for entity status tones.
 *
 * Previously three views each defined a private `statusColor()` map with
 * drifting palettes and a rogue `bg-gray-100 text-gray-800` fallback that
 * sat outside the semantic theme. Every badge now resolves here, and the
 * fallback uses design-system tokens.
 */
import type {
  ComplaintStatus,
  PassStatus,
  RebateStatus,
  SickDietStatus,
  SuggestionStatus,
} from "./types";

/** Semantic tone tokens (Tailwind palette classes mapped to app semantics). */
export type StatusTone = string;

const STATUS_TONES: Record<
  | ComplaintStatus
  | SickDietStatus
  | PassStatus
  | RebateStatus
  | SuggestionStatus,
  StatusTone
> = {
  // Complaint lifecycle
  Pending: "bg-amber-100 text-amber-800",
  "Under Progress": "bg-sky-100 text-sky-800",
  Resolved: "bg-emerald-100 text-emerald-800",
  "Cannot Resolve": "bg-rose-100 text-rose-800",

  // Sick-diet delivery pipeline
  Requested: "bg-purple-100 text-purple-800",
  "In Preparation": "bg-sky-100 text-sky-800",
  "Out for Delivery": "bg-amber-100 text-amber-800",
  Delivered: "bg-emerald-100 text-emerald-800",

  // Approvals (passes + rebates)
  Approved: "bg-emerald-100 text-emerald-800",
  Rejected: "bg-rose-100 text-rose-800",

  // Community moderation ladder
  Open: "bg-amber-100 text-amber-700",
  "Under Review": "bg-sky-100 text-sky-700",
  Implemented: "bg-emerald-100 text-emerald-700",
};

/**
 * Resolve the tone classes for any known status label.
 * Unknown/legacy labels degrade to muted theme tokens — never rogue gray.
 */
export function statusTone(status: string): StatusTone {
  return (
    STATUS_TONES[status as keyof typeof STATUS_TONES] ??
    "bg-muted text-muted-foreground"
  );
}
