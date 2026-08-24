import { action, mutation } from "./_generated/server";
import { v } from "convex/values";
import { api } from "./_generated/api";

// Sliding-window send budget per email address.
const MAX_SENDS_PER_WINDOW = 3;
const WINDOW_MS = 10 * 60 * 1000; // 10 minutes

function isValidIITREmail(email: string): boolean {
  return /^[^@]+@([a-z0-9]+\.)?iitr\.ac\.in$/.test(email);
}

/**
 * Transactional budget check + spend for one OTP send.
 * Runs in a mutation so concurrent requests serialize on the same table row
 * window — a burst of parallel signIn calls cannot exceed the budget.
 */
export const recordOtpSend = mutation({
  args: { identifier: v.string() },
  handler: async (ctx, { identifier }) => {
    const cleaned = identifier.toLowerCase().trim();
    const since = Date.now() - WINDOW_MS;

    const rows = await ctx.db
      .query("otpRequests")
      .withIndex("by_identifier", (q) => q.eq("identifier", cleaned))
      .collect();

    if (rows.filter((r) => r.at > since).length >= MAX_SENDS_PER_WINDOW) {
      throw new Error(
        "Too many codes requested. Please try again in 10 minutes.",
      );
    }

    // Opportunistic GC of stale entries (>24h) so the ledger stays tiny.
    const dayAgo = Date.now() - 24 * 60 * 60 * 1000;
    for (const r of rows) {
      if (r.at < dayAgo) await ctx.db.delete(r._id);
    }

    await ctx.db.insert("otpRequests", { identifier: cleaned, at: Date.now() });
  },
});

/**
 * Rate-limited OTP dispatcher — the ONLY sanctioned path for requesting a
 * sign-in code. Runs as an ACTION because the underlying provider performs
 * an outbound HTTPS call (mutations must stay side-effect free).
 *
 * Order matters: domain gate → spend budget → dispatch, so rejected
 * domains never consume budget or trigger an email.
 */
export const requestOtp = action({
  args: { email: v.string() },
  handler: async (ctx, { email }) => {
    const cleaned = email.toLowerCase().trim();

    if (!isValidIITREmail(cleaned)) {
      throw new Error(
        "Only @iitr.ac.in institute accounts can sign in.",
      );
    }

    await ctx.runMutation(api.otp.recordOtpSend, { identifier: cleaned });

    // Delegates to Convex Auth's public signIn action; the provider sends
    // the code server-side. (signIn is a RegisteredAction reference, not a
    // directly-callable function — it must be invoked via runAction.)
    await ctx.runAction(api.auth.signIn, {
      provider: "email-otp",
      params: { email: cleaned },
    });
    return { sent: true as const };
  },
});
