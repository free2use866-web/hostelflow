import {
  AlertTriangle,
  ArrowRight,
  CheckCircle,
  FileText,
  Pizza,
  TrendingUp,
  Users,
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
import { CATEGORY_OF_ROLE, SECY_ROLES } from "./constants";
import { SectionCard, StatCard, StatusBadge } from "./primitives";
import { Button } from "@/components/ui/button";

/**
 * Warden / Assistant Warden oversight view.
 * Extracted verbatim from the former 1,300-line RoleDashboards monolith;
 * shared presentation now lives in ./primitives.
 */
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
  // Derived at read time — the persisted flag freezes at creation and lies.
  const overdue = active.filter((c) => isOverdueNow(c));
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
      <div className="grid grid-cols-2 gap-3 sm:gap-4 sm:grid-cols-2 lg:grid-cols-4">
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
        <div className="min-w-0 space-y-6">
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
              <ul className="space-y-2">
                {overdue.slice(0, 6).map((c) => {
                  const secy = users.find(
                    (u) => u.role === c.assignedRole,
                  );
                  const hours = Math.floor(
                    (Date.now() - new Date(c.createdAt).getTime()) /
                      3600000,
                  );
                  return (
                    <li
                      key={c.id}
                      className="flex items-center justify-between rounded-lg border border-rose-100 bg-rose-50/50 px-4 py-2.5"
                    >
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold text-rose-900">
                          {c.title}
                        </p>
                        <p className="truncate text-xs text-rose-600">
                          {c.category} · {c.bhawan} → {secy?.name ?? "Unassigned"}
                        </p>
                      </div>
                      <span className="shrink-0 rounded bg-rose-100 px-2 py-0.5 text-xs font-bold text-rose-700">
                        {hours}h
                      </span>
                    </li>
                  );
                })}
              </ul>
            )}
          </SectionCard>

          {/* Secretary workload */}
          <SectionCard
            title="Secretary Workload"
            icon={<Users className="size-4 text-primary" />}
          >
            <ul className="space-y-2">
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
                const od = catComplaints.filter((c) => isOverdueNow(c)).length;
                const community = COMMUNITIES.find(
                  (x) => x.id === (cat as Category),
                );
                return (
                  <li
                    key={role}
                    className="flex items-center gap-3 rounded-lg border border-border/60 bg-background px-4 py-2.5"
                  >
                    <span className="text-lg" aria-hidden>
                      {community?.icon ?? "📋"}
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-foreground">
                          {secy?.name ?? "Vacant"}
                        </span>
                        <span className="truncate text-xs text-muted-foreground">
                          {ROLE_LABELS[role]}
                        </span>
                      </div>
                      <div className="mt-1 flex gap-3 text-xs font-semibold">
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
                      <span className="shrink-0 rounded bg-rose-100 px-1.5 py-0.5 text-xs font-bold text-rose-700">
                        {od} overdue
                      </span>
                    )}
                  </li>
                );
              })}
            </ul>
          </SectionCard>
        </div>

        {/* Right column */}
        <div className="min-w-0 space-y-6">
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
              <ul className="space-y-2">
                {pendingPasses.slice(0, 5).map((p) => (
                  <li
                    key={p.id}
                    className="rounded-lg border border-border/60 bg-background p-3"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-foreground">
                          {p.studentName}
                        </p>
                        <p className="mt-0.5 truncate text-xs text-muted-foreground">
                          {p.passType.replace(/([A-Z])/g, " $1").trim()} ·{" "}
                          {p.validDate}
                        </p>
                        <p className="mt-1 line-clamp-1 text-xs text-muted-foreground">
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
                        className="rounded-full bg-emerald-600 px-3 text-xs text-white hover:bg-emerald-700"
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
                        className="rounded-full px-3 text-xs"
                      >
                        Reject
                      </Button>
                    </div>
                  </li>
                ))}
              </ul>
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
              <ul className="space-y-2">
                {activeSick.map((r) => {
                  const student = users.find(
                    (u) => u.id === r.studentId,
                  );
                  return (
                    <li
                      key={r.id}
                      className="rounded-lg border border-purple-100 bg-purple-50/50 p-3"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <p className="truncate text-xs font-bold text-purple-900">
                          {student?.name ?? "Student"} · Room{" "}
                          {r.roomNo}
                        </p>
                        <StatusBadge status={r.status} />
                      </div>
                      <p className="mt-1 truncate text-xs text-purple-700">
                        {r.mealType} · {r.date} · {r.bhawan}
                      </p>
                      <p className="mt-0.5 line-clamp-1 text-xs text-purple-600">
                        {r.message}
                      </p>
                    </li>
                  );
                })}
              </ul>
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
              <ul className="space-y-2">
                {topPosts.map((p) => (
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
                        r/{p.category} · {timeAgo(p.createdAt)}
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
