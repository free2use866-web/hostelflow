import { useAuth } from "@/hooks/use-auth";
import {
  CATEGORY_META,
  ROLE_META,
  categoryForSecy,
  isStaffRole,
  ticketNeedsAttention,
} from "@/lib/hostel";
import { BellRing, Inbox, TicketCheck } from "lucide-react";
import { TicketList, useMyTickets, usePortalTickets } from "./TicketList";

function StatCard({
  emoji,
  label,
  value,
  tint,
}: {
  emoji: string;
  label: string;
  value: number | undefined;
  tint: string;
}) {
  return (
    <div className="clay-flat rounded-3xl p-5">
      <div
        className={`flex size-11 items-center justify-center rounded-2xl text-xl shadow-[var(--clay-raised),var(--clay-inner)] ${tint}`}
      >
        {emoji}
      </div>
      <p className="mt-3 text-3xl font-extrabold">
        {value === undefined ? "—" : value}
      </p>
      <p className="text-xs font-medium text-muted-foreground">{label}</p>
    </div>
  );
}

export function OverviewView({ onSelectTicket }: { onSelectTicket: (id: string) => void }) {
  const { user } = useAuth();
  const role = user?.hostelRole as import("@/convex/schema").HostelRole | undefined;
  const mine = useMyTickets();
  const portal = usePortalTickets();

  const openCount = portal?.filter((t) => t.status === "open").length;
  const progressCount = portal?.filter((t) => t.status === "in_progress").length;
  const resolvedCount = portal?.filter((t) => t.status === "resolved").length;
  const reminders = portal?.filter((t) => ticketNeedsAttention(t)) ?? [];
  const myCategory = categoryForSecy(role);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-extrabold">
          {ROLE_META[role ?? "student"].emoji} Welcome back,{" "}
          {user?.name ?? "friend"}
        </h1>
        <p className="text-sm text-muted-foreground">
          {isStaffRole(role)
            ? "Oversight of every secretary's work — transfer, track and resolve."
            : myCategory
              ? `Your ${CATEGORY_META[myCategory].label} portal at a glance.`
              : "Your hostel dashboard."}
        </p>
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard emoji="📥" label="Open" value={openCount} tint="bg-primary/15 text-primary" />
        <StatCard emoji="🚧" label="In Progress" value={progressCount} tint="bg-accent text-accent-foreground" />
        <StatCard emoji="✅" label="Resolved" value={resolvedCount} tint="bg-secondary text-secondary-foreground" />
        <StatCard emoji="🔔" label="Need Attention" value={reminders.length} tint="bg-destructive/15 text-destructive" />
      </div>

      {/* Reminders */}
      <section>
        <h2 className="mb-3 flex items-center gap-2 font-bold">
          <BellRing className="size-4 text-destructive" /> Reminders — stale or
          untagged complaints
        </h2>
        <TicketList
          tickets={reminders}
          onSelect={onSelectTicket}
          emptyText="🎉 Nothing stale — every complaint is tagged and freshly updated."
        />
      </section>

      {/* Recent */}
      <section>
        <h2 className="mb-3 flex items-center gap-2 font-bold">
          <Inbox className="size-4 text-primary" /> Latest complaints
        </h2>
        <TicketList
          tickets={portal?.slice(0, 5)}
          onSelect={onSelectTicket}
          emptyText="No complaints filed yet."
        />
      </section>

      {/* My recent (students) */}
      {!myCategory && !isStaffRole(role) && (
        <section>
          <h2 className="mb-3 flex items-center gap-2 font-bold">
            <TicketCheck className="size-4 text-secondary-foreground" /> My
            recent complaints
          </h2>
          <TicketList
            tickets={mine?.slice(0, 3)}
            onSelect={onSelectTicket}
            emptyText="You haven't filed anything yet."
          />
        </section>
      )}
    </div>
  );
}
