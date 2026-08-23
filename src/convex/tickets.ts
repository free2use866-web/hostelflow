import { getAuthUserId } from "@convex-dev/auth/server";
import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import {
  CATEGORIES,
  HOSTEL_ROLES,
  TICKET_STATUSES,
  categoryValidator,
  statusValidator,
  type Category,
  type HostelRole,
  type TicketStatus,
} from "./schema";
import { STAFF_ROLES, SECY_ROLE_BY_CATEGORY } from "./profile";

export function isStaff(role?: HostelRole) {
  return !!role && (STAFF_ROLES as string[]).includes(role);
}

export function categoryForSecy(role?: HostelRole): Category | null {
  if (!role) return null;
  const entry = Object.entries(SECY_ROLE_BY_CATEGORY).find(
    ([, r]) => r === role,
  );
  return entry ? (entry[0] as Category) : null;
}

async function notify(ctx: any, userId: any, ticketId: any, message: string) {
  await ctx.db.insert("notifications", {
    userId,
    ticketId,
    message,
    read: false,
    createdAt: Date.now(),
  });
}

/** Parse "@Full Name" mentions against known users. */
async function resolveMentions(ctx: any, text: string) {
  const users = await ctx.db.query("users").collect();
  const lower = text.toLowerCase();
  const ids: any[] = [];
  for (const u of users) {
    const name = u.name?.trim().toLowerCase();
    if (name && name.length > 2 && lower.includes(`@${name}`)) {
      ids.push(u._id);
    }
  }
  return ids;
}

export const createTicket = mutation({
  args: {
    title: v.string(),
    description: v.string(),
    category: categoryValidator,
  },
  handler: async (ctx, { title, description, category }) => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) throw new Error("Not signed in");
    const user = await ctx.db.get(userId);
    if (!user) throw new Error("User not found");

    // Auto-assign to the secy of this category, if one exists
    const users = await ctx.db.query("users").collect();
    const secyRole = SECY_ROLE_BY_CATEGORY[category];
    const secy = users.find((u) => u.hostelRole === secyRole);

    const mentionedIds = await resolveMentions(ctx, `${title}\n${description}`);
    const now = Date.now();

    const ticketId = await ctx.db.insert("tickets", {
      title,
      description,
      category,
      status: "open",
      createdBy: userId,
      assignedTo: secy?._id,
      mentionedIds,
      createdAt: now,
      updatedAt: now,
    });

    await ctx.db.insert("ticketUpdates", {
      ticketId,
      authorId: userId,
      type: "created",
      createdAt: now,
    });

    if (secy && secy._id !== userId) {
      await notify(
        ctx,
        secy._id,
        ticketId,
        `New ${category} complaint assigned to you: "${title}"`,
      );
    }
    // Wardens get visibility of every new complaint
    for (const w of users.filter((u) => isStaff(u.hostelRole))) {
      await notify(
        ctx,
        w._id,
        ticketId,
        `New ${category} complaint filed: "${title}"`,
      );
    }
    for (const m of mentionedIds) {
      if (m !== userId && m !== secy?._id) {
        await notify(
          ctx,
          m,
          ticketId,
          `${user.name ?? "A student"} mentioned you in "${title}"`,
        );
      }
    }
    return ticketId;
  },
});

/** Tickets the current user created (student's "My complaints"). */
export const listMyTickets = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) return [];
    const tickets = await ctx.db
      .query("tickets")
      .withIndex("by_creator", (q) => q.eq("createdBy", userId))
      .order("desc")
      .collect();
    const users = await ctx.db.query("users").collect();
    const byId = new Map(users.map((u) => [u._id, u]));
    return tickets.map((t) => ({
      ...t,
      creatorName:
        t.createdBy === userId
          ? (byId.get(userId)?.name ?? "You")
          : (byId.get(t.createdBy)?.name ?? "Unknown"),
      assigneeName: t.assignedTo
        ? (byId.get(t.assignedTo)?.name ?? "Unassigned")
        : "Unassigned",
    }));
  },
});

/**
 * Portal queue. Secys see their own category; wardens / assistant /
 * chief wardens see everything and can filter.
 */
export const listPortalTickets = query({
  args: {
    category: v.optional(categoryValidator),
    status: v.optional(statusValidator),
  },
  handler: async (ctx, { category, status }) => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) return [];
    const me = await ctx.db.get(userId);
    if (!me) return [];

    let tickets = await ctx.db.query("tickets").order("desc").collect();

    const myCategory = categoryForSecy(me.hostelRole);
    if (myCategory && !isStaff(me.hostelRole)) {
      tickets = tickets.filter((t) => t.category === myCategory);
    } else if (category) {
      tickets = tickets.filter((t) => t.category === category);
    }
    if (status) {
      tickets = tickets.filter((t) => t.status === status);
    }

    const users = await ctx.db.query("users").collect();
    const byId = new Map(users.map((u) => [u._id, u]));
    return tickets.map((t) => ({
      ...t,
      creatorName: byId.get(t.createdBy)?.name ?? "Unknown",
      assigneeName: t.assignedTo
        ? (byId.get(t.assignedTo)?.name ?? "Unassigned")
        : "Unassigned",
    }));
  },
});

