import { Badge } from "@/components/ui/badge";
import type { Category, HostelRole } from "@/convex/schema";
import {
  CATEGORIES,
  CATEGORY_META,
  ROLE_META,
  STATUS_META,
  categoryForSecy,
  isStaffRole,
  ticketNeedsAttention,
} from "@/lib/hostel";
import { useState } from "react";
import { TicketList, usePortalTickets } from "./TicketList";

const STATUS_FILTERS = [
  { value: "", label: "All" },
  { value: "open", label: "Open" },
  { value: "in_progress", label: "In progress" },
  { value: "resolved", label: "Resolved" },
  { value: "rejected", label: "Rejected" },
] as const;

export function PortalView({
  role,
  onSelectTicket,
}: {
  role: HostelRole | undefined;
  onSelectTicket: (id: string) => void;
}) {
  const myCategory = categoryForSecy(role);
  const staff = isStaffRole(role);
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [categoryFilter, setCategoryFilter] = useState<string>("");

  const effectiveCategory =
    myCategory && !staff ? myCategory : (categoryFilter || undefined);

  const tickets = usePortalTickets(effectiveCategory, statusFilter || undefined);
  const attentionCount =
    tickets?.filter((t) => ticketNeedsAttention(t)).length ?? 0;

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold">
          {myCategory && !staff
            ? `${CATEGORY_META[myCategory].emoji} ${ROLE_META[role!].label} Portal`
            : staff
              ? `${ROLE_META[role!].emoji} Oversight — all complaints`
              : "🗂️ Communities"}
        </h1>
        <p className="text-sm text-muted-foreground">
          {staff
            ? "See every secretary's work, transfer complaints and track status."
            : myCategory
              ? `Complaints in the ${CATEGORY_META[myCategory].label} community land here automatically.`
              : "Browse complaints by community."}
          {" · "}
          <span className="font-semibold text-destructive">
            {attentionCount} need{attentionCount === 1 ? "s" : ""} attention
          </span>
        </p>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-2">
        {(staff || (!myCategory && !staff)) && (
          <>
            <button
              onClick={() => setCategoryFilter("")}
              className={`rounded-full px-4 py-2 text-xs font-bold transition-all ${
                categoryFilter === ""
                  ? "shadow-[var(--clay-raised),var(--clay-inner)]"
                  : "clay-inset text-muted-foreground hover:text-foreground"
              }`}
            >
              All communities
            </button>
            {CATEGORIES.map((c) => (
              <button
                key={c}
                onClick={() => setCategoryFilter(c)}
                className={`rounded-full px-4 py-2 text-xs font-bold transition-all ${
                  categoryFilter === c
                    ? CATEGORY_META[c].chip + " shadow-[var(--clay-raised),var(--clay-inner)]"
                    : "clay-inset text-muted-foreground hover:text-foreground"
                }`}
              >
                {CATEGORY_META[c].emoji} {CATEGORY_META[c].label}
              </button>
            ))}
            <span className="mx-1 h-5 w-px bg-border" />
          </>
        )}
        {STATUS_FILTERS.map((s) => (
          <button
            key={s.value}
            onClick={() => setStatusFilter(s.value)}
            className={`rounded-full px-4 py-2 text-xs font-bold transition-all ${
              statusFilter === s.value
                ? "bg-primary/10 text-primary shadow-[var(--clay-raised),var(--clay-inner)]"
                : "clay-inset text-muted-foreground hover:text-foreground"
            }`}
          >
            {s.label}
          </button>
        ))}
      </div>

      <TicketList
        tickets={tickets}
        onSelect={onSelectTicket}
        emptyText="No complaints match these filters."
      />
    </div>
  );
}

export function StatusBadge({ status }: { status: keyof typeof STATUS_META }) {
  return (
    <Badge className={`rounded-full border-none ${STATUS_META[status].chip}`}>
      {STATUS_META[status].label}
    </Badge>
  );
}
