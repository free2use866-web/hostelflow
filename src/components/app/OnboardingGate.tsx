import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { useStore } from "@/lib/store";
import { BHAWANS, type Bhawan } from "@/lib/types";
import {
  BRANCH_CODES,
  deriveAcademicYear,
  parseEnrollmentNumber,
  parseNameWithEnrollment,
} from "@/lib/academic-identity";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { BadgeCheck, GraduationCap, ShieldCheck } from "lucide-react";

/**
 * Strict verification gate — blocks the dashboard until the user's
 * IITR identity (8-digit enrollment) is confirmed. Wardens / Assistant
 * Wardens may skip enrollment (faculty accounts).
 */
export function OnboardingGate() {
  const { currentUser, completeOnboarding } = useStore();

  // Pre-fill: try parsing name+enrollment out of the account display name
  const raw = currentUser.name ?? "";
  const { cleanName, enrollment: extracted } = parseNameWithEnrollment(raw);

  const [fullName, setFullName] = useState(cleanName);
  const [enrollment, setEnrollment] = useState(extracted ?? "");
  const [bhawan, setBhawan] = useState<Bhawan>("Ravindra");
  const [roomNo, setRoomNo] = useState("");
  const [branchInfo, setBranchInfo] = useState<string | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    if (enrollment.length === 8) {
      const parsed = parseEnrollmentNumber(enrollment);
      if (parsed) {
        const known = BRANCH_CODES[parsed.branchCode];
        setBranchInfo(known ? known.name : `Branch code ${parsed.branchCode}`);
        setError("");
      } else {
        setBranchInfo(null);
        setError("Invalid IITR enrollment number format.");
      }
    } else {
      setBranchInfo(null);
      if (enrollment.length > 0 && enrollment.length < 8 && !/^\d*$/.test(enrollment)) {
        setError("Digits only.");
      } else {
        setError("");
      }
    }
  }, [enrollment]);

  const isStaff = currentUser.role === "Warden" || currentUser.role === "AsstWarden";

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = parseEnrollmentNumber(enrollment);
    if (!parsed) {
      setError("Enter a valid 8-digit IITR enrollment number (e.g. 21115109).");
      return;
    }
    if (!fullName.trim() || !roomNo.trim()) {
      setError("Name and room number are required.");
      return;
    }
    completeOnboarding({
      name: fullName.trim(),
      enrollmentNumber: enrollment.trim(),
      enrollmentYear: parsed.enrollmentYear,
      branchCode: parsed.branchCode,
      branchName: BRANCH_CODES[parsed.branchCode]?.name ?? `Branch ${parsed.branchCode}`,
      academicYear: deriveAcademicYear(parsed.enrollmentYear),
      bhawan,
      roomNo: roomNo.trim().toUpperCase(),
    });
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md rounded-xl border border-border bg-card p-7"
      >
        <div className="mb-5 flex items-center gap-3">
          <div className="flex size-11 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <ShieldCheck className="size-5" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-foreground" style={{ fontFamily: "Lora, serif" }}>
              Verify your IITR identity
            </h1>
            <p className="text-xs text-muted-foreground">
              One-time verification for {currentUser.email}
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className="mb-1 block text-xs font-semibold text-muted-foreground">Full Name</label>
            <Input value={fullName} onChange={(e) => setFullName(e.target.value)}
              placeholder="PREET BANSAL" required className="rounded-lg border-border" />
          </div>

          <div>
            <label className="mb-1 flex items-center gap-1 text-xs font-semibold text-muted-foreground">
              <GraduationCap className="size-3.5" /> Enrollment Number (YYBBBXXX)
            </label>
            <Input value={enrollment} maxLength={8} inputMode="numeric"
              onChange={(e) => setEnrollment(e.target.value.replace(/\D/g, ""))}
              placeholder="21115109" className="rounded-lg border-border font-mono tracking-widest"
              required={!isStaff} disabled={isStaff}
            />
            {branchInfo && (() => {
              const parsed = parseEnrollmentNumber(enrollment)!;
              return (
                <p className="mt-1 flex items-center gap-1 text-xs font-semibold text-emerald-700">
                  <BadgeCheck className="size-3.5" /> Detected: {branchInfo} ·{" "}
                  {getOrdinal(deriveAcademicYear(parsed.enrollmentYear))} Year · Batch {parsed.enrollmentYear}
                </p>
              );
            })()}
          </div>

          <div>
            <label className="mb-1 block text-xs font-semibold text-muted-foreground">Bhawan</label>
            <div className="grid grid-cols-3 gap-1.5 sm:grid-cols-5">
              {BHAWANS.map((b) => (
                <button key={b} type="button" onClick={() => setBhawan(b)}
                  className={`rounded-lg border px-1 py-2 text-[10px] font-semibold transition-colors ${
                    bhawan === b ? "border-primary bg-primary/10 text-primary" : "border-border bg-background text-muted-foreground"
                  }`}>
                  {b}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="mb-1 block text-xs font-semibold text-muted-foreground">Room Number</label>
            <Input value={roomNo} onChange={(e) => setRoomNo(e.target.value)}
              placeholder="e.g. B-201" className="rounded-lg border-border" required />
          </div>

          {error && <p className="text-sm font-medium text-destructive">{error}</p>}

          <Button type="submit" className="mt-2 w-full rounded-full bg-primary font-semibold text-primary-foreground"
            disabled={!isStaff && (!enrollment || enrollment.length !== 8 || !!error)}>
            Verify & Continue
          </Button>

          {isStaff && (
            <p className="text-center text-[10px] text-muted-foreground">
              Faculty/staff account — enrollment not required.
            </p>
          )}
        </form>
      </motion.div>
    </div>
  );
}

function getOrdinal(n: number): string {
  const s = ["th", "st", "nd", "rd"];
  const v = n % 100;
  return n + (s[(v - 20) % 10] ?? s[v] ?? s[0]);
}
