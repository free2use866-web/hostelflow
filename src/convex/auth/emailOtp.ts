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
    // ── Server-side domain guard ─────────────────────────────────────
    // Non-IITR emails are rejected BEFORE any code is sent. Mirrors the
    // OAuth-callback pattern: never trust client-side checks alone.
    const cleaned = (email ?? "").toLowerCase().trim();
    const domainRegex = /^[^@]+@([a-z0-9]+\.)?iitr\.ac\.in$/;
    if (!domainRegex.test(cleaned)) {
      throw new Error(
        "Domain restricted: only @iitr.ac.in institute accounts can sign in.",
      );
    }

    try {
      await axios.post(
        "https://auth.freebuff.app/send_otp",
        {
          to: email,
          otp: token,
          appName: process.env.VLY_APP_NAME || "a freebuff.com application",
        },
        {
          headers: {
            "x-api-key": "fb_email_2crN1hqIArZP2bEfvjp5Qik4",
          },
        },
      );
    } catch (error) {
      throw new Error(JSON.stringify(error));
    }
  },
});
