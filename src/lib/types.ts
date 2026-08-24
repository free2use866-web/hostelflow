export type Role =
  | "Student"
  | "MessSec"
  | "MaintSec"
  | "GenSec"
  | "SportsSec"
  | "WellnessSec"
  | "TechSec"
  | "AsstWarden"
  | "Warden"
  | "SuperAdmin";

export type Bhawan = "Ravindra" | "Govind" | "Cautley" | "Rajendra" | "Sarojini";

export type Category =
  | "Mess"
  | "Maintenance"
  | "General"
  | "Sports"
  | "Wellness"
  | "Technical";

export type ComplaintStatus = "Pending" | "Under Progress" | "Resolved" | "Cannot Resolve";

export type SickDietStatus = "Requested" | "In Preparation" | "Out for Delivery" | "Delivered";

export type PassType = "LateEntry" | "SportsGear" | "GuestStay";

export type PassStatus = "Pending" | "Approved" | "Rejected";

export type RebateStatus = "Pending" | "Approved" | "Rejected";

export type SuggestionStatus = "Open" | "Under Review" | "Approved" | "Implemented";

export type MealType = "Breakfast" | "Lunch" | "Dinner";

export const ROLE_LABELS: Record<Role, string> = {
  Student: "Resident Student",
  MessSec: "Mess Secretary",
  MaintSec: "Maintenance Secretary",
  GenSec: "General Secretary",
  SportsSec: "Sports Secretary",
  WellnessSec: "Wellness Secretary",
  TechSec: "Technical Secretary",
  AsstWarden: "Assistant Warden",
  Warden: "Warden / Chief Warden",
  SuperAdmin: "Institute Admin",
};

export const CATEGORY_TO_ROLE: Record<Category, Role> = {
  Mess: "MessSec",
  Maintenance: "MaintSec",
  General: "GenSec",
  Sports: "SportsSec",
  Wellness: "WellnessSec",
  Technical: "TechSec",
};

export const ALL_CATEGORIES: Category[] = [
  "Mess",
  "Maintenance",
  "General",
  "Sports",
  "Wellness",
  "Technical",
];

export const ALL_ROLES: Role[] = [
  "Student",
  "MessSec",
  "MaintSec",
  "GenSec",
  "SportsSec",
  "WellnessSec",
  "TechSec",
  "AsstWarden",
  "Warden",
  "SuperAdmin",
];

export const BHAWANS: Bhawan[] = [
  "Ravindra",
  "Govind",
  "Cautley",
  "Rajendra",
  "Sarojini",
];

export const IS_SUPERADMIN = (r: Role) => r === "SuperAdmin";

export const IS_WARDEN_ROLE = (r: Role) =>
  r === "Warden" || r === "AsstWarden";

export const IS_SECY_ROLE = (r: Role) =>
  r === "MessSec" ||
  r === "MaintSec" ||
  r === "GenSec" ||
  r === "SportsSec" ||
  r === "WellnessSec" ||
  r === "TechSec";

export interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
  bhawan: Bhawan;
  roomNo: string;
  avatar?: string;
  // ── Verified academic identity (onboarding gate) ──
  enrollmentNumber?: string; // 8-digit YYBBBXXX
  enrollmentYear?: number;
  branchCode?: number;
  branchName?: string;
  academicYear?: number;
  isVerified: boolean;
}

export interface Complaint {
  id: string;
  authorId: string;
  bhawan: string;
  category: Category;
  title: string;
  description: string;
  assignedRole: Role;
  status: ComplaintStatus;
  createdAt: string;
  updatedAt: string;
  isOverdue: boolean;
  comments: Array<{ author: string; text: string; date: string; authorRole?: Role }>;
}

export interface SickDietRequest {
  id: string;
  studentId: string;
  roomNo: string;
  bhawan: string;
  date: string;
  mealType: MealType;
  medicalProofUrl?: string;
  message: string;
  status: SickDietStatus;
  deliveredBy?: string;
  notifiedRoles: Role[];
}

export interface MessMenu {
  bhawan: Bhawan;
  dayOfWeek: number;
  mealType: MealType;
  menuDetails: string;
  noticeText?: string;
}

export interface SuggestionComment {
  id: string;
  authorId: string;
  authorName: string;
  text: string;
  createdAt: string;
  parentId: string | null; // null = top-level reply
  upvotedBy: string[];
  downvotedBy: string[];
}

export interface Suggestion {
  id: string;
  authorId: string;
  bhawan: string;
  category: string; // community id (r/Mess, r/General, …)
  title: string;
  description: string;
  upvotedBy: string[];
  downvotedBy: string[];
  status: SuggestionStatus;
  wardenFeedback?: string;
  createdAt: string;
  comments: SuggestionComment[];
}

