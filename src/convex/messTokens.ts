import { getAuthUserId } from "@convex-dev/auth/server";
import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { mealValidator } from "./schema";
import { HOSTEL_ROLES } from "./schema";

function randomCode() {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let out = "";
  for (let i = 0; i < 6; i++) {
    out += chars[Math.floor(Math.random() * chars.length)];
  }
  return `MT-${out}`;
}

export const generate = mutation({
  args: { meal: mealValidator, date: v.string() },
  handler: async (ctx, { meal, date }) => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) throw new Error("Not signed in");
    const user = await ctx.db.get(userId);
    if (!user) throw new Error("User not found");
    if (user.hostelRole === HOSTEL_ROLES.STUDENT || !user.hostelRole) {
      // students only — but allow anyone to demo-generate
    }
    const existing = await ctx.db
      .query("messTokens")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .collect();
    if (
      existing.some(
        (t) =>
          t.date === date &&
          t.meal === meal &&
          t.status === "active",
      )
    ) {
      throw new Error(`You already have an active ${meal} token for that day`);
    }
    const id = await ctx.db.insert("messTokens", {
      userId,
      tokenCode: randomCode(),
      meal,
      date,
      status: "active",
      createdAt: Date.now(),
    });
    return await ctx.db.get(id);
  },
});

export const listMine = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) return [];
    const tokens = await ctx.db
      .query("messTokens")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .collect();
    return tokens.sort((a, b) => b.createdAt - a.createdAt);
  },
});

/** Mess secretary view of all tokens for a given date. */
export const listByDate = query({
  args: { date: v.string() },
  handler: async (ctx, { date }) => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) return [];
    const me = await ctx.db.get(userId);
    if (!me || (me.hostelRole !== HOSTEL_ROLES.MESS_SECY && me.hostelRole !== HOSTEL_ROLES.WARDEN && me.hostelRole !== HOSTEL_ROLES.CHIEF_WARDEN)) {
      throw new Error("Only the mess secretary and wardens can scan tokens");
    }
    const users = await ctx.db.query("users").collect();
    const byId = new Map(users.map((u) => [u._id, u]));
    const tokens = await ctx.db
      .query("messTokens")
      .withIndex("by_date", (q) => q.eq("date", date))
      .collect();
    return tokens
      .sort((a, b) => b.createdAt - a.createdAt)
      .map((t) => ({
        ...t,
        ownerName: byId.get(t.userId)?.name ?? "Unknown",
        rollNumber: byId.get(t.userId)?.rollNumber ?? "",
      }));
  },
});

export const setStatus = mutation({
  args: {
    tokenId: v.id("messTokens"),
    status: v.union(
      v.literal("active"),
      v.literal("used"),
      v.literal("cancelled"),
    ),
  },
  handler: async (ctx, { tokenId, status }) => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) throw new Error("Not signed in");
    const me = await ctx.db.get(userId);
    const token = await ctx.db.get(tokenId);
    if (!token) throw new Error("Token not found");

    const canManage =
      me?.hostelRole === HOSTEL_ROLES.MESS_SECY ||
      me?.hostelRole === HOSTEL_ROLES.WARDEN ||
      me?.hostelRole === HOSTEL_ROLES.CHIEF_WARDEN;
    if (!canManage && token.userId !== userId) {
      throw new Error("You cannot modify this token");
    }
    await ctx.db.patch(tokenId, { status });
  },
});
