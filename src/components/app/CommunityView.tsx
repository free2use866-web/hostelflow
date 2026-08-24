import { useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useStore } from "@/lib/store";
import type { Suggestion, SuggestionComment, SuggestionStatus } from "@/lib/types";
import { COMMUNITIES, IS_WARDEN_ROLE, scoreOf, timeAgo } from "@/lib/types";
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
  ArrowBigDown,
  ArrowBigUp,
  ChevronDown,
  ChevronRight,
  Clock,
  Compass,
  MessageCircle,
  Plus,
  ShieldCheck,
  TrendingUp,
  Trophy,
  Users,
} from "lucide-react";

/* ── Hot-ranking algorithm (Reddit-inspired) ─────────────────────────────── */
function hotScore(s: Suggestion): number {
  const hours = Math.max(
    0.5,
    (Date.now() - new Date(s.createdAt).getTime()) / 3600000,
  );
  return (scoreOf(s) + 1) / Math.pow(hours + 2, 1.4);
}

/* ── Types ──────────────────────────────────────────────────────────────── */
type SortKey = "hot" | "new" | "top";

const SORTS: { key: SortKey; label: string; Icon: typeof TrendingUp }[] = [
  { key: "hot", label: "Hot", Icon: TrendingUp },
  { key: "new", label: "New", Icon: Clock },
  { key: "top", label: "Top", Icon: Trophy },
];

/* ── Vote Widget ────────────────────────────────────────────────────────── */
function VoteWidget({
  score,
  myVote,
  onUp,
  onDown,
  compact,
}: {
  score: number;
  myVote: "up" | "down" | null;
  onUp: () => void;
  onDown: () => void;
  compact?: boolean;
}) {
  const size = compact ? "size-4" : "size-6";
  return (
    <div
      className={`flex shrink-0 flex-col items-center gap-0.5 ${compact ? "" : "w-10 pt-3"}`}
      onClick={(e) => e.stopPropagation()}
    >
      <button
        onClick={onUp}
        className={`transition-colors ${myVote === "up" ? "text-orange-500" : "text-muted-foreground hover:text-orange-500"}`}
      >
        <ArrowBigUp
          className={`${size} ${myVote === "up" ? "fill-current" : ""}`}
        />
      </button>
      <span
        className={`${compact ? "text-[10px]" : "text-xs"} font-bold ${myVote === "up" ? "text-orange-500" : myVote === "down" ? "text-indigo-400" : "text-foreground"}`}
      >
        {score}
      </span>
      <button
        onClick={onDown}
        className={`transition-colors ${myVote === "down" ? "text-indigo-400" : "text-muted-foreground hover:text-indigo-400"}`}
      >
        <ArrowBigDown
          className={`${size} ${myVote === "down" ? "fill-current" : ""}`}
        />
      </button>
    </div>
  );
}

