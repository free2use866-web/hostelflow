import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import type {
  User, Complaint, SickDietRequest, MessMenu, Suggestion,
  Rebate, Pass, Role, Bhawan, Category, AppState,
  ComplaintStatus, PassType, MealType, SuggestionStatus, RebateStatus, PassStatus, SickDietStatus,
  Notice, GroupMessage, BhawanConfig,
} from "./types";
import { CATEGORY_TO_ROLE } from "./types";
import { genMockData, SCHEMA_VERSION, uid } from "./mock-data";

const STORAGE_KEY = "iitr-hms-v6";
// SECURITY/INTEGRITY: persisted snapshots carry a schema version. Anything we
// can't structurally validate (tampered via DevTools, corrupt partial write,
// stale shape after a deploy) is DISCARDED and reseeded instead of crashing
// dozens of unguarded consumers downstream.

type PersistedState = AppState & { schemaVersion?: number };

function loadPersisted(): AppState | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const p = JSON.parse(raw) as PersistedState;
    const isArr = (x: unknown): x is unknown[] => Array.isArray(x);
    if (
      p?.schemaVersion !== SCHEMA_VERSION ||
      !isArr(p.users) ||
      !isArr(p.complaints) ||
      !isArr(p.passes) ||
      !isArr(p.notices) ||
      !isArr(p.groupMessages) ||
      !isArr(p.bhawanConfigs) ||
      !isArr(p.specialAnnouncements) ||
      typeof p.currentUserId !== "string" ||
      typeof p.nextId !== "number"
    ) {
      return null;
    }
    return p as AppState;
  } catch {
    return null; // malformed JSON ⇒ reseed, never crash on boot
  }
}

function nowISO(): string { return new Date().toISOString(); }

// Demo fixtures live in lib/mock-data.ts — this module owns behavior only.

// ─── Context ───────────────────────────────────────────────────────────────────

interface StoreContextType extends AppState {
  currentUser: User;
  switchUser: (userId: string) => void;
  switchByEmail: (email: string) => void;
  /** Collision-proof ID minting (UUID-based). Prefer the atomic add* actions. */
  genId: (prefix: string) => string;
  completeOnboarding: (data: {
    name: string; enrollmentNumber: string; enrollmentYear: number;
    branchCode: number; branchName: string; academicYear: number;
    bhawan: Bhawan; roomNo: string;
  }) => void;

  addComplaint: (c: Omit<Complaint, "id" | "createdAt" | "updatedAt" | "isOverdue" | "comments" | "assignedRole">) => void;
  updateComplaintStatus: (id: string, status: ComplaintStatus, note?: string) => void;
  reassignComplaint: (id: string, newCategory: Category) => void;
  addComplaintComment: (id: string, text: string) => void;

  addSickDietRequest: (r: Omit<SickDietRequest, "id" | "status" | "deliveredBy" | "notifiedRoles">) => void;
  updateSickDietStatus: (id: string, status: SickDietStatus, deliveredBy?: string) => void;

  addSuggestion: (s: Omit<Suggestion, "id" | "upvotedBy" | "downvotedBy" | "status" | "createdAt" | "comments">) => void;
  voteSuggestion: (id: string, dir: "up" | "down") => void;
  addSuggestionComment: (suggestionId: string, text: string, parentId?: string | null) => void;
  voteComment: (suggestionId: string, commentId: string, dir: "up" | "down") => void;
  toggleJoin: (communityId: string) => void;
  updateSuggestionStatus: (id: string, status: SuggestionStatus, feedback?: string) => void;

  addRebate: (r: Omit<Rebate, "id" | "status" | "submittedAt">) => void;
  updateRebateStatus: (id: string, status: RebateStatus) => void;

  addPass: (p: Omit<Pass, "id" | "status" | "approvedBy" | "createdAt">) => void;
  updatePassStatus: (id: string, status: PassStatus, approvedBy?: string) => void;

  // ── Admin ──
  assignRole: (userId: string, newRole: Role, newBhawan?: Bhawan) => void;
  revokeRole: (userId: string) => void;
  addUser: (data: { name: string; email: string; role: Role; bhawan: Bhawan; roomNo: string }) => void;

  // ── Notices ──
  addNotice: (n: Omit<Notice, "id" | "createdAt">) => void;
  deleteNotice: (id: string) => void;

  // ── Group Chat ──
  sendGroupMessage: (text: string) => void;

