// Adding Google OAuth per Convex Auth documentation (the sanctioned reason
// to modify this file): "Continue with Google" alongside email OTP + Anonymous.
//
// Server-side domain enforcement lives in the `createOrUpdateUser` callback
// below — a non-IITR Google account is rejected during sign-in itself,
// mirroring the OAuth-callback pattern (never trust client-side checks alone).
import Google from "@auth/core/providers/google";
import { convexAuth } from "@convex-dev/auth/server";
import { Anonymous } from "@convex-dev/auth/providers/Anonymous";
import { emailOtp } from "./auth/emailOtp";

// Mirrors src/lib/academic-identity.ts (Convex functions can't import
// outside their folder, so the strict subdomain-aware regex lives here too).
function isValidIITREmail(email: string): boolean {
  const cleaned = email.toLowerCase().trim();
  return /^[^@]+@([a-z0-9]+\.)?iitr\.ac\.in$/.test(cleaned);
}

export const { auth, signIn, signOut, store, isAuthenticated } = convexAuth({
  providers: [
    // Reads GOOGLE_CLIENT_ID / GOOGLE_CLIENT_SECRET env vars.
    // Whitelist this redirect URI in Google Cloud Console:
    //   https://<CONVEX_SITE_URL>/api/callback/google
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      authorization: { params: { prompt: "select_account" } },
    }),
    emailOtp,
    Anonymous,
  ],
  callbacks: {
    async createOrUpdateUser(ctx, args) {
      const rawEmail =
        typeof args.profile.email === "string"
          ? args.profile.email
          : undefined;

      // ── Blueprint Step 1: reject & block non-IITR accounts ──
      if (rawEmail && !isValidIITREmail(rawEmail)) {
        throw new Error(
          "Domain restricted: only @iitr.ac.in institute accounts are allowed.",
        );
      }

      if (args.existingUserId) return args.existingUserId;

      const { name, emailVerified } = args.profile;
      return ctx.db.insert("users", {
        ...(typeof name === "string" && name.length > 0 ? { name } : {}),
        ...(rawEmail !== undefined ? { email: rawEmail } : {}),
        ...(emailVerified ? { emailVerificationTime: Date.now() } : {}),
      });
    },
  },
});