/* ── Main View ──────────────────────────────────────────────────────────── */
export function CommunityView() {
  const { currentUser, suggestions, joinedBy } = useStore();
  const isWarden = IS_WARDEN_ROLE(currentUser.role);
  const [community, setCommunity] = useState("all");
  const [sort, setSort] = useState<SortKey>("hot");
  const [showCreate, setShowCreate] = useState(false);
  const [openPost, setOpenPost] = useState<Suggestion | null>(null);

  const feed = useMemo(() => {
    let list =
      community === "all"
        ? [...suggestions]
        : suggestions.filter((s) => s.category === community);
    if (sort === "new")
      list.sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt));
    else if (sort === "top")
      list.sort((a, b) => scoreOf(b) - scoreOf(a));
    else list.sort((a, b) => hotScore(b) - hotScore(a));
    return list;
  }, [suggestions, community, sort]);

  const livePost = openPost
    ? suggestions.find((s) => s.id === openPost.id) ?? null
    : null;

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_300px]">
      {/* ── Feed ──────────────────────────────────────────────────────── */}
      <div className="min-w-0 space-y-4">
        {/* Header */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2
              className="text-xl font-bold text-foreground"
              style={{ fontFamily: "Lora, serif" }}
            >
              Community
            </h2>
            <p className="text-xs text-muted-foreground">
              r/-style boards for every corner of hostel life
            </p>
          </div>
          <Button
            onClick={() => setShowCreate(true)}
            className="rounded-full bg-orange-600 text-white hover:bg-orange-700"
          >
            <Plus className="mr-1 size-3.5" /> Create Post
          </Button>
        </div>

        {/* Community tabs */}
        <div className="flex gap-1.5 overflow-x-auto pb-1">
          <button
            onClick={() => setCommunity("all")}
            className={`flex shrink-0 items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors ${community === "all" ? "border-orange-500 bg-orange-500 text-white" : "border-border bg-card text-muted-foreground hover:border-orange-300"}`}
          >
            <Compass className="size-3" /> All
          </button>
          {COMMUNITIES.map((c) => (
            <button
              key={c.id}
              onClick={() => setCommunity(c.id)}
              className={`flex shrink-0 items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors ${community === c.id ? "border-orange-500 bg-orange-500 text-white" : "border-border bg-card text-muted-foreground hover:border-orange-300"}`}
            >
              <span>{c.icon}</span> r/{c.name}
            </button>
          ))}
        </div>

        {/* Sort bar */}
        <div className="flex items-center gap-1 rounded-lg border border-border bg-card p-1">
          {SORTS.map((s) => (
            <button
              key={s.key}
              onClick={() => setSort(s.key)}
              className={`flex items-center gap-1 rounded-md px-3 py-1.5 text-xs font-semibold transition-colors ${sort === s.key ? "bg-orange-100 text-orange-700" : "text-muted-foreground hover:bg-muted"}`}
            >
              <s.Icon className="size-3.5" /> {s.label}
            </button>
          ))}
        </div>

        {/* Posts */}
        <div className="space-y-3">
          <AnimatePresence>
            {feed.map((post, i) => (
              <motion.div
                key={post.id}
                layout
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ delay: i * 0.02 }}
              >
                <PostCard post={post} onClick={() => setOpenPost(post)} />
              </motion.div>
            ))}
          </AnimatePresence>
          {feed.length === 0 && (
            <div className="rounded-xl border border-dashed border-border bg-card p-12 text-center text-sm text-muted-foreground">
              <Compass className="mx-auto mb-2 size-8 opacity-40" />
              {community === "all"
                ? "No posts yet — be the first to start a discussion."
                : `No posts in r/${community} yet.`}
            </div>
          )}
        </div>
      </div>

      {/* ── Sidebar ───────────────────────────────────────────────────── */}
      <CommunitySidebar
        activeId={community}
        onSelect={(id) => setCommunity(id)}
      />

      {/* ── Dialogs ───────────────────────────────────────────────────── */}
      <CreatePostDialog open={showCreate} onOpenChange={setShowCreate} />
      {livePost && (
        <PostDetail post={livePost} onClose={() => setOpenPost(null)} />
      )}
    </div>
  );
}

