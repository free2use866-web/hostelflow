import { useState } from "react";
import { motion } from "framer-motion";
import { useStore } from "@/lib/store";
import {
  IS_WARDEN_ROLE,
  IS_SECY_ROLE,
  ROLE_LABELS,
  timeAgo,
} from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Bell,
  Megaphone,
  Pin,
  Plus,
  Trash2,
} from "lucide-react";

export function NoticeBoard() {
  const { currentUser, users, notices, addNotice, deleteNotice } = useStore();
  const [showComposer, setShowComposer] = useState(false);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

  const canPost = IS_WARDEN_ROLE(currentUser.role) || IS_SECY_ROLE(currentUser.role);

  // Filter notices by user's bhawan
  const bhawanNotices = notices
    .filter((n) => n.bhawan === currentUser.bhawan)
    .sort((a, b) => {
      if (a.pinned && !b.pinned) return -1;
      if (!a.pinned && b.pinned) return 1;
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });

  const handlePost = () => {
    if (!title.trim() || !body.trim()) return;
    addNotice({
      authorId: currentUser.id,
      bhawan: currentUser.bhawan,
      title: title.trim(),
      body: body.trim(),
      pinned: false,
    });
    setTitle("");
    setBody("");
    setShowComposer(false);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1
            className="text-2xl font-bold text-foreground"
            style={{ fontFamily: "Lora, serif" }}
          >
            📌 Notice Board — {currentUser.bhawan}
          </h1>
          <p className="text-sm text-muted-foreground">
            {canPost
              ? "Post notices visible to all residents of your bhawan."
              : "Official notices from your wardens and secretaries."}
          </p>
        </div>
        {canPost && (
          <Button
            onClick={() => setShowComposer(true)}
            className="rounded-full bg-primary px-4 text-xs font-semibold text-primary-foreground"
          >
            <Plus className="mr-1.5 size-3.5" /> New Notice
          </Button>
        )}
      </div>

      {/* Notices feed */}
      {bhawanNotices.length === 0 ? (
        <div className="rounded-xl border border-border bg-card p-10 text-center">
          <Bell className="mx-auto mb-4 size-10 text-muted-foreground/30" />
          <p className="text-sm font-semibold text-foreground">No notices yet</p>
          <p className="mt-1 text-xs text-muted-foreground">
            {canPost
              ? "Post the first notice for your bhawan residents."
              : "Your wardens and secretaries haven't posted any notices yet."}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {bhawanNotices.map((notice, i) => {
            const author = users.find((u) => u.id === notice.authorId);
            const isAuthor = notice.authorId === currentUser.id;
            const canDelete = canPost && (isAuthor || IS_WARDEN_ROLE(currentUser.role));

            return (
              <motion.div
                key={notice.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.04 }}
                className={`rounded-xl border bg-card p-5 ${
                  notice.pinned
                    ? "border-amber-300 ring-1 ring-amber-200"
                    : "border-border"
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1.5">
                      {notice.pinned && (
                        <span className="rounded bg-amber-100 px-1.5 py-0.5 text-[9px] font-bold text-amber-700 flex items-center gap-0.5">
                          <Pin className="size-2.5" /> PINNED
                        </span>
                      )}
                    </div>
                    <h3
                      className="font-bold text-foreground"
                      style={{ fontFamily: "Lora, serif" }}
                    >
                      {notice.title}
                    </h3>
                    <p className="mt-2 text-sm leading-relaxed text-muted-foreground whitespace-pre-line">
                      {notice.body}
                    </p>
                    <div className="mt-3 flex items-center gap-2">
                      <span className="flex size-5 items-center justify-center rounded-full bg-primary/15 text-[9px] font-bold text-primary">
                        {author?.name.charAt(0) ?? "?"}
                      </span>
                      <span className="text-[11px] font-semibold text-foreground">
                        {author?.name ?? "Unknown"}
                      </span>
                      <span className="rounded-full bg-primary/10 px-1.5 py-0.5 text-[8px] font-bold text-primary">
                        {author ? ROLE_LABELS[author.role] : ""}
                      </span>
                      <span className="text-[10px] text-muted-foreground">
                        · {timeAgo(notice.createdAt)}
                      </span>
                    </div>
                  </div>

                  {canDelete && (
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => setConfirmDelete(notice.id)}
                      className="size-7 shrink-0 text-muted-foreground hover:text-destructive"
                    >
                      <Trash2 className="size-3.5" />
                    </Button>
                  )}
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* Composer Dialog */}
      <Dialog open={showComposer} onOpenChange={(o) => !o && setShowComposer(false)}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle
              style={{ fontFamily: "Lora, serif" }}
              className="flex items-center gap-2"
            >
              <Megaphone className="size-4 text-primary" /> New Notice
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3 pt-2">
            <div>
              <label className="mb-1 block text-xs font-semibold text-foreground">Title</label>
              <Input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Mess timings changed for exams"
                className="h-9 text-sm"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold text-foreground">Notice Body</label>
              <Textarea
                value={body}
                onChange={(e) => setBody(e.target.value)}
                placeholder="Write the full notice content here..."
                rows={5}
                className="text-sm"
              />
            </div>
            <div className="rounded-lg bg-muted/50 px-3 py-2">
              <p className="text-[10px] text-muted-foreground">
                This notice will be visible to <strong>all residents of {currentUser.bhawan} Bhawan</strong>.
              </p>
            </div>
            <Button
              onClick={handlePost}
              disabled={!title.trim() || !body.trim()}
              className="w-full rounded-full bg-primary text-xs font-semibold text-primary-foreground"
            >
              <Megaphone className="mr-1.5 size-3.5" /> Post Notice
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <Dialog open={!!confirmDelete} onOpenChange={(o) => !o && setConfirmDelete(null)}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle style={{ fontFamily: "Lora, serif" }}>Delete Notice</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            This notice will be permanently removed from the board.
          </p>
          <div className="flex gap-2 pt-2">
            <Button
              variant="outline"
              onClick={() => setConfirmDelete(null)}
              className="flex-1 rounded-full text-xs"
            >
              Cancel
            </Button>
            <Button
              onClick={() => {
                if (confirmDelete) deleteNotice(confirmDelete);
                setConfirmDelete(null);
              }}
              className="flex-1 rounded-full bg-destructive text-xs text-destructive-foreground"
            >
              Delete
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
