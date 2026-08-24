/**
 * Better Auth — React client.
 *
 * Pairs with src/lib/better-auth.ts (server config). The client returns null
 * until BETTER_AUTH_URL points at a live Better Auth host, so the rest of
 * the app degrades gracefully.
 *
 * Quick-start once a Better Auth host is live:
 *   const authClient = getBetterAuthClient();
 *   await authClient?.signIn.social({ provider: "google" });
 *   const session = await authClient?.getSession();
 *   await authClient?.signOut();
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

/**
 * Convenience wrapper: fetch the current session from the Better Auth host.
 * Returns `null` when the client is not configured or the request fails.
 */
export async function getBetterAuthSession() {
  const client = getBetterAuthClient();
  if (!client) return null;
  try {
    const { data } = await client.getSession();
    return data?.session ?? null;
  } catch {
    return null;
  }
}

/**
 * Convenience wrapper: sign the current user out of the Better Auth host.
 * No-op when the client is not configured.
 */
export async function signOutBetterAuth() {
  const client = getBetterAuthClient();
  if (!client) return;
  try {
    await client.signOut();
  } catch {
    // Best-effort sign-out — safe to swallow.
  }
}
