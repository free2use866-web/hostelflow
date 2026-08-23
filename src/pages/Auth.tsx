import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
import { useAuth } from "@/hooks/use-auth";
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

  const [step, setStep] = useState<"signIn" | { email: string }>("signIn");
  const [otp, setOtp] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!authLoading && isAuthenticated) navigate(redirect);
  }, [authLoading, isAuthenticated, navigate, redirect]);

  const handleEmailSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    const fd = new FormData(e.currentTarget);
    const email = (fd.get("email") as string).trim().toLowerCase();

    if (!email.endsWith(IITR_DOMAIN)) {
      setError(`Only institute accounts (${IITR_DOMAIN}) can sign in.`);
      return;
    }
    setIsLoading(true);
    try {
      await signIn("email-otp", fd);
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
            <div className="flex size-9 items-center justify-center rounded-lg bg-primary text-sm font-bold text-primary-foreground">IITR</div>
            <span className="text-sm font-bold text-foreground" style={{ fontFamily: "Lora, serif" }}>HostelHub</span>
          </button>

          <div className="rounded-xl border border-border bg-card p-7">
            {step === "signIn" ? (
              <>
                <h1 className="text-xl font-bold text-foreground" style={{ fontFamily: "Lora, serif" }}>Sign in</h1>
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
