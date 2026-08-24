import { useState } from "react";
import { motion } from "framer-motion";
import { useStore } from "@/lib/store";
import type { Role, Bhawan } from "@/lib/types";
import {
  ALL_ROLES,
  BHAWANS,
  IS_WARDEN_ROLE,
  ROLE_LABELS,
} from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
  AlertTriangle,
  Crown,
  Shield,
  ShieldOff,
  UserPlus,
  Users,
} from "lucide-react";

const STAFF_ROLES = ALL_ROLES.filter((r) => !IS_WARDEN_ROLE(r) && r !== "Student");

export function AdminPortal() {
  const {
    currentUser,
    users,
    assignRole,
    revokeRole,
    addUser,
  } = useStore();

  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showAssignDialog, setShowAssignDialog] = useState<string | null>(null);
  const [confirmRevoke, setConfirmRevoke] = useState<string | null>(null);

  // New user form
  const [newName, setNewName] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [newRole, setNewRole] = useState<Role>("Student");
  const [newBhawan, setNewBhawan] = useState<Bhawan>("Ravindra");
  const [newRoom, setNewRoom] = useState("");

  // Assign form
  const [assignRole2, setAssignRole2] = useState<Role>("MessSec");
  const [assignBhawan, setAssignBhawan] = useState<Bhawan>("Ravindra");

  const canManage = IS_WARDEN_ROLE(currentUser.role);

  if (!canManage) {
    return (
      <div className="rounded-xl border border-border bg-card p-10 text-center">
        <ShieldOff className="mx-auto mb-4 size-10 text-muted-foreground/40" />
        <p className="text-sm font-semibold text-foreground">Access Restricted</p>
        <p className="mt-1 text-xs text-muted-foreground">
          Only Wardens and Assistant Wardens can access the Admin Portal.
        </p>
      </div>
    );
  }

  const staff = users.filter((u) => u.role !== "Student");
  const students = users.filter((u) => u.role === "Student");

  const handleAddUser = () => {
    if (!newName.trim() || !newEmail.trim()) return;
    addUser({
      name: newName.trim(),
      email: newEmail.trim().toLowerCase(),
      role: newRole,
      bhawan: newBhawan,
      roomNo: newRoom.trim() || "A-000",
    });
    setNewName("");
    setNewEmail("");
    setNewRole("Student");
    setNewRoom("");
    setShowAddDialog(false);
  };

  const handleAssign = (userId: string) => {
    assignRole(userId, assignRole2, assignBhawan);
    setShowAssignDialog(null);
  };

  const handleRevoke = (userId: string) => {
    revokeRole(userId);
    setConfirmRevoke(null);
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
            ⚙ Admin Portal
          </h1>
          <p className="text-sm text-muted-foreground">
            Assign and revoke roles, manage hostel staff
          </p>
        </div>
        <Button
          onClick={() => setShowAddDialog(true)}
          className="rounded-full bg-primary px-4 text-xs font-semibold text-primary-foreground"
        >
          <UserPlus className="mr-1.5 size-3.5" /> Add User
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-amber-900"
        >
          <p className="text-3xl font-bold">{staff.length}</p>
          <p className="mt-1 text-xs font-medium">Staff Members</p>
        </motion.div>
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="rounded-xl border border-sky-200 bg-sky-50 p-4 text-sky-900"
        >
          <p className="text-3xl font-bold">{students.length}</p>
          <p className="mt-1 text-xs font-medium">Students</p>
        </motion.div>
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-emerald-900"
        >
          <p className="text-3xl font-bold">{users.length}</p>
          <p className="mt-1 text-xs font-medium">Total Users</p>
        </motion.div>
      </div>

      {/* Staff Table */}
      <div className="rounded-xl border border-border bg-card p-5">
        <h3
          className="mb-4 flex items-center gap-2 font-bold text-foreground"
          style={{ fontFamily: "Lora, serif" }}
        >
          <Users className="size-4 text-primary" /> Staff & Role Holders
        </h3>
        <div className="overflow-x-auto -mx-5 px-5 md:mx-0 md:px-0">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-border text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                <th className="pb-2 pr-4">Name</th>
                <th className="pb-2 pr-4">Role</th>
                <th className="pb-2 pr-4">Bhawan</th>
                <th className="pb-2 pr-4">Email</th>
                <th className="pb-2 pr-4">Added</th>
                <th className="pb-2 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {staff.map((u) => (
                <tr key={u.id} className="border-b border-border/50 last:border-0">
                  <td className="py-2.5 pr-4">
                    <div className="flex items-center gap-2">
                      <span className="flex size-7 items-center justify-center rounded-full bg-primary/15 text-[10px] font-bold text-primary">
                        {u.name.charAt(0)}
                      </span>
                      <span className="font-semibold text-foreground">{u.name}</span>
                    </div>
                  </td>
                  <td className="py-2.5 pr-4">
                    <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-bold text-primary">
                      {ROLE_LABELS[u.role]}
                    </span>
                  </td>
                  <td className="py-2.5 pr-4 text-xs text-muted-foreground">{u.bhawan}</td>
                  <td className="py-2.5 pr-4 text-[10px] text-muted-foreground">{u.email}</td>
                  <td className="py-2.5 pr-4 text-[10px] text-muted-foreground">{u.email}</td>
                  <td className="py-2.5 text-right">
                    <div className="flex justify-end gap-1.5">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setAssignRole2(u.role);
                          setAssignBhawan(u.bhawan);
                          setShowAssignDialog(u.id);
                        }}
                        className="h-6 rounded-full px-2 text-[10px]"
                      >
                        <Crown className="mr-1 size-2.5" /> Reassign
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setConfirmRevoke(u.id)}
                        className="h-6 rounded-full border-destructive/30 px-2 text-[10px] text-destructive hover:bg-destructive/10"
                      >
                        <ShieldOff className="mr-1 size-2.5" /> Revoke
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Students table */}
      <div className="rounded-xl border border-border bg-card p-5">
        <h3
          className="mb-4 flex items-center gap-2 font-bold text-foreground"
          style={{ fontFamily: "Lora, serif" }}
        >
          <Shield className="size-4 text-sky-600" /> Students (Can be Promoted)
        </h3>
        <div className="overflow-x-auto -mx-5 px-5 md:mx-0 md:px-0">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-border text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                <th className="pb-2 pr-4">Name</th>
                <th className="pb-2 pr-4">Bhawan</th>
                <th className="pb-2 pr-4">Room</th>
                <th className="pb-2 pr-4">Branch</th>
                <th className="pb-2 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {students.slice(0, 10).map((u) => (
                <tr key={u.id} className="border-b border-border/50 last:border-0">
                  <td className="py-2.5 pr-4">
                    <div className="flex items-center gap-2">
                      <span className="flex size-7 items-center justify-center rounded-full bg-sky-100 text-[10px] font-bold text-sky-700">
                        {u.name.charAt(0)}
                      </span>
                      <span className="font-semibold text-foreground">{u.name}</span>
                    </div>
                  </td>
                  <td className="py-2.5 pr-4 text-xs text-muted-foreground">{u.bhawan}</td>
                  <td className="py-2.5 pr-4 text-xs text-muted-foreground">{u.roomNo}</td>
                  <td className="py-2.5 pr-4 text-[10px] text-muted-foreground">{u.branchName ?? "—"}</td>
                  <td className="py-2.5 text-right">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setAssignRole2("MessSec");
                        setAssignBhawan(u.bhawan);
                        setShowAssignDialog(u.id);
                      }}
                      className="h-6 rounded-full px-2 text-[10px]"
                    >
                      <Crown className="mr-1 size-2.5" /> Promote
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Assign/Reassign Dialog */}
      <Dialog open={!!showAssignDialog} onOpenChange={(o) => !o && setShowAssignDialog(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle style={{ fontFamily: "Lora, serif" }}>
              Assign Role
            </DialogTitle>
          </DialogHeader>
          {showAssignDialog && (
            <div className="space-y-4 pt-2">
              <div>
                <label className="mb-1 block text-xs font-semibold text-foreground">Role</label>
                <Select value={assignRole2} onValueChange={(v) => setAssignRole2(v as Role)}>
                  <SelectTrigger className="h-9 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {ALL_ROLES.map((r) => (
                      <SelectItem key={r} value={r} className="text-xs">
                        {ROLE_LABELS[r]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="mb-1 block text-xs font-semibold text-foreground">Bhawan</label>
                <Select value={assignBhawan} onValueChange={(v) => setAssignBhawan(v as Bhawan)}>
                  <SelectTrigger className="h-9 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {BHAWANS.map((b) => (
                      <SelectItem key={b} value={b} className="text-xs">
                        {b}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <Button
                onClick={() => showAssignDialog && handleAssign(showAssignDialog)}
                className="w-full rounded-full bg-primary text-xs font-semibold text-primary-foreground"
              >
                Confirm Assignment
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Revoke Confirmation */}
      <Dialog open={!!confirmRevoke} onOpenChange={(o) => !o && setConfirmRevoke(null)}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle style={{ fontFamily: "Lora, serif" }} className="flex items-center gap-2">
              <AlertTriangle className="size-4 text-destructive" /> Confirm Revoke
            </DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            This will revert <strong>{users.find((u) => u.id === confirmRevoke)?.name}</strong> to Student role. They will lose all staff access.
          </p>
          <div className="flex gap-2 pt-2">
            <Button
              variant="outline"
              onClick={() => setConfirmRevoke(null)}
              className="flex-1 rounded-full text-xs"
            >
              Cancel
            </Button>
            <Button
              onClick={() => confirmRevoke && handleRevoke(confirmRevoke)}
              className="flex-1 rounded-full bg-destructive text-xs text-destructive-foreground"
            >
              Revoke Role
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Add User Dialog */}
      <Dialog open={showAddDialog} onOpenChange={(o) => !o && setShowAddDialog(false)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle style={{ fontFamily: "Lora, serif" }}>Add New User</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 pt-2">
            <div>
              <label className="mb-1 block text-xs font-semibold text-foreground">Full Name</label>
              <Input
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="e.g. Ravi Kumar"
                className="h-9 text-xs"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold text-foreground">Email</label>
              <Input
                value={newEmail}
                onChange={(e) => setNewEmail(e.target.value)}
                placeholder="name@iitr.ac.in"
                type="email"
                className="h-9 text-xs"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="mb-1 block text-xs font-semibold text-foreground">Role</label>
                <Select value={newRole} onValueChange={(v) => setNewRole(v as Role)}>
                  <SelectTrigger className="h-9 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {ALL_ROLES.map((r) => (
                      <SelectItem key={r} value={r} className="text-xs">
                        {ROLE_LABELS[r]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="mb-1 block text-xs font-semibold text-foreground">Bhawan</label>
                <Select value={newBhawan} onValueChange={(v) => setNewBhawan(v as Bhawan)}>
                  <SelectTrigger className="h-9 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {BHAWANS.map((b) => (
                      <SelectItem key={b} value={b} className="text-xs">
                        {b}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold text-foreground">Room No.</label>
              <Input
                value={newRoom}
                onChange={(e) => setNewRoom(e.target.value)}
                placeholder="e.g. B-201"
                className="h-9 text-xs"
              />
            </div>
            <Button
              onClick={handleAddUser}
              disabled={!newName.trim() || !newEmail.trim()}
              className="w-full rounded-full bg-primary text-xs font-semibold text-primary-foreground"
            >
              <UserPlus className="mr-1.5 size-3.5" /> Add User
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
