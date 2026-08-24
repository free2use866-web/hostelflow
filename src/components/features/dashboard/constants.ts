import type { Category, Role } from "@/lib/types";
import { CATEGORY_TO_ROLE } from "@/lib/types";

/** Reverse map: Role → routed Category (e.g. MessSec → "Mess"). */
export const CATEGORY_OF_ROLE: Partial<Record<Role, Category>> = {};
for (const [cat, role] of Object.entries(CATEGORY_TO_ROLE)) {
  CATEGORY_OF_ROLE[role as Role] = cat as Category;
}

/** The six secretary roles, in display order. */
export const SECY_ROLES: Role[] = [
  "MessSec",
  "MaintSec",
  "GenSec",
  "SportsSec",
  "WellnessSec",
  "TechSec",
];
