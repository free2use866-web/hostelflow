import { useState } from "react";
import { motion } from "framer-motion";
import { useStore } from "@/lib/store";
import type { Category, Role } from "@/lib/types";
import {
  CATEGORY_TO_ROLE,
  COMMUNITIES,
  IS_WARDEN_ROLE,
  ROLE_LABELS,
  STATUS_COLORS,
  scoreOf,
  timeAgo,
} from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  AlertTriangle,
  ArrowRight,
  CheckCircle,
  Clock,
  FileText,
  MessageCircle,
  MessageSquare,
  Pizza,
  Shield,
  ThumbsUp,
  TrendingUp,
  Users,
} from "lucide-react";

/* ── Reverse map: Role → Category ───────────────────────────────────────── */
const CATEGORY_OF_ROLE: Partial<Record<Role, Category>> = {};
for (const [cat, role] of Object.entries(CATEGORY_TO_ROLE)) {
  CATEGORY_OF_ROLE[role as Role] = cat as Category;
}

const SECY_ROLES: Role[] = [
  "MessSec",
  "MaintSec",
  "GenSec",
  "SportsSec",
  "WellnessSec",
  "TechSec",
];

/* ── Shared helpers ─────────────────────────────────────────────────────── */

function StatCard({
  label,
  value,
  tone,
  icon,
}: {
  label: string;
  value: number;
  tone: string;
  icon: React.ReactNode;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className={`rounded-xl border p-4 ${tone}`}
    >
      <div className="flex items-center justify-between">
        <div>
          <p className="text-3xl font-bold">{value}</p>
          <p className="mt-1 text-xs font-medium">{label}</p>
        </div>
        <div className="opacity-40">{icon}</div>
      </div>
    </motion.div>
  );
}

