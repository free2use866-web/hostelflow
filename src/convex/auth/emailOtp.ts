import { Email } from "@convex-dev/auth/providers/Email";
import axios from "axios";
import { RandomReader, generateRandomString } from "@oslojs/crypto/random";

export const emailOtp = Email({
  id: "email-otp",
  maxAge: 60 * 15, // 15 minutes
  // This function can be asynchronous
  async generateVerificationToken() {
    const random: RandomReader = {
      read(bytes: Uint8Array) {
        crypto.getRandomValues(bytes);
      },
    };
    const alphabet = "0123456789";
    return generateRandomString(random, alphabet, 6);
  },
  async sendVerificationRequest({ identifier: email, token }) {
    // ── Server-side domain guard (defense in depth) ──────────────────
    // Primary enforcement lives in otp.requestOtp; repeated here so any
    // future caller of signIn("email-otp") is covered too.
    const cleaned = (email ?? "").toLowerCase().trim();
    const domainRegex = /^[^@]+@([a-z0-9]+\.)?iitr\.ac\.in$/;
    if (!domainRegex.test(cleaned)) {
      throw new Error(
        "Domain restricted: only @iitr.ac.in institute accounts can sign in.",
      );
    }

    // SECURITY: the mail API key lives in an env var (Keys/API keys tab),
    // never in source. Add FREEBUFF_OTP_API_KEY to your deployment.
    if (!process.env.FREEBUFF_OTP_API_KEY) {
      console.error("[emailOtp] FREEBUFF_OTP_API_KEY is not configured.");
      throw new Error("Mail service is not configured.");
    }

    try {
      await axios.post(
        "https://auth.freebuff.app/send_otp",
        {
          to: cleaned,
          otp: token,
          appName: process.env.VLY_APP_NAME || "a freebuff.com application",
        },
        {
          headers: {
            "x-api-key": process.env.FREEBUFF_OTP_API_KEY,
          },
          timeout: 8000, // fail fast — never hang the auth flow
        },
      );
    } catch (error) {
      // Log details server-side only; surface a generic message to clients.
      // (JSON.stringify(Error) yields "{}" and can leak upstream internals.)
      const status = (error as { response?: { status?: number } })?.response
        ?.status;
      console.error("[emailOtp] send failed:", status ?? error);
      throw new Error(
        status
          ? `Mail service unavailable (${status}). Try again shortly.`
          : "Network error while sending the code.",
      );
    }
  },
});
