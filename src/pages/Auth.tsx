import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
import { useAuth } from "@/hooks/use-auth";
import { isValidIITREmail } from "@/lib/academic-identity";
import { useAction } from "convex/react";
import { api } from "@/convex/_generated/api";
import { ArrowRight, Loader2, MailCheck } from "lucide-react";
import { Suspense, useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router";
import { motion } from "framer-motion";

interface AuthProps { redirectAfterAuth?: string; }
const IITR_DOMAIN = "@iitr.ac.in";

function resolveRedirect(returnTo: string | null, fallback = "/dashboard") {
  if (returnTo?.startsWith("/") && !returnTo.startsWith("//")) return returnTo;
  return fallback;
}

function Auth({ redirectAfterAuth }: AuthProps = {}) {
  const { isLoading: authLoading, isAuthenticated, signIn } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const redirect = resolveRedirect(searchParams.get("returnTo"), redirectAfterAuth);

  // SECURITY: code requests go through the server-enforced dispatcher
  // (domain gate + per-email rate limit), never straight to signIn.
  const requestOtp = useAction(api.otp.requestOtp);

  const [step, setStep] = useState<"google" | "signIn" | { email: string }>("google");
  const [otp, setOtp] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!authLoading && isAuthenticated) navigate(redirect);
  }, [authLoading, isAuthenticated, navigate, redirect]);

  // ── Primary: Continue with Google ──
  const handleGoogleSignIn = async () => {
    setError(null);
    try {
      await signIn("google", { redirectTo: redirect });
    } catch {
      setError(
        "Google sign-in isn't active yet. Ask your admin to add GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET in the Keys/API keys tab — or sign in with an email code below.",
      );
    }
  };

  const handleEmailSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    const fd = new FormData(e.currentTarget);
    const email = (fd.get("email") as string).trim().toLowerCase();

    if (!isValidIITREmail(email)) {
      setError(`Only institute accounts (${IITR_DOMAIN} or subdomains like @me.iitr.ac.in) can sign in.`);
      return;
    }
    setIsLoading(true);
    try {
      // Server validates the domain and enforces the send budget before
      // dispatching — client-side checks are convenience only.
      await requestOtp({ email });
      setStep({ email });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to send code.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleOtpSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);
    try {
      const fd = new FormData(e.currentTarget);
      await signIn("email-otp", fd);
      navigate(redirect);
    } catch {
      setError("Incorrect code. Try again.");
      setOtp("");
      setIsLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen bg-background">
      <div className="flex min-h-screen flex-col items-center justify-center px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-md"
        >
          <button onClick={() => navigate("/")} className="mb-8 flex items-center gap-2 self-start">
            <img src="/src/assets/logo.svg" alt="HostelHub" className="size-9" />
            <span className="text-sm font-bold text-foreground" style={{ fontFamily: "Lora, serif" }}>HostelHub</span>
          </button>

          <div className="rounded-xl border border-border bg-card p-5 sm:p-7">
            {step === "google" ? (
              <>
                <h1 className="text-xl font-bold text-foreground" style={{ fontFamily: "Lora, serif" }}>Sign in</h1>
                <p className="mt-1.5 text-sm text-muted-foreground">
                  Use your institute Google account — only <strong>{IITR_DOMAIN}</strong> addresses are accepted.
                </p>

                {/* Primary: Continue with Google */}
                <button
                  type="button"
                  onClick={handleGoogleSignIn}
                  disabled={isLoading}
                  className="mt-5 flex w-full items-center justify-center gap-3 rounded-lg border border-border bg-background px-4 py-3 text-sm font-semibold text-foreground transition-colors hover:bg-accent/40 disabled:opacity-60"
                >
                  <svg viewBox="0 0 24 24" className="h-[18px] w-[18px]" aria-hidden>
                    <path fill="#4285F4" d="M23.49 12.27c0-.79-.07-1.54-.19-2.27H12v4.51h6.47a5.57 5.57 0 0 1-2.4 3.58v3h3.86c2.26-2.09 3.56-5.17 3.56-8.82z" />
                    <path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.86-3c-1.08.72-2.45 1.16-4.07 1.16-3.13 0-5.78-2.11-6.73-4.96H1.29v3.09C3.26 21.3 7.31 24 12 24z" />
                    <path fill="#FBBC05" d="M5.27 14.29c-.25-.72-.38-1.49-.38-2.29s.14-1.57.38-2.29V6.62H1.29C.47 8.24 0 10.06 0 12s.47 3.76 1.29 5.38l3.98-3.09z" />
                    <path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.31 0 3.26 2.7 1.29 6.62l3.98 3.09C6.22 6.86 8.87 4.75 12 4.75z" />
                  </svg>
                  Continue with Google
                </button>

                {error && <p className="mt-3 text-xs leading-relaxed text-destructive">{error}</p>}

                {/* Secondary: email OTP fallback */}
                <div className="my-5 flex items-center gap-3">
                  <span className="h-px flex-1 bg-border" />
                  <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">or email code</span>
                  <span className="h-px flex-1 bg-border" />
                </div>

                <form onSubmit={handleEmailSubmit} className="space-y-3">
                  <div className="flex items-center gap-2 rounded-lg border border-input bg-background px-3 py-2">
                    <MailCheck className="size-4 shrink-0 text-muted-foreground" />
                    <Input name="email" placeholder="name@iitr.ac.in" type="email" className="border-0 bg-transparent shadow-none focus-visible:ring-0" disabled={isLoading} required />
                    <Button type="submit" size="icon" variant="ghost" className="size-8 shrink-0" disabled={isLoading}>
                      {isLoading ? <Loader2 className="size-4 animate-spin" /> : <ArrowRight className="size-4" />}
                    </Button>
                  </div>
                </form>
                <p className="mt-3 text-center text-xs text-muted-foreground">
                  We'll email you a 6-digit code — no password needed.
                </p>
              </>
            ) : step === "signIn" ? (
              <>
                <h1 className="text-xl font-bold text-foreground" style={{ fontFamily: "Lora, serif" }}>Sign in with email</h1>
                <p className="mt-1.5 text-sm text-muted-foreground">Your <strong>{IITR_DOMAIN}</strong> institute email.</p>

                <form onSubmit={handleEmailSubmit} className="mt-5 space-y-3">
                  <div className="flex items-center gap-2 rounded-lg border border-input bg-background px-3 py-2">
                    <MailCheck className="size-4 shrink-0 text-muted-foreground" />
                    <Input name="email" placeholder="name@iitr.ac.in" type="email" className="border-0 bg-transparent shadow-none focus-visible:ring-0" disabled={isLoading} required />
                    <Button type="submit" size="icon" variant="ghost" className="size-8 shrink-0" disabled={isLoading}>
                      {isLoading ? <Loader2 className="size-4 animate-spin" /> : <ArrowRight className="size-4" />}
                    </Button>
                  </div>
                </form>
                {error && <p className="mt-3 text-center text-sm font-medium text-destructive">{error}</p>}
                <p className="mt-3 text-center text-xs text-muted-foreground">
                  We'll email you a 6-digit code — no password needed.
                </p>
              </>
            ) : (
              <>
                <h1 className="text-xl font-bold text-foreground" style={{ fontFamily: "Lora, serif" }}>Check your inbox</h1>
                <p className="mt-1.5 text-sm text-muted-foreground">Code sent to <strong>{step.email}</strong></p>
                <form onSubmit={handleOtpSubmit}>
                  <input type="hidden" name="email" value={step.email} />
                  <input type="hidden" name="code" value={otp} />
                  <div className="mt-5 flex justify-center">
                    <InputOTP value={otp} onChange={setOtp} maxLength={6} disabled={isLoading}
                      onKeyDown={(e) => { if (e.key === "Enter" && otp.length === 6) e.currentTarget.closest("form")?.requestSubmit(); }}
                    >
                      <InputOTPGroup>{Array.from({ length: 6 }).map((_, i) => <InputOTPSlot key={i} index={i} />)}</InputOTPGroup>
                    </InputOTP>
                  </div>
                  {error && <p className="mt-3 text-center text-sm font-medium text-destructive">{error}</p>}
                  <Button type="submit" disabled={isLoading || otp.length !== 6} className="mt-5 w-full rounded-full bg-primary font-semibold text-primary-foreground">
                    {isLoading ? <><Loader2 className="mr-2 size-4 animate-spin" /> Verifying…</> : <>Verify & Enter <ArrowRight className="ml-2 size-4" /></>}
                  </Button>
                  <Button type="button" variant="ghost" onClick={() => setStep("signIn")} disabled={isLoading} className="mt-2 w-full rounded-full text-sm">
                    Use different email
                  </Button>
                  <Button type="button" variant="ghost" onClick={() => setStep("google")} disabled={isLoading} className="w-full rounded-full text-sm text-primary">
                    ← Back to sign-in options
                  </Button>
                </form>
              </>
            )}
          </div>

          <p className="mt-6 text-center text-xs text-muted-foreground">
            HostelHub · IIT Roorkee — Bhawan Administration & HAC
          </p>
        </motion.div>
      </div>
    </div>
  );
}

export default function AuthPage(props: AuthProps) {
  return <Suspense><Auth {...props} /></Suspense>;
}
