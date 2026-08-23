import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from "@/components/ui/input-otp";
import { api } from "@/convex/_generated/api";
import type { HostelRole } from "@/convex/schema";
import { useAuth } from "@/hooks/use-auth";
import { ArrowRight, Loader2, MailCheck, PlayCircle } from "lucide-react";
import { Suspense, useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router";
import { toast } from "sonner";

interface AuthProps {
  redirectAfterAuth?: string;
}

const IITR_DOMAIN = "@iitr.ac.in";

const DEMO_ROLES: { role: HostelRole; label: string; emoji: string }[] = [
  { role: "student", label: "Student", emoji: "🎓" },
  { role: "mess_secy", label: "Mess Secy", emoji: "🍽️" },
  { role: "general_secy", label: "General Secy", emoji: "📋" },
  { role: "maintenance_secy", label: "Maintenance Secy", emoji: "🔧" },
  { role: "suggestion_secy", label: "Suggestion Secy", emoji: "💡" },
  { role: "assistant_warden", label: "Assistant Warden", emoji: "🧑‍💼" },
  { role: "chief_warden", label: "Chief Warden", emoji: "👨‍🍳" },
  { role: "warden", label: "Warden", emoji: "🛡️" },
];

function resolveRedirectAfterAuth(returnTo: string | null, fallback = "/dashboard") {
  if (returnTo?.startsWith("/") && !returnTo.startsWith("//")) return returnTo;
  return fallback;
}

function Auth({ redirectAfterAuth }: AuthProps = {}) {
  const { isLoading: authLoading, isAuthenticated, signIn } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const redirect = resolveRedirectAfterAuth(
    searchParams.get("returnTo"),
    redirectAfterAuth,
  );
  const [step, setStep] = useState<"signIn" | { email: string }>("signIn");
  const [otp, setOtp] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!authLoading && isAuthenticated) navigate(redirect);
  }, [authLoading, isAuthenticated, navigate, redirect]);

  const handleEmailSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    const formData = new FormData(event.currentTarget);
    const email = (formData.get("email") as string).trim().toLowerCase();

    if (!email.endsWith(IITR_DOMAIN)) {
      setError(
        `Only institute accounts (${IITR_DOMAIN}) can sign in. Use your IIT Roorkee Google email.`,
      );
      return;
    }

    setIsLoading(true);
    try {
      await signIn("email-otp", formData);
      setStep({ email });
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Failed to send verification code. Please try again.",
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleOtpSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setIsLoading(true);
    try {
      const formData = new FormData(event.currentTarget);
      await signIn("email-otp", formData);
      navigate(redirect);
    } catch {
      setError("The verification code you entered is incorrect.");
      setOtp("");
      setIsLoading(false);
    }
  };

  const handleDemoLogin = async (role: HostelRole) => {
    setError(null);
    setIsLoading(true);
    try {
      await signIn("anonymous");
      toast.info(`Demo Mode — signed in as ${DEMO_ROLES.find((r) => r.role === role)?.label}`);
      navigate(`/dashboard?demoRole=${role}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Demo sign-in failed");
      setIsLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen overflow-hidden bg-background">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -top-20 left-1/4 size-80 rounded-full bg-primary/15 blur-3xl" />
        <div className="absolute bottom-0 right-0 size-96 rounded-full bg-secondary/25 blur-3xl" />
      </div>

      <div className="relative z-10 flex min-h-screen flex-col items-center justify-center px-4 py-10">
        <button
          onClick={() => navigate("/")}
          className="clay-flat clay-pressable mb-8 flex size-16 items-center justify-center rounded-3xl text-3xl"
        >
          🏠
        </button>

        {step === "signIn" ? (
          <div className="clay-lg w-full max-w-md p-8">
            <h1 className="text-center text-2xl font-extrabold">Sign in</h1>
            <p className="mt-2 text-center text-sm text-muted-foreground">
              Institute members only — your{" "}
              <strong>{IITR_DOMAIN}</strong> address.
            </p>

            <form onSubmit={handleEmailSubmit} className="mt-6 space-y-3">
              <div className="clay-inset flex items-center rounded-full px-4">
                <MailCheck className="size-4 shrink-0 text-muted-foreground" />
                <Input
                  name="email"
                  placeholder="name@iitr.ac.in"
                  type="email"
                  className="border-0 bg-transparent shadow-none focus-visible:ring-0"
                  disabled={isLoading}
                  required
                />
                <Button
                  type="submit"
                  size="icon"
                  variant="ghost"
                  className="size-9 shrink-0 rounded-full hover:bg-primary/10"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <Loader2 className="size-4 animate-spin" />
                  ) : (
                    <ArrowRight className="size-4" />
                  )}
                </Button>
              </div>
            </form>

            {error && (
              <p className="mt-3 text-center text-sm font-medium text-destructive">
                {error}
              </p>
            )}

            <p className="mt-4 text-center text-xs text-muted-foreground">
              We'll email you a 6-digit verification code — just like signing in
              with Google, but verified to your institute inbox.
            </p>

            <div className="my-7 flex items-center gap-4">
              <span className="h-px flex-1 bg-border" />
              <span className="text-xs font-semibold tracking-wider text-muted-foreground uppercase">
                or explore
              </span>
              <span className="h-px flex-1 bg-border" />
            </div>

            <div className="rounded-[calc(var(--radius)+0.5rem)] bg-primary/5 p-4">
              <p className="mb-3 text-center text-sm font-bold">
                🎭 Demo Mode — become anyone
              </p>
              <div className="grid grid-cols-2 gap-2.5">
                {DEMO_ROLES.map((r) => (
                  <Button
                    key={r.role}
                    type="button"
                    disabled={isLoading}
                    onClick={() => handleDemoLogin(r.role)}
                    className="clay-flat clay-pressable h-auto justify-start gap-2 rounded-2xl py-2.5 text-sm font-semibold"
                    variant="outline"
                  >
                    <span className="text-lg">{r.emoji}</span> {r.label}
                  </Button>
                ))}
              </div>
              {isLoading && (
                <p className="mt-3 flex items-center justify-center gap-2 text-xs text-muted-foreground">
                  <Loader2 className="size-3 animate-spin" /> Entering demo…
                </p>
              )}
            </div>
          </div>
        ) : (
          <div className="clay-lg w-full max-w-md p-8">
            <h1 className="text-center text-2xl font-extrabold">
              Check your inbox
            </h1>
            <p className="mt-2 text-center text-sm text-muted-foreground">
              We sent a code to <strong>{step.email}</strong>
            </p>
            <form onSubmit={handleOtpSubmit}>
              <input type="hidden" name="email" value={step.email} />
              <input type="hidden" name="code" value={otp} />
              <div className="mt-6 flex justify-center">
                <InputOTP
                  value={otp}
                  onChange={setOtp}
                  maxLength={6}
                  disabled={isLoading}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && otp.length === 6 && !isLoading) {
                      (e.target as HTMLElement)
                        .closest("form")
                        ?.requestSubmit();
                    }
                  }}
                >
                  <InputOTPGroup>
                    {Array.from({ length: 6 }).map((_, index) => (
                      <InputOTPSlot key={index} index={index} />
                    ))}
                  </InputOTPGroup>
                </InputOTP>
              </div>
              {error && (
                <p className="mt-4 text-center text-sm font-medium text-destructive">
                  {error}
                </p>
              )}
              <Button
                type="submit"
                disabled={isLoading || otp.length !== 6}
                className="clay-flat clay-pressable mt-6 w-full rounded-full py-6 font-bold"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 size-4 animate-spin" /> Verifying…
                  </>
                ) : (
                  <>
                    Verify & enter <ArrowRight className="ml-2 size-4" />
                  </>
                )}
              </Button>
              <Button
                type="button"
                variant="ghost"
                onClick={() => setStep("signIn")}
                disabled={isLoading}
                className="mt-2 w-full rounded-full"
              >
                Use a different email
              </Button>
            </form>
          </div>
        )}

        <p className="mt-8 text-center text-xs text-muted-foreground">
          HostelHub ·IITR — for wardens, secretaries & students of IIT Roorkee
        </p>
      </div>
    </div>
  );
}

export default function AuthPage(props: AuthProps) {
  return (
    <Suspense>
      <Auth {...props} />
    </Suspense>
  );
}