function SectionCard({
  title,
  icon,
  children,
  action,
}: {
  title: string;
  icon: React.ReactNode;
  children: React.ReactNode;
  action?: React.ReactNode;
}) {
  return (
    <div className="rounded-xl border border-border bg-card p-5">
      <div className="mb-3 flex items-center justify-between">
        <h3
          className="flex items-center gap-2 font-bold text-foreground"
          style={{ fontFamily: "Lora, serif" }}
        >
          {icon} {title}
        </h3>
        {action}
      </div>
      {children}
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  return (
    <span
      className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${STATUS_COLORS[status] ?? "bg-gray-100 text-gray-600 border border-gray-200"}`}
    >
      {status}
    </span>
  );
}

function CategoryChip({ category }: { category: string }) {
  return (
    <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] font-semibold text-muted-foreground">
      {category}
    </span>
  );
}

/* ══════════════════════════════════════════════════════════════════════════
   WARDEN / ASSISTANT WARDEN DASHBOARD
   ══════════════════════════════════════════════════════════════════════════ */

export function WardenDashboard({
  onNavigate,
}: {
  onNavigate: (k: string) => void;
}) {
  const store = useStore();
  const {
    currentUser,
    complaints,
    passes,
    sickDietRequests,
    suggestions,
    users,
    updatePassStatus,
  } = store;

  const isChief = currentUser.role === "Warden";
  const active = complaints.filter(
    (c) => c.status === "Pending" || c.status === "Under Progress",
  );
  const overdue = active.filter((c) => c.isOverdue);
  const pendingPasses = passes.filter((p) => p.status === "Pending");
  const activeSick = sickDietRequests.filter(
    (r) => r.status === "Requested" || r.status === "In Preparation",
  );
  const topPosts = [...suggestions]
    .sort((a, b) => scoreOf(b) - scoreOf(a))
    .slice(0, 3);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1
          className="text-2xl font-bold text-foreground"
          style={{ fontFamily: "Lora, serif" }}
        >
          {isChief ? "🏛 The Warden's Desk" : "🏛 Assistant Warden's Desk"}
        </h1>
        <p className="text-sm text-muted-foreground">
          {isChief
            ? "Oversight across all bhawans and secretaries"
            : "Active oversight and approvals"}
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        <StatCard
          label="Active Complaints"
          value={active.length}
          tone="bg-amber-50 text-amber-900 border border-amber-200"
          icon={<FileText className="size-8" />}
        />
        <StatCard
          label="Overdue (24h+)"
          value={overdue.length}
          tone="bg-rose-50 text-rose-900 border border-rose-200"
          icon={<AlertTriangle className="size-8" />}
        />
        <StatCard
          label="Pending Approvals"
          value={pendingPasses.length}
          tone="bg-sky-50 text-sky-900 border border-sky-200"
          icon={<CheckCircle className="size-8" />}
        />
        <StatCard
          label="Sick Diet Active"
          value={activeSick.length}
          tone="bg-purple-50 text-purple-900 border border-purple-200"
          icon={<Pizza className="size-8" />}
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        {/* Left column */}
        <div className="space-y-6">
          {/* Escalation queue */}
          <SectionCard
            title="Escalation Queue"
            icon={<AlertTriangle className="size-4 text-rose-600" />}
            action={
              overdue.length > 0 ? (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => onNavigate("complaints")}
                  className="rounded-full text-xs"
                >
                  View all <ArrowRight className="ml-1 size-3" />
                </Button>
              ) : undefined
            }
          >
            {overdue.length === 0 ? (
              <p className="py-3 text-center text-xs text-muted-foreground">
                ✅ No overdue complaints — all clear.
              </p>
            ) : (
              <div className="space-y-2">
                {overdue.slice(0, 6).map((c) => {
                  const secy = users.find(
                    (u) => u.role === c.assignedRole,
                  );
                  const hours = Math.floor(
                    (Date.now() - new Date(c.createdAt).getTime()) /
                      3600000,
                  );
                  return (
                    <div
                      key={c.id}
                      className="flex items-center justify-between rounded-lg border border-rose-100 bg-rose-50/50 px-4 py-2.5"
                    >
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold text-rose-900">
                          {c.title}
                        </p>
                        <p className="text-xs text-rose-600">
                          {c.category} · {c.bhawan} → {secy?.name ?? "Unassigned"}
                        </p>
                      </div>
                      <span className="shrink-0 rounded bg-rose-100 px-2 py-0.5 text-[10px] font-bold text-rose-700">
                        {hours}h
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </SectionCard>

          {/* Secretary workload */}
          <SectionCard
            title="Secretary Workload"
            icon={<Users className="size-4 text-primary" />}
          >
            <div className="space-y-2">
              {SECY_ROLES.map((role) => {
                const secy = users.find((u) => u.role === role);
                const cat = CATEGORY_OF_ROLE[role];
                const catComplaints = complaints.filter(
                  (c) => c.assignedRole === role,
                );
                const open = catComplaints.filter(
                  (c) => c.status === "Pending",
                ).length;
                const prog = catComplaints.filter(
                  (c) => c.status === "Under Progress",
                ).length;
                const done = catComplaints.filter(
                  (c) => c.status === "Resolved",
                ).length;
                const od = catComplaints.filter(
                  (c) =>
                    c.isOverdue &&
                    c.status !== "Resolved" &&
                    c.status !== "Cannot Resolve",
                ).length;
                const community = COMMUNITIES.find(
                  (x) => x.id === cat,
                );
                return (
                  <div
                    key={role}
                    className="flex items-center gap-3 rounded-lg border border-border/60 bg-background px-4 py-2.5"
                  >
                    <span className="text-lg">
                      {community?.icon ?? "📋"}
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-foreground">
                          {secy?.name ?? "Vacant"}
                        </span>
                        <span className="text-[10px] text-muted-foreground">
                          {ROLE_LABELS[role]}
                        </span>
                      </div>
                      <div className="mt-1 flex gap-3 text-[10px] font-semibold">
                        <span className="text-amber-600">
                          {open} open
                        </span>
                        <span className="text-sky-600">
                          {prog} active
                        </span>
                        <span className="text-emerald-600">
                          {done} done
                        </span>
                      </div>
                    </div>
                    {od > 0 && (
                      <span className="rounded bg-rose-100 px-1.5 py-0.5 text-[9px] font-bold text-rose-700">
                        {od} overdue
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          </SectionCard>
        </div>

        {/* Right column */}
        <div className="space-y-6">
          {/* Approval queue */}
          <SectionCard
            title="Approval Queue"
            icon={<CheckCircle className="size-4 text-sky-600" />}
            action={
              pendingPasses.length > 0 ? (
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => onNavigate("passes")}
                  className="text-xs text-primary"
                >
                  View all
                </Button>
              ) : undefined
            }
          >
            {pendingPasses.length === 0 ? (
              <p className="py-3 text-center text-xs text-muted-foreground">
                No pending approvals.
              </p>
            ) : (
              <div className="space-y-2">
                {pendingPasses.slice(0, 5).map((p) => (
                  <div
                    key={p.id}
                    className="rounded-lg border border-border/60 bg-background p-3"
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="text-xs font-bold text-foreground">
                          {p.studentName}
                        </p>
                        <p className="mt-0.5 text-[10px] text-muted-foreground">
                          {p.passType.replace(/([A-Z])/g, " $1").trim()} ·{" "}
                          {p.validDate}
                        </p>
                        <p className="mt-1 line-clamp-1 text-[10px] text-muted-foreground">
                          {p.reason}
                        </p>
                      </div>
                    </div>
                    <div className="mt-2 flex gap-2">
                      <Button
                        size="sm"
                        onClick={() =>
                          updatePassStatus(
                            p.id,
                            "Approved",
                            currentUser.name,
                          )
                        }
                        className="h-6 rounded-full bg-emerald-600 px-3 text-[10px] text-white hover:bg-emerald-700"
                      >
                        Approve
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() =>
                          updatePassStatus(
                            p.id,
                            "Rejected",
                            currentUser.name,
                          )
                        }
                        className="h-6 rounded-full px-3 text-[10px]"
                      >
                        Reject
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </SectionCard>

          {/* Sick diet alerts */}
          <SectionCard
            title="Sick Diet Alerts"
            icon={<Pizza className="size-4 text-purple-600" />}
          >
            {activeSick.length === 0 ? (
              <p className="py-3 text-center text-xs text-muted-foreground">
                No active sick diet requests.
              </p>
            ) : (
              <div className="space-y-2">
                {activeSick.map((r) => {
                  const student = users.find(
                    (u) => u.id === r.studentId,
                  );
                  return (
                    <div
                      key={r.id}
                      className="rounded-lg border border-purple-100 bg-purple-50/50 p-3"
                    >
                      <div className="flex items-center justify-between">
                        <p className="text-xs font-bold text-purple-900">
                          {student?.name ?? "Student"} · Room{" "}
                          {r.roomNo}
                        </p>
                        <StatusBadge status={r.status} />
                      </div>
                      <p className="mt-1 text-[10px] text-purple-700">
                        {r.mealType} · {r.date} · {r.bhawan}
                      </p>
                      <p className="mt-0.5 line-clamp-1 text-[10px] text-purple-600">
                        {r.message}
                      </p>
                    </div>
                  );
                })}
              </div>
            )}
          </SectionCard>

          {/* Top community posts */}
          <SectionCard
            title="Top Community Posts"
            icon={<TrendingUp className="size-4 text-orange-600" />}
            action={
              <Button
                size="sm"
                variant="ghost"
                onClick={() => onNavigate("community")}
                className="text-xs text-orange-600"
              >
                Open Board
              </Button>
            }
          >
            {topPosts.length === 0 ? (
              <p className="py-3 text-center text-xs text-muted-foreground">
                No posts yet.
              </p>
            ) : (
              <div className="space-y-2">
                {topPosts.map((p) => (
                  <div
                    key={p.id}
                    className="flex items-center gap-3 rounded-lg border border-border/50 bg-background px-3 py-2"
                  >
                    <span className="shrink-0 rounded-full bg-orange-100 px-2 py-0.5 text-[10px] font-bold text-orange-700">
                      ↑ {scoreOf(p)}
                    </span>
                    <div className="min-w-0">
                      <p className="truncate text-xs font-semibold text-foreground">
                        {p.title}
                      </p>
                      <p className="text-[10px] text-muted-foreground">
                        r/{p.category} · {timeAgo(p.createdAt)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </SectionCard>
        </div>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════════════════
   SECRETARY DASHBOARD
   ══════════════════════════════════════════════════════════════════════════ */

export function SecyDashboard({
  onNavigate,
}: {
  onNavigate: (k: string) => void;
}) {
  const store = useStore();
  const {
    currentUser,
    complaints,
    passes,
    sickDietRequests,
    suggestions,
    users,
    updateComplaintStatus,
    updateSickDietStatus,
    updatePassStatus,
  } = store;

  const role = currentUser.role;
  const category = CATEGORY_OF_ROLE[role] as Category;
  const community = COMMUNITIES.find((c) => c.id === category);

  const mine = complaints.filter((c) => c.assignedRole === role);
  const queue = [...mine].sort((a, b) => {
    if (a.isOverdue && !b.isOverdue) return -1;
    if (!a.isOverdue && b.isOverdue) return 1;
    const order = { Pending: 0, "Under Progress": 1, "Cannot Resolve": 2, Resolved: 3 };
    return (order[a.status] ?? 0) - (order[b.status] ?? 0);
  });
  const overdue = mine.filter(
    (c) => c.isOverdue && c.status !== "Resolved" && c.status !== "Cannot Resolve",
  );
  const pending = mine.filter((c) => c.status === "Pending").length;
  const inProgress = mine.filter((c) => c.status === "Under Progress").length;
  const resolved = mine.filter((c) => c.status === "Resolved").length;

  const myPosts = suggestions
    .filter((s) => s.category === category)
    .sort((a, b) => scoreOf(b) - scoreOf(a))
    .slice(0, 4);

  // MessSec gets sick diets
  const sickDiets =
    role === "MessSec"
      ? sickDietRequests.filter(
          (r) =>
            r.status !== "Delivered" && r.notifiedRoles.includes(role),
        )
      : [];

  // SportsSec gets gear passes
  const gearPasses =
    role === "SportsSec"
      ? passes.filter(
          (p) => p.passType === "SportsGear" && p.status === "Pending",
        )
      : [];

  const [noteMap, setNoteMap] = useState<Record<string, string>>({});

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <span className="text-3xl">{community?.icon ?? "📋"}</span>
        <div>
          <h1
            className="text-2xl font-bold text-foreground"
            style={{ fontFamily: "Lora, serif" }}
          >
            {ROLE_LABELS[role]} Portal
          </h1>
          <p className="text-sm text-muted-foreground">
            r/{category} · {mine.length} total complaints
          </p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        <StatCard
          label="In Queue (Pending)"
          value={pending}
          tone="bg-amber-50 text-amber-900 border border-amber-200"
          icon={<Clock className="size-8" />}
        />
        <StatCard
          label="Under Progress"
          value={inProgress}
          tone="bg-sky-50 text-sky-900 border border-sky-200"
          icon={<FileText className="size-8" />}
        />
        <StatCard
          label="Resolved"
          value={resolved}
          tone="bg-emerald-50 text-emerald-900 border border-emerald-200"
          icon={<CheckCircle className="size-8" />}
        />
        <StatCard
          label="Overdue"
          value={overdue.length}
          tone="bg-rose-50 text-rose-900 border border-rose-200"
          icon={<AlertTriangle className="size-8" />}
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        {/* Left column */}
        <div className="space-y-6">
          {/* My Queue */}
          <SectionCard
            title="My Complaint Queue"
            icon={<MessageSquare className="size-4 text-primary" />}
            action={
              <Button
                size="sm"
                variant="ghost"
                onClick={() => onNavigate("complaints")}
                className="text-xs text-primary"
              >
                Full view
              </Button>
            }
          >
            {queue.length === 0 ? (
              <p className="py-6 text-center text-sm text-muted-foreground">
                🎉 No complaints assigned to you right now.
              </p>
            ) : (
              <div className="space-y-2">
                {queue.slice(0, 8).map((c) => {
                  const student = users.find(
                    (u) => u.id === c.authorId,
                  );
                  return (
                    <div
                      key={c.id}
                      className="rounded-lg border border-border/60 bg-background p-3"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            {c.isOverdue && (
                              <span className="rounded bg-rose-100 px-1 py-0.5 text-[8px] font-bold text-rose-700">
                                OVERDUE
                              </span>
                            )}
                            <p className="text-sm font-semibold text-foreground">
                              {c.title}
                            </p>
                          </div>
                          <p className="mt-0.5 text-[10px] text-muted-foreground">
                            {student?.name ?? "Student"} · {c.bhawan} ·{" "}
                            {timeAgo(c.createdAt)}
                          </p>
                        </div>
                        <StatusBadge status={c.status} />
                      </div>

                      {/* Quick actions */}
                      <div className="mt-2 flex flex-wrap gap-2">
                        {c.status === "Pending" && (
                          <Button
                            size="sm"
                            onClick={() =>
                              updateComplaintStatus(
                                c.id,
                                "Under Progress",
                              )
                            }
                            className="h-6 rounded-full bg-sky-600 px-3 text-[10px] text-white hover:bg-sky-700"
                          >
                            Start Progress
                          </Button>
                        )}
                        {c.status === "Under Progress" && (
                          <>
                            <Input
                              value={noteMap[c.id] ?? ""}
                              onChange={(e) =>
                                setNoteMap((m) => ({
                                  ...m,
                                  [c.id]: e.target.value,
                                }))
                              }
                              placeholder="Resolution note..."
                              className="h-6 w-40 rounded-full px-3 text-[10px]"
                            />
                            <Button
                              size="sm"
                              disabled={!noteMap[c.id]?.trim()}
                              onClick={() => {
                                updateComplaintStatus(
                                  c.id,
                                  "Resolved",
                                  noteMap[c.id],
                                );
                                setNoteMap((m) => {
                                  const n = { ...m };
                                  delete n[c.id];
                                  return n;
                                });
                              }}
                              className="h-6 rounded-full bg-emerald-600 px-3 text-[10px] text-white hover:bg-emerald-700"
                            >
                              Resolve
                            </Button>
                          </>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </SectionCard>

          {/* MessSec: Sick diets */}
          {sickDiets.length > 0 && (
            <SectionCard
              title="Sick Diets to Deliver"
              icon={<Pizza className="size-4 text-purple-600" />}
            >
              <div className="space-y-2">
                {sickDiets.map((r) => {
                  const student = users.find(
                    (u) => u.id === r.studentId,
                  );
                  return (
                    <div
                      key={r.id}
                      className="flex items-center justify-between rounded-lg border border-purple-100 bg-purple-50/50 p-3"
                    >
                      <div>
                        <p className="text-xs font-bold text-purple-900">
                          {r.mealType} → Room {r.roomNo}
                        </p>
                        <p className="text-[10px] text-purple-700">
                          {student?.name ?? "Student"} · {r.bhawan}
                        </p>
                        <p className="mt-0.5 line-clamp-1 text-[10px] text-purple-600">
                          {r.message}
                        </p>
                      </div>
                      <div className="flex gap-1.5">
                        {r.status === "Requested" && (
                          <Button
                            size="sm"
                            onClick={() =>
                              updateSickDietStatus(
                                r.id,
                                "In Preparation",
                              )
                            }
                            className="h-6 rounded-full bg-sky-600 px-2 text-[10px] text-white"
                          >
                            Preparing
                          </Button>
                        )}
                        {r.status === "In Preparation" && (
                          <Button
                            size="sm"
                            onClick={() =>
                              updateSickDietStatus(
                                r.id,
                                "Out for Delivery",
                              )
                            }
                            className="h-6 rounded-full bg-amber-600 px-2 text-[10px] text-white"
                          >
                            Out
                          </Button>
                        )}
                        {(r.status === "In Preparation" ||
                          r.status === "Out for Delivery") && (
                          <Button
                            size="sm"
                            onClick={() =>
                              updateSickDietStatus(
                                r.id,
                                "Delivered",
                                currentUser.name,
                              )
                            }
                            className="h-6 rounded-full bg-emerald-600 px-2 text-[10px] text-white"
                          >
                            ✓ Delivered
                          </Button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </SectionCard>
          )}

          {/* SportsSec: gear passes */}
          {gearPasses.length > 0 && (
            <SectionCard
              title="Sports Gear Requests"
              icon={<Shield className="size-4 text-orange-600" />}
            >
              <div className="space-y-2">
                {gearPasses.map((p) => (
                  <div
                    key={p.id}
                    className="flex items-center justify-between rounded-lg border border-border/60 bg-background p-3"
                  >
                    <div>
                      <p className="text-xs font-bold text-foreground">
                        {p.studentName}
                      </p>
                      <p className="mt-0.5 line-clamp-1 text-[10px] text-muted-foreground">
                        {p.reason}
                      </p>
                    </div>
                    <div className="flex gap-1.5">
                      <Button
                        size="sm"
                        onClick={() =>
                          updatePassStatus(
                            p.id,
                            "Approved",
                            currentUser.name,
                          )
                        }
                        className="h-6 rounded-full bg-emerald-600 px-2 text-[10px] text-white"
                      >
                        Approve
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() =>
                          updatePassStatus(
                            p.id,
                            "Rejected",
                            currentUser.name,
                          )
                        }
                        className="h-6 rounded-full px-2 text-[10px]"
                      >
                        Reject
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </SectionCard>
          )}
        </div>

        {/* Right column */}
        <div className="space-y-6">
          {/* Community card */}
          <div className="overflow-hidden rounded-xl border border-border bg-card">
            <div
              className={`h-16 bg-gradient-to-r ${community?.bannerClass ?? "from-gray-200 to-gray-300"}`}
            />
            <div className="space-y-3 p-4">
              <div className="-mt-8 flex items-end gap-2">
                <span className="flex size-10 items-center justify-center rounded-full border-4 border-card bg-background text-xl">
                  {community?.icon}
                </span>
              </div>
              <div>
                <p className="font-bold text-foreground">
                  r/{category}
                </p>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  {community?.description ?? ""}
                </p>
              </div>
              <Button
                size="sm"
                onClick={() => onNavigate("community")}
                className="w-full rounded-full bg-orange-600 text-[10px] text-white hover:bg-orange-700"
              >
                Open Community
              </Button>
            </div>
          </div>

          {/* Top posts in this category */}
          <SectionCard
            title={`Posts in r/${category}`}
            icon={<ThumbsUp className="size-4 text-orange-600" />}
          >
            {myPosts.length === 0 ? (
              <p className="py-3 text-center text-xs text-muted-foreground">
                No posts in this category yet.
              </p>
            ) : (
              <div className="space-y-2">
                {myPosts.map((p) => (
                  <div
                    key={p.id}
                    className="flex items-center gap-3 rounded-lg border border-border/50 bg-background px-3 py-2"
                  >
                    <span className="shrink-0 rounded-full bg-orange-100 px-2 py-0.5 text-[10px] font-bold text-orange-700">
                      ↑ {scoreOf(p)}
                    </span>
                    <div className="min-w-0">
                      <p className="truncate text-xs font-semibold text-foreground">
                        {p.title}
                      </p>
                      <p className="text-[10px] text-muted-foreground">
                        {p.comments.length} comments ·{" "}
                        {timeAgo(p.createdAt)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </SectionCard>
        </div>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════════════════
   STUDENT DASHBOARD
   ══════════════════════════════════════════════════════════════════════════ */

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

  const quickActions = [
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
  ];

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
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {quickActions.map((a, i) => (
          <motion.button
            key={a.view}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.06 }}
            onClick={() => onNavigate(a.view)}
            className={`rounded-xl border p-4 text-left transition-all ${a.tone}`}
          >
            <span className="text-2xl">{a.emoji}</span>
            <p className="mt-2 text-sm font-bold text-foreground">
              {a.label}
            </p>
            <p className="mt-0.5 text-[10px] text-muted-foreground">
              {a.desc}
            </p>
          </motion.button>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        {/* Left column */}
        <div className="space-y-6">
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
              <div className="space-y-2">
                {myComplaints.slice(0, 5).map((c) => (
                  <div
                    key={c.id}
                    className="flex items-center justify-between rounded-lg border border-border/60 bg-background px-4 py-2.5"
                  >
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        {c.isOverdue && (
                          <span className="rounded bg-rose-100 px-1 py-0.5 text-[8px] font-bold text-rose-700">
                            OVERDUE
                          </span>
                        )}
                        <p className="truncate text-sm font-medium text-foreground">
                          {c.title}
                        </p>
                      </div>
                      <p className="mt-0.5 text-[10px] text-muted-foreground">
                        {c.category} · {timeAgo(c.updatedAt)}
                      </p>
                    </div>
                    <StatusBadge status={c.status} />
                  </div>
                ))}
              </div>
            )}
          </SectionCard>

          {/* Today's Mess */}
          <SectionCard
            title={`Today's Mess — ${currentUser.bhawan}`}
            icon={<span className="text-base">🍽️</span>}
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
              <div className="space-y-2">
                {todayMenu.map((m) => (
                  <div
                    key={m.mealType}
                    className="rounded-lg border border-border/60 bg-background p-3"
                  >
                    <div className="flex items-center justify-between">
                      <p className="text-xs font-bold text-foreground">
                        {m.mealType}
                      </p>
                      {m.noticeText && (
                        <span className="rounded-full bg-orange-100 px-2 py-0.5 text-[9px] font-bold text-orange-700">
                          ✨ Special
                        </span>
                      )}
                    </div>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {m.menuDetails}
                    </p>
                    {m.noticeText && (
                      <p className="mt-1 rounded bg-orange-50 px-2 py-1 text-[10px] font-semibold text-orange-700">
                        {m.noticeText}
                      </p>
                    )}
                  </div>
                ))}
              </div>
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
                  when: r.date,
                })),
                ...myPasses.map((p) => ({
                  id: p.id,
                  kind: "Pass",
                  label: p.passType
                    .replace(/([A-Z])/g, " $1")
                    .trim(),
                  status: p.status,
                  when: p.createdAt,
                })),
                ...myRebates.map((r) => ({
                  id: r.id,
                  kind: "Rebate",
                  label: `${r.startDate} → ${r.endDate} · ${r.totalDays}d`,
                  status: r.status,
                  when: r.submittedAt,
                })),
              ];
              if (items.length === 0)
                return (
                  <p className="py-3 text-center text-xs text-muted-foreground">
                    No requests yet.
                  </p>
                );
              return (
                <div className="space-y-2">
                  {items.slice(0, 6).map((item) => (
                    <div
                      key={item.id}
                      className="flex items-center justify-between rounded-lg border border-border/60 bg-background px-4 py-2.5"
                    >
                      <div className="min-w-0">
                        <p className="text-xs font-semibold text-foreground">
                          {item.kind}
                        </p>
                        <p className="truncate text-[10px] text-muted-foreground">
                          {item.label}
                        </p>
                      </div>
                      <StatusBadge status={item.status} />
                    </div>
                  ))}
                </div>
              );
            })()}
          </SectionCard>
        </div>

        {/* Right column */}
        <div className="space-y-6">
          {/* Profile card */}
          {currentUser.enrollmentNumber && (
            <div className="rounded-xl border border-border bg-card p-4">
              <p
                className="mb-2 font-bold text-foreground"
                style={{ fontFamily: "Lora, serif" }}
              >
                Your Profile
              </p>
              <div className="space-y-1.5 text-xs">
                <p className="text-muted-foreground">
                  <span className="font-semibold text-foreground">
                    Enrollment:
                  </span>{" "}
                  {currentUser.enrollmentNumber}
                </p>
                {currentUser.branchName && (
                  <p className="text-muted-foreground">
                    <span className="font-semibold text-foreground">
                      Branch:
                    </span>{" "}
                    {currentUser.branchName}
                  </p>
                )}
                {currentUser.academicYear && (
                  <p className="text-muted-foreground">
                    <span className="font-semibold text-foreground">
                      Year:
                    </span>{" "}
                    {currentUser.academicYear}
                  </p>
                )}
                <p className="text-muted-foreground">
                  <span className="font-semibold text-foreground">
                    Email:
                  </span>{" "}
                  {currentUser.email}
                </p>
              </div>
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
              <div className="space-y-2">
                {specialAnnouncements.map((a, i) => (
                  <p
                    key={i}
                    className="rounded bg-white/60 px-3 py-2 text-xs text-orange-800"
                  >
                    {a}
                  </p>
                ))}
              </div>
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
              <div className="space-y-2">
                {topPosts.map((p) => {
                  const com = COMMUNITIES.find(
                    (c) => c.id === p.category,
                  );
                  return (
                    <div
                      key={p.id}
                      className="rounded-lg border border-border/50 bg-background px-3 py-2"
                    >
                      <div className="flex items-center gap-2 text-[10px]">
                        <span className="font-bold text-orange-600">
                          ↑ {scoreOf(p)}
                        </span>
                        <span className="rounded-full bg-orange-50 px-1.5 py-0.5 text-orange-700">
                          {com?.icon} r/{p.category}
                        </span>
                      </div>
                      <p className="mt-1 text-xs font-semibold text-foreground">
                        {p.title}
                      </p>
                      <div className="mt-1 flex items-center gap-2 text-[10px] text-muted-foreground">
                        <span>
                          <MessageCircle className="mr-0.5 inline size-3" />
                          {p.comments.length}
                        </span>
                        <span>{timeAgo(p.createdAt)}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </SectionCard>
        </div>
      </div>
    </div>
  );
}
