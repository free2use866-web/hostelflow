import { TicketList, useMyTickets } from "./TicketList";

export function MyTicketsView({ onSelectTicket }: { onSelectTicket: (id: string) => void }) {
  const mine = useMyTickets();

  const open = mine?.filter((t) => t.status === "open" || t.status === "in_progress");
  const done = mine?.filter((t) => t.status === "resolved" || t.status === "rejected");

  return (
    <div className="mx-auto max-w-3xl space-y-8">
      <div>
        <h1 className="text-2xl font-extrabold">🧾 My complaints</h1>
        <p className="text-sm text-muted-foreground">
          Track everything you've filed. You'll be notified when the status
          changes.
        </p>
      </div>

      <section>
        <h2 className="mb-3 font-bold">In progress ({open?.length ?? 0})</h2>
        <TicketList
          tickets={open}
          onSelect={onSelectTicket}
          emptyText="Nothing in progress — file a complaint from the sidebar."
        />
      </section>

      <section>
        <h2 className="mb-3 font-bold">Closed ({done?.length ?? 0})</h2>
        <TicketList
          tickets={done}
          onSelect={onSelectTicket}
          emptyText="No closed complaints yet."
        />
      </section>
    </div>
  );
}
