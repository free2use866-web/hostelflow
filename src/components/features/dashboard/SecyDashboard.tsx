import { useState } from "react";
import {
  AlertTriangle,
  CheckCircle,
  Clock,
  FileText,
  MessageSquare,
  Pizza,
  Shield,
  ThumbsUp,
} from "lucide-react";
import { useStore } from "@/lib/store";
import type { Category } from "@/lib/types";
import {
  COMMUNITIES,
  ROLE_LABELS,
  isOverdueNow,
  scoreOf,
  timeAgo,
} from "@/lib/types";
import { CATEGORY_OF_ROLE } from "./constants";
import { SectionCard, StatCard, StatusBadge } from "./primitives";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

/**
 * Secretary portal view (Mess/Maint/Gen/Sports/Wellness/Tech).
 * Extracted from the former RoleDashboards monolith.
 */
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
    // Derived overdue comparison — never the frozen stored flag.
    if (isOverdueNow(a) && !isOverdueNow(b)) return -1;
    if (!isOverdueNow(a) && isOverdueNow(b)) return 1;
    const order = { Pending: 0, "Under Progress": 1, "Cannot Resolve": 2, Resolved: 3 };
    return (order[a.status] ?? 0) - (order[b.status] ?? 0);
  });
  const overdue = mine.filter((c) => isOverdueNow(c));
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

  // Resolution notes keyed per complaint id (extracted state pattern).
  const [noteMap, setNoteMap] = useState<Record<string, string>>({});

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <span className="text-3xl" aria-hidden>
          {community?.icon ?? "📋"}
        </span>
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
        <div className="min-w-0 space-y-6">
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
              <ul className="space-y-2">
                {queue.slice(0, 8).map((c) => {
                  const student = users.find(
                    (u) => u.id === c.authorId,
                  );
                  return (
                    <li
                      key={c.id}
                      className="rounded-lg border border-border/60 bg-background p-3"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            {isOverdueNow(c) && (
                              <span className="shrink-0 rounded bg-rose-100 px-1 py-0.5 text-xs font-bold text-rose-700">
                                OVERDUE
                              </span>
                            )}
                            <p className="truncate text-sm font-semibold text-foreground">
                              {c.title}
                            </p>
                          </div>
                          <p className="mt-0.5 truncate text-xs text-muted-foreground">
                            {student?.name ?? "Student"} · {c.bhawan} ·{" "}
                            {timeAgo(c.createdAt)}
                          </p>
                        </div>
                        <StatusBadge status={c.status} />
                      </div>

                      {/* Quick actions */}
                      <div className="mt-2 flex flex-wrap items-center gap-2">
                        {c.status === "Pending" && (
                          <Button
                            size="sm"
                            onClick={() =>
                              updateComplaintStatus(
                                c.id,
                                "Under Progress",
                              )
                            }
                            className="rounded-full bg-sky-600 px-3 text-xs text-white hover:bg-sky-700"
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
                              aria-label={`Resolution note for ${c.title}`}
                              className="w-44 rounded-full px-3 text-xs"
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
                              className="rounded-full bg-emerald-600 px-3 text-xs text-white hover:bg-emerald-700"
                            >
                              Resolve
                            </Button>
                          </>
                        )}
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </SectionCard>

          {/* MessSec: Sick diets */}
          {sickDiets.length > 0 && (
            <SectionCard
              title="Sick Diets to Deliver"
              icon={<Pizza className="size-4 text-purple-600" />}
            >
              <ul className="space-y-2">
                {sickDiets.map((r) => {
                  const student = users.find(
                    (u) => u.id === r.studentId,
                  );
                  return (
                    <li
                      key={r.id}
                      className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-purple-100 bg-purple-50/50 p-3"
                    >
                      <div className="min-w-0">
                        <p className="truncate text-xs font-bold text-purple-900">
                          {r.mealType} → Room {r.roomNo}
                        </p>
                        <p className="truncate text-xs text-purple-700">
                          {student?.name ?? "Student"} · {r.bhawan}
                        </p>
                        <p className="mt-0.5 line-clamp-1 text-xs text-purple-600">
                          {r.message}
                        </p>
                      </div>
                      <div className="flex shrink-0 gap-1.5">
                        {r.status === "Requested" && (
                          <Button
                            size="sm"
                            onClick={() =>
                              updateSickDietStatus(
                                r.id,
                                "In Preparation",
                              )
                            }
                            className="rounded-full bg-sky-600 px-2.5 text-xs text-white"
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
                            className="rounded-full bg-amber-600 px-2.5 text-xs text-white"
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
                            className="rounded-full bg-emerald-600 px-2.5 text-xs text-white"
                          >
                            ✓ Delivered
                          </Button>
                        )}
                      </div>
                    </li>
                  );
                })}
              </ul>
            </SectionCard>
          )}

          {/* SportsSec: gear passes */}
          {gearPasses.length > 0 && (
            <SectionCard
              title="Sports Gear Requests"
              icon={<Shield className="size-4 text-orange-600" />}
            >
              <ul className="space-y-2">
                {gearPasses.map((p) => (
                  <li
                    key={p.id}
                    className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-border/60 bg-background p-3"
                  >
                    <div className="min-w-0">
                      <p className="truncate text-xs font-bold text-foreground">
                        {p.studentName}
                      </p>
                      <p className="mt-0.5 line-clamp-1 text-xs text-muted-foreground">
                        {p.reason}
                      </p>
                    </div>
                    <div className="flex shrink-0 gap-1.5">
                      <Button
                        size="sm"
                        onClick={() =>
                          updatePassStatus(
                            p.id,
                            "Approved",
                            currentUser.name,
                          )
                        }
                        className="rounded-full bg-emerald-600 px-2.5 text-xs text-white"
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
                        className="rounded-full px-2.5 text-xs"
                      >
                        Reject
                      </Button>
                    </div>
                  </li>
                ))}
              </ul>
            </SectionCard>
          )}
        </div>

        {/* Right column */}
        <div className="min-w-0 space-y-6">
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
                className="w-full rounded-full bg-orange-600 text-xs text-white hover:bg-orange-700"
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
              <ul className="space-y-2">
                {myPosts.map((p) => (
                  <li
                    key={p.id}
                    className="flex items-center gap-3 rounded-lg border border-border/50 bg-background px-3 py-2"
                  >
                    <span className="shrink-0 rounded-full bg-orange-100 px-2 py-0.5 text-xs font-bold text-orange-700">
                      ↑ {scoreOf(p)}
                    </span>
                    <div className="min-w-0">
                      <p className="truncate text-xs font-semibold text-foreground">
                        {p.title}
                      </p>
                      <p className="truncate text-xs text-muted-foreground">
                        {p.comments.length} comments ·{" "}
                        {timeAgo(p.createdAt)}
                      </p>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </SectionCard>
        </div>
      </div>
    </div>
  );
}
