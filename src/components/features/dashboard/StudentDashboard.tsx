import { motion } from "framer-motion";
import {
  Clock,
  FileText,
  MessageCircle,
  MessageSquare,
  Pizza,
  TrendingUp,
} from "lucide-react";
import { useStore } from "@/lib/store";
import {
  COMMUNITIES,
  isOverdueNow,
  scoreOf,
  timeAgo,
} from "@/lib/types";
import { SectionCard, StatCard, StatusBadge } from "./primitives";
import { Button } from "@/components/ui/button";

const QUICK_ACTIONS = [
  {
    label: "File a Complaint",
    desc: "Auto-routed to the right secretary",
    emoji: "📝",
    view: "complaints",
    tone: "bg-amber-50 border-amber-200 hover:border-amber-400",
  },
  {
    label: "Request Sick Meal",
    desc: "Khichdi / dalia delivered to your room",
    emoji: "🍲",
    view: "mess",
    tone: "bg-purple-50 border-purple-200 hover:border-purple-400",
  },
  {
    label: "Apply for a Pass",
    desc: "Late entry, gear checkout or guest stay",
    emoji: "🎫",
    view: "passes",
    tone: "bg-sky-50 border-sky-200 hover:border-sky-400",
  },
  {
    label: "Community",
    desc: "Post and vote in r/ boards",
    emoji: "💬",
    view: "community",
    tone: "bg-emerald-50 border-emerald-200 hover:border-emerald-400",
  },
] as const;

/**
 * Resident-student home view.
 * Extracted from the former RoleDashboards monolith.
 */
