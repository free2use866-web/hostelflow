import { motion } from "framer-motion";
import {
  ArrowRight,
  BellRing,
  ClipboardList,
  Eye,
  QrCode,
  Repeat,
  UtensilsCrossed,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router";

const features = [
  {
    icon: QrCode,
    title: "Mess Tokens in a tap",
    desc: "Students generate meal tokens instantly — the mess secretary sees the day's count at a glance.",
    tint: "bg-[oklch(0.89_0.075_168)] text-[oklch(0.38_0.06_170)]",
  },
  {
    icon: ClipboardList,
    title: "Complaints & suggestions",
    desc: "File anything — mess, general, maintenance — and @mention the person who needs to know.",
    tint: "bg-[oklch(0.9_0.075_55)] text-[oklch(0.4_0.07_50)]",
  },
  {
    icon: Eye,
    title: "Secy portals",
    desc: "Every secretary gets a focused portal with only the complaints that belong to them.",
    tint: "bg-[oklch(0.88_0.07_230)] text-[oklch(0.36_0.07_235)]",
  },
  {
    icon: Repeat,
    title: "Smart routing",
    desc: "Wardens, assistant & chief wardens see all work, transfer complaints to the right secy, and track progress.",
    tint: "bg-[oklch(0.89_0.075_350)] text-[oklch(0.4_0.08_350)]",
  },
  {
    icon: BellRing,
    title: "Mentions & notifications",
    desc: "Whoever is mentioned in a complaint is notified instantly. Status changes ping the student too.",
    tint: "bg-[oklch(0.87_0.09_295)] text-[oklch(0.38_0.09_295)]",
  },
  {
    icon: UtensilsCrossed,
    title: "Auto reminders",
    desc: "Complaints left untagged or untouched for 48 hours get flagged so nothing slips through.",
    tint: "bg-[oklch(0.92_0.05_120)] text-[oklch(0.4_0.07_130)]",
  },
];

const roles = [
  { emoji: "🎓", label: "Student" },
  { emoji: "🍽️", label: "Mess Secy" },
  { emoji: "📋", label: "General Secy" },
  { emoji: "🔧", label: "Maintenance Secy" },
  { emoji: "💡", label: "Suggestion Secy" },
  { emoji: "🧑‍💼", label: "Assistant Warden" },
  { emoji: "👨‍🍳", label: "Chief Warden" },
  { emoji: "🛡️", label: "Warden" },
];

export default function Landing() {
  return (
    <div className="min-h-screen overflow-x-hidden bg-background">
      {/* decorative blobs */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -top-24 -left-24 size-96 rounded-full bg-primary/15 blur-3xl" />
        <div className="absolute top-1/3 -right-32 size-[28rem] rounded-full bg-secondary/30 blur-3xl" />
        <div className="absolute bottom-0 left-1/3 size-80 rounded-full bg-accent/25 blur-3xl" />
      </div>

      <header className="relative z-10 mx-auto flex max-w-6xl items-center justify-between px-6 py-6">
        <div className="flex items-center gap-3">
          <div className="clay-pressable flex size-12 items-center justify-center rounded-2xl bg-primary text-2xl shadow-[var(--clay-raised),var(--clay-inner)]">
            🏠
          </div>
          <span className="text-lg font-extrabold tracking-tight">
            HostelHub<span className="text-primary">·IITR</span>
          </span>
        </div>
        <Link to="/auth">
          <Button className="clay-flat clay-pressable rounded-full px-6 font-semibold">
            Sign in
          </Button>
        </Link>
      </header>

      {/* Hero */}
      <section className="relative z-10 mx-auto max-w-6xl px-6 pt-14 pb-20 text-center">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <span className="clay-inset inline-flex items-center gap-2 rounded-full px-5 py-2 text-sm font-medium text-muted-foreground">
            🔐 Exclusive to <strong>@iitr.ac.in</strong> accounts
          </span>
          <h1 className="mx-auto mt-8 max-w-3xl text-5xl leading-tight font-extrabold tracking-tight sm:text-6xl">
            Your hostel,{" "}
            <span className="text-primary">softly</span> organised.
          </h1>
          <p className="mx-auto mt-6 max-w-xl text-lg text-muted-foreground">
            Complaints, mess tokens, communities and secretary portals — one
            squishy home for every warden, secy and student of an IIT Roorkee
            hostel.
          </p>
          <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
            <Link to="/auth?mode=demo">
              <Button
                size="lg"
                className="clay-flat clay-pressable h-14 rounded-full px-8 text-base font-bold"
              >
                Try Demo Mode <ArrowRight className="ml-2 size-5" />
              </Button>
            </Link>
            <Link to="/auth">
              <Button
                size="lg"
                variant="outline"
                className="clay-inset clay-pressable h-14 rounded-full border-none px-8 text-base font-semibold"
              >
                IITR Google sign-in
              </Button>
            </Link>
          </div>
        </motion.div>

        {/* role chips */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3, duration: 0.6 }}
          className="mt-14 flex flex-wrap justify-center gap-3"
        >
          {roles.map((r) => (
            <span
              key={r.label}
              className="clay-flat clay-pressable cursor-default rounded-full px-5 py-2.5 text-sm font-semibold"
            >
              {r.emoji} {r.label}
            </span>
          ))}
        </motion.div>
      </section>

      {/* Features */}
      <section className="relative z-10 mx-auto max-w-6xl px-6 pb-24">
        <h2 className="mb-10 text-center text-3xl font-extrabold tracking-tight">
          Everything a hostel needs
        </h2>
        <div className="grid gap-7 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((f, i) => (
            <motion.div
              key={f.title}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-60px" }}
              transition={{ duration: 0.45, delay: i * 0.06 }}
              className="clay-lg p-7"
            >
              <div
                className={`flex size-14 items-center justify-center rounded-2xl shadow-[var(--clay-raised),var(--clay-inner)] ${f.tint}`}
              >
                <f.icon className="size-6" />
              </div>
              <h3 className="mt-5 text-lg font-bold">{f.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                {f.desc}
              </p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section className="relative z-10 mx-auto max-w-4xl px-6 pb-24">
        <div className="clay-lg p-10 text-center">
          <h2 className="text-3xl font-extrabold tracking-tight">
            How a complaint travels
          </h2>
          <div className="mt-10 grid gap-6 sm:grid-cols-4">
            {[
              ["📝", "Student files", "Pick a community, describe it, @mention anyone."],
              ["📥", "Secy portal", "It lands in the right secretary's queue instantly."],
              ["🔁", "Route it", "Wardens can transfer it to another secy if misfiled."],
              ["✅", "Resolve", "Mark in-progress, resolved, or rejected — student is notified."],
            ].map(([emoji, title, desc], i) => (
              <div key={title}>
                <div className="clay mx-auto flex size-16 items-center justify-center rounded-3xl text-2xl">
                  {emoji}
                </div>
                <p className="mt-4 font-bold">
                  {i + 1}. {title}
                </p>
                <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                  {desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <footer className="relative z-10 border-t border-border/50 py-8 text-center text-sm text-muted-foreground">
        Built for hostel life at IIT Roorkee · HostelHub ·IITR
      </footer>
    </div>
  );
}
