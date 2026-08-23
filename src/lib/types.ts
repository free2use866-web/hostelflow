export type Role =
  | "Student"
  | "MessSec"
  | "MaintSec"
  | "GenSec"
  | "SportsSec"
  | "WellnessSec"
  | "TechSec"
  | "AsstWarden"
  | "Warden";

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
];

export const BHAWANS: Bhawan[] = [
  "Ravindra",
  "Govind",
  "Cautley",
  "Rajendra",
  "Sarojini",
];

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

export interface Suggestion {
  id: string;
  authorId: string;
  bhawan: string;
  category: string;
  title: string;
  description: string;
  upvotes: number;
  upvotedBy: string[];
  status: SuggestionStatus;
  wardenFeedback?: string;
  createdAt: string;
}

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

export interface AppState {
  users: User[];
  complaints: Complaint[];
  sickDietRequests: SickDietRequest[];
  messMenus: MessMenu[];
  suggestions: Suggestion[];
  rebates: Rebate[];
  passes: Pass[];
  specialAnnouncements: string[];
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
