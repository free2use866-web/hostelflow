/**
 * Better Auth — React client (pairs with src/lib/better-auth.ts).
 *
 * Returns null until BETTER_AUTH_URL points at a live Better Auth host.
 * Usage once active:
 *   const authClient = getBetterAuthClient();
 *   await authClient?.signIn.social({ provider: "google" });
 */
import { createAuthClient, type BetterFetchError } from "better-auth/react";
import { BETTER_AUTH_URL, isBetterAuthConfigured } from "./better-auth";

type AuthClient = ReturnType<typeof createAuthClient>;

let client: AuthClient | null = null;

export function getBetterAuthClient(): AuthClient | null {
  if (!isBetterAuthConfigured) return null;
  if (!client) {
    client = createAuthClient({ baseURL: BETTER_AUTH_URL });
  }
  return client;
}

export type { BetterFetchError };
export { isBetterAuthConfigured as isBetterAuthClientConfigured };
