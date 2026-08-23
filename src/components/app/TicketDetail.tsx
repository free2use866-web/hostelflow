import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import type { Category, TicketStatus } from "@/convex/schema";
import {
  CATEGORIES,
  CATEGORY_META,
  STATUS_META,
  categoryForSecy,
  isStaffRole,
  timeAgo,
} from "@/lib/hostel";
import { useAuth } from "@/hooks/use-auth";
import { ArrowRightLeft, Send } from "lucide-react";
import { useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { toast } from "sonner";

const STATUS_ACTIONS: { status: TicketStatus; label: string; className: string }[] = [
  { status: "in_progress", label: "🚧 In progress", className: "bg-[oklch(0.78_0.13_65)] text-[oklch(0.32_0.08_55)]" },
  { status: "resolved", label: "✅ Resolved", className: "bg-secondary text-secondary-foreground" },
  { status: "rejected", label: "🚫 Can't act", className: "bg-destructive/90 text-white" },
];

export function TicketDetail({
  ticketId,
  open,
  onOpenChange,
}: {
  ticketId: Id<"tickets"> | null;
  open: boolean;
  onOpenChange: (v: boolean) => void;
}) {
  const { user } = useAuth();
  const data = useQuery(
    api.tickets.getTicket,
    ticketId ? ({ ticketId } as { ticketId: Id<"tickets"> }) : "skip",
  );
  const setStatus = useMutation(api.tickets.updateStatus);
  const transfer = useMutation(api.tickets.transferTicket);
  const addComment = useMutation(api.tickets.addComment);
  const [comment, setComment] = useState("");
  const [transferTo, setTransferTo] = useState<string>("");

  const role = user?.hostelRole as import("@/convex/schema").HostelRole | undefined;
  const myCategory = categoryForSecy(role);
  const canManage =
    !!ticketId &&
    !!data &&
    (isStaffRole(role) || (!!myCategory && myCategory === data.ticket.category));
  const isOwner = !!data && data.ticket.createdBy === user?._id;
  const canDo = (s: TicketStatus) => canManage || (isOwner && s === "resolved");
  const canTransfer = canManage;

  if (!ticketId) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="clay-lg max-h-[85vh] max-w-xl overflow-y-auto border-none sm:rounded-[2rem]">
        {!data ? (
          <div className="p-10 text-center text-muted-foreground">Loading…</div>
        ) : (
          <>
            <DialogHeader>
              <div className="flex flex-wrap items-center gap-2">
                <Badge className={`rounded-full border-none px-3 ${CATEGORY_META[data.ticket.category].chip}`}>
                  {CATEGORY_META[data.ticket.category].emoji}{" "}
                  {CATEGORY_META[data.ticket.category].label}
                </Badge>
                <Badge className={`rounded-full border-none px-3 ${STATUS_META[data.ticket.status].chip}`}>
                  {STATUS_META[data.ticket.status].label}
                </Badge>
              </div>
              <DialogTitle className="text-left text-xl font-extrabold">
                {data.ticket.title}
              </DialogTitle>
            </DialogHeader>

            <p className="clay-inset rounded-2xl p-4 text-sm leading-relaxed whitespace-pre-wrap">
              {data.ticket.description}
            </p>
            <p className="text-xs text-muted-foreground">
              Filed by <strong>{data.ticket.creatorName}</strong> ·{" "}
              {timeAgo(data.ticket.createdAt)} · Handling:{" "}
              <strong>{data.ticket.assigneeName}</strong>
            </p>

            {/* Actions */}
            {(canManage || isOwner) && (
              <div className="flex flex-wrap gap-2 pt-1">
                {STATUS_ACTIONS.map((a) => (
                  <Button
                    key={a.status}
                    size="sm"
                    disabled={!canDo(a.status) || data.ticket.status === a.status}
                    onClick={async () => {
                      try {
                        await setStatus({ ticketId, status: a.status });
                        toast.success(`Marked ${a.label.replace(/^\S+\s/, "").toLowerCase()}`);
                      } catch (e) {
                        toast.error(e instanceof Error ? e.message : "Failed");
                      }
                    }}
                    className={`clay-flat clay-pressable rounded-full border-none text-xs font-bold ${a.className}`}
                    variant="outline"
                  >
                    {a.label}
                  </Button>
                ))}
              </div>
            )}

            {/* Transfer */}
            {canTransfer && (
              <div className="clay-inset mt-1 flex flex-wrap items-center gap-2 rounded-2xl p-3">
                <ArrowRightLeft className="size-4 shrink-0 text-muted-foreground" />
                <span className="text-xs font-semibold">Transfer to:</span>
                <Select value={transferTo} onValueChange={setTransferTo}>
                  <SelectTrigger className="w-40 rounded-full bg-card text-xs">
                    <SelectValue placeholder="Community" />
                  </SelectTrigger>
                  <SelectContent className="rounded-2xl">
                    {CATEGORIES.filter((c) => c !== data.ticket.category).map((c) => (
                      <SelectItem key={c} value={c}>
                        {CATEGORY_META[c].emoji} {CATEGORY_META[c].label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button
                  size="sm"
                  disabled={!transferTo}
                  onClick={async () => {
                    try {
                      await transfer({ ticketId, toCategory: transferTo as Category });
                      toast.success("Complaint transferred");
                      setTransferTo("");
                    } catch (e) {
                      toast.error(e instanceof Error ? e.message : "Failed");
                    }
                  }}
                  className="clay-flat clay-pressable rounded-full border-none bg-primary text-xs font-bold"
                  variant="outline"
                >
                  Route it
                </Button>
              </div>
            )}

            {/* Timeline */}
            <h4 className="pt-2 text-sm font-bold">Activity</h4>
            <ol className="space-y-3">
              {data.updates.map((u) => (
                <li key={u._id} className="flex gap-3">
                  <span
                    className={`mt-1.5 size-2.5 shrink-0 rounded-full ${
                      u.type === "created"
                        ? "bg-primary"
                        : u.type === "status_change"
                          ? STATUS_META[u.toStatus ?? u.fromStatus ?? "open"].dot
                          : u.type === "transfer"
                            ? "bg-[oklch(0.72_0.12_230)]"
                            : "bg-muted-foreground/50"
                    }`}
                  />
                  <div className="min-w-0">
                    <p className="text-xs text-muted-foreground">
                      <strong className="text-foreground">{u.authorName}</strong>{" "}
                      {u.type === "created" && "filed this complaint"}
                      {u.type === "comment" && "commented"}
                      {u.type === "transfer" &&
                        `transferred ${CATEGORY_META[u.fromCategory ?? "mess"].label} → ${CATEGORY_META[u.toCategory ?? "mess"].label}`}
                      {u.type === "status_change" &&
                        `${STATUS_META[u.fromStatus ?? "open"].label} → ${STATUS_META[u.toStatus ?? "open"].label}`}
                      {" · "}
                      {timeAgo(u.createdAt)}
                    </p>
                    {u.body && (
                      <p className="mt-1 text-sm whitespace-pre-wrap">{u.body}</p>
                    )}
                  </div>
                </li>
              ))}
            </ol>

            {/* Comment box */}
            <form
              className="mt-2 flex gap-2"
              onSubmit={async (e) => {
                e.preventDefault();
                const body = comment.trim();
                if (!body) return;
                setComment("");
                try {
                  await addComment({ ticketId, body });
                } catch (err) {
                  toast.error(err instanceof Error ? err.message : "Failed");
                }
              }}
            >
              <Textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="Add a comment… @mention someone to notify them"
                rows={2}
                className="clay-inset resize-none rounded-2xl border-none"
              />
              <Button
                type="submit"
                size="icon"
                className="clay-flat clay-pressable size-10 shrink-0 self-end rounded-full border-none"
                variant="outline"
              >
                <Send className="size-4" />
              </Button>
            </form>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
