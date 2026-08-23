import { useEffect, useState, type ReactNode } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router";
import { useAuth } from "@/hooks/use-auth";
import { StoreProvider, useStore } from "@/lib/store";
import {
  ALL_ROLES, ROLE_LABELS, IS_WARDEN_ROLE, IS_SECY_ROLE,
  type Role,
} from "@/lib/types";
import {
  Bell, AlertTriangle, ChevronDown, LogOut,
  LayoutDashboard, MessageSquare, UtensilsCrossed,
  ThumbsUp, KeyRound, Users,
} from "lucide-react";
import {
  DropdownMenu, DropdownMenuTrigger, DropdownMenuContent,
  DropdownMenuItem, DropdownMenuSeparator, DropdownMenuLabel,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { ComplaintsView } from "@/components/app/ComplaintsView";
import { MessView } from "@/components/app/MessView";
import { CommunityView } from "@/components/app/CommunityView";
import { PassesView } from "@/components/app/PassesView";

type ViewKey = "overview" | "complaints" | "mess" | "community" | "passes";

const NAV_ITEMS: { key: ViewKey; label: string; icon: typeof LayoutDashboard }[] = [
  { key: "overview", label: "Dashboard", icon: LayoutDashboard },
  { key: "complaints", label: "Complaints", icon: MessageSquare },
  { key: "mess", label: "Mess & Diet", icon: UtensilsCrossed },
  { key: "community", label: "Community", icon: ThumbsUp },
  { key: "passes", label: "Digital Passes", icon: KeyRound },
];

/* ─── Animated Tab Underline ─────────────────────────────────────────────── */

function AnimatedTabs({
  tabs, active, onChange,
}: {
  tabs: { key: string; label: string; icon?: ReactNode }[];
  active: string;
  onChange: (k: string) => void;
}) {
  return (
    <div className="relative flex gap-1 rounded-lg border border-border bg-muted/50 p-1">
      {tabs.map((t) => (
        <button
          key={t.key}
          onClick={() => onChange(t.key)}
          className={`relative z-10 flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-semibold transition-colors ${
            active === t.key ? "text-primary-foreground" : "text-muted-foreground hover:text-foreground"
          }`}
        >
          {active === t.key && (
            <motion.div
              layoutId="tab-indicator"
              className="absolute inset-0 rounded-md bg-primary"
              transition={{ type: "spring", stiffness: 380, damping: 30 }}
            />
          )}
          <span className="relative z-10 flex items-center gap-1.5">
            {t.icon}
            {t.label}
          </span>
        </button>
      ))}
    </div>
  );
}

/* ─── Overview / Dashboard Home ──────────────────────────────────────────── */

function OverviewView() {
  const store = useStore();
  const { currentUser, complaints, sickDietRequests, passes, suggestions, users } = store;
  const role = currentUser.role;
  const isWarden = IS_WARDEN_ROLE(role);
  const isSecy = IS_SECY_ROLE(role);

  const overdue = complaints.filter((c) => c.isOverdue && c.status !== "Resolved" && c.status !== "Cannot Resolve");
  const pending = complaints.filter((c) => c.status === "Pending");
  const myComplaints = isSecy ? complaints.filter((c) => c.assignedRole === role) : [];
  const myPasses = passes.filter((p) => p.studentId === currentUser.id);
  const pendingPasses = passes.filter((p) => p.status === "Pending");
  const pendingSick = sickDietRequests.filter((r) => r.status === "Requested" || r.status === "In Preparation");
  const topSuggestions = [...suggestions].sort((a, b) => b.upvotes - a.upvotes).slice(0, 3);

  const statCards = [
    { label: "Open Complaints", value: pending.length, color: "bg-amber-50 text-amber-800 border-amber-200" },
    { label: "Overdue Alerts", value: overdue.length, color: "bg-rose-50 text-rose-800 border-rose-200" },
    { label: isWarden ? "Pending Passes" : "My Passes", value: isWarden ? pendingPasses.length : myPasses.length, color: "bg-sky-50 text-sky-800 border-sky-200" },
    { label: "Sick Meal Requests", value: pendingSick.length, color: "bg-purple-50 text-purple-800 border-purple-200" },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground" style={{ fontFamily: "Lora, serif" }}>
          Welcome, {currentUser.name}
        </h1>
        <p className="text-sm text-muted-foreground">
          {ROLE_LABELS[role]} · {currentUser.bhawan} Bhawan · Room {currentUser.roomNo}
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {statCards.map((s, i) => (
          <motion.div
            key={s.label}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.08 }}
            className={`rounded-xl border p-4 ${s.color}`}
          >
            <p className="text-3xl font-bold">{s.value}</p>
            <p className="mt-1 text-xs font-medium">{s.label}</p>
          </motion.div>
        ))}
      </div>

      {/* Overdue Alerts */}
      {(isWarden || isSecy) && overdue.length > 0 && (
        <div className="rounded-xl border border-rose-200 bg-rose-50 p-5">
          <h3 className="mb-3 flex items-center gap-2 font-bold text-rose-800">
            <AlertTriangle className="size-4" /> Overdue Complaints
          </h3>
          <div className="space-y-2">
            {overdue.slice(0, 5).map((c) => (
              <div key={c.id} className="flex items-center justify-between rounded-lg bg-white/60 px-4 py-2.5 text-sm">
                <div>
                  <span className="font-semibold text-rose-900">{c.title}</span>
                  <span className="ml-2 text-xs text-rose-600">· {c.category} · {c.bhawan}</span>
                </div>
                <span className="text-xs text-rose-500">
                  {Math.floor((Date.now() - new Date(c.createdAt).getTime()) / 3600000)}h pending
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Top Suggestions */}
      {topSuggestions.length > 0 && (
        <div className="rounded-xl border border-border bg-card p-5">
          <h3 className="mb-3 font-bold text-foreground" style={{ fontFamily: "Lora, serif" }}>🔥 Top Suggestions</h3>
          <div className="space-y-2">
            {topSuggestions.map((s) => (
              <div key={s.id} className="flex items-center gap-3 rounded-lg border border-border/50 bg-background px-4 py-2.5 text-sm">
                <span className="shrink-0 rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-bold text-primary">
                  ↑ {s.upvotes}
                </span>
                <span className="font-medium text-foreground">{s.title}</span>
                <span className="ml-auto text-xs text-muted-foreground">{s.status}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recent Complaints */}
      <div className="rounded-xl border border-border bg-card p-5">
        <h3 className="mb-3 font-bold text-foreground" style={{ fontFamily: "Lora, serif" }}>Recent Complaints</h3>
        <div className="space-y-2">
          {complaints.slice(0, 5).map((c) => (
            <div key={c.id} className="flex items-center justify-between rounded-lg border border-border/50 bg-background px-4 py-2.5 text-sm">
              <div>
                <span className="font-medium text-foreground">{c.title}</span>
                <span className="ml-2 text-xs text-muted-foreground">· {c.category}</span>
              </div>
              <div className="flex items-center gap-2">
                {c.isOverdue && <span className="rounded bg-rose-100 px-1.5 py-0.5 text-[10px] font-bold text-rose-700">OVERDUE</span>}
                <StatusPill status={c.status} />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function StatusPill({ status }: { status: string }) {
  const colors: Record<string, string> = {
    Pending: "bg-amber-100 text-amber-800",
    "Under Progress": "bg-sky-100 text-sky-800",
    Resolved: "bg-emerald-100 text-emerald-800",
    "Cannot Resolve": "bg-rose-100 text-rose-800",
    Open: "bg-amber-100 text-amber-800",
    "Under Review": "bg-sky-100 text-sky-800",
    Approved: "bg-emerald-100 text-emerald-800",
    Implemented: "bg-emerald-100 text-emerald-800",
    Rejected: "bg-rose-100 text-rose-800",
  };
  return (
    <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${colors[status] ?? "bg-gray-100 text-gray-800"}`}>
      {status}
    </span>
  );
}

function PersonaDropdown() {
  const { currentUser, users, switchUser } = useStore();
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" className="gap-2 rounded-full border-border text-xs font-semibold">
          <span className="flex size-6 items-center justify-center rounded-full bg-primary/15 text-[10px] font-bold text-primary">
            {currentUser.name.charAt(0)}
          </span>
          <span className="max-w-[120px] truncate">{currentUser.name}</span>
          <span className="rounded-full bg-primary/10 px-1.5 py-0.5 text-[9px] font-bold text-primary">
            {ROLE_LABELS[currentUser.role]}
          </span>
          <ChevronDown className="size-3" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-72 rounded-xl border-border">
        <DropdownMenuLabel className="text-xs text-muted-foreground">
          Switch Persona — Sandbox Mode
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        {ALL_ROLES.map((r) => {
          const representative = users.find((u) => u.role === r && u.bhawan === currentUser.bhawan) ?? users.find((u) => u.role === r);
          if (!representative) return null;
          return (
            <DropdownMenuItem
              key={r}
              onClick={() => switchUser(representative.id)}
              className={`flex items-center gap-2 rounded-lg text-sm ${representative.id === currentUser.id ? "bg-primary/10 font-semibold" : ""}`}
            >
              <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-muted text-[10px] font-bold">
                {representative.name.charAt(0)}
              </span>
              <div className="min-w-0">
                <p className="truncate font-medium">{representative.name}</p>
                <p className="truncate text-[10px] text-muted-foreground">{ROLE_LABELS[r]}</p>
              </div>
              {representative.id === currentUser.id && (
                <span className="ml-auto rounded-full bg-primary px-2 py-0.5 text-[9px] font-bold text-primary-foreground">
                  Active
                </span>
              )}
            </DropdownMenuItem>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

/* ─── Main Dashboard ─────────────────────────────────────────────────────── */

import { OnboardingGate } from "@/components/app/OnboardingGate";

function DashboardInner() {
  const { currentUser, switchByEmail } = useStore();
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [view, setView] = useState<ViewKey>("overview");

  // Sync Convex auth email → store
  useEffect(() => {
    if (user?.email) switchByEmail(user.email);
  }, [user?.email, switchByEmail]);

  const handleSignOut = async () => { await signOut(); navigate("/"); };

  // ── Strict verification gate: block everything until verified ──
  if (!currentUser.isVerified) {
    return <OnboardingGate />;
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Persona Switcher Top Bar */}
      <div className="sticky top-0 z-50 border-b border-border bg-card/95 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-2.5">
          <div className="flex items-center gap-3">
            <div className="flex size-8 items-center justify-center rounded-lg bg-primary text-xs font-bold text-primary-foreground">IITR</div>
            <span className="hidden text-sm font-bold text-foreground sm:inline" style={{ fontFamily: "Lora, serif" }}>HostelHub</span>
          </div>

          {/* Persona dropdown */}
          <PersonaDropdown />

          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" className="size-8 rounded-full text-muted-foreground" onClick={handleSignOut}>
              <LogOut className="size-4" />
            </Button>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 py-6">
        {/* Navigation */}
        <div className="mb-6 flex flex-wrap items-center gap-2">
          <AnimatedTabs
            tabs={NAV_ITEMS.map((n) => ({ key: n.key, label: n.label, icon: <n.icon className="size-3.5" /> }))}
            active={view}
            onChange={(k) => setView(k as ViewKey)}
          />
        </div>

        {/* Views */}
        <AnimatePresence mode="wait">
          <motion.div
            key={view}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2 }}
          >
            {view === "overview" && <OverviewView />}
            {view === "complaints" && <ComplaintsView />}
            {view === "mess" && <MessView />}
            {view === "community" && <CommunityView />}
            {view === "passes" && <PassesView />}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}

export default function Dashboard() {
  return (
    <StoreProvider>
      <DashboardInner />
    </StoreProvider>
  );
}
