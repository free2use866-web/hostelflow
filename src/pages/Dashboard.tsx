import { useEffect, useState, type ReactNode } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router";
import { useAuth } from "@/hooks/use-auth";
import { StoreProvider, useStore } from "@/lib/store";
import {
  ALL_ROLES,
  ROLE_LABELS,
  IS_WARDEN_ROLE,
  IS_SECY_ROLE,
} from "@/lib/types";
import {
  ChevronDown,
  LogOut,
  LayoutDashboard,
  MessageSquare,
  UtensilsCrossed,
  ThumbsUp,
  KeyRound,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { ComplaintsView } from "@/components/app/ComplaintsView";
import { MessView } from "@/components/app/MessView";
import { CommunityView } from "@/components/app/CommunityView";
import { PassesView } from "@/components/app/PassesView";
import {
  WardenDashboard,
  SecyDashboard,
  StudentDashboard,
} from "@/components/app/RoleDashboards";
import { OnboardingGate } from "@/components/app/OnboardingGate";
import { isValidIITREmail } from "@/lib/academic-identity";

type ViewKey =
  | "overview"
  | "complaints"
  | "mess"
  | "community"
  | "passes";

const NAV_ITEMS: {
  key: ViewKey;
  label: string;
  icon: typeof LayoutDashboard;
}[] = [
  { key: "overview", label: "Dashboard", icon: LayoutDashboard },
  { key: "complaints", label: "Complaints", icon: MessageSquare },
  { key: "mess", label: "Mess & Diet", icon: UtensilsCrossed },
  { key: "community", label: "Community", icon: ThumbsUp },
  { key: "passes", label: "Digital Passes", icon: KeyRound },
];

/* ─── Animated Tab Underline ─────────────────────────────────────────────── */

function AnimatedTabs({
  tabs,
  active,
  onChange,
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
            active === t.key
              ? "text-primary-foreground"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          {active === t.key && (
            <motion.div
              layoutId="tab-indicator"
              className="absolute inset-0 rounded-md bg-primary"
              transition={{
                type: "spring",
                stiffness: 380,
                damping: 30,
              }}
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

/* ─── Persona Switcher ──────────────────────────────────────────────────── */

function PersonaDropdown() {
  const { currentUser, users, switchUser } = useStore();
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          className="gap-2 rounded-full border-border text-xs font-semibold"
        >
          <span className="flex size-6 items-center justify-center rounded-full bg-primary/15 text-[10px] font-bold text-primary">
            {currentUser.name.charAt(0)}
          </span>
          <span className="max-w-[120px] truncate">
            {currentUser.name}
          </span>
          <span className="rounded-full bg-primary/10 px-1.5 py-0.5 text-[9px] font-bold text-primary">
            {ROLE_LABELS[currentUser.role]}
          </span>
          <ChevronDown className="size-3" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="end"
        className="w-72 rounded-xl border-border"
      >
        <DropdownMenuLabel className="text-xs text-muted-foreground">
          Switch Persona — Sandbox Mode
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        {ALL_ROLES.map((r) => {
          const representative =
            users.find(
              (u) =>
                u.role === r && u.bhawan === currentUser.bhawan,
            ) ?? users.find((u) => u.role === r);
          if (!representative) return null;
          return (
            <DropdownMenuItem
              key={r}
              onClick={() => switchUser(representative.id)}
              className={`flex items-center gap-2 rounded-lg text-sm ${
                representative.id === currentUser.id
                  ? "bg-primary/10 font-semibold"
                  : ""
              }`}
            >
              <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-muted text-[10px] font-bold">
                {representative.name.charAt(0)}
              </span>
              <div className="min-w-0">
                <p className="truncate font-medium">
                  {representative.name}
                </p>
                <p className="truncate text-[10px] text-muted-foreground">
                  {ROLE_LABELS[r]}
                </p>
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

function DashboardInner() {
  const { currentUser, switchByEmail } = useStore();
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [view, setView] = useState<ViewKey>("overview");

  // Sync Convex auth email → store
  useEffect(() => {
    if (user?.email) switchByEmail(user.email);
  }, [user?.email, switchByEmail]);

  // Defense-in-depth domain guard
  useEffect(() => {
    if (user?.email && !isValidIITREmail(user.email)) {
      signOut()
        .then(() =>
          navigate("/?error=domain_restricted", { replace: true }),
        )
        .catch(() => {});
    }
  }, [user?.email, signOut, navigate]);

  const handleSignOut = async () => {
    await signOut();
    navigate("/");
  };

  // Strict verification gate
  if (!currentUser.isVerified) {
    return <OnboardingGate />;
  }

  const isWarden = IS_WARDEN_ROLE(currentUser.role);
  const isSecy = IS_SECY_ROLE(currentUser.role);

  const navigateToView = (k: string) => setView(k as ViewKey);

  return (
    <div className="min-h-screen bg-background">
      {/* Persona Switcher Top Bar */}
      <div className="sticky top-0 z-50 border-b border-border bg-card/95 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-2.5">
          <div className="flex items-center gap-3">
            <div className="flex size-8 items-center justify-center rounded-lg bg-primary text-xs font-bold text-primary-foreground">
              IITR
            </div>
            <span
              className="hidden text-sm font-bold text-foreground sm:inline"
              style={{ fontFamily: "Lora, serif" }}
            >
              HostelHub
            </span>
          </div>

          <PersonaDropdown />

          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              className="size-8 rounded-full text-muted-foreground"
              onClick={handleSignOut}
            >
              <LogOut className="size-4" />
            </Button>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 py-6">
        {/* Navigation tabs */}
        <div className="mb-6 flex flex-wrap items-center gap-2">
          <AnimatedTabs
            tabs={NAV_ITEMS.map((n) => ({
              key: n.key,
              label: n.label,
              icon: <n.icon className="size-3.5" />,
            }))}
            active={view}
            onChange={(k) => setView(k as ViewKey)}
          />
        </div>

        {/* View routing */}
        <AnimatePresence mode="wait">
          <motion.div
            key={view}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2 }}
          >
            {view === "overview" &&
              (isWarden ? (
                <WardenDashboard onNavigate={navigateToView} />
              ) : isSecy ? (
                <SecyDashboard onNavigate={navigateToView} />
              ) : (
                <StudentDashboard onNavigate={navigateToView} />
              ))}
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
