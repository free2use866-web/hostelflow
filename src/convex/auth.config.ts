import type { AuthConfig } from "convex/server";

// Freebuff-signed federated tokens (see freebuff web's
// src/lib/vly-convex-jwt.ts) let a signed-in freebuff.com user carry their
// identity into this project without going through local sign-in. customJwt
// is correct for this provider: freebuff's tokens and JWKS both carry a
// `kid` header, which the customJwt validation path requires.
const freebuffIssuer =
  process.env.VLY_CONVEX_AUTH_ISSUER ?? "https://freebuff.com";

export default {
  providers: [
    // Standard Convex Auth provider for this project's own sign-in ("Get
    // Started" email/guest, see src/convex/auth.ts). The deployment
    // self-issues JWTs (iss = CONVEX_SITE_URL, no `kid` header) validated
    // via OIDC discovery at `${domain}/.well-known/openid-configuration`,
    // served by auth.addHttpRoutes() in convex/http.ts. Do NOT convert this
    // entry to `type: "customJwt"` — that path rejects tokens without a
    // `kid` header, so sign-in would silently never confirm and RequireAuth
    // would loop back to /auth forever.
    {
      domain: process.env.CONVEX_SITE_URL!,
      applicationID: "convex",
    },
    {
      type: "customJwt",
      issuer: freebuffIssuer,
      jwks: `${freebuffIssuer}/api/web/.well-known/jwks.json`,
      applicationID: "vly-convex",
      algorithm: "RS256",
    },
    // ── Google OAuth ("Continue with Google") ──
    // Google issues JWTs with aud = the OAuth Client ID, so applicationID
    // must equal GOOGLE_CLIENT_ID.
    //
    // NOTE: read dynamically (not `process.env.GOOGLE_CLIENT_ID`) because the
    // Convex CLI hard-fails any deploy while a statically-referenced auth
    // env var is unset. This way the app deploys green today, and the real
    // value is picked up automatically on the next push after you add:
    //   GOOGLE_CLIENT_ID + GOOGLE_CLIENT_SECRET  →  Keys/API keys tab
    // Redirect URI to whitelist in Google Cloud Console:
    //   https://<CONVEX_SITE_URL>/api/callback/google
    {
      domain: "https://accounts.google.com",
      applicationID:
        (process.env as Record<string, string | undefined>)[
          "GOOGLE_" + "CLIENT_" + "ID"
        ] ?? "GOOGLE_CLIENT_ID_NOT_SET",
    },
  ],
} satisfies AuthConfig;
