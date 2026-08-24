import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useStore } from "@/lib/store";
import type { Role, Bhawan } from "@/lib/types";
import {
  ALL_ROLES,
  BHAWANS,
  IS_SUPERADMIN,
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
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Activity,
  AlertTriangle,
  Building2,
  CheckCircle,
  Crown,
  FileText,
  Megaphone,
  MessageSquare,
  Pizza,
  Plus,
  Shield,
  ShieldOff,
  Settings,
  Trash2,
  TrendingUp,
  Users,
  X,
} from "lucide-react";

/* ── Helpers ──────────────────────────────────────────────────────────────── */

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

type Tab = "overview" | "users" | "bhawans" | "settings";

/* ══════════════════════════════════════════════════════════════════════════
   CENTRAL ADMIN DASHBOARD
   ══════════════════════════════════════════════════════════════════════════ */

export function CentralAdmin() {
  const {
    currentUser,
    users,
    complaints,
    sickDietRequests,
    suggestions,
    passes,
    notices,
    bhawanConfigs,
    specialAnnouncements,
    assignRole,
    revokeRole,
    deleteUser,
    addUser,
    addBhawan,
    toggleBhawanActive,
    removeBhawan,
    addGlobalAnnouncement,
    removeGlobalAnnouncement,
  } = useStore();

  const [tab, setTab] = useState<Tab>("overview");
  const [showAddUser, setShowAddUser] = useState(false);
  const [showAddBhawan, setShowAddBhawan] = useState(false);
  const [showAddAnnouncement, setShowAddAnnouncement] = useState(false);
  const [assignDialog, setAssignDialog] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const [confirmRemoveBhawan, setConfirmRemoveBhawan] = useState<string | null>(null);
  const [assignRole2, setAssignRole2] = useState<Role>("MessSec");
  const [assignBhawan, setAssignBhawan] = useState<Bhawan>("Ravindra");
  const [newBhawanName, setNewBhawanName] = useState("");
  const [newBhawanCapacity, setNewBhawanCapacity] = useState(250);
  const [newAnnouncement, setNewAnnouncement] = useState("");
  const [newUserName, setNewUserName] = useState("");
  const [newUserEmail, setNewUserEmail] = useState("");
  const [newUserRole, setNewUserRole] = useState<Role>("Student");
  const [newUserBhawan, setNewUserBhawan] = useState<Bhawan>("Ravindra");
  const [newUserRoom, setNewUserRoom] = useState("");

  if (!IS_SUPERADMIN(currentUser.role)) {
    return (
      <div className="rounded-xl border border-border bg-card p-10 text-center">
        <ShieldOff className="mx-auto mb-4 size-10 text-muted-foreground/40" />
        <p className="text-sm font-semibold text-foreground">Access Restricted</p>
        <p className="mt-1 text-xs text-muted-foreground">
          Only the Institute Admin (SuperAdmin) can access this panel.
        </p>
      </div>
    );
  }

  // ── Global stats ──
  const totalStudents = users.filter((u) => u.role === "Student").length;
  const totalStaff = users.filter((u) => u.role !== "Student").length;
  const activeComplaints = complaints.filter((c) => c.status !== "Resolved" && c.status !== "Cannot Resolve");
  const overdueComplaints = activeComplaints.filter((c) => c.isOverdue);
  const pendingPasses = passes.filter((p) => p.status === "Pending");
  const activeSick = sickDietRequests.filter((r) => r.status !== "Delivered");
  const topSuggestions = [...suggestions].sort((a, b) => scoreOf(b) - scoreOf(a)).slice(0, 5);
  const activeBhawans = bhawanConfigs.filter((bc) => bc.active);

  // Per-bhawan stats
  const bhawanStats = bhawanConfigs.map((bc) => {
    const bUsers = users.filter((u) => u.bhawan === bc.name);
    const bComplaints = complaints.filter((c) => c.bhawan === bc.name);
    const bOverdue = bComplaints.filter((c) => c.isOverdue && c.status !== "Resolved" && c.status !== "Cannot Resolve");
    const bSick = sickDietRequests.filter((r) => r.bhawan === bc.name && r.status !== "Delivered");
    return {
      ...bc,
      students: bUsers.filter((u) => u.role === "Student").length,
      staff: bUsers.filter((u) => u.role !== "Student").length,
      totalComplaints: bComplaints.length,
      activeComplaints: bComplaints.filter((c) => c.status !== "Resolved" && c.status !== "Cannot Resolve").length,
      overdue: bOverdue.length,
      sickDiet: bSick.length,
    };
  });

  const handleAddBhawan = () => {
    if (!newBhawanName.trim()) return;
    addBhawan(newBhawanName.trim(), newBhawanCapacity);
    setNewBhawanName("");
    setNewBhawanCapacity(250);
    setShowAddBhawan(false);
  };

  const handleAddUser = () => {
    if (!newUserName.trim() || !newUserEmail.trim()) return;
    addUser({
      name: newUserName.trim(),
      email: newUserEmail.trim().toLowerCase(),
      role: newUserRole,
      bhawan: newUserBhawan,
      roomNo: newUserRoom.trim() || "A-000",
    });
    setNewUserName("");
    setNewUserEmail("");
    setNewUserRoom("");
    setShowAddUser(false);
  };

  const handleAddAnnouncement = () => {
    if (!newAnnouncement.trim()) return;
    addGlobalAnnouncement(newAnnouncement.trim());
    setNewAnnouncement("");
    setShowAddAnnouncement(false);
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
            🏛 Central Admin Panel
          </h1>
          <p className="text-sm text-muted-foreground">
            Institute-wide control — all bhawans, users, and system settings
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            onClick={() => setShowAddUser(true)}
            className="rounded-full bg-primary px-3 text-xs font-semibold text-primary-foreground"
          >
            <Plus className="mr-1 size-3" /> Add User
          </Button>
        </div>
      </div>

      {/* Tab switcher — scrollable on mobile */}
      <div className="flex gap-1 overflow-x-auto rounded-lg border border-border bg-muted/50 p-1 scrollbar-none">
        {([
          { key: "overview" as Tab, label: "Overview", icon: Activity },
          { key: "users" as Tab, label: "Users", icon: Users },
          { key: "bhawans" as Tab, label: "Bhawans", icon: Building2 },
          { key: "settings" as Tab, label: "Settings", icon: Settings },
        ]).map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`relative z-10 flex shrink-0 items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-semibold transition-colors ${
              tab === t.key
                ? "text-primary-foreground"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {tab === t.key && (
              <motion.div
                layoutId="admin-tab"
                className="absolute inset-0 rounded-md bg-primary"
                transition={{ type: "spring", stiffness: 380, damping: 30 }}
              />
            )}
            <span className="relative z-10 flex items-center gap-1.5 whitespace-nowrap">
              <t.icon className="size-3.5" />
              {t.label}
            </span>
          </button>
        ))}
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={tab}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.2 }}
        >
          {/* ── OVERVIEW TAB ── */}
          {tab === "overview" && (
            <div className="space-y-6">
              {/* Global stats */}
              <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-6">
                <StatCard label="Total Users" value={users.length} tone="bg-amber-50 text-amber-900 border border-amber-200" icon={<Users className="size-8" />} />
                <StatCard label="Students" value={totalStudents} tone="bg-sky-50 text-sky-900 border border-sky-200" icon={<Users className="size-8" />} />
                <StatCard label="Active Complaints" value={activeComplaints.length} tone="bg-orange-50 text-orange-900 border border-orange-200" icon={<FileText className="size-8" />} />
                <StatCard label="Overdue" value={overdueComplaints.length} tone="bg-rose-50 text-rose-900 border border-rose-200" icon={<AlertTriangle className="size-8" />} />
                <StatCard label="Pending Passes" value={pendingPasses.length} tone="bg-emerald-50 text-emerald-900 border border-emerald-200" icon={<CheckCircle className="size-8" />} />
                <StatCard label="Active Sick Diet" value={activeSick.length} tone="bg-purple-50 text-purple-900 border border-purple-200" icon={<Pizza className="size-8" />} />
              </div>

              {/* Bhawan breakdown */}
              <div className="rounded-xl border border-border bg-card p-5">
                <h3 className="mb-4 flex items-center gap-2 font-bold text-foreground" style={{ fontFamily: "Lora, serif" }}>
                  <Building2 className="size-4 text-primary" /> Bhawan Performance
                </h3>
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {bhawanStats.map((bs) => (
                    <div key={bs.id} className={`rounded-lg border p-4 ${bs.active ? "border-border bg-background" : "border-dashed border-border/50 bg-muted/30 opacity-60"}`}>
                      <div className="flex items-center justify-between">
                        <p className="font-bold text-foreground" style={{ fontFamily: "Lora, serif" }}>🏛 {bs.name}</p>
                        {!bs.active && <span className="rounded bg-rose-100 px-1.5 py-0.5 text-[8px] font-bold text-rose-700">INACTIVE</span>}
                      </div>
                      <div className="mt-2 grid grid-cols-2 gap-2 text-[10px]">
                        <div><span className="font-semibold text-muted-foreground">Students:</span> <span className="font-bold text-foreground">{bs.students}/{bs.capacity}</span></div>
                        <div><span className="font-semibold text-muted-foreground">Staff:</span> <span className="font-bold text-foreground">{bs.staff}</span></div>
                        <div><span className="font-semibold text-muted-foreground">Complaints:</span> <span className="font-bold text-foreground">{bs.activeComplaints} active</span></div>
                        <div><span className="font-semibold text-muted-foreground">Overdue:</span> <span className={`font-bold ${bs.overdue > 0 ? "text-rose-600" : "text-emerald-600"}`}>{bs.overdue}</span></div>
                      </div>
                      {/* Occupancy bar */}
                      <div className="mt-2">
                        <div className="h-1.5 w-full rounded-full bg-muted">
                          <div
                            className="h-1.5 rounded-full bg-primary/60"
                            style={{ width: `${Math.min((bs.students / bs.capacity) * 100, 100)}%` }}
                          />
                        </div>
                        <p className="mt-0.5 text-[9px] text-muted-foreground">
                          {Math.round((bs.students / bs.capacity) * 100)}% occupancy
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Top suggestions + staff */}
              <div className="grid gap-6 lg:grid-cols-2">
                <div className="rounded-xl border border-border bg-card p-5">
                  <h3 className="mb-3 flex items-center gap-2 font-bold text-foreground" style={{ fontFamily: "Lora, serif" }}>
                    <TrendingUp className="size-4 text-orange-600" /> Top Community Posts
                  </h3>
                  <div className="space-y-2">
                    {topSuggestions.map((s) => (
                      <div key={s.id} className="flex items-center gap-3 rounded-lg border border-border/50 bg-background px-3 py-2">
                        <span className="shrink-0 rounded-full bg-orange-100 px-2 py-0.5 text-[10px] font-bold text-orange-700">
                          ↑ {scoreOf(s)}
                        </span>
                        <div className="min-w-0">
                          <p className="truncate text-xs font-semibold text-foreground">{s.title}</p>
                          <p className="text-[10px] text-muted-foreground">r/{s.category} · {s.bhawan}</p>
                        </div>
                        <span className={`ml-auto rounded-full px-2 py-0.5 text-[8px] font-bold ${STATUS_COLORS[s.status] ?? ""}`}>
                          {s.status}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="rounded-xl border border-border bg-card p-5">
                  <h3 className="mb-3 flex items-center gap-2 font-bold text-foreground" style={{ fontFamily: "Lora, serif" }}>
                    <Crown className="size-4 text-amber-600" /> Staff Distribution
                  </h3>
                  <div className="space-y-1.5">
                    {ALL_ROLES.filter((r) => r !== "Student" && r !== "SuperAdmin").map((role) => {
                      const count = users.filter((u) => u.role === role).length;
                      return (
                        <div key={role} className="flex items-center justify-between rounded-lg bg-background px-3 py-1.5 text-xs">
                          <span className="font-semibold text-foreground">{ROLE_LABELS[role]}</span>
                          <div className="flex items-center gap-2">
                            <div className="h-1.5 w-20 rounded-full bg-muted">
                              <div
                                className="h-1.5 rounded-full bg-primary/60"
                                style={{ width: `${count > 0 ? 100 : 0}%` }}
                              />
                            </div>
                            <span className="w-6 text-right font-bold text-muted-foreground">{count}</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ── USER MANAGEMENT TAB ── */}
          {tab === "users" && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <p className="text-sm text-muted-foreground">
                  {users.length} total users across {activeBhawans.length} active bhawans
                </p>
                <Button onClick={() => setShowAddUser(true)} size="sm" className="rounded-full bg-primary text-xs text-primary-foreground">
                  <Plus className="mr-1 size-3" /> Add User
                </Button>
              </div>
              <div className="rounded-xl border border-border bg-card p-5">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm">
                    <thead>
                      <tr className="border-b border-border text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                        <th className="pb-2 pr-4">Name</th>
                        <th className="pb-2 pr-4">Role</th>
                        <th className="pb-2 pr-4">Bhawan</th>
                        <th className="pb-2 pr-4">Email</th>
                        <th className="pb-2 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {users.map((u) => (
                        <tr key={u.id} className="border-b border-border/50 last:border-0">
                          <td className="py-2.5 pr-4">
                            <div className="flex items-center gap-2">
                              <span className={`flex size-7 items-center justify-center rounded-full text-[10px] font-bold ${
                                u.role === "SuperAdmin" ? "bg-amber-150 text-amber-800" : u.role === "Student" ? "bg-sky-100 text-sky-700" : "bg-primary/15 text-primary"
                              }`}>
                                {u.name.charAt(0)}
                              </span>
                              <span className="font-semibold text-foreground">{u.name}</span>
                              {u.role === "SuperAdmin" && (
                                <Crown className="size-3 text-amber-600" />
                              )}
                            </div>
                          </td>
                          <td className="py-2.5 pr-4">
                            <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-bold text-primary">
                              {ROLE_LABELS[u.role]}
                            </span>
                          </td>
                          <td className="py-2.5 pr-4 text-xs text-muted-foreground">{u.bhawan}</td>
                          <td className="py-2.5 pr-4 text-[10px] text-muted-foreground">{u.email}</td>
                          <td className="py-2.5 text-right">
                            <div className="flex justify-end gap-1.5">
                              {u.role !== "SuperAdmin" && (
                                <>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => {
                                      setAssignRole2(u.role);
                                      setAssignBhawan(u.bhawan);
                                      setAssignDialog(u.id);
                                    }}
                                    className="h-6 rounded-full px-2 text-[10px]"
                                  >
                                    <Crown className="mr-1 size-2.5" /> Edit
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => setConfirmDelete(u.id)}
                                    className="h-6 rounded-full border-destructive/30 px-2 text-[10px] text-destructive hover:bg-destructive/10"
                                  >
                                    <Trash2 className="mr-1 size-2.5" /> Delete
                                  </Button>
                                </>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* ── BHAWAN MANAGEMENT TAB ── */}
          {tab === "bhawans" && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <p className="text-sm text-muted-foreground">
                  {activeBhawans.length} active bhawans · {bhawanConfigs.length} total
                </p>
                <Button onClick={() => setShowAddBhawan(true)} size="sm" className="rounded-full bg-primary text-xs text-primary-foreground">
                  <Plus className="mr-1 size-3" /> Add Bhawan
                </Button>
              </div>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {bhawanConfigs.map((bc) => {
                  const stats = bhawanStats.find((s) => s.id === bc.id);
                  return (
                    <motion.div
                      key={bc.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className={`rounded-xl border bg-card p-5 ${bc.active ? "border-border" : "border-dashed border-border/50 opacity-70"}`}
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <h4 className="font-bold text-foreground" style={{ fontFamily: "Lora, serif" }}>
                            🏛 {bc.name} Bhawan
                          </h4>
                          <p className="mt-1 text-[10px] text-muted-foreground">
                            Capacity: {bc.capacity} · {bc.wardenEmail ? `Warden: ${bc.wardenEmail}` : "No warden assigned"}
                          </p>
                        </div>
                        {!bc.active && (
                          <span className="rounded bg-rose-100 px-1.5 py-0.5 text-[8px] font-bold text-rose-700">
                            DEACTIVATED
                          </span>
                        )}
                      </div>

                      {stats && (
                        <div className="mt-3 grid grid-cols-3 gap-2 text-[10px]">
                          <div className="rounded bg-muted/50 px-2 py-1.5 text-center">
                            <p className="font-bold text-foreground">{stats.students}</p>
                            <p className="text-muted-foreground">Students</p>
                          </div>
                          <div className="rounded bg-muted/50 px-2 py-1.5 text-center">
                            <p className="font-bold text-foreground">{stats.activeComplaints}</p>
                            <p className="text-muted-foreground">Complaints</p>
                          </div>
                          <div className="rounded bg-muted/50 px-2 py-1.5 text-center">
                            <p className={`font-bold ${stats.overdue > 0 ? "text-rose-600" : "text-emerald-600"}`}>{stats.overdue}</p>
                            <p className="text-muted-foreground">Overdue</p>
                          </div>
                        </div>
                      )}

                      {/* Occupancy */}
                      <div className="mt-3">
                        <div className="flex items-center justify-between text-[9px] text-muted-foreground">
                          <span>Occupancy</span>
                          <span>{stats ? `${stats.students}/${bc.capacity}` : "—"}</span>
                        </div>
                        <div className="mt-1 h-1.5 w-full rounded-full bg-muted">
                          <div
                            className="h-1.5 rounded-full bg-primary/60"
                            style={{ width: `${stats ? Math.min((stats.students / bc.capacity) * 100, 100) : 0}%` }}
                          />
                        </div>
                      </div>

                      <div className="mt-3 flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => toggleBhawanActive(bc.id)}
                          className={`h-7 flex-1 rounded-full text-[10px] ${bc.active ? "border-amber-300 text-amber-700 hover:bg-amber-50" : "border-emerald-300 text-emerald-700 hover:bg-emerald-50"}`}
                        >
                          {bc.active ? "Deactivate" : "Reactivate"}
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setConfirmRemoveBhawan(bc.id)}
                          className="h-7 rounded-full border-destructive/30 px-2 text-[10px] text-destructive hover:bg-destructive/10"
                        >
                          <Trash2 className="size-2.5" />
                        </Button>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </div>
          )}

          {/* ── SYSTEM SETTINGS TAB ── */}
          {tab === "settings" && (
            <div className="space-y-6">
              {/* Global Announcements */}
              <div className="rounded-xl border border-border bg-card p-5">
                <div className="mb-4 flex items-center justify-between">
                  <h3 className="flex items-center gap-2 font-bold text-foreground" style={{ fontFamily: "Lora, serif" }}>
                    <Megaphone className="size-4 text-primary" /> Global Announcements
                  </h3>
                  <Button onClick={() => setShowAddAnnouncement(true)} size="sm" className="rounded-full bg-primary text-xs text-primary-foreground">
                    <Plus className="mr-1 size-3" /> Add
                  </Button>
                </div>
                <p className="mb-3 text-xs text-muted-foreground">
                  These announcements appear on every student's dashboard across all bhawans.
                </p>
                {specialAnnouncements.length === 0 ? (
                  <p className="py-4 text-center text-xs text-muted-foreground">No global announcements.</p>
                ) : (
                  <div className="space-y-2">
                    {specialAnnouncements.map((a, i) => (
                      <div key={i} className="flex items-center justify-between rounded-lg border border-border/50 bg-background px-3 py-2">
                        <p className="text-xs text-foreground">{a}</p>
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => removeGlobalAnnouncement(i)}
                          className="size-6 shrink-0 text-muted-foreground hover:text-destructive"
                        >
                          <X className="size-3" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* System Info */}
              <div className="rounded-xl border border-border bg-card p-5">
                <h3 className="mb-4 flex items-center gap-2 font-bold text-foreground" style={{ fontFamily: "Lora, serif" }}>
                  <Settings className="size-4 text-muted-foreground" /> System Information
                </h3>
                <div className="grid grid-cols-2 gap-4 text-xs">
                  <div className="rounded-lg bg-muted/50 p-3">
                    <p className="font-semibold text-muted-foreground">Total Users</p>
                    <p className="mt-1 text-lg font-bold text-foreground">{users.length}</p>
                  </div>
                  <div className="rounded-lg bg-muted/50 p-3">
                    <p className="font-semibold text-muted-foreground">Active Bhawans</p>
                    <p className="mt-1 text-lg font-bold text-foreground">{activeBhawans.length}</p>
                  </div>
                  <div className="rounded-lg bg-muted/50 p-3">
                    <p className="font-semibold text-muted-foreground">Total Complaints</p>
                    <p className="mt-1 text-lg font-bold text-foreground">{complaints.length}</p>
                  </div>
                  <div className="rounded-lg bg-muted/50 p-3">
                    <p className="font-semibold text-muted-foreground">Community Posts</p>
                    <p className="mt-1 text-lg font-bold text-foreground">{suggestions.length}</p>
                  </div>
                  <div className="rounded-lg bg-muted/50 p-3">
                    <p className="font-semibold text-muted-foreground">Notices</p>
                    <p className="mt-1 text-lg font-bold text-foreground">{notices.length}</p>
                  </div>
                  <div className="rounded-lg bg-muted/50 p-3">
                    <p className="font-semibold text-muted-foreground">Group Messages</p>
                    <p className="mt-1 text-lg font-bold text-foreground">{specialAnnouncements.length} announcements</p>
                  </div>
                </div>
              </div>

              {/* Quick Actions */}
              <div className="rounded-xl border border-border bg-card p-5">
                <h3 className="mb-4 flex items-center gap-2 font-bold text-foreground" style={{ fontFamily: "Lora, serif" }}>
                  <Shield className="size-4 text-destructive" /> Danger Zone
                </h3>
                <p className="mb-3 text-xs text-muted-foreground">
                  Irreversible actions. Use with caution.
                </p>
                <div className="flex gap-3">
                  <Button
                    variant="outline"
                    onClick={() => {
                      if (confirm("Reset all data to defaults? This cannot be undone.")) {
                        localStorage.removeItem("iitr-hms-v5");
                        window.location.reload();
                      }
                    }}
                    className="rounded-full border-destructive/30 text-xs text-destructive hover:bg-destructive/10"
                  >
                    <Trash2 className="mr-1.5 size-3" /> Reset All Data
                  </Button>
                </div>
              </div>
            </div>
          )}
        </motion.div>
      </AnimatePresence>

      {/* ── DIALOGS ── */}

      {/* Add User */}
      <Dialog open={showAddUser} onOpenChange={(o) => !o && setShowAddUser(false)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle style={{ fontFamily: "Lora, serif" }}>Add New User</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 pt-2">
            <div>
              <label className="mb-1 block text-xs font-semibold text-foreground">Full Name</label>
              <Input value={newUserName} onChange={(e) => setNewUserName(e.target.value)} placeholder="e.g. Ravi Kumar" className="h-9 text-xs" />
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold text-foreground">Email</label>
              <Input value={newUserEmail} onChange={(e) => setNewUserEmail(e.target.value)} placeholder="name@iitr.ac.in" type="email" className="h-9 text-xs" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="mb-1 block text-xs font-semibold text-foreground">Role</label>
                <Select value={newUserRole} onValueChange={(v) => setNewUserRole(v as Role)}>
                  <SelectTrigger className="h-9 text-xs"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {ALL_ROLES.map((r) => (
                      <SelectItem key={r} value={r} className="text-xs">{ROLE_LABELS[r]}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="mb-1 block text-xs font-semibold text-foreground">Bhawan</label>
                <Select value={newUserBhawan} onValueChange={(v) => setNewUserBhawan(v as Bhawan)}>
                  <SelectTrigger className="h-9 text-xs"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {BHAWANS.map((b) => (
                      <SelectItem key={b} value={b} className="text-xs">{b}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold text-foreground">Room No.</label>
              <Input value={newUserRoom} onChange={(e) => setNewUserRoom(e.target.value)} placeholder="e.g. B-201" className="h-9 text-xs" />
            </div>
            <Button onClick={handleAddUser} disabled={!newUserName.trim() || !newUserEmail.trim()} className="w-full rounded-full bg-primary text-xs font-semibold text-primary-foreground">
              <Plus className="mr-1.5 size-3.5" /> Add User
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Assign/Edit Role */}
      <Dialog open={!!assignDialog} onOpenChange={(o) => !o && setAssignDialog(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle style={{ fontFamily: "Lora, serif" }}>Edit User Role</DialogTitle>
          </DialogHeader>
          {assignDialog && (() => {
            const targetUser = users.find((u) => u.id === assignDialog);
            return (
              <div className="space-y-4 pt-2">
                {targetUser && (
                  <div className="rounded-lg bg-muted/50 px-3 py-2">
                    <p className="text-xs font-semibold text-foreground">{targetUser.name}</p>
                    <p className="text-[10px] text-muted-foreground">{targetUser.email}</p>
                  </div>
                )}
                <div>
                  <label className="mb-1 block text-xs font-semibold text-foreground">Role</label>
                  <Select value={assignRole2} onValueChange={(v) => setAssignRole2(v as Role)}>
                    <SelectTrigger className="h-9 text-xs"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {ALL_ROLES.map((r) => (
                        <SelectItem key={r} value={r} className="text-xs">{ROLE_LABELS[r]}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="mb-1 block text-xs font-semibold text-foreground">Bhawan</label>
                  <Select value={assignBhawan} onValueChange={(v) => setAssignBhawan(v as Bhawan)}>
                    <SelectTrigger className="h-9 text-xs"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {BHAWANS.map((b) => (
                        <SelectItem key={b} value={b} className="text-xs">{b}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" onClick={() => setAssignDialog(null)} className="flex-1 rounded-full text-xs">Cancel</Button>
                  <Button onClick={() => { if (assignDialog) { assignRole(assignDialog, assignRole2, assignBhawan); setAssignDialog(null); } }} className="flex-1 rounded-full bg-primary text-xs text-primary-foreground">
                    Save Changes
                  </Button>
                </div>
              </div>
            );
          })()}
        </DialogContent>
      </Dialog>

      {/* Confirm Delete User */}
      <Dialog open={!!confirmDelete} onOpenChange={(o) => !o && setConfirmDelete(null)}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle style={{ fontFamily: "Lora, serif" }} className="flex items-center gap-2">
              <AlertTriangle className="size-4 text-destructive" /> Delete User
            </DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            Permanently delete <strong>{users.find((u) => u.id === confirmDelete)?.name}</strong>? This cannot be undone.
          </p>
          <div className="flex gap-2 pt-2">
            <Button variant="outline" onClick={() => setConfirmDelete(null)} className="flex-1 rounded-full text-xs">Cancel</Button>
            <Button onClick={() => { if (confirmDelete) { deleteUser(confirmDelete); setConfirmDelete(null); } }} className="flex-1 rounded-full bg-destructive text-xs text-destructive-foreground">
              Delete User
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Add Bhawan */}
      <Dialog open={showAddBhawan} onOpenChange={(o) => !o && setShowAddBhawan(false)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle style={{ fontFamily: "Lora, serif" }}>Add New Bhawan</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 pt-2">
            <div>
              <label className="mb-1 block text-xs font-semibold text-foreground">Bhawan Name</label>
              <Input value={newBhawanName} onChange={(e) => setNewBhawanName(e.target.value)} placeholder="e.g. New Bhawan" className="h-9 text-xs" />
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold text-foreground">Capacity (rooms)</label>
              <Input value={newBhawanCapacity} onChange={(e) => setNewBhawanCapacity(Number(e.target.value))} type="number" min={1} className="h-9 text-xs" />
            </div>
            <Button onClick={handleAddBhawan} disabled={!newBhawanName.trim()} className="w-full rounded-full bg-primary text-xs font-semibold text-primary-foreground">
              <Building2 className="mr-1.5 size-3.5" /> Add Bhawan
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Confirm Remove Bhawan */}
      <Dialog open={!!confirmRemoveBhawan} onOpenChange={(o) => !o && setConfirmRemoveBhawan(null)}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle style={{ fontFamily: "Lora, serif" }} className="flex items-center gap-2">
              <AlertTriangle className="size-4 text-destructive" /> Remove Bhawan
            </DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            Remove <strong>{bhawanConfigs.find((b) => b.id === confirmRemoveBhawan)?.name}</strong> Bhawan? Users assigned here will remain but lose their bhawan association.
          </p>
          <div className="flex gap-2 pt-2">
            <Button variant="outline" onClick={() => setConfirmRemoveBhawan(null)} className="flex-1 rounded-full text-xs">Cancel</Button>
            <Button onClick={() => { if (confirmRemoveBhawan) { removeBhawan(confirmRemoveBhawan); setConfirmRemoveBhawan(null); } }} className="flex-1 rounded-full bg-destructive text-xs text-destructive-foreground">
              Remove
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Add Announcement */}
      <Dialog open={showAddAnnouncement} onOpenChange={(o) => !o && setShowAddAnnouncement(false)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle style={{ fontFamily: "Lora, serif" }} className="flex items-center gap-2">
              <Megaphone className="size-4 text-primary" /> Add Global Announcement
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3 pt-2">
            <Textarea
              value={newAnnouncement}
              onChange={(e) => setNewAnnouncement(e.target.value)}
              placeholder="e.g. 🎉 Annual hostel fest starts next week!"
              rows={3}
              className="text-sm"
            />
            <p className="text-[10px] text-muted-foreground">
              This will appear on every student's dashboard across all bhawans.
            </p>
            <Button onClick={handleAddAnnouncement} disabled={!newAnnouncement.trim()} className="w-full rounded-full bg-primary text-xs font-semibold text-primary-foreground">
              Post Announcement
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
