import { useState } from "react";
import { motion } from "framer-motion";
import { useStore } from "@/lib/store";
import type { Pass, PassType, PassStatus } from "@/lib/types";
import { IS_WARDEN_ROLE, localYYYYMMDD } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { CheckCircle2, KeyRound, Plus, XCircle } from "lucide-react";

const PASS_EMOJI: Record<PassType, string> = { LateEntry: "🌙", SportsGear: "⚽", GuestStay: "🏨" };
const PASS_LABEL: Record<PassType, string> = { LateEntry: "Late Night Entry", SportsGear: "Sports Equipment", GuestStay: "Guest Stay" };
// Single source of truth for status badge tones + production empty state.
import { statusTone } from "@/lib/status";
import { EmptyState } from "@/components/features/dashboard/primitives";

export function PassesView() {
  const store = useStore();
  const { currentUser, passes, updatePassStatus } = store;
  const isApprover = IS_WARDEN_ROLE(currentUser.role) || ["MessSec", "MaintSec", "GenSec", "SportsSec", "WellnessSec", "TechSec"].includes(currentUser.role);
  const [tab, setTab] = useState<string>("all");
  const [showNew, setShowNew] = useState(false);

  const filtered = tab === "mine"
    ? passes.filter((p) => p.studentId === currentUser.id)
    : tab === "pending"
      ? passes.filter((p) => p.status === "Pending")
      : passes;

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-foreground" style={{ fontFamily: "Lora, serif" }}>
            <KeyRound className="mr-1.5 inline size-5 text-primary" /> Digital Passes
          </h2>
          <p className="text-xs text-muted-foreground">Late entry, sports gear checkout, and guest stays.</p>
        </div>
        <Button onClick={() => setShowNew(true)} className="rounded-full bg-primary text-primary-foreground">
          <Plus className="mr-1.5 size-3.5" /> Request Pass
        </Button>
      </div>

      <div className="flex gap-2">
        {["all", "pending", "mine"].map((k) => {
          const labels: Record<string, string> = { all: "All Passes", pending: "Pending Approvals", mine: "My Passes" };
          const l = labels[k];
          return (
          <button key={k} onClick={() => setTab(k)}
            className={`rounded-full px-3 py-1.5 text-xs font-semibold transition-colors ${
              tab === k ? "bg-primary text-primary-foreground" : "border border-border bg-card text-muted-foreground"
            }`}>
            {l}
          </button>
          );
        })}
      </div>

      <div className="space-y-3">
        {filtered.length === 0 ? (
          <EmptyState
            icon={<KeyRound className="size-5" />}
            title={
              tab === "mine"
                ? "No passes requested yet"
                : tab === "pending"
                  ? "Nothing awaiting approval"
                  : "No passes on record"
            }
            body={
              tab === "mine"
                ? "Request a late-entry, sports-gear or guest-stay pass with the button above."
                : undefined
            }
          />
        ) : (
          filtered.map((p) => (
            <motion.div key={p.id} layout initial={{ opacity: 0 }} animate={{ opacity: 1 }}
              className="rounded-xl border border-border bg-card p-4">
              <div className="flex flex-wrap items-center gap-2">
                <span className="rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-semibold text-primary">
                  {PASS_EMOJI[p.passType]} {PASS_LABEL[p.passType]}
                </span>
                <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${statusTone(p.status)}`}>
                  {p.status}
                </span>
                <span className="ml-auto text-xs text-muted-foreground">{p.validDate}</span>
              </div>
              <p className="mt-2 text-sm text-foreground">
                <span className="font-semibold">{p.studentName || "Student"}</span>
                <span className="ml-2 text-muted-foreground">— {p.reason}</span>
              </p>
              {p.approvedBy && (
                <p className="mt-1 text-xs text-emerald-700">Approved by: {p.approvedBy}</p>
              )}

              {/* Approval buttons */}
              {isApprover && p.status === "Pending" && p.studentId !== currentUser.id && (
                <div className="mt-3 flex gap-2">
                  <Button size="sm" onClick={() => updatePassStatus(p.id, "Approved", currentUser.name)}
                    className="rounded-full bg-emerald-600 text-xs text-white hover:bg-emerald-700">
                    <CheckCircle2 className="mr-1 size-3" /> Approve
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => updatePassStatus(p.id, "Rejected", currentUser.name)}
                    className="rounded-full border-rose-300 text-xs text-rose-700 hover:bg-rose-50">
                    <XCircle className="mr-1 size-3" /> Reject
                  </Button>
                </div>
              )}
            </motion.div>
          ))
        )}
      </div>

      <NewPassDialog open={showNew} onOpenChange={setShowNew} />
    </div>
  );
}

function NewPassDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (v: boolean) => void }) {
  const { currentUser, addPass } = useStore();
  const [type, setType] = useState<PassType>("LateEntry");
  const [reason, setReason] = useState("");
  const [date, setDate] = useState("");

  const submit = () => {
    if (!reason.trim() || !date) return;
    addPass({ studentId: currentUser.id, studentName: currentUser.name, passType: type, reason: reason.trim(), validDate: date });
    setReason(""); setDate(""); onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md rounded-xl border-border">
        <DialogHeader>
          <DialogTitle style={{ fontFamily: "Lora, serif" }}>Request Digital Pass</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <div className="grid grid-cols-3 gap-2">
            {(["LateEntry", "SportsGear", "GuestStay"] as PassType[]).map((t) => (
              <button key={t} onClick={() => setType(t)}
                className={`rounded-lg border px-3 py-2.5 text-center text-xs font-semibold transition-colors ${
                  type === t ? "border-primary bg-primary/10 text-primary" : "border-border bg-background text-muted-foreground"
                }`}>
                {PASS_EMOJI[t]}
                <br />
                {PASS_LABEL[t]}
              </button>
            ))}
          </div>
          <Textarea placeholder="Reason for request…" rows={3} value={reason} onChange={(e) => setReason(e.target.value)} className="rounded-lg border-border text-sm" />
          <Input type="date" value={date} min={localYYYYMMDD()} onChange={(e) => setDate(e.target.value)} className="rounded-lg border-border text-sm" />
          <p className="text-[10px] text-muted-foreground">
            Your pass will be sent to the Assistant Warden or relevant Secretary for approval.
          </p>
          <Button onClick={submit} className="w-full rounded-full bg-primary text-primary-foreground" disabled={!reason.trim() || !date}>
            Submit Request
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