/* ── Post Card ──────────────────────────────────────────────────────────── */
function PostCard({
  post,
  onClick,
}: {
  post: Suggestion;
  onClick: () => void;
}) {
  const { currentUser, users, voteSuggestion } = useStore();
  const score = scoreOf(post);
  const myVote = post.upvotedBy.includes(currentUser.id)
    ? ("up" as const)
    : post.downvotedBy.includes(currentUser.id)
      ? ("down" as const)
      : null;
  const community = COMMUNITIES.find((c) => c.id === post.category);
  const author = users.find((u) => u.id === post.authorId);

  return (
    <div className="flex gap-0 rounded-xl border border-border bg-card transition-colors hover:border-orange-200">
      <VoteWidget
        score={score}
        myVote={myVote}
        onUp={() => voteSuggestion(post.id, "up")}
        onDown={() => voteSuggestion(post.id, "down")}
      />
      <button
        onClick={onClick}
        className="min-w-0 flex-1 p-3 text-left"
      >
        {/* Meta */}
        <div className="flex flex-wrap items-center gap-1.5 text-xs text-muted-foreground">
          {community && (
            <span className="rounded-full bg-orange-50 px-2 py-0.5 font-semibold text-orange-700">
              {community.icon} r/{community.name}
            </span>
          )}
          <span className="text-muted-foreground">
            Posted by {author?.name ?? "Unknown"}
          </span>
          <span>·</span>
          <span>{timeAgo(post.createdAt)}</span>
        </div>

        {/* Title */}
        <h3
          className="mt-1.5 font-bold text-foreground"
          style={{ fontFamily: "Lora, serif" }}
        >
          {post.title}
        </h3>

        {/* Preview */}
        <p className="mt-1 line-clamp-2 text-sm leading-relaxed text-muted-foreground">
          {post.description}
        </p>

        {/* Status + Comments */}
        <div className="mt-2.5 flex flex-wrap items-center gap-3 text-xs">
          <span className="flex items-center gap-1 rounded-full bg-muted px-2.5 py-1 font-semibold text-muted-foreground">
            <MessageCircle className="size-3" /> {post.comments.length}
          </span>
          <StatusChip status={post.status} />
          {post.status === "Approved" && (
            <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-700">
              ✓ Warden Approved
            </span>
          )}
        </div>

        {/* Warden feedback preview */}
        {post.wardenFeedback && (
          <div className="mt-2.5 rounded-lg border border-primary/20 bg-primary/5 px-3 py-2">
            <p className="text-xs font-bold text-primary">
              🏛 Warden Feedback
            </p>
            <p className="mt-0.5 line-clamp-1 text-xs text-muted-foreground">
              {post.wardenFeedback}
            </p>
          </div>
        )}
      </button>
    </div>
  );
}

