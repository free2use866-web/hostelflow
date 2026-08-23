/**
 * Better Auth — server config (dormant until a Node host is available).
 *
 * WHY DORMANT: Better Auth's `handler` must run on a Node/Hono/Next-style
 * server with access to a SQL database. This project's backend is Convex,
 * whose HTTP actions cannot host Better Auth's database layer. The existing
 * Convex Auth sign-in (Google + email OTP) remains the live system.
 *
 * ACTIVATION PATH: deploy this factory on any Node host (Hono, Express,
 * Next.js route handler, Bun) with a SQL database, set the two env keys,
 * then mount it:
 *
 *   import { createIITRBetterAuth } from "@/lib/better-auth";
 *   export const auth = createIITRBetterAuth({ database: prismaAdapter(db) });
 *   // Hono/Next: app.all("/api/auth/*", (c) => auth.handler(c.req.raw));
 *
 * Keys (Keys/API keys tab):
 *   BETTER_AUTH_SECRET — random 32+ char string (openssl rand -base64 32)
 *   BETTER_AUTH_URL    — public origin of the auth host, e.g. https://auth.example.com
 */
import { betterAuth } from "better-auth";

const env = import.meta.env as Record<string, string | undefined>;

export const BETTER_AUTH_SECRET =
  env.BETTER_AUTH_SECRET ?? env.VITE_BETTER_AUTH_SECRET ?? "";
export const BETTER_AUTH_URL =
  env.BETTER_AUTH_URL ?? env.VITE_BETTER_AUTH_URL ?? "";

export const isBetterAuthConfigured = Boolean(BETTER_AUTH_SECRET && BETTER_AUTH_URL);

/** Same strict policy enforced in Convex Auth — @iitr.ac.in + subdomains only. */
export function isValidIITREmail(email: string): boolean {
  return /^[^@]+@([a-z0-9]+\.)?iitr\.ac\.in$/.test(email.toLowerCase().trim());
}

export interface BetterAuthDeps {
  /** Any Better Auth adapter: Kysely/SQLite, Drizzle, Prisma, Mongo, or custom. */
  database: Parameters<typeof betterAuth>[0] extends never ? unknown : NonNullable<Parameters<typeof betterAuth>[0]["database"]>;
}

/**
 * Canonical IITR-flavored Better Auth instance.
 * Mirrors HostelHub policy: institute-only accounts, Google social login,
 * and enrollment captured on user creation.
 */
export function createIITRBetterAuth(deps: BetterAuthDeps) {
  return betterAuth({
    secret: BETTER_AUTH_SECRET,
    baseURL: BETTER_AUTH_URL,

    database: deps.database,

    emailAndPassword: { enabled: true },

    socialProviders:
      env.GOOGLE_CLIENT_ID && env.GOOGLE_CLIENT_SECRET
        ? {
            google: {
              clientId: env.GOOGLE_CLIENT_ID,
              clientSecret: env.GOOGLE_CLIENT_SECRET,
            },
          }
        : {},

    // ── Domain guard (mirrors convex/auth.ts createOrUpdateUser check) ──
    databaseHooks: {
      user: {
        create: {
          before: async (user) => {
            const email = typeof user.email === "string" ? user.email : "";
            if (!isValidIITREmail(email)) {
              throw new Error(
                "Domain restricted: only @iitr.ac.in institute accounts are allowed.",
              );
            }
            return { data: user };
          },
        },
      },
    },

    user: {
      additionalFields: {
        bhawan: { type: "string", required: false, defaultValue: "" },
        roomNo: { type: "string", required: false, defaultValue: "" },
        enrollmentNumber: { type: "string", required: false },
        role: { type: "string", required: false, defaultValue: "Student" },
      },
    },
  });
}