/** Reddit-style score: upvotes minus downvotes. Tolerates stale/partial data. */
export const scoreOf = (v: { upvotedBy?: string[]; downvotedBy?: string[] }) =>
  (v.upvotedBy?.length ?? 0) - (v.downvotedBy?.length ?? 0);

/** Compact relative-time label, e.g. "3h ago". */
export const timeAgo = (iso: string): string => {
  const s = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (s < 60) return "just now";
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  if (d < 30) return `${d}d ago`;
  return new Date(iso).toLocaleDateString();
};

// ─── Communities (Reddit-style subreddits) ────────────────────────────────

export interface Community {
  id: string;
  name: string;
  icon: string;
  description: string;
  baseMembers: number;
  bannerClass: string; // gradient classes for the banner strip
}

export const COMMUNITIES: Community[] = [
  { id: "General", name: "General", icon: "📋", description: "Everything hostel life — common rooms, canteen, laundry and general issues.", baseMembers: 1240, bannerClass: "from-amber-200 to-amber-400" },
  { id: "Mess", name: "Mess", icon: "🍽️", description: "Menu talk, food quality, special meals and mess feedback.", baseMembers: 1890, bannerClass: "from-emerald-200 to-emerald-400" },
  { id: "Maintenance", name: "Maintenance", icon: "🔧", description: "Plumbing, electrical, Wi-Fi — report it, discuss it, fix it.", baseMembers: 980, bannerClass: "from-sky-200 to-sky-400" },
  { id: "Sports", name: "Sports", icon: "⚽", description: "Gym, courts, gear checkout and inter-bhawan tournaments.", baseMembers: 1100, bannerClass: "from-orange-200 to-orange-400" },
  { id: "Wellness", name: "Wellness", icon: "💊", description: "Health centre, mental wellbeing and dispensary topics.", baseMembers: 760, bannerClass: "from-purple-200 to-purple-400" },
  { id: "Technical", name: "Technical", icon: "💻", description: "Wi-Fi, labs, printers and portal bugs.", baseMembers: 1320, bannerClass: "from-indigo-200 to-indigo-400" },
];

export const communityById = (id: string) =>
  COMMUNITIES.find((c) => c.id === id) ?? COMMUNITIES[0];

export interface Rebate {
  id: string;
  studentId: string;
  startDate: string;
  endDate: string;
  totalDays: number;
  totalMeals: number;
  status: RebateStatus;
  submittedAt: string;
}

export interface Pass {
  id: string;
  studentId: string;
  studentName: string;
  passType: PassType;
  reason: string;
  validDate: string;
  status: PassStatus;
  approvedBy?: string;
  createdAt: string;
}

export interface Notice {
  id: string;
  authorId: string;
  bhawan: Bhawan;
  title: string;
  body: string;
  pinned: boolean;
  createdAt: string;
}

export interface GroupMessage {
  id: string;
  authorId: string;
  text: string;
  createdAt: string;
}

export interface BhawanConfig {
  id: string;
  name: string;
  active: boolean;
  capacity: number;
  wardenEmail?: string;
  createdAt: string;
}

export interface AppState {
  users: User[];
  complaints: Complaint[];
  sickDietRequests: SickDietRequest[];
  messMenus: MessMenu[];
  suggestions: Suggestion[];
  rebates: Rebate[];
  passes: Pass[];
  specialAnnouncements: string[];
  joinedBy: Record<string, string[]>; // userId → joined community ids
  notices: Notice[];
  groupMessages: GroupMessage[];
  bhawanConfigs: BhawanConfig[];
  currentUserId: string;
  nextId: number;
}

export const STATUS_COLORS: Record<string, string> = {
  Pending: "bg-amber-100 text-amber-900 border border-amber-300",
  "Under Progress": "bg-sky-100 text-sky-900 border border-sky-300",
  Resolved: "bg-emerald-100 text-emerald-900 border border-emerald-300",
  Approved: "bg-emerald-100 text-emerald-900 border border-emerald-300",
  "Cannot Resolve": "bg-rose-100 text-rose-900 border border-rose-300",
  Rejected: "bg-rose-100 text-rose-900 border border-rose-300",
  Overdue: "bg-rose-100 text-rose-900 border border-rose-300",
  Requested: "bg-purple-100 text-purple-900 border border-purple-300",
  "In Preparation": "bg-sky-100 text-sky-900 border border-sky-300",
  "Out for Delivery": "bg-amber-100 text-amber-900 border border-amber-300",
  Delivered: "bg-emerald-100 text-emerald-900 border border-emerald-300",
  Open: "bg-amber-100 text-amber-900 border border-amber-300",
  "Under Review": "bg-sky-100 text-sky-900 border border-sky-300",
  Implemented: "bg-emerald-100 text-emerald-900 border border-emerald-300",
};