export function StudentDashboard({
  onNavigate,
}: {
  onNavigate: (k: string) => void;
}) {
  const store = useStore();
  const {
    currentUser,
    complaints,
    passes,
    rebates,
    sickDietRequests,
    messMenus,
    suggestions,
    specialAnnouncements,
  } = store;

  const myComplaints = complaints.filter(
    (c) => c.authorId === currentUser.id,
  );
  const openMine = myComplaints.filter(
    (c) => c.status === "Pending" || c.status === "Under Progress",
  );
  const myPasses = passes.filter(
    (p) => p.studentId === currentUser.id,
  );
  const myRebates = rebates.filter(
    (r) => r.studentId === currentUser.id,
  );
  const mySick = sickDietRequests.filter(
    (r) => r.studentId === currentUser.id,
  );

  const today = new Date().getDay();
  const todayMenu = messMenus.filter(
    (m) => m.bhawan === currentUser.bhawan && m.dayOfWeek === today,
  );

  const topPosts = [...suggestions]
    .sort((a, b) => scoreOf(b) - scoreOf(a))
    .slice(0, 4);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1
          className="text-2xl font-bold text-foreground"
          style={{ fontFamily: "Lora, serif" }}
        >
          Welcome, {currentUser.name.split(" ")[0]} 👋
        </h1>
        <p className="text-sm text-muted-foreground">
          {currentUser.bhawan} Bhawan · Room {currentUser.roomNo}
          {currentUser.branchName &&
            ` · ${currentUser.branchName}`}
          {currentUser.academicYear &&
            ` · Year ${currentUser.academicYear}`}
        </p>
      </div>

      {/* Quick actions */}
      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        {QUICK_ACTIONS.map((a, i) => (
          <motion.button
            key={a.view}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.06 }}
            onClick={() => onNavigate(a.view)}
            className={`rounded-xl border p-4 text-left transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 ${a.tone}`}
          >
            <span className="text-2xl" aria-hidden>
              {a.emoji}
            </span>
            <p className="mt-2 text-sm font-bold text-foreground">
              {a.label}
            </p>
            <p className="mt-0.5 text-xs text-muted-foreground">
              {a.desc}
            </p>
          </motion.button>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        {/* Left column */}
        <div className="min-w-0 space-y-6">
          {/* Stats */}
          <div className="grid grid-cols-2 gap-3 sm:gap-4 sm:grid-cols-3">
            <StatCard
              label="My Open Complaints"
              value={openMine.length}
              tone="bg-amber-50 text-amber-900 border border-amber-200"
              icon={<FileText className="size-6" />}
            />
            <StatCard
              label="My Pending Passes"
              value={
                myPasses.filter((p) => p.status === "Pending").length
              }
              tone="bg-sky-50 text-sky-900 border border-sky-200"
              icon={<Clock className="size-6" />}
            />
            <StatCard
              label="Sick Diet Requests"
              value={mySick.length}
              tone="bg-purple-50 text-purple-900 border border-purple-200"
              icon={<Pizza className="size-6" />}
            />
          </div>

          {/* My Complaints */}
          <SectionCard
            title="My Complaints"
            icon={<MessageSquare className="size-4 text-primary" />}
            action={
              <Button
                size="sm"
                variant="ghost"
                onClick={() => onNavigate("complaints")}
                className="text-xs text-primary"
              >
                File new →
              </Button>
            }
          >
            {myComplaints.length === 0 ? (
              <p className="py-6 text-center text-sm text-muted-foreground">
                You haven't filed any complaints yet.
              </p>
            ) : (
              <ul className="space-y-2">
                {myComplaints.slice(0, 5).map((c) => (
                  <li
                    key={c.id}
                    className="flex items-center justify-between gap-3 rounded-lg border border-border/60 bg-background px-4 py-2.5"
                  >
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        {isOverdueNow(c) && (
                          <span className="shrink-0 rounded bg-rose-100 px-1 py-0.5 text-xs font-bold text-rose-700">
                            OVERDUE
                          </span>
                        )}
                        <p className="truncate text-sm font-medium text-foreground">
                          {c.title}
                        </p>
                      </div>
                      <p className="mt-0.5 truncate text-xs text-muted-foreground">
                        {c.category} · {timeAgo(c.updatedAt)}
                      </p>
                    </div>
                    <StatusBadge status={c.status} />
                  </li>
                ))}
              </ul>
            )}
          </SectionCard>

          {/* Today's Mess */}
          <SectionCard
            title={`Today's Mess — ${currentUser.bhawan}`}
            icon={<span aria-hidden className="text-base">🍽️</span>}
            action={
              <Button
                size="sm"
                variant="ghost"
                onClick={() => onNavigate("mess")}
                className="text-xs text-primary"
              >
                Full menu →
              </Button>
            }
          >
            {todayMenu.length === 0 ? (
              <p className="py-3 text-center text-xs text-muted-foreground">
                No menu loaded for today.
              </p>
            ) : (
              <ul className="space-y-2">
                {todayMenu.map((m) => (
                  <li
                    key={m.mealType}
                    className="rounded-lg border border-border/60 bg-background p-3"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-xs font-bold text-foreground">
                        {m.mealType}
                      </p>
                      {m.noticeText && (
                        <span className="shrink-0 rounded-full bg-orange-100 px-2 py-0.5 text-xs font-bold text-orange-700">
                          ✨ Special
                        </span>
                      )}
                    </div>
                    <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                      {m.menuDetails}
                    </p>
                    {m.noticeText && (
                      <p className="mt-1 rounded bg-orange-50 px-2 py-1 text-xs font-semibold text-orange-700">
                        {m.noticeText}
                      </p>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </SectionCard>

          {/* My Requests */}
          <SectionCard
            title="My Requests"
            icon={<FileText className="size-4 text-sky-600" />}
          >
            {(() => {
              const items = [
                ...mySick.map((r) => ({
                  id: r.id,
                  kind: "Sick Meal",
                  label: `${r.mealType} · ${r.date}`,
                  status: r.status,
                })),
                ...myPasses.map((p) => ({
                  id: p.id,
                  kind: "Pass",
                  label: p.passType
                    .replace(/([A-Z])/g, " $1")
                    .trim(),
                  status: p.status,
                })),
                ...myRebates.map((r) => ({
                  id: r.id,
                  kind: "Rebate",
                  label: `${r.startDate} → ${r.endDate} · ${r.totalDays}d`,
                  status: r.status,
                })),
              ];
              if (items.length === 0)
                return (
                  <p className="py-3 text-center text-xs text-muted-foreground">
                    No requests yet.
                  </p>
                );
              return (
                <ul className="space-y-2">
                  {items.slice(0, 6).map((item) => (
                    <li
                      key={item.id}
                      className="flex items-center justify-between gap-3 rounded-lg border border-border/60 bg-background px-4 py-2.5"
                    >
                      <div className="min-w-0">
                        <p className="text-xs font-semibold text-foreground">
                          {item.kind}
                        </p>
                        <p className="truncate text-xs text-muted-foreground">
                          {item.label}
                        </p>
                      </div>
                      <StatusBadge status={item.status} />
                    </li>
                  ))}
                </ul>
              );
            })()}
          </SectionCard>
        </div>

        {/* Right column */}
        <div className="min-w-0 space-y-6">
          {/* Profile card */}
          {currentUser.enrollmentNumber && (
            <div className="rounded-xl border border-border bg-card p-4">
              <p
                className="mb-2 font-bold text-foreground"
                style={{ fontFamily: "Lora, serif" }}
              >
                Your Profile
              </p>
              <dl className="space-y-1.5 text-xs">
                <div className="text-muted-foreground">
                  <dt className="inline font-semibold text-foreground">
                    Enrollment:{" "}
                  </dt>
                  <dd className="inline">
                    {currentUser.enrollmentNumber}
                  </dd>
                </div>
                {currentUser.branchName && (
                  <div className="text-muted-foreground">
                    <dt className="inline font-semibold text-foreground">
                      Branch:{" "}
                    </dt>
                    <dd className="inline">{currentUser.branchName}</dd>
                  </div>
                )}
                {currentUser.academicYear && (
                  <div className="text-muted-foreground">
                    <dt className="inline font-semibold text-foreground">
                      Year:{" "}
                    </dt>
                    <dd className="inline">{currentUser.academicYear}</dd>
                  </div>
                )}
                <div className="text-muted-foreground">
                  <dt className="inline font-semibold text-foreground">
                    Email:{" "}
                  </dt>
                  <dd className="inline break-all">{currentUser.email}</dd>
                </div>
              </dl>
            </div>
          )}

          {/* Notice board */}
          {specialAnnouncements.length > 0 && (
            <div className="rounded-xl border border-orange-200 bg-orange-50 p-4">
              <p
                className="mb-2 font-bold text-orange-900"
                style={{ fontFamily: "Lora, serif" }}
              >
                📢 Notice Board
              </p>
              {/* Identity-keyed records: render .text, key by stable id */}
              <ul className="space-y-2">
                {specialAnnouncements.map((a) => (
                  <li
                    key={a.id}
                    className="rounded bg-white/60 px-3 py-2 text-xs text-orange-800"
                  >
                    {a.text}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Trending posts */}
          <SectionCard
            title="Trending in Communities"
            icon={<TrendingUp className="size-4 text-orange-600" />}
            action={
              <Button
                size="sm"
                variant="ghost"
                onClick={() => onNavigate("community")}
                className="text-xs text-orange-600"
              >
                Browse all
              </Button>
            }
          >
            {topPosts.length === 0 ? (
              <p className="py-3 text-center text-xs text-muted-foreground">
                No posts yet.
              </p>
            ) : (
              <ul className="space-y-2">
                {topPosts.map((p) => {
                  const com = COMMUNITIES.find(
                    (c) => c.id === p.category,
                  );
                  return (
                    <li
                      key={p.id}
                      className="rounded-lg border border-border/50 bg-background px-3 py-2"
                    >
                      <div className="flex items-center gap-2 text-xs">
                        <span className="font-bold text-orange-600">
                          ↑ {scoreOf(p)}
                        </span>
                        <span className="truncate rounded-full bg-orange-50 px-1.5 py-0.5 text-orange-700">
                          {com?.icon} r/{p.category}
                        </span>
                      </div>
                      <p className="mt-1 truncate text-xs font-semibold text-foreground">
                        {p.title}
                      </p>
                      <div className="mt-1 flex items-center gap-2 text-xs text-muted-foreground">
                        <span className="inline-flex items-center gap-0.5">
                          <MessageCircle className="size-3" aria-hidden />
                          {p.comments.length}
                        </span>
                        <span>{timeAgo(p.createdAt)}</span>
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </SectionCard>
        </div>
      </div>
    </div>
  );
}
