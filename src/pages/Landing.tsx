import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowRight,
  BellRing,
  Building2,
  CheckCircle2,
  ClipboardList,
  Shield,
  Utensils,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router";
import { useEffect, useState } from "react";

/* ─── Flip Words ──────────────────────────────────────────────────────────── */

const FLIP_WORDS = [
  "No more lost complaints.",
  "Mess menu at a glance.",
  "Sick meals delivered fast.",
  "Digital passes, zero paper.",
  "Suggestions that reach the Warden.",
  "Overdue tickets auto-escalated.",
];

function FlipWords() {
  const [index, setIndex] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setIndex((i) => (i + 1) % FLIP_WORDS.length), 2800);
    return () => clearInterval(t);
  }, []);
  return (
    <span className="inline-block h-[1.2em] overflow-hidden align-bottom">
      <AnimatePresence mode="wait">
        <motion.span
          key={index}
          initial={{ y: 20, opacity: 0, filter: "blur(4px)" }}
          animate={{ y: 0, opacity: 1, filter: "blur(0px)" }}
          exit={{ y: -20, opacity: 0, filter: "blur(4px)" }}
          transition={{ duration: 0.45 }}
          className="inline-block text-primary"
        >
          {FLIP_WORDS[index]}
        </motion.span>
      </AnimatePresence>
    </span>
  );
}

/* ─── Staggered Text ─────────────────────────────────────────────────────── */

function StaggerText({ text, className = "" }: { text: string; className?: string }) {
  const words = text.split(" ");
  return (
    <span className={className}>
      {words.map((w, i) => (
        <motion.span
          key={i}
          initial={{ opacity: 0, filter: "blur(6px)" }}
          whileInView={{ opacity: 1, filter: "blur(0px)" }}
          viewport={{ once: true }}
          transition={{ delay: i * 0.04, duration: 0.35 }}
          className="inline-block mr-[0.3em]"
        >
          {w}
        </motion.span>
      ))}
    </span>
  );
}

/* ─── Feature cards ──────────────────────────────────────────────────────── */

const features = [
  { icon: ClipboardList, title: "Smart Complaint Routing", desc: "File once — auto-routed to the right secretary based on category. Mess, maintenance, tech, sports, wellness, general." },
  { icon: BellRing, title: "24-Hour Overdue Escalation", desc: "Complaints unresolved after 24h are flagged and surfaced directly to the Assistant Warden dashboard." },
  { icon: Utensils, title: "Mess & Sick Diet", desc: "Weekly 3-meal schedule, sick meal requests delivered to your room, and mess rebate tracker with IITR rule compliance." },
  { icon: Building2, title: "Community Board", desc: "Upvote hostel improvement proposals. Top-voted ideas automatically rank higher on the Warden dashboard." },
  { icon: Shield, title: "Digital Passes", desc: "Late-night entry, sports equipment checkout, and guest stay approvals — all with digital sign-offs." },
  { icon: CheckCircle2, title: "Cross-Secretary Coordination", desc: "Wardens and Assistant Wardens see all work, reassign tickets, and track progress across every secretary." },
];

/* ─── Landing ────────────────────────────────────────────────────────────── */

export default function Landing() {
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="mx-auto flex max-w-6xl items-center justify-between px-6 py-5">
        <div className="flex items-center gap-2.5">
          <div className="flex size-10 items-center justify-center rounded-lg bg-primary text-lg font-bold text-primary-foreground">
            IITR
          </div>
          <span className="font-bold tracking-tight text-foreground" style={{ fontFamily: "Lora, serif" }}>
            HostelHub
          </span>
        </div>
        <div className="flex items-center gap-3">
          <Link to="/auth">
            <Button size="sm" className="rounded-full bg-primary px-5 font-semibold text-primary-foreground">
              Sign In <ArrowRight className="ml-1.5 size-3.5" />
            </Button>
          </Link>
        </div>
      </header>

      {/* Hero */}
      <section className="mx-auto max-w-6xl px-6 pt-16 pb-20 text-center">
        <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
          <p className="mb-4 inline-block rounded-full border border-primary/30 bg-primary/8 px-4 py-1.5 text-xs font-semibold tracking-wide text-primary">
            🔐 Exclusive to @iitr.ac.in
          </p>
          <h1 className="mx-auto max-w-3xl text-4xl leading-tight font-bold text-foreground sm:text-5xl" style={{ fontFamily: "Lora, serif" }}>
            The Hostel Management System{" "}
            <br className="hidden sm:block" />
            for <FlipWords />
          </h1>
          <p className="mx-auto mt-6 max-w-xl text-base text-muted-foreground" style={{ fontFamily: "Libre Baskerville, serif" }}>
            One portal for complaints, mess, sick meals, digital passes, community suggestions and everything else — for every Bhawan at IIT Roorkee.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Link to="/auth">
              <Button size="lg" className="rounded-full bg-primary px-7 font-semibold text-primary-foreground">
                Enter as Institute Member <ArrowRight className="ml-2 size-4" />
              </Button>
            </Link>
          </div>
        </motion.div>

        {/* Bhawan badges */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4, duration: 0.5 }}
          className="mt-10 flex flex-wrap justify-center gap-2"
        >
          {["Ravindra", "Govind", "Cautley", "Rajendra", "Sarojini"].map((b) => (
            <span key={b} className="rounded-full border border-border bg-card px-4 py-1.5 text-xs font-semibold text-muted-foreground">
              🏛️ {b}
            </span>
          ))}
        </motion.div>
      </section>

      {/* Features */}
      <section className="mx-auto max-w-6xl px-6 pb-20">
        <StaggerText
          text="Everything a Bhawan needs — in one place."
          className="mb-8 block text-center text-2xl font-bold text-foreground"
        />
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((f, i) => (
            <motion.div
              key={f.title}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ duration: 0.4, delay: i * 0.06 }}
              className="rounded-xl border border-border bg-card p-6"
            >
              <div className="mb-4 flex size-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <f.icon className="size-5" />
              </div>
              <h3 className="mb-2 font-bold text-foreground" style={{ fontFamily: "Lora, serif" }}>
                {f.title}
              </h3>
              <p className="text-sm leading-relaxed text-muted-foreground">
                {f.desc}
              </p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section className="mx-auto max-w-4xl px-6 pb-20">
        <div className="rounded-xl border border-border bg-card p-8 text-center">
          <h2 className="mb-8 text-2xl font-bold text-foreground" style={{ fontFamily: "Lora, serif" }}>
            How a complaint flows
          </h2>
          <div className="grid gap-6 sm:grid-cols-4">
            {[
              ["📝", "Student files", "Pick a category, describe it."],
              ["🔀", "Auto-routed", "Lands with the right secretary instantly."],
              ["⏰", "24h escalation", "Unresolved? Flagged to the Asst. Warden."],
              ["✅", "Resolved", "Status updated, student notified."],
            ].map(([emoji, title, desc], i) => (
              <div key={title}>
                <motion.div
                  initial={{ scale: 0.8, opacity: 0 }}
                  whileInView={{ scale: 1, opacity: 1 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.1, duration: 0.35 }}
                  className="mx-auto mb-3 flex size-14 items-center justify-center rounded-full border border-border bg-background text-2xl"
                >
                  {emoji}
                </motion.div>
                <p className="font-semibold text-foreground">{title}</p>
                <p className="mt-1 text-xs text-muted-foreground">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <footer className="border-t border-border py-6 text-center text-xs text-muted-foreground">
        HostelHub · IIT Roorkee — Bhawan Administration & HAC
      </footer>
    </div>
  );
}
