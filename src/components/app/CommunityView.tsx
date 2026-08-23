import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useStore } from "@/lib/store";
import type { Suggestion, SuggestionStatus } from "@/lib/types";
import { IS_WARDEN_ROLE } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { MessageSquareText, ThumbsUp, Plus, Star } from "lucide-react";

function statusColor(s: string) {
  const m: Record<string, string> = {
    Open: "bg-amber-100 text-amber-800", "Under Review": "bg-sky-100 text-sky-800",
    Approved: "bg-emerald-100 text-emerald-800", Implemented: "bg-emerald-100 text-emerald-800",
  };
  return m[s] ?? "bg-gray-100 text-gray-800";
}

export function CommunityView() {
  const store = useStore();
  const { currentUser, suggestions, upvoteSuggestion, updateSuggestionStatus, addSuggestion } = store;
  const isWarden = IS_WARDEN_ROLE(currentUser.role);
  const [tab, setTab] = useState<string>("all");
  const [showNew, setShowNew] = useState(false);
  const [detail, setDetail] = useState<Suggestion | null>(null);

  const filtered = tab === "all" ? suggestions : suggestions.filter((s) => tab === "open" ? s.status === "Open" : s.status === "Approved" || s.status === "Implemented");
  const sorted = [...filtered].sort((a, b) => b.upvotes - a.upvotes);

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-foreground" style={{ fontFamily: "Lora, serif" }}>
            <ThumbsUp className="mr-1.5 inline size-5 text-primary" /> Community Board
          </h2>
          <p className="text-xs text-muted-foreground">Upvote ideas you support — top suggestions reach the Warden dashboard.</p>
        </div>
        <Button onClick={() => setShowNew(true)} className="rounded-full bg-primary text-primary-foreground">
          <Plus className="mr-1.5 size-3.5" /> Suggest
        </Button>
      </div>

      <div className="flex gap-2">
        {["all", "open", "approved"].map((k) => {
          const labels: Record<string, string> = { all: "All", open: "Open", approved: "Approved & Implemented" };
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
        <AnimatePresence>
          {sorted.map((s, i) => {
            const voted = s.upvotedBy.includes(currentUser.id);
            return (
              <motion.div key={s.id} layout initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }}>
                <div className="flex gap-4 rounded-xl border border-border bg-card p-4">
                  <button onClick={() => upvoteSuggestion(s.id)}
                    className={`flex shrink-0 flex-col items-center gap-0.5 rounded-lg px-3 py-2 transition-colors ${
                      voted ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:bg-primary/10 hover:text-primary"
                    }`}>
                    <ThumbsUp className="size-4" />
                    <span className="text-sm font-bold">{s.upvotes}</span>
                  </button>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="font-semibold text-foreground" style={{ fontFamily: "Lora, serif" }}>{s.title}</h3>
                      <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${statusColor(s.status)}`}>{s.status}</span>
                    </div>
                    <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{s.description}</p>
                    <div className="mt-2 flex items-center gap-3 text-xs text-muted-foreground">
                      <span className="rounded-full bg-muted px-2 py-0.5">{s.category}</span>
                      <span>{s.bhawan} Bhawan</span>
                      <span>{new Date(s.createdAt).toLocaleDateString()}</span>
                    </div>
                    {s.wardenFeedback && (
                      <div className="mt-3 rounded-lg bg-primary/5 border border-primary/20 p-3">
                        <p className="mb-1 flex items-center gap-1 text-xs font-bold text-primary">
                          <MessageSquareText className="size-3" /> Warden Feedback
                        </p>
                        <p className="text-sm text-muted-foreground">{s.wardenFeedback}</p>
                      </div>
                    )}
                  </div>
                  {isWarden && (
                    <div className="shrink-0">
                      <Button variant="ghost" size="sm" onClick={() => setDetail(s)} className="text-xs text-primary">
                        Review
                      </Button>
                    </div>
                  )}
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
        {sorted.length === 0 && (
          <div className="rounded-xl border border-dashed border-border bg-card p-10 text-center text-sm text-muted-foreground">
            No suggestions yet. Be the first to suggest!
          </div>
        )}
      </div>

      <NewSuggestionDialog open={showNew} onOpenChange={setShowNew} />
      {detail && <WardenReviewDialog suggestion={detail} onClose={() => setDetail(null)} />}
    </div>
  );
}

function NewSuggestionDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (v: boolean) => void }) {
  const { currentUser, addSuggestion } = useStore();
  const [title, setTitle] = useState("");
  const [desc, setDesc] = useState("");
  const [cat, setCat] = useState("General");

  const submit = () => {
    if (!title.trim() || !desc.trim()) return;
    addSuggestion({ authorId: currentUser.id, bhawan: currentUser.bhawan, category: cat, title: title.trim(), description: desc.trim() });
    setTitle(""); setDesc(""); onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md rounded-xl border-border">
        <DialogHeader>
          <DialogTitle style={{ fontFamily: "Lora, serif" }}>New Suggestion</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <Input placeholder="Title" value={title} onChange={(e) => setTitle(e.target.value)} className="rounded-lg border-border" />
          <div className="flex gap-2">
            {["General", "Mess", "Maintenance", "Sports", "Wellness", "Technical"].map((c) => (
              <button key={c} onClick={() => setCat(c)}
                className={`rounded-full px-2.5 py-1 text-[10px] font-semibold ${cat === c ? "bg-primary text-primary-foreground" : "border border-border text-muted-foreground"}`}>
                {c}
              </button>
            ))}
          </div>
          <Textarea placeholder="Describe your idea…" rows={4} value={desc} onChange={(e) => setDesc(e.target.value)} className="rounded-lg border-border text-sm" />
          <Button onClick={submit} className="w-full rounded-full bg-primary text-primary-foreground" disabled={!title.trim() || !desc.trim()}>
            Submit Suggestion
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function WardenReviewDialog({ suggestion, onClose }: { suggestion: Suggestion; onClose: () => void }) {
  const { updateSuggestionStatus } = useStore();
  const [feedback, setFeedback] = useState(suggestion.wardenFeedback ?? "");

  return (
    <Dialog open onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-md rounded-xl border-border">
        <DialogHeader>
          <DialogTitle style={{ fontFamily: "Lora, serif" }}>
            <Star className="mr-1.5 inline size-4 text-primary" /> Review Suggestion
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <h3 className="font-semibold text-foreground">{suggestion.title}</h3>
          <p className="text-sm text-muted-foreground">{suggestion.description}</p>
          <p className="text-xs text-muted-foreground">
            👍 {suggestion.upvotes} upvotes · {suggestion.bhawan} · {suggestion.category}
          </p>
          <Textarea placeholder="Warden feedback…" rows={3} value={feedback} onChange={(e) => setFeedback(e.target.value)} className="rounded-lg border-border text-sm" />
          <div className="flex flex-wrap gap-2">
            {(["Open", "Under Review", "Approved", "Implemented"] as SuggestionStatus[]).map((s) => (
              <Button key={s} size="sm" variant="outline"
                onClick={() => { updateSuggestionStatus(suggestion.id, s, feedback || undefined); onClose(); }}
                className={`rounded-full text-xs font-semibold ${statusColor(s)} border-none`}>
                {s}
              </Button>
            ))}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