  // ── SuperAdmin ──
  addBhawan: (name: string, capacity: number) => void;
  toggleBhawanActive: (bhawanId: string) => void;
  removeBhawan: (bhawanId: string) => void;
  addGlobalAnnouncement: (text: string) => void;
  removeGlobalAnnouncement: (id: string) => void;
  deleteUser: (userId: string) => void;
}

const StoreContext = createContext<StoreContextType | null>(null);

export function StoreProvider({ children }: { children: React.ReactNode }) {
  // Versioned + structurally validated load. Corrupt or tampered snapshots
  // are discarded (reseeded) instead of crashing on first render.
  const [state, setState] = useState<AppState>(() => {
    const loaded = loadPersisted();
    if (loaded) return loaded;
    const fresh = genMockData();
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(fresh));
    } catch (err) {
      console.error("[store] initial persist failed:", err);
    }
    return fresh;
  });

  const stateRef = useRef(state);
  stateRef.current = state;

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch (err) {
      // QuotaExceededError previously threw inside this effect on EVERY
      // subsequent render → crash loop. Log and keep the app usable.
      console.error("[store] persist failed:", err);
    }
  }, [state]);

  // Cross-tab consistency: when another tab writes, ADOPT its snapshot
  // instead of blindly overwriting it on our next flush (last-write-wins
  // used to silently erase the other tab's records).
  useEffect(() => {
    function onStorage(e: StorageEvent) {
      if (e.key !== STORAGE_KEY || e.newValue === null) return;
      try {
        const incoming = JSON.parse(e.newValue) as PersistedState;
        if (incoming?.schemaVersion === SCHEMA_VERSION) {
          setState(incoming);
        }
      } catch {
        /* ignore malformed cross-tab payloads */
      }
    }
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  const currentUser = state.users.find((u) => u.id === state.currentUserId) ?? state.users[0];

  // RACE FIX: IDs minted outside React state are collision-proof; mutations
  // needing sequence numbers consume s.nextId atomically inside updaters.
  const genId = useCallback(
    (prefix: string) => `${prefix}-${crypto.randomUUID()}`,
    [],
  );

  const switchUser = useCallback((userId: string) => {
    setState((s) => ({ ...s, currentUserId: userId }));
  }, []);

  const switchByEmail = useCallback((rawEmail: string) => {
    // Normalize case ONCE — mixed-case Google profiles otherwise fork
    // duplicate accounts for the same person.
    const email = rawEmail.toLowerCase().trim();
    setState((s) => {
      const match = s.users.find((u) => u.email === email);
      if (match) return { ...s, currentUserId: match.id };
      // New sign-in → unverified until onboarding completes
      const newUser: User = {
        id: uid("u", s.nextId), name: email.split("@")[0], email,
        role: "Student", bhawan: "Ravindra", roomNo: "A-000",
        isVerified: false,
      };
      return { ...s, users: [...s.users, newUser], currentUserId: newUser.id, nextId: s.nextId + 1 };
    });
  }, []);

  /** Onboarding gate: persist verified academic identity. */
  const completeOnboarding = useCallback((data: {
    name: string; enrollmentNumber: string; enrollmentYear: number;
    branchCode: number; branchName: string; academicYear: number;
    bhawan: Bhawan; roomNo: string;
  }) => {
    setState((s) => ({
      ...s,
      users: s.users.map((u) =>
        u.id === s.currentUserId
          ? {
              ...u,
              name: data.name,
              enrollmentNumber: data.enrollmentNumber,
              enrollmentYear: data.enrollmentYear,
              branchCode: data.branchCode,
              branchName: data.branchName,
              academicYear: data.academicYear,
              bhawan: data.bhawan,
              roomNo: data.roomNo,
              isVerified: true,
            }
          : u,
      ),
    }));
  }, []);

  const patch = useCallback((updater: (s: AppState) => AppState) => {
    setState((s) => updater(s));
  }, []);

  // ─── Complaints ────────────────────────────────────────────────────────
  const addComplaint: StoreContextType["addComplaint"] = useCallback((data) => {
    const role = CATEGORY_TO_ROLE[data.category];
    patch((s) => ({
      ...s,
      complaints: [
        {
          ...data,
          id: uid("c", s.nextId), assignedRole: role, status: "Pending",
          createdAt: nowISO(), updatedAt: nowISO(), isOverdue: false, comments: [],
        },
        ...s.complaints,
      ],
      nextId: s.nextId + 1,
    }));
  }, [patch]);

  const updateComplaintStatus: StoreContextType["updateComplaintStatus"] = useCallback((id, status, note) => {
    patch((s) => ({
      ...s,
      complaints: s.complaints.map((c) =>
        c.id === id
          ? {
              ...c, status, updatedAt: nowISO(),
              comments: note
                ? [...c.comments, { author: s.users.find((u) => u.id === s.currentUserId)?.name ?? "Unknown", text: note, date: nowISO() }]
                : c.comments,
            }
          : c,
      ),
    }));
  }, [patch]);

  const reassignComplaint: StoreContextType["reassignComplaint"] = useCallback((id, newCategory) => {
    const newRole = CATEGORY_TO_ROLE[newCategory];
    patch((s) => ({
      ...s,
      complaints: s.complaints.map((c) =>
        c.id === id
          ? { ...c, category: newCategory, assignedRole: newRole, status: "Pending" as const, updatedAt: nowISO() }
          : c,
      ),
    }));
  }, [patch]);

  const addComplaintComment: StoreContextType["addComplaintComment"] = useCallback((id, text) => {
    patch((s) => ({
      ...s,
      complaints: s.complaints.map((c) =>
        c.id === id
          ? {
              ...c, updatedAt: nowISO(),
              comments: [...c.comments, { author: s.users.find((u) => u.id === s.currentUserId)?.name ?? "Unknown", text, date: nowISO(), authorRole: s.users.find((u) => u.id === s.currentUserId)?.role }],
            }
          : c,
      ),
    }));
  }, [patch]);

  // ─── Sick Diet ─────────────────────────────────────────────────────────
  const addSickDietRequest: StoreContextType["addSickDietRequest"] = useCallback((data) => {
    patch((s) => ({
      ...s,
      sickDietRequests: [
        { ...data, id: uid("sd", s.nextId), status: "Requested" as const, notifiedRoles: ["MessSec", "WellnessSec"] },
        ...s.sickDietRequests,
      ],
      nextId: s.nextId + 1,
    }));
  }, [patch]);

  const updateSickDietStatus: StoreContextType["updateSickDietStatus"] = useCallback((id, status, deliveredBy) => {
    patch((s) => ({
      ...s,
      sickDietRequests: s.sickDietRequests.map((r) =>
        r.id === id ? { ...r, status, deliveredBy: deliveredBy ?? r.deliveredBy } : r,
      ),
    }));
  }, [patch]);

  // ─── Suggestions / Community (Reddit-style) ───────────────────────────
  const addSuggestion: StoreContextType["addSuggestion"] = useCallback((data) => {
    patch((s) => ({
      ...s,
      suggestions: [
        {
          ...data, id: uid("sg", s.nextId),
          upvotedBy: [s.currentUserId], downvotedBy: [],
          status: "Open" as const, createdAt: nowISO(), comments: [],
        },
        ...s.suggestions,
      ],
      nextId: s.nextId + 1,
    }));
  }, [patch]);

  /** Reddit vote semantics: up→down switches, clicking active vote clears it. */
  const voteSuggestion: StoreContextType["voteSuggestion"] = useCallback((id, dir) => {
    patch((s) => ({
      ...s,
      suggestions: s.suggestions.map((sg) => {
        if (sg.id !== id) return sg;
        const me = s.currentUserId;
        const up = sg.upvotedBy.includes(me);
        const down = sg.downvotedBy.includes(me);
        if (dir === "up") {
          return down
            ? { ...sg, downvotedBy: sg.downvotedBy.filter((u) => u !== me), upvotedBy: [...sg.upvotedBy, me] }
            : up
              ? { ...sg, upvotedBy: sg.upvotedBy.filter((u) => u !== me) }
              : { ...sg, upvotedBy: [...sg.upvotedBy, me] };
        }
        return up
          ? { ...sg, upvotedBy: sg.upvotedBy.filter((u) => u !== me), downvotedBy: [...sg.downvotedBy, me] }
          : down
            ? { ...sg, downvotedBy: sg.downvotedBy.filter((u) => u !== me) }
            : { ...sg, downvotedBy: [...sg.downvotedBy, me] };
      }),
    }));
  }, [patch]);

  const addSuggestionComment: StoreContextType["addSuggestionComment"] = useCallback((suggestionId, text, parentId = null) => {
    patch((s) => {
      const me = s.users.find((u) => u.id === s.currentUserId);
      const comment = {
        id: `c-${s.nextId}`, authorId: s.currentUserId,
        authorName: me?.name ?? "Unknown", text: text.trim(),
        createdAt: nowISO(), parentId: parentId ?? null,
        upvotedBy: [s.currentUserId], downvotedBy: [],
      };
      return {
        ...s,
        suggestions: s.suggestions.map((sg) =>
          sg.id === suggestionId ? { ...sg, comments: [...sg.comments, comment] } : sg,
        ),
        nextId: s.nextId + 1,
      };
    });
  }, [patch]);

  const voteComment: StoreContextType["voteComment"] = useCallback((suggestionId, commentId, dir) => {
    patch((s) => ({
      ...s,
      suggestions: s.suggestions.map((sg) => {
        if (sg.id !== suggestionId) return sg;
        const me = s.currentUserId;
        return {
          ...sg,
          comments: sg.comments.map((c) => {
            if (c.id !== commentId) return c;
            const up = c.upvotedBy.includes(me);
            const down = c.downvotedBy.includes(me);
            if (dir === "up") {
              return down
                ? { ...c, downvotedBy: c.downvotedBy.filter((u) => u !== me), upvotedBy: [...c.upvotedBy, me] }
                : up
                  ? { ...c, upvotedBy: c.upvotedBy.filter((u) => u !== me) }
                  : { ...c, upvotedBy: [...c.upvotedBy, me] };
            }
            return up
              ? { ...c, upvotedBy: c.upvotedBy.filter((u) => u !== me), downvotedBy: [...c.downvotedBy, me] }
              : down
                ? { ...c, downvotedBy: c.downvotedBy.filter((u) => u !== me) }
                : { ...c, downvotedBy: [...c.downvotedBy, me] };
          }),
        };
      }),
    }));
  }, [patch]);

  const toggleJoin: StoreContextType["toggleJoin"] = useCallback((communityId) => {
    patch((s) => {
      const mine = s.joinedBy[s.currentUserId] ?? [];
      return {
        ...s,
        joinedBy: {
          ...s.joinedBy,
          [s.currentUserId]: mine.includes(communityId)
            ? mine.filter((c) => c !== communityId)
            : [...mine, communityId],
        },
      };
    });
  }, [patch]);

  const updateSuggestionStatus: StoreContextType["updateSuggestionStatus"] = useCallback((id, status, feedback) => {
    patch((s) => ({
      ...s,
      suggestions: s.suggestions.map((sg) =>
        sg.id === id ? { ...sg, status, wardenFeedback: feedback ?? sg.wardenFeedback } : sg,
      ),
    }));
  }, [patch]);

  // ─── Rebates ───────────────────────────────────────────────────────────
  const addRebate: StoreContextType["addRebate"] = useCallback((data) => {
    patch((s) => ({
      ...s,
      rebates: [{ ...data, id: uid("rb", s.nextId), status: "Pending" as const, submittedAt: nowISO() }, ...s.rebates],
      nextId: s.nextId + 1,
    }));
  }, [patch]);

  const updateRebateStatus: StoreContextType["updateRebateStatus"] = useCallback((id, status) => {
    patch((s) => ({
      ...s,
      rebates: s.rebates.map((r) => (r.id === id ? { ...r, status } : r)),
    }));
  }, [patch]);

  // ─── Passes ────────────────────────────────────────────────────────────
  const addPass: StoreContextType["addPass"] = useCallback((data) => {
    patch((s) => ({
      ...s,
      passes: [{ ...data, id: uid("p", s.nextId), status: "Pending" as const, createdAt: nowISO() }, ...s.passes],
      nextId: s.nextId + 1,
    }));
  }, [patch]);

  const updatePassStatus: StoreContextType["updatePassStatus"] = useCallback((id, status, approvedBy) => {
    patch((s) => ({
      ...s,
      passes: s.passes.map((p) =>
        p.id === id ? { ...p, status, approvedBy: approvedBy ?? p.approvedBy } : p,
      ),
    }));
  }, [patch]);

  // ─── Admin (role management) ──────────────────────────────────────────
  const assignRole: StoreContextType["assignRole"] = useCallback((userId, newRole, newBhawan) => {
    patch((s) => ({
      ...s,
      users: s.users.map((u) =>
        u.id === userId ? { ...u, role: newRole, ...(newBhawan ? { bhawan: newBhawan } : {}) } : u,
      ),
    }));
  }, [patch]);

  const revokeRole: StoreContextType["revokeRole"] = useCallback((userId) => {
    patch((s) => ({
      ...s,
      users: s.users.map((u) =>
        u.id === userId ? { ...u, role: "Student" as Role } : u,
      ),
    }));
  }, [patch]);

  const addUser: StoreContextType["addUser"] = useCallback((data) => {
    patch((s) => ({
      ...s,
      users: [...s.users, { ...data, id: uid("u", s.nextId), isVerified: true }],
      nextId: s.nextId + 1,
    }));
  }, [patch]);

  // ─── Notices ──────────────────────────────────────────────────────────
  const addNotice: StoreContextType["addNotice"] = useCallback((data) => {
    patch((s) => ({
      ...s,
      notices: [{ ...data, id: uid("nt", s.nextId), createdAt: nowISO() }, ...s.notices],
      nextId: s.nextId + 1,
    }));
  }, [patch]);

  const deleteNotice: StoreContextType["deleteNotice"] = useCallback((id) => {
    patch((s) => ({
      ...s,
      notices: s.notices.filter((n) => n.id !== id),
    }));
  }, [patch]);

  // ─── Group Chat ───────────────────────────────────────────────────────
  const sendGroupMessage: StoreContextType["sendGroupMessage"] = useCallback((text) => {
    patch((s) => ({
      ...s,
      groupMessages: [...s.groupMessages, { id: uid("gm", s.nextId), authorId: s.currentUserId, text: text.trim(), createdAt: nowISO() }],
      nextId: s.nextId + 1,
    }));
  }, [patch]);

  // ─── SuperAdmin: Bhawan management ───────────────────────────────────
  const addBhawan: StoreContextType["addBhawan"] = useCallback((name, capacity) => {
    patch((s) => ({
      ...s,
      bhawanConfigs: [...s.bhawanConfigs, { id: uid("bc", s.nextId), name: name.trim(), active: true, capacity, createdAt: nowISO() }],
      nextId: s.nextId + 1,
    }));
  }, [patch]);

  const toggleBhawanActive: StoreContextType["toggleBhawanActive"] = useCallback((bhawanId) => {
    patch((s) => ({
      ...s,
      bhawanConfigs: s.bhawanConfigs.map((bc) =>
        bc.id === bhawanId ? { ...bc, active: !bc.active } : bc,
      ),
    }));
  }, [patch]);

  const removeBhawan: StoreContextType["removeBhawan"] = useCallback((bhawanId) => {
    patch((s) => ({
      ...s,
      bhawanConfigs: s.bhawanConfigs.filter((bc) => bc.id !== bhawanId),
    }));
  }, [patch]);

  const addGlobalAnnouncement: StoreContextType["addGlobalAnnouncement"] = useCallback((text) => {
    patch((s) => ({
      ...s,
      // Identity-based storage: removal can never hit the wrong item.
      specialAnnouncements: [{ id: uid("an", s.nextId), text }, ...s.specialAnnouncements],
      nextId: s.nextId + 1,
    }));
  }, [patch]);

  const removeGlobalAnnouncement: StoreContextType["removeGlobalAnnouncement"] = useCallback((id) => {
    patch((s) => ({
      ...s,
      specialAnnouncements: s.specialAnnouncements.filter((a) => a.id !== id),
    }));
  }, [patch]);

  const deleteUser: StoreContextType["deleteUser"] = useCallback((userId) => {
    patch((s) => {
      const users = s.users.filter((u) => u.id !== userId);
      return {
        ...s,
        users,
        // Never leave currentUserId pointing at a deleted user.
        currentUserId: s.currentUserId === userId ? users[0]?.id ?? "" : s.currentUserId,
      };
    });
  }, [patch]);

  return (
    <StoreContext.Provider
      value={{
        ...state, currentUser, switchUser, switchByEmail, genId, completeOnboarding,
        addComplaint, updateComplaintStatus, reassignComplaint, addComplaintComment,
        addSickDietRequest, updateSickDietStatus,
        addSuggestion, voteSuggestion, addSuggestionComment, voteComment, toggleJoin, updateSuggestionStatus,
        addRebate, updateRebateStatus,
        addPass, updatePassStatus,
        assignRole, revokeRole, addUser,
        addNotice, deleteNotice, sendGroupMessage,
        addBhawan, toggleBhawanActive, removeBhawan,
        addGlobalAnnouncement, removeGlobalAnnouncement, deleteUser,
      }}
    >
      {children}
    </StoreContext.Provider>
  );
}

export function useStore(): StoreContextType {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error("useStore must be used within StoreProvider");
  return ctx;
}
