import { Button } from "@/components/ui/button";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import type { HostelRole } from "@/convex/schema";
import { useAuth } from "@/hooks/use-auth";
import { ROLE_META, categoryForSecy, isStaffRole } from "@/lib/hostel";
import {
  Bell,
  Home,
  LogOut,
  Megaphone,
  QrCode,
  Ticket,
  Users,
} from "lucide-react";
import { useEffect, useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { useNavigate, useSearchParams } from "react-router";
import { toast } from "sonner";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { timeAgo } from "@/lib/hostel";
import { OverviewView } from "@/components/app/OverviewView";
import { NewTicketView } from "@/components/app/NewTicketView";
import { MyTicketsView } from "@/components/app/MyTicketsView";
import { TokensView } from "@/components/app/TokensView";
import { PortalView } from "@/components/app/PortalView";
import { TicketDetail } from "@/components/app/TicketDetail";

type ViewKey = "overview" | "new" | "mine" | "tokens" | "portal";

export default function Dashboard() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [view, setView] = useState<ViewKey>("overview");
  const [openTicketId, setOpenTicketId] = useState<string | null>(null);

  const claimProfile = useMutation(api.profile.claimProfile);
  const setDemoProfile = useMutation(api.profile.setDemoProfile);

  const demoRole = searchParams.get("demoRole") as HostelRole | null;

  useEffect(() => {
    if (!user) return;
    if (demoRole && user.hostelRole !== demoRole) {
      setDemoProfile({ role: demoRole })
        .then(() => setSearchParams({}, { replace: true }))
        .catch((e) =>
          toast.error(e instanceof Error ? e.message : "Demo setup failed"),
        );
    } else if (!user.hostelRole) {
      claimProfile().catch(() => {});
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?._id, user?.hostelRole, demoRole]);

  const role = user?.hostelRole as HostelRole | undefined;
  const isSecy = !!categoryForSecy(role);
  const staff = isStaffRole(role);

  const navItems: { key: ViewKey; label: string; icon: typeof Home; show: boolean }[] = [
    { key: "overview", label: "Overview", icon: Home, show: true },
    { key: "new", label: "File Complaint", icon: Megaphone, show: true },
    { key: "mine", label: "My Complaints", icon: Ticket, show: true },
    { key: "portal", label: isSecy ? "My Portal" : staff ? "All Complaints" : "Communities", icon: Users, show: true },
    { key: "tokens", label: "Mess Tokens", icon: QrCode, show: true },
  ];

  const handleSignOut = async () => {
    await signOut();
    navigate("/");
  };

  return (
    <div className="min-h-screen bg-background">
      {/* decorative blobs */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -top-32 left-1/4 size-96 rounded-full bg-primary/10 blur-3xl" />
        <div className="absolute right-0 bottom-0 size-[26rem] rounded-full bg-secondary/20 blur-3xl" />
      </div>

      <div className="relative z-10 mx-auto flex max-w-6xl gap-6 px-4 py-6 lg:px-8">
        {/* Sidebar */}
        <aside className="sticky top-6 hidden h-fit w-56 shrink-0 flex-col gap-2 lg:flex">
          <button
            onClick={() => setView("overview")}
            className="clay-flat clay-pressable mb-4 flex items-center gap-3 rounded-3xl p-4 text-left"
          >
            <span className="flex size-10 items-center justify-center rounded-2xl bg-primary text-xl shadow-[var(--clay-raised),var(--clay-inner)]">
              🏠
            </span>
            <span>
              <span className="block text-sm font-extrabold">HostelHub</span>
              <span className="block text-xs text-muted-foreground">
                IIT Roorkee
              </span>
            </span>
          </button>

          {navItems.map((n) => (
            <NavButton
              key={n.key}
              active={view === n.key}
              label={n.label}
              Icon={n.icon}
              onClick={() => setView(n.key)}
            />
          ))}

          <UserCard onSignOut={handleSignOut} />
        </aside>

        {/* Main */}
        <main className="min-w-0 flex-1 space-y-6">
          {/* Mobile header */}
          <header className="flex items-center justify-between gap-3 lg:hidden">
            <span className="text-lg font-extrabold">🏠 HostelHub·IITR</span>
            <NotificationBell />
            <Button
              size="icon"
              variant="outline"
              onClick={handleSignOut}
              className="clay-flat size-10 rounded-full border-none"
            >
              <LogOut className="size-4" />
            </Button>
          </header>

          {/* Mobile nav */}
          <nav className="scrollbar-none flex gap-2 overflow-x-auto pb-1 lg:hidden">
            {navItems.map((n) => (
              <button
                key={n.key}
                onClick={() => setView(n.key)}
                className={`flex shrink-0 items-center gap-1.5 rounded-full px-4 py-2 text-xs font-bold whitespace-nowrap transition-all ${
                  view === n.key
                    ? "bg-primary/10 text-primary shadow-[var(--clay-raised),var(--clay-inner)]"
                    : "clay-inset text-muted-foreground"
                }`}
              >
                <n.icon className="size-3.5" /> {n.label}
              </button>
            ))}
          </nav>

          {/* Desktop top bar */}
          <header className="hidden items-center justify-between lg:flex">
            <div className="flex items-center gap-2 rounded-full px-1">
              {role && (
                <span className="clay-inset flex items-center gap-2 rounded-full px-4 py-2 text-sm font-bold">
                  {ROLE_META[role].emoji} {ROLE_META[role].label}
                  {user?.isDemo && (
                    <span className="rounded-full bg-accent px-2 py-0.5 text-[10px] font-extrabold tracking-wide text-accent-foreground uppercase">
                      Demo
                    </span>
                  )}
                </span>
              )}
            </div>
            <NotificationBell />
          </header>

          {view === "overview" && (
            <OverviewView onSelectTicket={setOpenTicketId} />
          )}
          {view === "new" && (
            <NewTicketView onFiled={() => setView("mine")} />
          )}
          {view === "mine" && <MyTicketsView onSelectTicket={setOpenTicketId} />}
          {view === "tokens" && <TokensView />}
          {view === "portal" && (
            <PortalView role={role} onSelectTicket={setOpenTicketId} />
          )}

          <footer className="pt-8 pb-4 text-center text-xs text-muted-foreground">
            HostelHub ·IITR — complaints, tokens & coordination for hostel life
          </footer>
        </main>
      </div>

      <TicketDetail
        ticketId={openTicketId as Id<"tickets"> | null}
        open={!!openTicketId}
        onOpenChange={(v) => !v && setOpenTicketId(null)}
      />
    </div>
  );
}

function NavButton({
  active,
  label,
  Icon,
  onClick,
}: {
  active: boolean;
  label: string;
  Icon: typeof Home;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-bold transition-all ${
        active
          ? "bg-primary/12 text-primary shadow-[var(--clay-raised),var(--clay-inner)]"
          : "clay-inset text-muted-foreground hover:text-foreground"
      }`}
    >
      <Icon className="size-4 shrink-0" />
      {label}
    </button>
  );
}

function UserCard({ onSignOut }: { onSignOut: () => void }) {
  const { user } = useAuth();
  return (
    <div className="clay-flat mt-auto rounded-3xl p-4">
      <p className="truncate text-sm font-bold">{user?.name ?? "Member"}</p>
      <p className="mb-3 truncate text-xs text-muted-foreground">
        {user?.email ?? "demo mode"}
      </p>
      <Button
        variant="outline"
        size="sm"
        onClick={onSignOut}
        className="clay-flat clay-pressable w-full rounded-full border-none text-xs"
      >
        <LogOut className="mr-1 size-3.5" /> Sign out
      </Button>
    </div>
  );
}

function NotificationBell() {
  const unread = useQuery(api.notifications.unreadCount, {});
  const items = useQuery(api.notifications.listMine, {});
  const markAllRead = useMutation(api.notifications.markAllRead);

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          size="icon"
          className="clay-flat relative size-11 shrink-0 rounded-full border-none"
        >
          <Bell className="size-4" />
          {!!unread && unread > 0 && (
            <span className="absolute -top-1 -right-1 flex size-5 items-center justify-center rounded-full bg-destructive text-[10px] font-extrabold text-white">
              {unread > 9 ? "9+" : unread}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="clay-lg w-80 rounded-3xl border-none p-4" align="end">
        <div className="mb-2 flex items-center justify-between">
          <p className="text-sm font-extrabold">Notifications</p>
          {!!unread && unread > 0 && (
            <button
              onClick={() => markAllRead()}
              className="text-xs font-semibold text-primary hover:underline"
            >
              Mark all read
            </button>
          )}
        </div>
        {!items || items.length === 0 ? (
          <p className="py-6 text-center text-sm text-muted-foreground">
            🔔 All quiet — nothing yet.
          </p>
        ) : (
          <ul className="max-h-72 space-y-2 overflow-y-auto">
            {items.map((n) => (
              <li
                key={n._id}
                className={`rounded-2xl p-3 text-xs leading-relaxed ${
                  n.read ? "opacity-60" : "bg-primary/5 font-medium"
                }`}
              >
                {n.message}
                <span className="mt-1 block text-[10px] text-muted-foreground">
                  {timeAgo(n.createdAt)}
                </span>
              </li>
            ))}
          </ul>
        )}
      </PopoverContent>
    </Popover>
  );
}