/* ── Status Chip ────────────────────────────────────────────────────────── */
function StatusChip({ status }: { status: string }) {
  const m: Record<string, string> = {
    Open: "bg-amber-100 text-amber-700",
    "Under Review": "bg-sky-100 text-sky-700",
    Approved: "bg-emerald-100 text-emerald-700",
    Implemented: "bg-emerald-100 text-emerald-700",
  };
  return (
    <span
      className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${m[status] ?? "bg-gray-100 text-gray-600"}`}
    >
      {status}
    </span>
  );
}

/* ── Post Detail Dialog (with threaded comments) ────────────────────────── */
function PostDetail({
  post,
  onClose,
}: {
  post: Suggestion;
  onClose: () => void;
}) {
  const { currentUser, users, voteSuggestion, addSuggestionComment } =
    useStore();
  const isWarden = IS_WARDEN_ROLE(currentUser.role);
  const [text, setText] = useState("");

  const score = scoreOf(post);
  const myVote = post.upvotedBy.includes(currentUser.id)
    ? ("up" as const)
    : post.downvotedBy.includes(currentUser.id)
      ? ("down" as const)
      : null;
  const community = COMMUNITIES.find((c) => c.id === post.category);
  const author = users.find((u) => u.id === post.authorId);

  const topComments = post.comments
    .filter((c) => c.parentId === null)
    .sort((a, b) => scoreOf(b) - scoreOf(a));

  const submitComment = () => {
    if (!text.trim()) return;
    addSuggestionComment(post.id, text.trim());
    setText("");
  };

  return (
    <Dialog open onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-h-[85vh] max-w-2xl overflow-y-auto rounded-xl border-border">
        <DialogHeader>
          <DialogTitle
            className="pr-6"
            style={{ fontFamily: "Lora, serif" }}
          >
            {post.title}
          </DialogTitle>
        </DialogHeader>

        {/* Post body */}
        <div className="flex gap-3">
          <VoteWidget
            score={score}
            myVote={myVote}
            onUp={() => voteSuggestion(post.id, "up")}
            onDown={() => voteSuggestion(post.id, "down")}
          />
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
              {community && (
                <span className="rounded-full bg-orange-50 px-2 py-0.5 font-semibold text-orange-700">
                  {community.icon} r/{community.name}
                </span>
              )}
              <span>Posted by {author?.name ?? "Unknown"}</span>
              <span>·</span>
              <span>{timeAgo(post.createdAt)}</span>
              <StatusChip status={post.status} />
            </div>
            <p className="mt-3 whitespace-pre-wrap text-sm leading-relaxed text-foreground">
              {post.description}
            </p>
            {post.wardenFeedback && (
              <div className="mt-4 rounded-lg border border-primary/20 bg-primary/5 p-3">
                <p className="text-xs font-bold text-primary">
                  🏛 Warden Feedback
                </p>
                <p className="mt-1 text-sm text-muted-foreground">
                  {post.wardenFeedback}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Comment composer */}
        <div className="mt-4 flex gap-2">
          <Textarea
            rows={2}
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="What are your thoughts?"
            className="flex-1 rounded-lg border-border text-sm"
          />
          <Button
            size="sm"
            disabled={!text.trim()}
            onClick={submitComment}
            className="self-end rounded-full bg-orange-600 text-white hover:bg-orange-700"
          >
            Reply
          </Button>
        </div>

        {/* Comments */}
        <div className="mt-3 space-y-1 border-t border-border pt-3">
          {topComments.length === 0 ? (
            <p className="py-4 text-center text-xs text-muted-foreground">
              No comments yet — start the discussion.
            </p>
          ) : (
            topComments.map((c) => (
              <CommentNode
                key={c.id}
                comment={c}
                all={post.comments}
                suggestionId={post.id}
                depth={0}
              />
            ))
          )}
        </div>

        {/* Warden moderation */}
        {isWarden && <ModerationPanel post={post} />}
      </DialogContent>
    </Dialog>
  );
}

/* ── Threaded Comment ───────────────────────────────────────────────────── */
function CommentNode({
  comment,
  all,
  suggestionId,
  depth,
}: {
  comment: SuggestionComment;
  all: SuggestionComment[];
  suggestionId: string;
  depth: number;
}) {
  const { currentUser, voteComment, addSuggestionComment } = useStore();
  const [collapsed, setCollapsed] = useState(false);
  const [replying, setReplying] = useState(false);
  const [reply, setReply] = useState("");

  const children = all
    .filter((c) => c.parentId === comment.id)
    .sort((a, b) => scoreOf(b) - scoreOf(a));
  const score = scoreOf(comment);
  const myVote = comment.upvotedBy.includes(currentUser.id)
    ? ("up" as const)
    : comment.downvotedBy.includes(currentUser.id)
      ? ("down" as const)
      : null;

  return (
    <div
      className={`${depth > 0 ? "ml-4 border-l-2 border-orange-200 pl-3" : ""}`}
    >
      <div className="py-2">
        {/* Header */}
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="rounded p-0.5 hover:bg-muted"
          >
            {collapsed ? (
              <ChevronRight className="size-3" />
            ) : (
              <ChevronDown className="size-3" />
            )}
          </button>
          <span className="flex size-5 items-center justify-center rounded-full bg-orange-100 text-[9px] font-bold text-orange-700">
            {comment.authorName.charAt(0)}
          </span>
          <span className="font-semibold text-foreground">
            {comment.authorName}
          </span>
          <span>· {timeAgo(comment.createdAt)}</span>
        </div>

        {!collapsed && (
          <>
            <p className="mt-1 pl-5 text-sm leading-relaxed text-foreground">
              {comment.text}
            </p>
            <div className="mt-1 flex items-center gap-2 pl-5">
              <button
                onClick={() =>
                  voteComment(suggestionId, comment.id, "up")
                }
                aria-label="Upvote comment"
                aria-pressed={myVote === "up"}
                className={`${myVote === "up" ? "text-orange-500" : "text-muted-foreground hover:text-orange-500"}`}
              >
                <ArrowBigUp
                  className={`size-4 ${myVote === "up" ? "fill-current" : ""}`}
                />
              </button>
              <span className="text-[10px] font-bold">{score}</span>
              <button
                onClick={() =>
                  voteComment(suggestionId, comment.id, "down")
                }
                aria-label="Downvote comment"
                aria-pressed={myVote === "down"}
                className={`${myVote === "down" ? "text-indigo-400" : "text-muted-foreground hover:text-indigo-400"}`}
              >
                <ArrowBigDown
                  className={`size-4 ${myVote === "down" ? "fill-current" : ""}`}
                />
              </button>
              <button
                onClick={() => setReplying(!replying)}
                className="ml-1 text-[10px] font-bold text-muted-foreground hover:text-primary"
              >
                Reply
              </button>
            </div>

            {replying && (
              <div className="mt-2 space-y-2 pl-5">
                <Textarea
                  rows={2}
                  value={reply}
                  onChange={(e) => setReply(e.target.value)}
                  placeholder={`Reply to ${comment.authorName}...`}
                  className="text-sm"
                />
                <div className="flex justify-end gap-2">
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => setReplying(false)}
                  >
                    Cancel
                  </Button>
                  <Button
                    size="sm"
                    disabled={!reply.trim()}
                    onClick={() => {
                      addSuggestionComment(
                        suggestionId,
                        reply,
                        comment.id,
                      );
                      setReply("");
                      setReplying(false);
                    }}
                    className="rounded-full bg-orange-600 text-white hover:bg-orange-700"
                  >
                    Reply
                  </Button>
                </div>
              </div>
            )}

            {children.map((child) => (
              <CommentNode
                key={child.id}
                comment={child}
                all={all}
                suggestionId={suggestionId}
                depth={depth + 1}
              />
            ))}
          </>
        )}
      </div>
    </div>
  );
}

/* ── Warden Moderation Panel (inside detail dialog) ─────────────────────── */
function ModerationPanel({ post }: { post: Suggestion }) {
  const { updateSuggestionStatus } = useStore();
  const [feedback, setFeedback] = useState(post.wardenFeedback ?? "");
  const statuses: SuggestionStatus[] = [
    "Open",
    "Under Review",
    "Approved",
    "Implemented",
  ];

  return (
    <div className="mt-4 rounded-lg border border-primary/30 bg-primary/5 p-4">
      <p className="flex items-center gap-1.5 text-xs font-bold text-primary">
        <ShieldCheck className="size-3.5" /> Warden Moderation
      </p>
      <Textarea
        rows={3}
        value={feedback}
        onChange={(e) => setFeedback(e.target.value)}
        placeholder="Official warden feedback..."
        className="mt-2 rounded-lg border-border text-sm"
      />
      <div className="mt-2 flex flex-wrap gap-1.5">
        {statuses.map((s) => (
          <Button
            key={s}
            size="sm"
            variant={post.status === s ? "default" : "outline"}
            onClick={() =>
              updateSuggestionStatus(
                post.id,
                s,
                feedback || undefined,
              )
            }
            className="rounded-full text-xs font-semibold"
          >
            {s}
          </Button>
        ))}
      </div>
    </div>
  );
}

/* ── Create Post Dialog ─────────────────────────────────────────────────── */
function CreatePostDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
}) {
  const { currentUser, addSuggestion } = useStore();
  const [community, setCommunity] = useState(COMMUNITIES[0].id);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");

  const submit = () => {
    if (!title.trim() || !body.trim()) return;
    addSuggestion({
      authorId: currentUser.id,
      bhawan: currentUser.bhawan,
      category: community,
      title: title.trim(),
      description: body.trim(),
    });
    setTitle("");
    setBody("");
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg rounded-xl border-border">
        <DialogHeader>
          <DialogTitle style={{ fontFamily: "Lora, serif" }}>
            Create a post
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <div className="flex flex-wrap gap-1.5">
            {COMMUNITIES.map((c) => (
              <button
                key={c.id}
                onClick={() => setCommunity(c.id)}
                className={`flex items-center gap-1 rounded-full border px-2.5 py-1 text-[10px] font-semibold transition-colors ${community === c.id ? "border-orange-500 bg-orange-500 text-white" : "border-border text-muted-foreground hover:border-orange-300"}`}
              >
                {c.icon} r/{c.name}
              </button>
            ))}
          </div>
          <Input
            placeholder="Title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="rounded-lg border-border"
          />
          <Textarea
            rows={5}
            placeholder="Write your post..."
            value={body}
            onChange={(e) => setBody(e.target.value)}
            className="rounded-lg border-border text-sm"
          />
          <Button
            onClick={submit}
            disabled={!title.trim() || !body.trim()}
            className="w-full rounded-full bg-orange-600 text-white hover:bg-orange-700"
          >
            Post
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

/* ── Right Sidebar ──────────────────────────────────────────────────────── */
function CommunitySidebar({
  activeId,
  onSelect,
}: {
  activeId: string;
  onSelect: (id: string) => void;
}) {
  const { suggestions, joinedBy, currentUser, toggleJoin } = useStore();
  const active = activeId !== "all" ? COMMUNITIES.find((c) => c.id === activeId) : null;
  const myJoined = joinedBy[currentUser.id] ?? [];

  const memberCount = (id: string) => {
    const c = COMMUNITIES.find((x) => x.id === id);
    return (c?.baseMembers ?? 0) + suggestions.filter((s) => s.category === id).length * 7;
  };

  const postCount = (id: string) =>
    suggestions.filter((s) => s.category === id).length;

  return (
    <aside className="hidden space-y-4 lg:block">
      {/* About card */}
      {active ? (
        <div className="overflow-hidden rounded-xl border border-border bg-card">
          <div className={`h-16 bg-gradient-to-r ${active.bannerClass}`} />
          <div className="space-y-3 p-4">
            <div className="-mt-8 flex items-end gap-2">
              <span className="flex size-12 items-center justify-center rounded-full border-4 border-card bg-background text-2xl">
                {active.icon}
              </span>
            </div>
            <div>
              <p className="font-bold text-foreground">r/{active.name}</p>
              <p className="mt-0.5 text-xs text-muted-foreground">
                {active.description}
              </p>
            </div>
            <div className="flex gap-5 text-xs">
              <div>
                <p className="font-bold text-foreground">
                  {memberCount(active.id).toLocaleString()}
                </p>
                <p className="text-muted-foreground">Members</p>
              </div>
              <div>
                <p className="font-bold text-foreground">
                  {postCount(active.id)}
                </p>
                <p className="text-muted-foreground">Posts</p>
              </div>
            </div>
            <Button
              onClick={() => toggleJoin(active.id)}
              variant={myJoined.includes(active.id) ? "outline" : "default"}
              className="w-full rounded-full text-xs"
            >
              {myJoined.includes(active.id) ? "Joined ✓" : "Join Community"}
            </Button>
          </div>
        </div>
      ) : (
        <div className="rounded-xl border border-border bg-card p-4">
          <p
            className="mb-1 font-bold text-foreground"
            style={{ fontFamily: "Lora, serif" }}
          >
            Home
          </p>
          <p className="text-xs text-muted-foreground">
            Your campus communities. Pick a board above or below to filter
            the feed.
          </p>
        </div>
      )}

      {/* All communities list */}
      <div className="rounded-xl border border-border bg-card p-2">
        <p className="px-2 py-1.5 text-[10px] font-bold uppercase tracking-wide text-muted-foreground">
          All Communities
        </p>
        {COMMUNITIES.map((c) => {
          const joined = myJoined.includes(c.id);
          return (
            <div
              key={c.id}
              className="flex items-center gap-2.5 rounded-lg px-2 py-2 transition-colors hover:bg-muted/60"
            >
              <span className="text-base">{c.icon}</span>
              <button
                onClick={() => onSelect(c.id)}
                className="min-w-0 flex-1 text-left text-xs font-semibold text-foreground hover:text-orange-600"
              >
                r/{c.name}
              </button>
              <span className="shrink-0 text-[10px] text-muted-foreground">
                {memberCount(c.id).toLocaleString()}
              </span>
              <button
                onClick={() => toggleJoin(c.id)}
                className={`shrink-0 rounded-full px-2 py-0.5 text-[9px] font-bold transition-colors ${joined ? "bg-orange-100 text-orange-700" : "bg-muted text-muted-foreground hover:bg-orange-100 hover:text-orange-700"}`}
              >
                {joined ? "Joined" : "Join"}
              </button>
            </div>
          );
        })}
      </div>
    </aside>
  );
}