export const getTicket = query({
  args: { ticketId: v.id("tickets") },
  handler: async (ctx, { ticketId }) => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) return null;
    const ticket = await ctx.db.get(ticketId);
    if (!ticket) return null;

    const updates = await ctx.db
      .query("ticketUpdates")
      .withIndex("by_ticket", (q) => q.eq("ticketId", ticketId))
      .order("asc")
      .collect();
    const users = await ctx.db.query("users").collect();
    const byId = new Map(users.map((u) => [u._id, u]));

    return {
      ticket: {
        ...ticket,
        creatorName: byId.get(ticket.createdBy)?.name ?? "Unknown",
        assigneeName: ticket.assignedTo
          ? (byId.get(ticket.assignedTo)?.name ?? "Unassigned")
          : "Unassigned",
      },
      updates: updates.map((u) => ({
        ...u,
        authorName: u.authorId
          ? (byId.get(u.authorId)?.name ?? "Unknown")
          : "System",
      })),
    };
  },
});

export const updateStatus = mutation({
  args: {
    ticketId: v.id("tickets"),
    status: statusValidator,
    comment: v.optional(v.string()),
  },
  handler: async (ctx, { ticketId, status, comment }) => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) throw new Error("Not signed in");
    const me = await ctx.db.get(userId);
    if (!me) throw new Error("User not found");
    const ticket = await ctx.db.get(ticketId);
    if (!ticket) throw new Error("Ticket not found");

    const myCategory = categoryForSecy(me.hostelRole);
    const allowed =
      isStaff(me.hostelRole) ||
      (myCategory && myCategory === ticket.category) ||
      (me.hostelRole === HOSTEL_ROLES.STUDENT &&
        ticket.createdBy === userId &&
        status === "resolved");
    if (!allowed) throw new Error("You cannot update this ticket");

    const now = Date.now();
    await ctx.db.patch(ticketId, { status, updatedAt: now });
    await ctx.db.insert("ticketUpdates", {
      ticketId,
      authorId: userId,
      type: "status_change",
      fromStatus: ticket.status as TicketStatus,
      toStatus: status as TicketStatus,
      body: comment,
      createdAt: now,
    });
    if (comment) {
      const extra = await resolveMentions(ctx, comment);
      for (const m of extra) {
        if (m !== userId) await notify(ctx, m, ticketId, `${me.name ?? "Someone"} mentioned you in "${ticket.title}"`);
      }
    }
    if (ticket.createdBy !== userId) {
      await notify(
        ctx,
        ticket.createdBy,
        ticketId,
        `Your complaint "${ticket.title}" is now ${status.replace("_", " ")}`,
      );
    }
  },
});

/** Transfer a complaint to another category/secy (staff + secys can route). */
export const transferTicket = mutation({
  args: {
    ticketId: v.id("tickets"),
    toCategory: categoryValidator,
    comment: v.optional(v.string()),
  },
  handler: async (ctx, { ticketId, toCategory, comment }) => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) throw new Error("Not signed in");
    const me = await ctx.db.get(userId);
    if (!me) throw new Error("User not found");
    const ticket = await ctx.db.get(ticketId);
    if (!ticket) throw new Error("Ticket not found");

    const myCategory = categoryForSecy(me.hostelRole);
    if (!isStaff(me.hostelRole) && !myCategory) {
      throw new Error("Only secretaries and wardens can transfer complaints");
    }

    const users = await ctx.db.query("users").collect();
    const secyRole = SECY_ROLE_BY_CATEGORY[toCategory];
    const secy = users.find((u) => u.hostelRole === secyRole);

    const now = Date.now();
    await ctx.db.patch(ticketId, {
      category: toCategory,
      assignedTo: secy?._id,
      status: "open",
      updatedAt: now,
    });
    await ctx.db.insert("ticketUpdates", {
      ticketId,
      authorId: userId,
      type: "transfer",
      fromCategory: ticket.category as Category,
      toCategory: toCategory as Category,
      body: comment,
      createdAt: now,
    });
    if (secy && secy._id !== userId) {
      await notify(
        ctx,
        secy._id,
        ticketId,
        `"${ticket.title}" was transferred to you (${toCategory})`,
      );
    }
    if (ticket.createdBy !== userId) {
      await notify(
        ctx,
        ticket.createdBy,
        ticketId,
        `Your complaint "${ticket.title}" was routed to the ${toCategory} team`,
      );
    }
  },
});

export const addComment = mutation({
  args: { ticketId: v.id("tickets"), body: v.string() },
  handler: async (ctx, { ticketId, body }) => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) throw new Error("Not signed in");
    const me = await ctx.db.get(userId);
    if (!me) throw new Error("User not found");
    const ticket = await ctx.db.get(ticketId);
    if (!ticket) throw new Error("Ticket not found");

    const now = Date.now();
    await ctx.db.insert("ticketUpdates", {
      ticketId,
      authorId: userId,
      type: "comment",
      body,
      createdAt: now,
    });
    await ctx.db.patch(ticketId, { updatedAt: now });

    const targets = new Set<any>([ticket.createdBy]);
    for (const m of await resolveMentions(ctx, body)) targets.add(m);
    if (ticket.assignedTo) targets.add(ticket.assignedTo);
    for (const t of targets) {
      if (t !== userId) {
        await notify(ctx, t, ticketId, `${me.name ?? "Someone"} commented on "${ticket.title}"`);
      }
    }
  },
});
