import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useStore } from "@/lib/store";
import {
  ALL_CATEGORIES, CATEGORY_TO_ROLE, ROLE_LABELS,
  type Category, type Complaint, type ComplaintStatus,
} from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import {
  AlertTriangle, ArrowRightLeft, Clock, MessageSquare, Plus, Send,
} from "lucide-react";

const CATEGORY_EMOJI: Record<Category, string> = {
  Mess: "🍽️", Maintenance: "🔧", General: "📋", Sports: "⚽", Wellness: "💊", Technical: "💻",
};

function statusColor(s: string) {
  const m: Record<string, string> = {
    Pending: "bg-amber-100 text-amber-800", "Under Progress": "bg-sky-100 text-sky-800",
    Resolved: "bg-emerald-100 text-emerald-800", "Cannot Resolve": "bg-rose-100 text-rose-800",
  };
  return m[s] ?? "bg-gray-100 text-gray-800";
}

export function ComplaintsView() {
  const store = useStore();
  const { currentUser, complaints, addComplaint, updateComplaintStatus, reassignComplaint, addComplaintComment } = store;
  const role = currentUser.role;
  const isWarden = role === "Warden" || role === "AsstWarden";
  const isSecy = ["MessSec", "MaintSec", "GenSec", "SportsSec", "WellnessSec", "TechSec"].includes(role);

  const [filter, setFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [detailId, setDetailId] = useState<string | null>(null);
  const [showNew, setShowNew] = useState(false);

  // Filter complaints
  let visible = complaints;
  if (isSecy && !isWarden) {
    visible = visible.filter((c) => c.assignedRole === role);
  }
  if (filter !== "all") visible = visible.filter((c) => c.category === filter);
  if (statusFilter !== "all") visible = visible.filter((c) => c.status === statusFilter);

  const detail = detailId ? complaints.find((c) => c.id === detailId) : null;

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-foreground" style={{ fontFamily: "Lora, serif" }}>
            {isWarden ? "All Complaints" : isSecy ? `${CATEGORY_EMOJI[ALL_CATEGORIES.find((c) => CATEGORY_TO_ROLE[c] === role) as Category] ?? ""} My Portal` : "File & Track Complaints"}
          </h2>
          <p className="text-xs text-muted-foreground">
            {isSecy ? "Complaints routed to your category." : "Auto-routed based on category."}
          </p>
        </div>
        <Button onClick={() => setShowNew(true)} className="rounded-full bg-primary text-primary-foreground">
          <Plus className="mr-1.5 size-3.5" /> New Complaint
        </Button>
      </div>

      {/* Filters — horizontally scrollable on mobile */}
      <div className="flex flex-nowrap gap-2 overflow-x-auto pb-1 scrollbar-none">
        {["all", ...ALL_CATEGORIES].map((c) => (
          <button key={c} onClick={() => setFilter(c)}
            className={`rounded-full px-3 py-1.5 text-xs font-semibold transition-colors ${
              filter === c ? "bg-primary text-primary-foreground" : "border border-border bg-card text-muted-foreground hover:text-foreground"
            }`}>
            {c === "all" ? "All" : `${CATEGORY_EMOJI[c as Category]} ${c}`}
          </button>
        ))}
        <span className="w-px bg-border" />
        {["all", "Pending", "Under Progress", "Resolved", "Cannot Resolve"].map((s) => (
          <button key={s} onClick={() => setStatusFilter(s)}
            className={`rounded-full px-3 py-1.5 text-xs font-semibold transition-colors ${
              statusFilter === s ? "bg-primary text-primary-foreground" : "border border-border bg-card text-muted-foreground hover:text-foreground"
            }`}>
            {s === "all" ? "All Status" : s}
          </button>
        ))}
      </div>

      {/* Complaint List */}
      <div className="space-y-3">
        <AnimatePresence>
          {visible.map((c) => (
            <motion.div key={c.id} layout initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <button
                onClick={() => setDetailId(c.id)}
                className="w-full rounded-xl border border-border bg-card p-4 text-left transition-colors hover:bg-accent/50"
              >
                <div className="flex flex-wrap items-center gap-2">
                  <span className="rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-semibold text-primary">
                    {CATEGORY_EMOJI[c.category]} {c.category}
                  </span>
                  <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${statusColor(c.status)}`}>
                    {c.status}
                  </span>
                  {c.isOverdue && (
                    <span className="flex items-center gap-1 rounded-full bg-rose-100 px-2 py-0.5 text-[10px] font-bold text-rose-700">
                      <AlertTriangle className="size-3" /> OVERDUE
                    </span>
                  )}
                  <span className="ml-auto text-xs text-muted-foreground">
                    {new Date(c.updatedAt).toLocaleDateString()} · {c.bhawan}
                  </span>
                </div>
                <h3 className="mt-2 font-semibold text-foreground">{c.title}</h3>
                <p className="mt-1 line-clamp-1 text-sm text-muted-foreground">{c.description}</p>
                <div className="mt-2 flex items-center gap-3 text-xs text-muted-foreground">
                  <span>Assigned: {ROLE_LABELS[c.assignedRole]}</span>
                  {c.comments.length > 0 && (
                    <span className="flex items-center gap-1"><MessageSquare className="size-3" /> {c.comments.length}</span>
                  )}
                </div>
              </button>
            </motion.div>
          ))}
        </AnimatePresence>
        {visible.length === 0 && (
          <div className="rounded-xl border border-dashed border-border bg-card p-10 text-center text-sm text-muted-foreground">
            No complaints match the current filters.
          </div>
        )}
      </div>

      {/* New Complaint Dialog */}
      <NewComplaintDialog open={showNew} onOpenChange={setShowNew} />

      {/* Detail Dialog */}
      {detail && (
        <ComplaintDetail complaint={detail} onClose={() => setDetailId(null)} />
      )}
    </div>
  );
}

/* ─── New Complaint ──────────────────────────────────────────────────────── */

function NewComplaintDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (v: boolean) => void }) {
  const { addComplaint, currentUser } = useStore();
  const [category, setCategory] = useState<Category>("Mess");
  const [title, setTitle] = useState("");
  const [desc, setDesc] = useState("");

  const submit = () => {
    if (!title.trim() || !desc.trim()) return;
    addComplaint({ authorId: currentUser.id, bhawan: currentUser.bhawan, category, title: title.trim(), description: desc.trim(), status: "Pending" });
    setTitle(""); setDesc(""); onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg rounded-xl border-border">
        <DialogHeader>
          <DialogTitle style={{ fontFamily: "Lora, serif" }}>New Complaint</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <p className="mb-2 text-xs font-semibold text-muted-foreground">Category (auto-routed)</p>
            <div className="grid grid-cols-3 gap-2">
              {ALL_CATEGORIES.map((c) => (
                <button key={c} onClick={() => setCategory(c)}
                  className={`rounded-lg border px-3 py-2 text-xs font-semibold transition-colors ${
                    category === c ? "border-primary bg-primary/10 text-primary" : "border-border bg-background text-muted-foreground"
                  }`}>
                  {CATEGORY_EMOJI[c]} {c}
                </button>
              ))}
            </div>
            <p className="mt-2 text-[10px] text-muted-foreground">
              → Auto-routed to: <strong>{ROLE_LABELS[CATEGORY_TO_ROLE[category]]}</strong>
            </p>
          </div>
          <Input placeholder="Title" value={title} onChange={(e) => setTitle(e.target.value)} className="rounded-lg border-border" />
          <Textarea placeholder="Describe the issue…" rows={4} value={desc} onChange={(e) => setDesc(e.target.value)} className="rounded-lg border-border" />
          <Button onClick={submit} className="w-full rounded-full bg-primary text-primary-foreground" disabled={!title.trim() || !desc.trim()}>
            Submit Complaint
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

/* ─── Complaint Detail ───────────────────────────────────────────────────── */

function ComplaintDetail({ complaint, onClose }: { complaint: Complaint; onClose: () => void }) {
  const { currentUser, updateComplaintStatus, reassignComplaint, addComplaintComment } = useStore();
  const [comment, setComment] = useState("");
  const [note, setNote] = useState("");
  const [reassignCat, setReassignCat] = useState<string>("");
  const role = currentUser.role;
  const isWarden = role === "Warden" || role === "AsstWarden";
  const isSecy = ["MessSec", "MaintSec", "GenSec", "SportsSec", "WellnessSec", "TechSec"].includes(role);
  const canManage = isWarden || (isSecy && complaint.assignedRole === role);

  return (
    <Dialog open onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto rounded-xl border-border">
        <DialogHeader>
          <div className="flex flex-wrap items-center gap-2">
            <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${statusColor(complaint.status)}`}>{complaint.status}</span>
            <span className="rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-semibold text-primary">
              {CATEGORY_EMOJI[complaint.category]} {complaint.category}
            </span>
            {complaint.isOverdue && (
              <span className="flex items-center gap-1 rounded-full bg-rose-100 px-2 py-0.5 text-[10px] font-bold text-rose-700">
                <AlertTriangle className="size-3" /> OVERDUE
              </span>
            )}
          </div>
          <DialogTitle className="mt-2" style={{ fontFamily: "Lora, serif" }}>{complaint.title}</DialogTitle>
        </DialogHeader>

        <p className="text-sm text-muted-foreground">{complaint.description}</p>
        <div className="flex items-center gap-4 text-xs text-muted-foreground">
          <span>Filed: {new Date(complaint.createdAt).toLocaleString()}</span>
          <span>Assigned: {ROLE_LABELS[complaint.assignedRole]}</span>
        </div>

        {/* Status Controls */}
        {canManage && (
          <div className="flex flex-wrap gap-2 border-t border-border pt-3">
            {(["Pending", "Under Progress", "Resolved", "Cannot Resolve"] as ComplaintStatus[]).map((s) => (
              <Button key={s} size="sm" variant="outline" disabled={complaint.status === s}
                onClick={() => {
                  if (s === "Cannot Resolve" || s === "Resolved") {
                    if (!note.trim()) { alert("Please enter a resolution note."); return; }
                    updateComplaintStatus(complaint.id, s, note);
                    setNote("");
                  } else {
                    updateComplaintStatus(complaint.id, s);
                  }
                }}
                className={`rounded-full text-xs font-semibold ${statusColor(s)} border-none`}>
                {s}
              </Button>
            ))}
          </div>
        )}

        {/* Resolution note (shown for Can't Resolve / Resolved) */}
        {canManage && (
          <div className="space-y-1">
            <Textarea placeholder="Resolution note (required for Resolved / Cannot Resolve)" rows={2} value={note} onChange={(e) => setNote(e.target.value)} className="rounded-lg border-border text-sm" />
          </div>
        )}

        {/* Reassign (wardens only) */}
        {isWarden && (
          <div className="flex items-center gap-2 border-t border-border pt-3">
            <ArrowRightLeft className="size-4 text-muted-foreground" />
            <span className="text-xs font-semibold">Reassign to:</span>
            <select value={reassignCat} onChange={(e) => setReassignCat(e.target.value)}
              className="rounded-lg border border-border bg-background px-2 py-1.5 text-xs">
              <option value="">Select category…</option>
              {ALL_CATEGORIES.filter((c) => c !== complaint.category).map((c) => (
                <option key={c} value={c}>{CATEGORY_EMOJI[c]} {c}</option>
              ))}
            </select>
            <Button size="sm" disabled={!reassignCat} onClick={() => { reassignComplaint(complaint.id, reassignCat as Category); setReassignCat(""); }}
              className="rounded-full bg-primary text-xs text-primary-foreground">
              Route
            </Button>
          </div>
        )}

        {/* Timeline */}
        <div className="border-t border-border pt-3">
          <h4 className="mb-2 text-xs font-bold text-foreground">Activity</h4>
          {complaint.comments.length === 0 ? (
            <p className="text-xs text-muted-foreground">No activity yet.</p>
          ) : (
            <div className="space-y-2">
              {complaint.comments.map((c, i) => (
                <div key={i} className="rounded-lg bg-muted/50 px-3 py-2 text-xs">
                  <span className="font-semibold text-foreground">{c.author}</span>
                  <span className="ml-2 text-muted-foreground">· {new Date(c.date).toLocaleString()}</span>
                  <p className="mt-1 text-muted-foreground">{c.text}</p>
                </div>
              ))}
            </div>
          )}
          <form onSubmit={(e) => { e.preventDefault(); if (!comment.trim()) return; addComplaintComment(complaint.id, comment); setComment(""); }}
            className="mt-3 flex gap-2">
            <Input placeholder="Add a comment…" value={comment} onChange={(e) => setComment(e.target.value)} className="rounded-lg border-border text-sm" />
            <Button type="submit" size="icon" className="size-9 shrink-0 rounded-full bg-primary text-primary-foreground" disabled={!comment.trim()}>
              <Send className="size-3.5" />
            </Button>
          </form>
        </div>
      </DialogContent>
    </Dialog>
  );
}
