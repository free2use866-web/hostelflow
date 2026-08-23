import { getAuthUserId } from "@convex-dev/auth/server";
import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import {
  HOSTEL_ROLES,
  type HostelRole,
  hostelRoleValidator,
} from "./schema";

export const STAFF_ROLES: HostelRole[] = [
  HOSTEL_ROLES.WARDEN,
  HOSTEL_ROLES.ASSISTANT_WARDEN,
  HOSTEL_ROLES.CHIEF_WARDEN,
];

export const SECY_ROLE_BY_CATEGORY: Record<string, HostelRole> = {
  mess: HOSTEL_ROLES.MESS_SECY,
  general: HOSTEL_ROLES.GENERAL_SECY,
  maintenance: HOSTEL_ROLES.MAINTENANCE_SECY,
  suggestion: HOSTEL_ROLES.SUGGESTION_SECY,
};

const DEMO_NAMES: Record<HostelRole, string> = {
  student: "Demo Student",
  mess_secy: "Demo Mess Secretary",
  general_secy: "Demo General Secretary",
  maintenance_secy: "Demo Maintenance Secretary",
  suggestion_secy: "Demo Suggestion Secretary",
  assistant_warden: "Demo Assistant Warden",
  chief_warden: "Demo Chief Warden",
  warden: "Demo Warden",
};

/** Called after real sign-in: gives new users the default student role. */
export const claimProfile = mutation({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) throw new Error("Not signed in");
    const user = await ctx.db.get(userId);
    if (!user) throw new Error("User not found");
    if (!user.hostelRole && !user.isDemo) {
      await ctx.db.patch(userId, { hostelRole: HOSTEL_ROLES.STUDENT });
    }
    return await ctx.db.get(userId);
  },
});

/** Demo mode: instantly become any role without signing up. */
export const setDemoProfile = mutation({
  args: { role: hostelRoleValidator },
  handler: async (ctx, { role }) => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) throw new Error("Not signed in");
    await ctx.db.patch(userId, {
      hostelRole: role,
      isDemo: true,
      name: DEMO_NAMES[role],
      email: undefined,
    });
    return await ctx.db.get(userId);
  },
});

/** Directory of secys + wardens (used for transfers and mention hints). */
export const listStaff = query({
  args: {},
  handler: async (ctx) => {
    const users = await ctx.db.query("users").collect();
    return users
      .filter(
        (u): u is typeof u & { name: string; email: string } =>
          !!u.hostelRole &&
          u.hostelRole !== HOSTEL_ROLES.STUDENT &&
          !u.isAnonymous,
      )
      .map((u) => ({
        _id: u._id,
        name: u.name ?? u.email ?? "Unnamed",
        email: u.email ?? "",
        hostelRole: u.hostelRole!,
      }));
  },
});

/** Lightweight list of all users for @mention matching in the UI. */
export const listMentionables = query({
  args: {},
  handler: async (ctx) => {
    const users = await ctx.db.query("users").collect();
    return users
      .filter((u) => !u.isAnonymous)
      .map((u) => ({
        _id: u._id,
        name: u.name ?? u.email ?? "Unnamed",
        hostelRole: u.hostelRole ?? HOSTEL_ROLES.STUDENT,
      }));
  },
});
