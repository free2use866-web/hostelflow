import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import {
  CATEGORY_META,
  STATUS_META,
  ticketNeedsAttention,
  timeAgo,
} from "@/lib/hostel";
import { TriangleAlert } from "lucide-react";
import { useQuery } from "convex/react";
import { Badge } from "@/components/ui/badge";

export type TicketListItem = {
  _id: Id<"tickets">;
  title: string;
  description: string;
  category: keyof typeof CATEGORY_META;
  status: keyof typeof STATUS_META;
  createdAt: number;
  updatedAt: number;
  assignedTo?: Id<"users">;
  creatorName?: string;
  assigneeName?: string;
};

export function TicketCard({
  ticket,
  onOpen,
}: {
  ticket: TicketListItem;
  onOpen: () => void;
}) {
  const attention = ticketNeedsAttention(ticket);
  const cat = CATEGORY_META[ticket.category];
  const st = STATUS_META[ticket.status];
  return (
    <button
      onClick={onOpen}
      className="clay-flat clay-pressable w-full rounded-3xl p-5 text-left"
    >
      <div className="flex items-center gap-2">
        <Badge className={`rounded-full border-none px-3 text-xs ${cat.chip}`}>
          {cat.emoji} {cat.label}
        </Badge>
        <Badge className={`rounded-full border-none px-3 text-xs ${st.chip}`}>
          <span className={`mr-1 inline-block size-2 rounded-full ${st.dot}`} />
          {st.label}
        </Badge>
        <span className="ml-auto text-xs text-muted-foreground">
          {timeAgo(ticket.updatedAt)}
        </span>
      </div>
      <h3 className="mt-3 font-bold">{ticket.title}</h3>
      <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">
        {ticket.description}
      </p>
      <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
        <span>By {ticket.creatorName ?? "You"}</span>
        <span>→ {ticket.assigneeName ?? "Unassigned"}</span>
        {attention && (
          <span className="flex items-center gap-1 font-semibold text-destructive">
            <TriangleAlert className="size-3.5" /> {attention}
          </span>
        )}
      </div>
    </button>
  );
}

export function TicketList({
  tickets,
  onSelect,
  emptyText = "Nothing here yet.",
}: {
  tickets: TicketListItem[] | undefined;
  onSelect: (id: string) => void;
  emptyText?: string;
}) {
  if (tickets === undefined) {
    return <p className="p-6 text-center text-sm text-muted-foreground">Loading…</p>;
  }
  if (tickets.length === 0) {
    return <p className="clay-inset rounded-3xl p-8 text-center text-sm text-muted-foreground">{emptyText}</p>;
  }
  return (
    <div className="space-y-4">
      {tickets.map((t) => (
        <TicketCard key={t._id} ticket={t} onOpen={() => onSelect(t._id)} />
      ))}
    </div>
  );
}

/** Small hook wrapper so views share the portal query shape. */
export function usePortalTickets(category?: string, status?: string) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const args: any = {};
  if (category) args.category = category;
  if (status) args.status = status;
  return useQuery(api.tickets.listPortalTickets, args);
}

export function useMyTickets() {
  return useQuery(api.tickets.listMyTickets, {});
}
