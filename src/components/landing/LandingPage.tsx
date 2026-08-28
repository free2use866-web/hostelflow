/* ============================================================================
   LandingPage.tsx — self-contained, production-grade SaaS landing page.
   Stack: React + Tailwind + Framer Motion + lucide-react. Zero other deps.

   Trust & compliance systems implemented (no dead links anywhere):
     • Privacy Policy / Terms of Service modals (structured legal copy)
     • Contact Sales dialog (validated form + animated success/error states)
     • Cookie consent banner (Accept / Customize / Reject, persisted)
     • Newsletter with explicit consent checkbox
     • Footer System column (status ping, region selector, dynamic year)

   A11y: role="dialog" + aria-modal + focus traps + ESC/backdrop dismiss,
   aria-expanded accordions/menus, semantic landmarks, 44px touch targets.
============================================================================ */

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type ChangeEvent,
  type CSSProperties,
  type FormEvent,
  type ReactNode,
} from "react";
import { AnimatePresence, motion, type Variants } from "framer-motion";
import {
  Activity,
  ArrowRight,
  ArrowUpRight,
  BadgeCheck,
  BarChart3,
  Bell,
  Check,
  CheckCircle2,
  ChevronDown,
  Cookie,
  FileText,
  GitBranch,
  Github,
  Globe,
  GraduationCap,
  Heart,
  KeyRound,
  Loader2,
  Lock,
  Mail,
  Menu,
  MessageSquare,
  Moon,
  Send,
  Server,
  ShieldCheck,
  Sparkles,
  Sun,
  Terminal,
  ThumbsUp,
  UtensilsCrossed,
  Users,
  X,
  XCircle,
  Info,
  Building2,
  Zap,
} from "lucide-react";

/* ─────────────────────────────────────────────────────────────────────────── */
/* Types                                                                       */
/* ─────────────────────────────────────────────────────────────────────────── */

type Theme = "dark" | "light";
type LegalKind = "privacy" | "terms";
type ToastKind = "success" | "error" | "info";
type CookiePhase = "hidden" | "banner" | "customize";

interface ToastItem {
  id: number;
  kind: ToastKind;
  title: string;
  desc?: string;
}

interface Consent {
  analytics: boolean;
  marketing: boolean;
}

interface LegalSection {
  heading: string;
  paras?: string[];
  bullets?: string[];
}

const BRAND = "HostelHub";
const CONSENT_KEY = "hostelhub-cookie-consent-v1";

/* ─────────────────────────────────────────────────────────────────────────── */
/* Design tokens — swapped live by the theme toggle via CSS custom properties  */
/* ─────────────────────────────────────────────────────────────────────────── */

const THEME_VARS: Record<Theme, Record<string, string>> = {
  dark: {
    "--lp-bg": "#09090b",
    "--lp-bg-soft": "#0e0e11",
    "--lp-surface": "#131316",
    "--lp-surface-2": "#1a1a1f",
    "--lp-border": "rgba(255,255,255,0.09)",
    "--lp-border-strong": "rgba(255,255,255,0.18)",
    "--lp-text": "#fafafa",
    "--lp-muted": "#a1a1ab",
    "--lp-glass": "rgba(9,9,11,0.72)",
    "--lp-chip": "rgba(255,255,255,0.06)",
    "--lp-ring": "rgba(52,211,153,0.35)",
  },
  light: {
    "--lp-bg": "#fafafa",
    "--lp-bg-soft": "#f4f4f5",
    "--lp-surface": "#ffffff",
    "--lp-surface-2": "#f4f4f5",
    "--lp-border": "rgba(9,9,11,0.10)",
    "--lp-border-strong": "rgba(9,9,11,0.22)",
    "--lp-text": "#101013",
    "--lp-muted": "#52525c",
    "--lp-glass": "rgba(250,250,250,0.78)",
    "--lp-chip": "rgba(9,9,11,0.05)",
    "--lp-ring": "rgba(5,150,105,0.30)",
  },
};

/* ─────────────────────────────────────────────────────────────────────────── */
/* Motion presets                                                              */
/* ─────────────────────────────────────────────────────────────────────────── */

const staggerParent: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.08 } },
};

const fadeUp: Variants = {
  hidden: { opacity: 0, y: 18 },
  show: { opacity: 1, y: 0, transition: { duration: 0.5, ease: "easeOut" } },
};

/* ─────────────────────────────────────────────────────────────────────────── */
/* Hooks — focus trapping, scroll lock, outside-click                          */
/* ─────────────────────────────────────────────────────────────────────────── */

function useFocusTrap(active: boolean, onClose: () => void) {
  const ref = useRef<HTMLDivElement | null>(null);
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  useEffect(() => {
    if (!active) return;
    const el = ref.current;
    if (!el) return;

    const prev =
      document.activeElement instanceof HTMLElement ? document.activeElement : null;

    const focusables = () =>
      Array.from(
        el.querySelectorAll<HTMLElement>(
          'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])',
        ),
      );

    // Move focus into the dialog once it has mounted.
    const t = window.setTimeout(() => focusables()[0]?.focus(), 40);

    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.stopPropagation();
        onCloseRef.current();
        return;
      }
      if (e.key !== "Tab") return;
      const list = focusables();
      if (list.length === 0) return;
      const first = list[0];
      const last = list[list.length - 1];
      const cur = document.activeElement;
      if (e.shiftKey && (cur === first || !el.contains(cur))) {
        last.focus();
        e.preventDefault();
      } else if (!e.shiftKey && (cur === last || !el.contains(cur))) {
        first.focus();
        e.preventDefault();
      }
    };

    document.addEventListener("keydown", onKey);
    return () => {
      window.clearTimeout(t);
      document.removeEventListener("keydown", onKey);
      prev?.focus(); // restore focus to the trigger element on close
    };
  }, [active]);

  return ref;
}

function useScrollLock(active: boolean) {
  useEffect(() => {
    if (!active) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [active]);
}

function readConsent(): Consent | null {
  try {
    const raw = window.localStorage.getItem(CONSENT_KEY);
    return raw ? (JSON.parse(raw) as Consent) : null;
  } catch {
    return null;
  }
}

/* ─────────────────────────────────────────────────────────────────────────── */
/* Static content                                                              */
/* ─────────────────────────────────────────────────────────────────────────── */

const NAV_LINKS = [
  { label: "Features", id: "features" },
  { label: "About", id: "about" },
  { label: "Pricing", id: "pricing" },
  { label: "FAQ", id: "faq" },
];

const COMPLIANCE = [
  { icon: ShieldCheck, label: "Institute-only access" },
  { icon: Users, label: "Role-based access" },
  { icon: CheckCircle2, label: "99.9% uptime" },
  { icon: ShieldCheck, label: "Privacy-first" },
];

const BHAWANS = ["Ravindra", "Govind", "Cautley", "Rajendra", "Sarojini"];

// Bhawans are displayed in the proof bar.
const REGIONS = [
  { code: "ravindra", label: "Ravindra Bhawan" },
  { code: "govind", label: "Govind Bhawan" },
  { code: "cautley", label: "Cautley Bhawan" },
  { code: "rajendra", label: "Rajendra Bhawan" },
  { code: "sarojini", label: "Sarojini Bhawan" },
];
const COMPANY_SIZES = ["1–10", "11–50", "51–200", "201–1000", "1000+"];

const FEATURES_DATA = [
  { title: "Smart Complaint Routing", desc: "Auto-routes to the right secretary based on category." },
  { title: "Mess & Diet Management", desc: "Weekly menus, sick-diet requests, and rebate tracking." },
  { title: "Community Boards", desc: "Reddit-style boards for hostel life discussions." },
  { title: "Digital Gate Passes", desc: "Late entries, sports gear, guest stays — one-tap approval." },
  { title: "Notice Board", desc: "Pinned notices from wardens and secretaries." },
  { title: "Management Group Chat", desc: "Private chat for wardens and secretaries." },
];

const FAQ_ITEMS = [
  {
    q: "Is HostelHub free to use?",
    a: "Yes! HostelHub is completely free for all IIT Roorkee residents. There are no paid tiers — every feature is available to students, secretaries, and wardens. Just sign in with your @iitr.ac.in email.",
  },
  {
    q: "Do I need to install anything?",
  },
  {
    q: "Is my data secure?",
    a: "Yes. All data is encrypted in transit and at rest. Only institute email addresses (.iitr.ac.in) are allowed to sign up, ensuring only verified residents can access the platform. We use role-based access control so students, secretaries, and wardens see only what they need.",
  },
  {
    q: "Which bhawans are supported?",
    a: "HostelHub currently supports all 5 major bhawans at IIT Roorkee: Ravindra, Govind, Cautley, Rajendra, and Sarojini. We're expanding to more bhawans based on demand.",
  },
  {
    q: "How does HostelHub handle complaint routing?",
    a: "When a student files a complaint, it's automatically routed to the right secretary based on category (mess, maintenance, technical, etc.). Secretaries can update status, and students get real-time notifications on progress.",
  },
  {
    q: "What support channels do you offer?",
    a: "For support, email support@hostelhub.app. Your wardens and secretaries are the first line of support, and the HostelHub team handles platform issues within 24 hours.",
  },
];

const LEGAL_CONTENT: Record<
  LegalKind,
  { title: string; updated: string; intro: string; sections: LegalSection[] }
> = {
  privacy: {
    title: "Privacy Policy",
    updated: "Last updated: August 1, 2026",
    intro:
      "This policy explains what personal data HostelHub collects when you use hostelhub.app, why we collect it, and the rights you have over it.",
    sections: [
      {
        heading: "1. Data We Collect",
        bullets: [
          "Account data — name, work email, password hash, avatar, and organization membership.",
          "Usage data — feature interactions, deploy events, and aggregated performance metrics tied to your workspace.",
          "Diagnostic data — crash reports, request traces, and error logs retained for 13 months.",
          "Billing data — processed by our PCI-DSS Level 1 payment provider; card numbers never touch our servers.",
        ],
      },
      {
        heading: "2. How We Use Data",
        paras: [
          "We process account data to provide the service (contractual necessity), usage data in aggregate to improve the product (legitimate interest), and communication data only where you have opted in. We do not sell personal data, ever.",
        ],
      },
      {
        heading: "3. Cookies & Tracking",
        bullets: [
          "Essential cookies — session and CSRF protection. Cannot be disabled while using the product.",
          "Analytics cookies (optional) — privacy-friendly, self-hosted, IP-truncated telemetry.",
          "Marketing cookies (optional) — campaign attribution, set only after explicit consent.",
          "We honor Global Privacy Control (GPC) signals automatically.",
        ],
      },
      {
        heading: "4. Your Rights",
        paras: [
          "Under GDPR and similar regimes (CCPA/CPRA, UK GDPR) you may exercise access, rectification, erasure, restriction, portability, and objection rights at any time:",
        ],
        bullets: [
          "Self-serve export and deletion from Settings → Workspace → Danger Zone.",
          "Email legal@hostelhub.app — we respond within 30 days, usually within 3 business days.",
          "You may lodge a complaint with your supervisory authority at any time.",
        ],
      },
      {
        heading: "5. Retention & Security",
        paras: [
          "Workspace data is retained while your subscription is active plus a 30-day grace period, then irreversibly purged from primary storage, backups included. All data is encrypted at rest (AES-256) and in transit (TLS 1.3); access follows least-privilege with mandatory SSO and hardware keys for staff.",
        ],
      },
      {
        heading: "6. International Transfers & Liability",
        paras: [
          "Transfers outside the EEA rely on Standard Contractual Clauses plus supplementary technical measures. Nothing in this policy limits liability for breaches of applicable data-protection law. Our DPO can be reached at legal@hostelhub.app.",
        ],
      },
    ],
  },
  terms: {
    title: "Terms of Service",
    updated: "Last updated: August 1, 2026",
    intro:
      "These Terms govern your access to and use of HostelHub. By creating an account you agree to them on behalf of yourself as an IIT Roorkee resident.",
    sections: [
      {
        heading: "1. Accounts & Eligibility",
        bullets: [
          "You must be at least 16 years old and able to form a binding contract.",
          "One human or entity per workspace; API tokens are issued per machine, never shared.",
          "You are responsible for activity under your accounts and for keeping credentials secure.",
        ],
      },
      {
        heading: "2. Acceptable Use",
        bullets: [
          "No hosting of malware, phishing infrastructure, or content infringing others' rights.",
          "No load-testing our shared control plane or circumventing rate limits.",
          "No resale of the service as a general-purpose hosting platform without a written agreement.",
        ],
      },
      {
        heading: "3. Subscriptions & Billing",
        paras: [
          "Paid plans renew automatically until cancelled. Upgrades are prorated immediately; downgrades apply at the next cycle. Annual plans cancelled within 14 days of purchase receive a full refund. Overage charges require pre-configured caps.",
        ],
      },
      {
        heading: "4. Intellectual Property",
        paras: [
          "You retain all rights to your code, data and content. We claim no license to it beyond what is technically required to build and host it for you. The HostelHub service, brand and documentation remain our exclusive property.",
        ],
      },
      {
        heading: "5. Disclaimers & Limitation of Liability",
        paras: [
          "The service is provided \u201cas is\u201d except for the obligations stated in the Enterprise SLA. To the maximum extent permitted by law, each party's aggregate liability is capped at the greater of $100 or the fees paid in the 12 months preceding the claim. Neither party is liable for indirect or consequential damages.",
        ],
      },
      {
        heading: "6. Termination & Governing Law",
        paras: [
          "Either party may terminate for material breach unremedied after 30 days' notice. Upon termination you retain export access for 30 days. These Terms are governed by the laws of the State of Delaware, USA, excluding conflict-of-law rules; disputes go to binding arbitration in San Francisco, CA.",
        ],
      },
    ],
  },
};

/* ─────────────────────────────────────────────────────────────────────────── */
/* Tiny presentational atoms                                                   */
/* ─────────────────────────────────────────────────────────────────────────── */

/** Green pulsing status dot. */
function Ping({ className = "" }: { className?: string }) {
  return (
    <span className={`relative flex h-2 w-2 ${className}`} aria-hidden="true">
      <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-60" />
      <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-400" />
    </span>
  );
}

function SectionHeading({
  eyebrow,
  title,
  sub,
}: {
  eyebrow: string;
  title: string;
  sub?: string;
}) {
  return (
    <motion.div
      variants={staggerParent}
      initial="hidden"
      whileInView="show"
      viewport={{ once: true, margin: "-80px" }}
      className="mx-auto mb-12 max-w-2xl text-center sm:mb-16"
    >
      <motion.p
        variants={fadeUp}
        className="text-xs font-bold uppercase tracking-[0.18em] text-emerald-500"
      >
        {eyebrow}
      </motion.p>
      <motion.h2
        variants={fadeUp}
        className="mt-3 text-balance text-3xl font-semibold tracking-tight text-[var(--lp-text)] sm:text-4xl"
      >
        {title}
      </motion.h2>
      {sub && (
        <motion.p
          variants={fadeUp}
          className="mt-4 text-base leading-relaxed text-[var(--lp-muted)]"
        >
          {sub}
        </motion.p>
      )}
    </motion.div>
  );
}

/** Shared modal/drawer shell: spring physics, blurred backdrop, focus trap. */
function Overlay({
  onClose,
  labelledBy,
  maxWidth = "max-w-lg",
  children,
}: {
  onClose: () => void;
  labelledBy: string;
  maxWidth?: string;
  children: ReactNode;
}) {
  const ref = useFocusTrap(true, onClose);
  return (
    <div className="fixed inset-0 z-[80] flex items-end justify-center sm:items-center sm:p-6">
      <motion.div
        className="absolute inset-0 bg-black/60 backdrop-blur-md"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        aria-hidden="true"
      />
      <motion.div
        ref={ref}
        role="dialog"
        aria-modal="true"
        aria-labelledby={labelledBy}
        className={`relative flex max-h-[88vh] w-full ${maxWidth} flex-col overflow-hidden rounded-t-2xl border border-[var(--lp-border)] bg-[var(--lp-surface)] shadow-2xl sm:rounded-2xl`}
        initial={{ opacity: 0, scale: 0.95, y: 24 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 24 }}
        transition={{ type: "spring", stiffness: 320, damping: 28 }}
      >
        {children}
      </motion.div>
    </div>
  );
}

function DialogShell({
  id,
  title,
  onClose,
  wide = false,
  children,
}: {
  id: string;
  title: string;
  onClose: () => void;
  wide?: boolean;
  children: ReactNode;
}) {
  return (
    <Overlay onClose={onClose} labelledBy={id} maxWidth={wide ? "max-w-2xl" : "max-w-lg"}>
      <div className="flex items-start justify-between gap-4 border-b border-[var(--lp-border)] px-5 py-4 sm:px-6">
        <h3 id={id} className="text-lg font-semibold tracking-tight text-[var(--lp-text)]">
          {title}
        </h3>
        <button
          onClick={onClose}
          aria-label="Close dialog"
          className="-mr-1 -mt-1 flex h-10 w-10 shrink-0 items-center justify-center rounded-lg text-[var(--lp-muted)] transition-colors hover:bg-[var(--lp-chip)] hover:text-[var(--lp-text)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-500"
        >
          <X className="size-5" />
        </button>
      </div>
      <div className="flex-1 overflow-y-auto px-5 py-5 sm:px-6">{children}</div>
    </Overlay>
  );
}

/* ─────────────────────────────────────────────────────────────────────────── */
/* Toast host                                                                  */
/* ─────────────────────────────────────────────────────────────────────────── */

const TOAST_ICON: Record<ToastKind, typeof CheckCircle2> = {
  success: CheckCircle2,
  error: XCircle,
  info: Info,
};

const TOAST_ACCENT: Record<ToastKind, string> = {
  success: "text-emerald-400",
  error: "text-rose-400",
  info: "text-sky-400",
};

function ToastHost({ toasts }: { toasts: ToastItem[] }) {
  return (
    <div
      className="pointer-events-none fixed right-4 top-4 z-[90] flex w-[calc(100%-2rem)] max-w-sm flex-col gap-2"
      aria-live="polite"
      role="status"
    >
      <AnimatePresence>
        {toasts.map((t) => {
          const Icon = TOAST_ICON[t.kind];
          return (
            <motion.div
              key={t.id}
              layout
              initial={{ opacity: 0, x: 40, scale: 0.96 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, x: 40, scale: 0.96 }}
              transition={{ type: "spring", stiffness: 380, damping: 30 }}
              className="pointer-events-auto flex items-start gap-3 rounded-xl border border-[var(--lp-border-strong)] bg-[var(--lp-surface)] p-4 shadow-xl"
            >
              <Icon className={`mt-0.5 size-5 shrink-0 ${TOAST_ACCENT[t.kind]}`} />
              <div className="min-w-0">
                <p className="text-sm font-semibold text-[var(--lp-text)]">{t.title}</p>
                {t.desc && (
                  <p className="mt-0.5 text-xs leading-relaxed text-[var(--lp-muted)]">{t.desc}</p>
                )}
              </div>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────────────── */
/* Interactive product mockup (hero visual)                                    */
/* ─────────────────────────────────────────────────────────────────────────── */

const MOCK_TABS = ["Overview", "Latency", "Traffic"] as const;
type MockTab = (typeof MOCK_TABS)[number];

const MOCK_DATA: Record<MockTab, { kpi: string; kpiLabel: string; delta: string; bars: number[] }> = {
  Overview: { kpi: "99.99%", kpiLabel: "Uptime · 30d", delta: "+0.02%", bars: [42, 58, 36, 74, 61, 88, 70, 92, 64, 81, 55, 77] },
  Latency: { kpi: "41ms", kpiLabel: "p99 latency", delta: "−8ms", bars: [66, 48, 72, 38, 54, 44, 60, 35, 50, 41, 47, 39] },
  Traffic: { kpi: "1.8M", kpiLabel: "Requests · 24h", delta: "+12%", bars: [22, 34, 45, 40, 58, 66, 62, 78, 84, 76, 91, 97] },
};

function MockWindow() {
  return (
    <div className="relative overflow-hidden rounded-2xl border border-border bg-card shadow-2xl">
      {/* Window chrome */}
      <div className="flex items-center gap-3 border-b border-border bg-muted/30 px-4 py-3">
        <div className="flex gap-1.5" aria-hidden="true">
          <span className="size-2.5 rounded-full bg-rose-500/80" />
          <span className="size-2.5 rounded-full bg-amber-500/80" />
          <span className="size-2.5 rounded-full bg-emerald-500/80" />
        </div>
        <div className="mx-auto flex items-center gap-1.5 rounded-md border border-border bg-background px-3 py-1 text-[11px] font-medium text-muted-foreground">
          <span aria-hidden>🏛️</span> hostelhub.app/dashboard
        </div>
        <span className="hidden w-14 sm:block" aria-hidden="true" />
      </div>

      <div className="grid gap-0 sm:grid-cols-[132px_1fr]">
        {/* Sidebar */}
        <nav className="hidden flex-col gap-1 border-r border-border p-3 sm:flex" aria-label="Demo navigation">
          {["Overview", "Complaints", "Mess & Diet", "Community", "Passes", "Notices"].map((item, i) => (
            <span
              key={item}
              className={`rounded-md px-2.5 py-1.5 text-[11px] font-medium ${
                i === 1
                  ? "bg-primary/10 text-primary"
                  : "text-muted-foreground"
              }`}
            >
              {item}
            </span>
          ))}
        </nav>

        <div className="p-4 sm:p-5">
          {/* Tabs */}
          <div className="flex items-center justify-between gap-3">
            <div className="flex gap-1 rounded-lg border border-border bg-muted/50 p-1" role="tablist" aria-label="Dashboard tabs">
              {MOCK_TABS.map((t) => (
                <button
                  key={t}
                  role="tab"
                  aria-selected={false}
                  className={`rounded-md px-2.5 py-1 text-[11px] font-semibold transition-colors text-muted-foreground hover:text-foreground`}
                >
                  {t}
                </button>
              ))}
            </div>
            <span className="flex items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-[10px] font-semibold text-emerald-700">
              <Ping /> Live
            </span>
          </div>

          {/* KPI row */}
          <div className="mt-4 grid grid-cols-3 gap-2">
            <div className="rounded-lg border border-amber-200 bg-amber-50 p-3">
              <p className="text-[10px] font-semibold text-amber-800">Open</p>
              <p className="mt-1 font-mono text-lg font-bold tabular-nums text-amber-900">8</p>
            </div>
            <div className="rounded-lg border border-sky-200 bg-sky-50 p-3">
              <p className="text-[10px] font-semibold text-sky-800">In Progress</p>
              <p className="mt-1 font-mono text-lg font-bold tabular-nums text-sky-900">4</p>
            </div>
            <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-3">
              <p className="text-[10px] font-semibold text-emerald-800">Resolved</p>
              <p className="mt-1 font-mono text-lg font-bold tabular-nums text-emerald-900">23</p>
            </div>
          </div>

          {/* Complaint list preview */}
          <div className="mt-3 space-y-1.5">
            {[
              { title: "Leaking pipe in Block C", cat: "Maintenance", status: "In Progress" },
              { title: "WiFi router down", cat: "Technical", status: "Pending" },
              { title: "Mess food quality", cat: "Mess", status: "Resolved" },
            ].map((c, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 + i * 0.08 }}
                className="flex items-center justify-between gap-2 rounded-lg border border-border/60 bg-background px-3 py-2"
              >
                <div className="min-w-0">
                  <p className="truncate text-xs font-medium text-foreground">{c.title}</p>
                  <p className="text-[10px] text-muted-foreground">{c.cat}</p>
                </div>
                <span className={`shrink-0 rounded-full px-2 py-0.5 text-[9px] font-semibold ${
                  c.status === "Resolved" ? "bg-emerald-100 text-emerald-700" :
                  c.status === "In Progress" ? "bg-sky-100 text-sky-700" :
                  "bg-amber-100 text-amber-700"
                }`}>{c.status}</span>
              </motion.div>
            ))}
          </div>
        </div>
      </div>

      {/* Floating notification */}
      <motion.div
        className="absolute -right-3 top-20 hidden rounded-xl border border-border bg-card p-3 shadow-xl md:block lg:-right-8"
        animate={{ y: [0, -10, 0] }}
        transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
        aria-hidden="true"
      >
        <p className="flex items-center gap-2 text-xs font-semibold text-foreground">
          <CheckCircle2 className="size-4 text-emerald-500" /> Complaint Resolved
        </p>
        <p className="mt-0.5 pl-6 text-[11px] text-muted-foreground">Mess menu updated · Ravindra</p>
      </motion.div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────────────── */
/* Header + mobile sheet                                                       */
/* ─────────────────────────────────────────────────────────────────────────── */

function scrollToId(id: string) {
  document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
}

function LogoMark() {
  return (
    <span className="flex size-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
      🏛️
    </span>
  );
}

function Header(props: {
  onOpenMobile: () => void;
  onContact: () => void;
  activeId: string;
}) {
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={`fixed inset-x-0 top-0 z-50 border-b transition-all duration-300 ${
        scrolled
          ? "border-[var(--lp-border)] bg-[var(--lp-glass)] shadow-lg backdrop-blur-xl"
          : "border-transparent bg-transparent"
      }`}
    >
      <nav className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4 sm:px-6" aria-label="Main navigation">
        <button
          onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
          className="flex min-h-11 items-center gap-2.5 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-primary"
          aria-label={`${BRAND} home`}
        >
          <LogoMark />
          <span className="text-[17px] font-semibold tracking-tight text-foreground" style={{ fontFamily: "Lora, serif" }}>{BRAND}</span>
        </button>

        <ul className="hidden items-center gap-1 md:flex">
          {NAV_LINKS.map((l) => (
            <li key={l.id}>
              <button
                onClick={() => scrollToId(l.id)}
                aria-current={props.activeId === l.id ? "true" : undefined}
                className={`relative rounded-lg px-3.5 py-2 text-sm font-medium transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-500 ${
                  props.activeId === l.id
                    ? "text-[var(--lp-text)]"
                    : "text-[var(--lp-muted)] hover:text-[var(--lp-text)]"
                }`}
              >
                {l.label}
                {props.activeId === l.id && (
                  <motion.span
                    layoutId="nav-underline"
                    className="absolute inset-x-3 -bottom-0.5 h-0.5 rounded-full bg-emerald-500"
                    transition={{ type: "spring", stiffness: 380, damping: 32 }}
                  />
                )}
              </button>
            </li>
          ))}
        </ul>

        <div className="flex items-center gap-2">
          <button
            onClick={props.onContact}
            className="hidden min-h-11 items-center rounded-lg px-3.5 text-sm font-medium text-[var(--lp-muted)] transition-colors hover:text-[var(--lp-text)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-500 sm:flex"
          >
            Contact Sales
          </button>
          <motion.a
            href="/auth"
            whileTap={{ scale: 0.98 }}
            className="hidden min-h-10 items-center gap-1.5 rounded-full bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground shadow-md transition-colors hover:bg-primary/90 md:flex"
          >
            Sign In <ArrowRight className="size-4" />
          </motion.a>

          <button
            onClick={props.onOpenMobile}
            aria-label="Open menu"
            aria-expanded="false"
            className="flex h-11 w-11 items-center justify-center rounded-lg text-[var(--lp-text)] transition-colors hover:bg-[var(--lp-chip)] md:hidden"
          >
            <Menu className="size-5" />
          </button>
        </div>
      </nav>

    </header>
  );
}

function MobileSheet({
  open,
  onClose,
  theme,
  onToggleTheme,
  onContact,
  onLegal,
}: {
  open: boolean;
  onClose: () => void;
  theme: Theme;
  onToggleTheme: () => void;
  onContact: () => void;
  onLegal: (k: LegalKind) => void;
}) {
  const ref = useFocusTrap(open, onClose);
  useScrollLock(open);

  const nav = (id: string) => {
    onClose();
    // Wait for sheet exit before scrolling so layout is stable.
    window.setTimeout(() => scrollToId(id), 180);
  };

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-[70] md:hidden">
          <motion.div
            className="absolute inset-0 bg-black/60 backdrop-blur-md"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={onClose}
            aria-hidden="true"
          />
          <motion.aside
            ref={ref}
            role="dialog"
            aria-modal="true"
            aria-label="Mobile menu"
            className="absolute inset-y-0 right-0 flex w-[85vw] max-w-sm flex-col border-l border-[var(--lp-border)] bg-[var(--lp-surface)] shadow-2xl"
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", stiffness: 320, damping: 32 }}
          >
            <div className="flex items-center justify-between border-b border-[var(--lp-border)] px-4 py-4">
              <span className="flex items-center gap-2.5">
                <LogoMark />
                <span className="font-semibold tracking-tight text-[var(--lp-text)]">{BRAND}</span>
              </span>
              <button
                onClick={onClose}
                aria-label="Close menu"
                className="flex h-11 w-11 items-center justify-center rounded-lg text-[var(--lp-muted)] hover:bg-[var(--lp-chip)] hover:text-[var(--lp-text)]"
              >
                <X className="size-5" />
              </button>
            </div>

            <nav className="flex-1 overflow-y-auto p-4" aria-label="Mobile navigation">
              <ul className="space-y-1">
                {NAV_LINKS.map((l) => (
                  <li key={l.id}>
                    <button
                      onClick={() => nav(l.id)}
                      className="flex min-h-11 w-full items-center justify-between rounded-lg px-3 text-left text-[15px] font-medium text-[var(--lp-text)] hover:bg-[var(--lp-chip)]"
                    >
                      {l.label} <ArrowUpRight className="size-4 text-[var(--lp-muted)]" />
                    </button>
                  </li>
                ))}
              </ul>

              <p className="px-3 pb-1 pt-5 text-[11px] font-bold uppercase tracking-widest text-[var(--lp-muted)]">Legal</p>
              <ul className="space-y-1">
                <li>
                  <button onClick={() => { onClose(); onLegal("privacy"); }} className="min-h-11 w-full rounded-lg px-3 text-left text-sm text-[var(--lp-muted)] hover:bg-[var(--lp-chip)] hover:text-[var(--lp-text)]">
                    Privacy Policy
                  </button>
                </li>
                <li>
                  <button onClick={() => { onClose(); onLegal("terms"); }} className="min-h-11 w-full rounded-lg px-3 text-left text-sm text-[var(--lp-muted)] hover:bg-[var(--lp-chip)] hover:text-[var(--lp-text)]">
                    Terms of Service
                  </button>
                </li>
              </ul>

              <p className="px-3 pb-1 pt-5 text-[11px] font-bold uppercase tracking-widest text-[var(--lp-muted)]">Appearance</p>
              <button
                onClick={onToggleTheme}
                role="switch"
                aria-checked={theme === "dark"}
                className="flex min-h-11 w-full items-center justify-between rounded-lg px-3 text-sm font-medium text-[var(--lp-text)] hover:bg-[var(--lp-chip)]"
              >
                <span className="flex items-center gap-2.5">
                  {theme === "dark" ? <Moon className="size-4" /> : <Sun className="size-4" />}
                  {theme === "dark" ? "Dark mode" : "Light mode"}
                </span>
                <span className={`flex h-6 w-11 items-center rounded-full p-0.5 transition-colors ${theme === "dark" ? "bg-emerald-500 justify-end" : "bg-[var(--lp-border-strong)] justify-start"}`}>
                  <span className="size-5 rounded-full bg-white shadow" />
                </span>
              </button>
            </nav>

            <div className="space-y-2 border-t border-[var(--lp-border)] p-4 pb-[calc(1rem+env(safe-area-inset-bottom))]">
              <button onClick={() => { onClose(); onContact(); }} className="min-h-11 w-full rounded-lg border border-[var(--lp-border-strong)] px-4 text-sm font-semibold text-[var(--lp-text)] hover:bg-[var(--lp-chip)]">
                Contact Sales
              </button>
              <motion.a
                href="/auth"
                whileTap={{ scale: 0.98 }}
                className="flex min-h-11 w-full items-center justify-center gap-1.5 rounded-lg bg-emerald-500 px-4 text-sm font-semibold text-emerald-950 shadow-md shadow-emerald-500/25 hover:bg-emerald-400"
              >
                Get Started <ArrowRight className="size-4" />
              </motion.a>
            </div>
          </motion.aside>
        </div>
      )}
    </AnimatePresence>
  );
}

/* ─────────────────────────────────────────────────────────────────────────── */
/* Page sections                                                               */
/* ─────────────────────────────────────────────────────────────────────────── */

function Hero({ onContact }: { onContact: () => void }) {
  const headlineGradient =
    "bg-gradient-to-r from-primary via-primary/90 to-amber-700 bg-clip-text text-transparent";

  return (
    <section className="relative overflow-hidden pt-28 sm:pt-36">
      {/* Ambient background glows */}
      <div className="pointer-events-none absolute inset-0 -z-10" aria-hidden="true">
        <div className="absolute left-1/2 top-[-240px] h-[480px] w-[720px] -translate-x-1/2 rounded-full bg-emerald-500/[0.07] blur-3xl" />
        <div className="absolute right-[-120px] top-40 h-72 w-72 rounded-full bg-teal-500/[0.05] blur-3xl" />
      </div>

      <motion.div
        variants={staggerParent}
        initial="hidden"
        animate="show"
        className="mx-auto max-w-4xl px-4 text-center sm:px-6"
      >
        <motion.button
          variants={fadeUp}
          onClick={() => scrollToId("features")}
          className="group inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 py-1.5 pl-2 pr-3.5 text-xs font-semibold text-primary transition-colors hover:border-primary/50"
        >
          <span className="flex items-center gap-1 rounded-full bg-primary px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-primary-foreground">
            IIT Roorkee
          </span>
          Trusted by 5 bhawans · 2000+ residents
          <ArrowRight className="size-3.5 transition-transform group-hover:translate-x-0.5" />
        </motion.button>

        <motion.h1
          variants={fadeUp}
          className="mt-6 text-balance text-4xl font-semibold leading-[1.08] tracking-tight text-[var(--lp-text)] sm:text-6xl lg:text-7xl"
        >
          One platform for your{" "}
          <span className={headlineGradient}>hostel life</span>.
        </motion.h1>

        <motion.p
          variants={fadeUp}
          className="mx-auto mt-6 max-w-2xl text-pretty text-base leading-relaxed text-[var(--lp-muted)] sm:text-lg"
        >
          {BRAND} replaces WhatsApp groups and paper workflows with accountable
          complaint routing, mess management, digital passes, and community boards
          — built exclusively for IIT Roorkee residents.
        </motion.p>

        <motion.div variants={fadeUp} className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <motion.a
            href="/auth"
            whileHover={{ y: -2 }}
            whileTap={{ scale: 0.98 }}
            className="flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-emerald-500 px-6 text-sm font-semibold text-emerald-950 shadow-lg shadow-emerald-500/30 transition-colors hover:bg-emerald-400 sm:w-auto"
          >
            Sign in with IITR email <ArrowRight className="size-4" />
          </motion.a>
          <motion.button
            onClick={onContact}
            whileHover={{ y: -2 }}
            whileTap={{ scale: 0.98 }}
            className="flex min-h-12 w-full items-center justify-center gap-2 rounded-xl border border-[var(--lp-border-strong)] bg-[var(--lp-chip)] px-6 text-sm font-semibold text-[var(--lp-text)] transition-colors hover:bg-[var(--lp-surface-2)] sm:w-auto"
          >
            See what's inside
          </motion.button>
        </motion.div>

        <motion.p variants={fadeUp} className="mt-4 text-xs text-[var(--lp-muted)]">
          Only @iitr.ac.in emails · Google or email OTP sign-in · No passwords needed
        </motion.p>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.35, duration: 0.7, ease: "easeOut" }}
        className="mx-auto mt-14 max-w-4xl px-4 sm:mt-16 sm:px-6"
      >
        <MockWindow />
      </motion.div>
    </section>
  );
}

function ProofBar() {
  return (
    <section className="border-y border-[var(--lp-border)] bg-[var(--lp-bg-soft)] py-10 sm:py-12" aria-label="Customers and compliance">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <p className="text-center text-[11px] font-bold uppercase tracking-[0.18em] text-[var(--lp-muted)]">
          Managing hostel operations across
        </p>
        <motion.div
          variants={staggerParent}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true }}
          className="mt-6 flex flex-wrap items-center justify-center gap-4"
        >
          {BHAWANS.map((name) => (
            <motion.div
              key={name}
              variants={fadeUp}
              className="flex items-center gap-2 rounded-full border border-border bg-card px-4 py-2 text-sm font-semibold text-foreground"
            >
              <Building2 className="size-4 text-primary" /> {name}
            </motion.div>
          ))}
        </motion.div>

        <motion.ul
          variants={staggerParent}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true }}
          className="mt-6 flex flex-wrap items-center justify-center gap-2.5"
          aria-label="Security features"
        >
          {[
            { icon: ShieldCheck, label: "Institute-only access" },
            { icon: Users, label: "Role-based access" },
            { icon: CheckCircle2, label: "99.9% uptime" },
          ].map(({ icon: Icon, label }) => (
            <motion.li
              key={label}
              variants={fadeUp}
              className="flex items-center gap-2 rounded-full border border-border bg-card px-3.5 py-2 text-xs font-semibold text-foreground"
            >
              <Icon className="size-4 text-primary" /> {label}
            </motion.li>
          ))}
        </motion.ul>
      </div>
    </section>
  );
}

function Chip({ children }: { children: ReactNode }) {
  return (
    <span className="inline-flex items-center gap-1 rounded-full border border-[var(--lp-border)] bg-[var(--lp-chip)] px-2.5 py-1 font-mono text-[10px] font-semibold text-[var(--lp-muted)]">
      {children}
    </span>
  );
}

function BentoGrid() {
  const cardBase =
    "group relative flex flex-col rounded-2xl border border-[var(--lp-border)] bg-[var(--lp-surface)] p-5 transition-colors duration-300 hover:border-emerald-500/40 hover:bg-[var(--lp-surface-2)] sm:p-6";

  return (
    <section id="features" className="scroll-mt-24 py-20 sm:py-28" aria-label="Features">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <SectionHeading
          eyebrow="Features"
          title="Everything your hostel needs — one platform"
          sub="Six core modules built for IIT Roorkee hostel management. Built for residents, designed for accountability."
        />

        <motion.div
          variants={staggerParent}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: "-60px" }}
          className="grid grid-cols-1 gap-4 md:grid-cols-6"
        >
          {/* 1 — Realtime pipelines (wide) */}
          <motion.article variants={fadeUp} whileHover={{ y: -4 }} className={`${cardBase} md:col-span-4`}>
            <div className="mb-3 flex size-10 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-500">
              <Activity className="size-5" />
            </div>
            <h3 className="text-lg font-semibold tracking-tight text-[var(--lp-text)]">Realtime pipelines</h3>
            <p className="mt-1.5 max-w-md text-sm leading-relaxed text-[var(--lp-muted)]">
              Builds, tests and deploys stream to every teammate live — no refresh, no
              dashboard babysitting. Average time-to-production across customers:
            </p>
            <div className="mt-4 flex items-end justify-between gap-4">
              <span className="font-mono text-3xl font-bold tabular-nums text-[var(--lp-text)]">38<span className="text-base text-[var(--lp-muted)]">s avg</span></span>
              <div className="flex h-12 flex-1 max-w-[220px] items-end gap-1" aria-hidden="true">
                {[35, 55, 42, 68, 50, 75, 60, 82, 66, 88].map((v, i) => (
                  <span key={i} className="w-full rounded-sm bg-gradient-to-t from-emerald-600/50 to-emerald-400/80" style={{ height: `${v}%` }} />
                ))}
              </div>
            </div>
          </motion.article>

          {/* 2 — Security-first */}
          <motion.article variants={fadeUp} whileHover={{ y: -4 }} className={`${cardBase} md:col-span-2`}>
            <div className="mb-3 flex size-10 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-500">
              <ShieldCheck className="size-5" />
            </div>
            <h3 className="text-lg font-semibold tracking-tight text-[var(--lp-text)]">Security-first by default</h3>
            <p className="mt-1.5 text-sm leading-relaxed text-[var(--lp-muted)]">
              SSO/SAML, SCIM and immutable audit logs on every paid plan — not gated behind enterprise.
            </p>
            <div className="mt-4 flex flex-wrap gap-1.5">
              <Chip><ShieldCheck className="size-3 text-emerald-500" /> Secure</Chip>
              <Chip><Users className="size-3 text-emerald-500" /> Role-based</Chip>
              <Chip><BadgeCheck className="size-3 text-emerald-500" /> ISO 27001</Chip>
            </div>
          </motion.article>

          {/* 3 — Edge runtime */}
          <motion.article variants={fadeUp} whileHover={{ y: -4 }} className={`${cardBase} md:col-span-2`}>
            <div className="mb-3 flex size-10 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-500">
              <Zap className="size-5" />
            </div>
            <h3 className="text-lg font-semibold tracking-tight text-[var(--lp-text)]">Edge-native runtime</h3>
            <p className="mt-1.5 text-sm leading-relaxed text-[var(--lp-muted)]">
              Isolate-per-request execution with sub-50ms cold starts worldwide.
            </p>
            <div className="mt-4 flex flex-wrap gap-1.5">
              {["iad", "fra", "sin", "gru"].map((r) => <Chip key={r}>{r}</Chip>)}
            </div>
          </motion.article>

          {/* 4 — Observability */}
          <motion.article variants={fadeUp} whileHover={{ y: -4 }} className={`${cardBase} md:col-span-2`}>
            <div className="mb-3 flex size-10 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-500">
              <BarChart3 className="size-5" />
            </div>
            <h3 className="text-lg font-semibold tracking-tight text-[var(--lp-text)]">Observability included</h3>
            <p className="mt-1.5 text-sm leading-relaxed text-[var(--lp-muted)]">
              Traces, structured logs and red-flag metrics with 13-month retention.
            </p>
            <p className="mt-4 font-mono text-2xl font-bold tabular-nums text-[var(--lp-text)]">
              p99 <span className="text-emerald-500">41ms</span>
            </p>
          </motion.article>

          {/* 5 — Git-native */}
          <motion.article variants={fadeUp} whileHover={{ y: -4 }} className={`${cardBase} md:col-span-2`}>
            <div className="mb-3 flex size-10 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-500">
              <GitBranch className="size-5" />
            </div>
            <h3 className="text-lg font-semibold tracking-tight text-[var(--lp-text)]">Git-native previews</h3>
            <p className="mt-1.5 text-sm leading-relaxed text-[var(--lp-muted)]">
              Every branch gets an isolated, production-parity preview URL instantly.
            </p>
            <div className="mt-4 flex items-center gap-2 rounded-lg border border-[var(--lp-border)] bg-[var(--lp-chip)] px-2.5 py-2">
              <Github className="size-3.5 shrink-0 text-[var(--lp-muted)]" />
              <span className="truncate font-mono text-[11px] text-[var(--lp-text)]">feat/billing-v2</span>
              <CheckCircle2 className="ml-auto size-3.5 shrink-0 text-emerald-500" />
            </div>
          </motion.article>

          {/* 6 — Team flow (wide) */}
          <motion.article variants={fadeUp} whileHover={{ y: -4 }} className={`${cardBase} md:col-span-4`}>
            <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
              <div className="flex-1">
                <div className="mb-3 flex size-10 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-500">
                  <Users className="size-5" />
                </div>
                <h3 className="text-lg font-semibold tracking-tight text-[var(--lp-text)]">Built for team flow</h3>
                <p className="mt-1.5 max-w-sm text-sm leading-relaxed text-[var(--lp-muted)]">
                  Role-based access, review gates, and Slack-native approvals — deploys become
                  a team sport instead of a single point of failure.
                </p>
              </div>
              <div className="grid shrink-0 grid-cols-3 gap-2 text-center">
                {[["RBAC", "8 roles"], ["Gates", "any step"], ["Slack", "native"]].map(([k, v]) => (
                  <div key={k} className="rounded-xl border border-[var(--lp-border)] bg-[var(--lp-chip)] px-3 py-2.5">
                    <p className="text-xs font-bold text-[var(--lp-text)]">{k}</p>
                    <p className="mt-0.5 text-[10px] text-[var(--lp-muted)]">{v}</p>
                  </div>
                ))}
              </div>
            </div>
          </motion.article>
        </motion.div>
      </div>
    </section>
  );
}

function AboutSpotlight() {
  return (
    <section id="about" className="scroll-mt-24 border-y border-[var(--lp-border)] bg-[var(--lp-bg-soft)] py-20 sm:py-28" aria-label="About us">
      <div className="mx-auto grid max-w-6xl items-center gap-12 px-4 sm:px-6 lg:grid-cols-2 lg:gap-16">
        <motion.div
          variants={staggerParent}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: "-80px" }}
        >
          <motion.p variants={fadeUp} className="text-xs font-bold uppercase tracking-[0.18em] text-emerald-500">
            Our mission
          </motion.p>
          <motion.h2 variants={fadeUp} className="mt-3 text-balance text-3xl font-semibold tracking-tight text-[var(--lp-text)] sm:text-4xl">
            Built by IITR residents, for IITR residents.
          </motion.h2>
          <motion.p variants={fadeUp} className="mt-5 leading-relaxed text-[var(--lp-muted)]">
            HostelHub was created to solve the real problems of hostel life —
            lost complaints, missed mess updates, and scattered communication.
            We replaced WhatsApp groups and paper forms with a single, accountable platform.
          </motion.p>

          <motion.ul variants={fadeUp} className="mt-6 space-y-4">
            {[
              {
                icon: ShieldCheck,
                title: "Institute-only security",
                body: "Restricted to @iitr.ac.in emails. Role-based access ensures students, secretaries, and wardens see only what they need.",
              },
              {
                icon: Bell,
                title: "Real-time accountability",
                body: "Every complaint has a clear owner, status pipeline, and timeline. Wardens get oversight dashboards with overdue alerts.",
              },
              {
                icon: ThumbsUp,
                title: "Community-driven",
                body: "Reddit-style community boards let residents post suggestions, vote, and get warden feedback on issues that matter.",
              },
            ].map(({ icon: Icon, title, body }) => (
              <li key={title} className="flex gap-3.5">
                <span className="mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-lg border border-[var(--lp-border)] bg-[var(--lp-surface)] text-emerald-500">
                  <Icon className="size-4" />
                </span>
                <div>
                  <p className="text-sm font-semibold text-[var(--lp-text)]">{title}</p>
                  <p className="mt-1 text-sm leading-relaxed text-[var(--lp-muted)]">{body}</p>
                </div>
              </li>
            ))}
          </motion.ul>
        </motion.div>

        {/* Terminal card */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="overflow-hidden rounded-2xl border border-[var(--lp-border-strong)] bg-[#0b0b0e] shadow-2xl"
          aria-label="Terminal demo"
        >
          <div className="flex items-center gap-2 border-b border-white/10 px-4 py-3">
            <Terminal className="size-4 text-emerald-400" />
            <span className="font-mono text-xs text-zinc-400">hostelhub — zsh</span>
          </div>
          <div className="space-y-2 p-5 font-mono text-[13px] leading-relaxed">
            <p><span className="text-emerald-400">$</span> <span className="text-zinc-200">npx hostelhub init</span></p>
            <p className="text-zinc-500">✔ Linked to acme/checkout</p>
            <p className="text-zinc-500">✔ Regions: iad, fra, sin, gru</p>
            <p className="text-zinc-500">✔ Secrets pulled from vault (read-only)</p>
            <p>
              <span className="text-emerald-400">$</span>{" "}
              <span className="text-zinc-200">hostelhub deploy --prod</span>
              <motion.span
                className="ml-1 inline-block h-4 w-2 translate-y-0.5 bg-emerald-400"
                animate={{ opacity: [1, 0, 1] }}
                transition={{ duration: 1.1, repeat: Infinity }}
                aria-hidden="true"
              />
            </p>
            <p className="text-emerald-400">● Build completed in 38s — live worldwide</p>
          </div>
        </motion.div>
      </div>
    </section>
  );
}

function PricingSection({ onSelectPlan }: { onSelectPlan: (plan: string) => void }) {
  // HostelHub is free for all IITR residents
  const tiers = [
    {
      name: "Student",
      price: "Free",
      blurb: "For all IITR residents.",
      cta: "Sign in",
      featured: true,
      features: ["File & track complaints", "Request sick meals", "Apply for gate passes", "Community boards", "Notice board"],
    },
    {
      name: "Secretary",
      price: "Free",
      blurb: "For hostel committee members.",
      cta: "Sign in",
      featured: false,
      features: ["Triage routed complaints", "Quick status updates", "Manage mess menus", "Moderate community", "Sick diet pipeline"],
    },
    {
      name: "Warden",
      price: "Free",
      blurb: "For hostel administration.",
      cta: "Sign in",
      featured: false,
      features: ["Oversight dashboard", "Approve passes & rebates", "Reassign complaints", "Manage roles & users", "Group chat"],
    },
  ];

  return (
    <section id="pricing" className="scroll-mt-24 py-20 sm:py-28" aria-label="Pricing">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <SectionHeading
          eyebrow="Access"
          title="Free for every IITR resident"
          sub="All features are available to students, secretaries, and wardens. Sign in with your institute email."
        />

        <div className="mb-10 flex items-center justify-center gap-3">
          <span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">No credit card required · Institute email only</span>
        </div>

        <motion.div
          variants={staggerParent}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: "-60px" }}
          className="grid gap-5 md:grid-cols-3"
        >
          {tiers.map((tier) => (
            <motion.article
              key={tier.name}
              variants={fadeUp}
              whileHover={{ y: -4 }}
              className={`relative flex flex-col rounded-2xl border p-6 transition-colors ${
                tier.featured
                  ? "border-emerald-500/50 bg-gradient-to-b from-emerald-500/[0.08] to-transparent shadow-lg shadow-emerald-500/5"
                  : "border-[var(--lp-border)] bg-[var(--lp-surface)] hover:border-[var(--lp-border-strong)]"
              }`}
            >
              {tier.featured && (
                <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-emerald-500 px-3 py-1 text-[10px] font-bold uppercase tracking-wide text-emerald-950 shadow-md">
                  Most popular
                </span>
              )}
              <h3 className="text-sm font-bold uppercase tracking-widest text-[var(--lp-muted)]">{tier.name}</h3>

              <div className="mt-4 flex min-h-14 items-baseline gap-1.5">
                {tier.price === "Custom" ? (
                  <span className="text-4xl font-semibold tracking-tight text-[var(--lp-text)]">Custom</span>
                ) : (
                  <span className="text-4xl font-semibold tracking-tight text-[var(--lp-text)]">{tier.price}</span>
                )}
              </div>

              <p className="mt-2 text-sm text-[var(--lp-muted)]">{tier.blurb}</p>

              <ul className="mt-6 flex-1 space-y-2.5" aria-label={`${tier.name} plan features`}>
                {tier.features.map((f) => (
                  <li key={f} className="flex items-start gap-2.5 text-sm text-[var(--lp-text)]">
                    <Check className="mt-0.5 size-4 shrink-0 text-emerald-500" /> {f}
                  </li>
                ))}
              </ul>

              <motion.button
                whileTap={{ scale: 0.98 }}
                onClick={() => onSelectPlan(tier.name)}
                className={`mt-7 flex min-h-11 items-center justify-center gap-1.5 rounded-xl px-4 text-sm font-semibold transition-colors ${
                  tier.featured
                    ? "bg-emerald-500 text-emerald-950 shadow-md shadow-emerald-500/25 hover:bg-emerald-400"
                    : "border border-[var(--lp-border-strong)] text-[var(--lp-text)] hover:bg-[var(--lp-chip)]"
                }`}
              >
                {tier.cta}
                {tier.name === "Enterprise" && <ArrowUpRight className="size-4" />}
              </motion.button>
            </motion.article>
          ))}
        </motion.div>
      </div>
    </section>
  );
}

function FaqSection() {
  const [openIdx, setOpenIdx] = useState<number | null>(0);

  return (
    <section id="faq" className="scroll-mt-24 border-t border-[var(--lp-border)] bg-[var(--lp-bg-soft)] py-20 sm:py-28" aria-label="Frequently asked questions">
      <div className="mx-auto max-w-3xl px-4 sm:px-6">
        <SectionHeading
          eyebrow="FAQ"
          title="Answers, before you ask"
          sub="Security, residency, migrations and money — the questions procurement actually sends."
        />
        <motion.div
          variants={staggerParent}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: "-40px" }}
          className="space-y-3"
        >
          {FAQ_ITEMS.map((item, i) => {
            const open = openIdx === i;
            return (
              <motion.div
                key={item.q}
                variants={fadeUp}
                className="overflow-hidden rounded-xl border border-[var(--lp-border)] bg-[var(--lp-surface)] transition-colors hover:border-[var(--lp-border-strong)]"
              >
                <button
                  onClick={() => setOpenIdx(open ? null : i)}
                  aria-expanded={open}
                  aria-controls={`faq-panel-${i}`}
                  className="flex min-h-11 w-full items-center justify-between gap-4 px-5 py-4 text-left"
                >
                  <span className="text-sm font-semibold text-[var(--lp-text)] sm:text-[15px]">{item.q}</span>
                  <motion.span
                    animate={{ rotate: open ? 180 : 0 }}
                    transition={{ duration: 0.25 }}
                    className={`shrink-0 ${open ? "text-emerald-500" : "text-[var(--lp-muted)]"}`}
                  >
                    <ChevronDown className="size-5" />
                  </motion.span>
                </button>
                <AnimatePresence initial={false}>
                  {open && (
                    <motion.div
                      id={`faq-panel-${i}`}
                      key="content"
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.28, ease: "easeInOut" }}
                      className="overflow-hidden"
                    >
                      <p className="px-5 pb-5 text-sm leading-relaxed text-[var(--lp-muted)]">{item.a}</p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            );
          })}
        </motion.div>
      </div>
    </section>
  );
}

function NewsletterBand({ notify }: { notify: (kind: ToastKind, title: string, desc?: string) => void }) {
  const [email, setEmail] = useState("");
  const [consent, setConsent] = useState(false);
  const [sending, setSending] = useState(false);

  const submit = (e: FormEvent) => {
    e.preventDefault();
    if (!/^\S+@\S+\.\S{2,}$/.test(email)) {
      notify("error", "Enter a valid email address");
      return;
    }
    if (!consent) {
      notify("error", "Consent required", "Please agree to receive updates per the Privacy Policy.");
      return;
    }
    setSending(true);
    window.setTimeout(() => {
      setSending(false);
      setEmail("");
      setConsent(false);
      notify("success", "You're subscribed", "First changelog lands next Tuesday.");
    }, 800);
  };

  return (
    <section className="py-20 sm:py-24" aria-label="Newsletter">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-60px" }}
          transition={{ duration: 0.6 }}
          className="relative overflow-hidden rounded-3xl border border-emerald-500/25 bg-gradient-to-br from-emerald-500/[0.10] via-transparent to-teal-500/[0.06] p-8 sm:p-12"
        >
          <div className="pointer-events-none absolute -right-20 -top-20 size-64 rounded-full bg-emerald-500/10 blur-3xl" aria-hidden="true" />
          <div className="relative mx-auto max-w-xl text-center">
            <h2 className="text-balance text-2xl font-semibold tracking-tight text-[var(--lp-text)] sm:text-3xl">
              Changelog in your inbox. No noise.
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-[var(--lp-muted)]">
              One email every two weeks: shipped features, benchmarks, and postmortems.
              Unsubscribe anytime.
            </p>
            <form onSubmit={submit} className="mt-6 space-y-3 text-left" noValidate>
              <div className="flex flex-col gap-2 sm:flex-row">
                <label htmlFor="nl-email" className="sr-only">Work email</label>
                <div className="relative flex-1">
                  <Mail className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-[var(--lp-muted)]" />
                  <input
                    id="nl-email"
                    type="email"
                    autoComplete="email"
                    placeholder="you@company.com"
                    value={email}
                    onChange={(e: ChangeEvent<HTMLInputElement>) => setEmail(e.target.value)}
                    className="min-h-12 w-full rounded-xl border border-[var(--lp-border-strong)] bg-[var(--lp-surface)] pl-10 pr-4 text-base text-[var(--lp-text)] placeholder:text-[var(--lp-muted)] focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-[var(--lp-ring)]"
                  />
                </div>
                <motion.button
                  whileTap={{ scale: 0.98 }}
                  type="submit"
                  disabled={sending}
                  className="flex min-h-12 items-center justify-center gap-2 rounded-xl bg-emerald-500 px-6 text-sm font-semibold text-emerald-950 shadow-md shadow-emerald-500/25 transition-colors hover:bg-emerald-400 disabled:opacity-60"
                >
                  {sending ? <Loader2 className="size-4 animate-spin" /> : <Send className="size-4" />}
                  Subscribe
                </motion.button>
              </div>
              <label className="flex cursor-pointer items-start gap-2.5 text-xs leading-relaxed text-[var(--lp-muted)]">
                <input
                  type="checkbox"
                  checked={consent}
                  onChange={(e: ChangeEvent<HTMLInputElement>) => setConsent(e.target.checked)}
                  className="mt-0.5 size-4 shrink-0 accent-emerald-500"
                />
                I agree to receive product updates according to the{" "}
                <span className="underline decoration-dotted underline-offset-2">Privacy Policy</span>.
              </label>
            </form>
          </div>
        </motion.div>
      </div>
    </section>
  );
}

/* ─────────────────────────────────────────────────────────────────────────── */
/* Footer                                                                      */
/* ─────────────────────────────────────────────────────────────────────────── */

interface FootLink {
  label: string;
  badge?: string;
  action: () => void;
}

function FootColumn({ title, links }: { title: string; links: FootLink[] }) {
  return (
    <div>
      <p className="text-[11px] font-bold uppercase tracking-widest text-[var(--lp-muted)]">{title}</p>
      <ul className="mt-4 space-y-1">
        {links.map((l) => (
          <li key={l.label}>
            <button
              onClick={l.action}
              className="group flex min-h-9 items-center gap-2 rounded-md px-1 py-1.5 text-left text-sm text-[var(--lp-muted)] transition-colors hover:text-[var(--lp-text)]"
            >
              {l.label}
              {l.badge && (
                <span className="rounded-full bg-emerald-500/15 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide text-emerald-500">
                  {l.badge}
                </span>
              )}
              <ArrowUpRight className="size-3.5 opacity-0 transition-opacity group-hover:opacity-100" />
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}

function RegionSelect({ notify }: { notify: (kind: ToastKind, title: string, desc?: string) => void }) {
  const [open, setOpen] = useState(false);
  const [region, setRegion] = useState(REGIONS[0]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open]);

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="listbox"
        aria-expanded={open}
        className="flex min-h-9 w-full items-center gap-2 rounded-lg border border-[var(--lp-border)] px-3 py-1.5 text-sm text-[var(--lp-muted)] transition-colors hover:border-[var(--lp-border-strong)] hover:text-[var(--lp-text)]"
      >
        <Server className="size-4 shrink-0 text-[var(--lp-muted)]" />
        <span className="truncate">{region.label}</span>
        <ChevronDown className={`ml-auto size-4 shrink-0 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>
      <AnimatePresence>
        {open && (
          <>
            <button className="fixed inset-0 z-10 cursor-default" aria-hidden="true" tabIndex={-1} onClick={() => setOpen(false)} />
            <motion.ul
              role="listbox"
              aria-label="Select region"
              initial={{ opacity: 0, y: 6, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 6, scale: 0.97 }}
              transition={{ duration: 0.18 }}
              className="absolute bottom-full z-20 mb-2 w-full overflow-hidden rounded-xl border border-[var(--lp-border-strong)] bg-[var(--lp-surface)] p-1 shadow-xl"
            >
              {REGIONS.map((r) => (
                <li key={r.code}>
                  <button
                    role="option"
                    aria-selected={region.code === r.code}
                    onClick={() => {
                      setRegion(r);
                      setOpen(false);
                      notify("info", `Region: ${r.label}`, "Console sessions pin to this region for latency estimates.");
                    }}
                    className={`flex min-h-9 w-full items-center gap-2 rounded-lg px-2.5 text-left text-sm transition-colors ${
                      region.code === r.code
                        ? "bg-emerald-500/10 font-semibold text-emerald-500"
                        : "text-[var(--lp-muted)] hover:bg-[var(--lp-chip)] hover:text-[var(--lp-text)]"
                    }`}
                  >
                    <Globe className="size-3.5 shrink-0" />
                    {r.label}
                    {region.code === r.code && <Check className="ml-auto size-3.5" />}
                  </button>
                </li>
              ))}
            </motion.ul>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}

function SiteFooter(props: {
  onLegal: (k: LegalKind) => void;
  onCookieSettings: () => void;
  notify: (kind: ToastKind, title: string, desc?: string) => void;
}) {
  const YEAR = new Date().getFullYear();

  const product: FootLink[] = [
    { label: "Features", action: () => scrollToId("features") },
    { label: "Integrations", action: () => scrollToId("features") },
    { label: "Changelog", action: () => props.notify("info", "Changelog", "v2.0 just shipped — full release notes arrive with GA.") },
    { label: "Roadmap", action: () => props.notify("info", "Roadmap", "Public roadmap opens alongside the v2.1 beta.") },
    { label: "Documentation", action: () => props.notify("info", "Documentation", "Docs portal ships with the GA release.") },
  ];

  const company: FootLink[] = [
    { label: "About Us", action: () => scrollToId("about") },
    { label: "Careers", badge: "Hiring", action: () => props.notify("success", "We're hiring!", "12 open roles across infra, DX and design.") },
    { label: "Blog", action: () => props.notify("info", "Blog", "Engineering deep-dives publish weekly.") },
    { label: "Brand Assets", action: () => props.notify("info", "Brand kit", "Logos, colors and usage guidelines available on request.") },
    { label: "Press Kit", action: () => props.notify("info", "Press", "Email press@hostelhub.app for media resources.") },
  ];

  const legal: FootLink[] = [
    { label: "Privacy Policy", action: () => props.onLegal("privacy") },
    { label: "Terms of Service", action: () => props.onLegal("terms") },
    { label: "Cookie Settings", action: props.onCookieSettings },
    { label: "Sub-processors", action: () => props.onLegal("privacy") },
    { label: "Security Whitepaper", action: () => props.onLegal("privacy") },
  ];

  return (
    <footer className="border-t border-[var(--lp-border)] bg-[var(--lp-bg-soft)]" aria-label="Site footer">
      <div className="mx-auto max-w-6xl px-4 py-14 sm:px-6 sm:py-16">
        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-5">
          <div className="lg:col-span-1">
            <div className="flex items-center gap-2.5">
              <LogoMark />
              <span className="text-[17px] font-semibold tracking-tight text-[var(--lp-text)]">{BRAND}</span>
            </div>
            <p className="mt-3 max-w-[26ch] text-sm leading-relaxed text-[var(--lp-muted)]">
              The deployment platform for teams that ship daily.
            </p>
          </div>
          <FootColumn title="Product" links={product} />
          <FootColumn title="Company" links={company} />
          <FootColumn title="Legal & Security" links={legal} />

          {/* System column */}
          <div className="sm:col-span-2 lg:col-span-1">
            <p className="text-[11px] font-bold uppercase tracking-widest text-[var(--lp-muted)]">System</p>
            <button
              onClick={() =>
                props.notify(
                  "success",
                  "All systems normal",
                  "99.99% uptime over the trailing 90 days. Status page mirrors this indicator.",
                )
              }
              className="mt-4 flex min-h-9 items-center gap-2.5 rounded-lg px-1 py-1.5 text-sm text-[var(--lp-muted)] transition-colors hover:text-[var(--lp-text)]"
            >
              <Ping /> <span className="text-[var(--lp-text)]">All systems normal</span>
            </button>
            <p className="mt-1 pl-1 text-xs text-[var(--lp-muted)]">hostelhub.app · built for IIT Roorkee</p>
            <div className="mt-4">
              <RegionSelect notify={props.notify} />
            </div>
          </div>
        </div>

        <div className="mt-12 flex flex-col items-center justify-between gap-3 border-t border-[var(--lp-border)] pt-6 sm:flex-row">
          <p className="text-xs text-[var(--lp-muted)]">
            © {YEAR} HostelHub. All rights reserved.
          </p>
          <p className="flex items-center gap-1.5 text-xs text-[var(--lp-muted)]">
            <ShieldCheck className="size-3.5 text-emerald-500" />
            Institute-only access · Role-based · 99.9% uptime
          </p>
        </div>
      </div>
    </footer>
  );
}

/* ─────────────────────────────────────────────────────────────────────────── */
/* Cookie consent                                                              */
/* ─────────────────────────────────────────────────────────────────────────── */

function ToggleSwitch({
  checked,
  onChange,
  disabled,
  label,
}: {
  checked: boolean;
  onChange?: (v: boolean) => void;
  disabled?: boolean;
  label: string;
}) {
  return (
    <button
      role="switch"
      aria-checked={checked}
      aria-label={label}
      disabled={disabled}
      onClick={() => onChange?.(!checked)}
      className={`flex h-6 w-11 shrink-0 items-center rounded-full p-0.5 transition-colors ${
        checked ? "justify-end bg-emerald-500" : "justify-start bg-[var(--lp-border-strong)]"
      } ${disabled ? "cursor-not-allowed opacity-70" : ""}`}
    >
      <span className="block size-5 rounded-full bg-white shadow" />
    </button>
  );
}

function CookieBanner({
  phase,
  setPhase,
  notify,
}: {
  phase: CookiePhase;
  setPhase: (p: CookiePhase) => void;
  notify: (kind: ToastKind, title: string, desc?: string) => void;
}) {
  const [analytics, setAnalytics] = useState(false);
  const [marketing, setMarketing] = useState(false);

  const persist = (choice: Consent, label: string) => {
    try {
      window.localStorage.setItem(CONSENT_KEY, JSON.stringify(choice));
    } catch {
      /* storage unavailable — choice stays session-only */
    }
    setPhase("hidden");
    notify("success", "Preferences saved", label);
  };

  return (
    <AnimatePresence>
      {phase !== "hidden" && (
        <motion.div
          initial={{ opacity: 0, y: 32 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 32 }}
          transition={{ type: "spring", stiffness: 300, damping: 30 }}
          role="region"
          aria-label="Cookie consent"
          className="fixed inset-x-4 bottom-4 z-[60] mx-auto max-w-md rounded-2xl border border-[var(--lp-border-strong)] bg-[var(--lp-surface)] p-5 shadow-2xl sm:left-6 sm:right-auto"
        >
          <div className="flex items-start gap-3">
            <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-500">
              <Cookie className="size-5" />
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-[var(--lp-text)]">We use cookies</p>
              <p className="mt-1 text-xs leading-relaxed text-[var(--lp-muted)]">
                Essential cookies keep the site working. Analytics and marketing
                cookies are optional — and your choice is respected permanently.
              </p>
            </div>
          </div>

          <AnimatePresence initial={false}>
            {phase === "customize" && (
              <motion.div
                key="custom"
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.25 }}
                className="overflow-hidden"
              >
                <div className="mt-4 space-y-3 border-t border-[var(--lp-border)] pt-4">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="text-xs font-semibold text-[var(--lp-text)]">Essential</p>
                      <p className="text-[11px] text-[var(--lp-muted)]">Session & security. Always on.</p>
                    </div>
                    <ToggleSwitch checked disabled label="Essential cookies (always enabled)" />
                  </div>
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="text-xs font-semibold text-[var(--lp-text)]">Analytics</p>
                      <p className="text-[11px] text-[var(--lp-muted)]">Self-hosted, IP-truncated.</p>
                    </div>
                    <ToggleSwitch checked={analytics} onChange={setAnalytics} label="Analytics cookies" />
                  </div>
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="text-xs font-semibold text-[var(--lp-text)]">Marketing</p>
                      <p className="text-[11px] text-[var(--lp-muted)]">Campaign attribution only.</p>
                    </div>
                    <ToggleSwitch checked={marketing} onChange={setMarketing} label="Marketing cookies" />
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="mt-4 flex flex-wrap gap-2">
            {phase === "customize" ? (
              <>
                <button
                  onClick={() => persist({ analytics, marketing }, "Custom cookie preferences applied.")}
                  className="min-h-10 flex-1 rounded-lg bg-emerald-500 px-4 text-xs font-semibold text-emerald-950 transition-colors hover:bg-emerald-400"
                >
                  Save preferences
                </button>
                <button
                  onClick={() => setPhase("banner")}
                  className="min-h-10 rounded-lg border border-[var(--lp-border-strong)] px-4 text-xs font-semibold text-[var(--lp-muted)] transition-colors hover:text-[var(--lp-text)]"
                >
                  Back
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={() => persist({ analytics: true, marketing: true }, "All cookies accepted.")}
                  className="min-h-10 flex-1 rounded-lg bg-emerald-500 px-4 text-xs font-semibold text-emerald-950 transition-colors hover:bg-emerald-400"
                >
                  Accept All
                </button>
                <button
                  onClick={() => setPhase("customize")}
                  className="min-h-10 rounded-lg border border-[var(--lp-border-strong)] px-4 text-xs font-semibold text-[var(--lp-text)] transition-colors hover:bg-[var(--lp-chip)]"
                >
                  Customize
                </button>
                <button
                  onClick={() => persist({ analytics: false, marketing: false }, "Non-essential cookies rejected.")}
                  className="min-h-10 rounded-lg px-3 text-xs font-semibold text-[var(--lp-muted)] transition-colors hover:text-[var(--lp-text)]"
                >
                  Reject Non-Essential
                </button>
              </>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

/* ─────────────────────────────────────────────────────────────────────────── */
/* Legal dialogs                                                               */
/* ─────────────────────────────────────────────────────────────────────────── */

function LegalDialog({ kind, onClose }: { kind: LegalKind; onClose: () => void }) {
  const doc = LEGAL_CONTENT[kind];
  return (
    <DialogShell id="legal-title" title={doc.title} onClose={onClose} wide>
      <p className="text-xs font-semibold uppercase tracking-wide text-[var(--lp-muted)]">{doc.updated}</p>
      <p className="mt-3 text-sm leading-relaxed text-[var(--lp-muted)]">{doc.intro}</p>
      <div className="mt-6 space-y-6">
        {doc.sections.map((s) => (
          <section key={s.heading} aria-label={s.heading}>
            <h4 className="text-sm font-bold text-[var(--lp-text)]">{s.heading}</h4>
            {s.paras?.map((p, i) => (
              <p key={i} className="mt-2 text-sm leading-relaxed text-[var(--lp-muted)]">{p}</p>
            ))}
            {s.bullets && (
              <ul className="mt-2 space-y-1.5">
                {s.bullets.map((b, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm leading-relaxed text-[var(--lp-muted)]">
                    <span className="mt-[7px] size-1 shrink-0 rounded-full bg-emerald-500" aria-hidden="true" />
                    {b}
                  </li>
                ))}
              </ul>
            )}
          </section>
        ))}
      </div>
      <p className="mt-8 rounded-xl border border-[var(--lp-border)] bg-[var(--lp-chip)] p-4 text-xs leading-relaxed text-[var(--lp-muted)]">
        Questions? Email <span className="font-semibold text-[var(--lp-text)]">legal@hostelhub.app</span> — a human
        (not a bot) answers within three business days.
      </p>
    </DialogShell>
  );
}

/* ─────────────────────────────────────────────────────────────────────────── */
/* Contact / sales dialog                                                      */
/* ─────────────────────────────────────────────────────────────────────────── */

interface ContactFormState {
  name: string;
  email: string;
  size: string;
  message: string;
}

interface FieldErrors {
  name?: string;
  email?: string;
  size?: string;
  message?: string;
}

function ContactDialog({
  open,
  planHint,
  onClose,
  notify,
}: {
  open: boolean;
  planHint: string | null;
  onClose: () => void;
  notify: (kind: ToastKind, title: string, desc?: string) => void;
}) {
  const [form, setForm] = useState<ContactFormState>({ name: "", email: "", size: "", message: "" });
  const [errors, setErrors] = useState<FieldErrors>({});
  const [status, setStatus] = useState<"idle" | "submitting" | "success">("idle");

  // Seed the message whenever the dialog opens with a plan context.
  useEffect(() => {
    if (open) {
      setStatus("idle");
      setErrors({});
      setForm((f) => ({
        ...f,
        message: planHint ? `Hi — we're evaluating the ${planHint} plan.` : f.message,
      }));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, planHint]);

  useScrollLock(open);

  const set = (key: keyof ContactFormState) => (
    e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>,
  ) => setForm((f) => ({ ...f, [key]: e.target.value }));

  const validate = (): boolean => {
    const next: FieldErrors = {};
    if (form.name.trim().length < 2) next.name = "Please enter your full name.";
    if (!/^\S+@\S+\.\S{2,}$/.test(form.email.trim())) next.email = "Enter a valid email address.";
    else if (/@(gmail|yahoo|outlook|hotmail)\./i.test(form.email))
      next.email = "Use your work email so we can route you correctly.";
    if (!form.size) next.size = "Select your company size.";
    if (form.message.trim().length < 10) next.message = "Tell us a little more (10+ characters).";
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const submit = (e: FormEvent) => {
    e.preventDefault();
    if (!validate()) {
      notify("error", "Check the highlighted fields");
      return;
    }
    setStatus("submitting");
    // Simulated transport — swap for a real endpoint in production.
    window.setTimeout(() => {
      setStatus("success");
      notify("success", "Message sent", "A solutions engineer will reply within one business day.");
    }, 900);
  };

  return (
    <AnimatePresence>
      {open && (
      <DialogShell id="contact-title" title={planHint ? `Talk to sales — ${planHint}` : "Talk to sales"} onClose={onClose}>
        {status === "success" ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex flex-col items-center py-8 text-center"
            role="status"
          >
            <motion.span
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", stiffness: 260, damping: 16, delay: 0.05 }}
              className="flex size-14 items-center justify-center rounded-full bg-emerald-500/15 text-emerald-500"
            >
              <CheckCircle2 className="size-7" />
            </motion.span>
            <h4 className="mt-4 text-lg font-semibold text-[var(--lp-text)]">Thanks, {form.name.split(" ")[0]}!</h4>
            <p className="mt-1.5 max-w-sm text-sm leading-relaxed text-[var(--lp-muted)]">
              Your message is in the queue. A solutions engineer will reach out to{" "}
              <span className="font-semibold text-[var(--lp-text)]">{form.email}</span> within one business day.
            </p>
            <button
              onClick={onClose}
              className="mt-6 min-h-11 rounded-xl border border-[var(--lp-border-strong)] px-6 text-sm font-semibold text-[var(--lp-text)] transition-colors hover:bg-[var(--lp-chip)]"
            >
              Done
            </button>
          </motion.div>
        ) : (
          <form onSubmit={submit} noValidate className="space-y-4">
            <div>
              <label htmlFor="ct-name" className="mb-1.5 block text-xs font-semibold text-[var(--lp-text)]">Full name</label>
              <input
                id="ct-name"
                type="text"
                autoComplete="name"
                value={form.name}
                onChange={set("name")}
                aria-invalid={!!errors.name}
                aria-describedby={errors.name ? "ct-name-err" : undefined}
                placeholder="Ada Lovelace"
                className={`min-h-11 w-full rounded-xl border bg-[var(--lp-surface-2)] px-3.5 text-base text-[var(--lp-text)] placeholder:text-[var(--lp-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--lp-ring)] ${
                  errors.name ? "border-rose-500" : "border-[var(--lp-border-strong)] focus:border-emerald-500"
                }`}
              />
              {errors.name && <p id="ct-name-err" className="mt-1.5 text-xs font-medium text-rose-400">{errors.name}</p>}
            </div>

            <div>
              <label htmlFor="ct-email" className="mb-1.5 block text-xs font-semibold text-[var(--lp-text)]">Work email</label>
              <input
                id="ct-email"
                type="email"
                autoComplete="email"
                value={form.email}
                onChange={set("email")}
                aria-invalid={!!errors.email}
                aria-describedby={errors.email ? "ct-email-err" : undefined}
                placeholder="ada@company.com"
                className={`min-h-11 w-full rounded-xl border bg-[var(--lp-surface-2)] px-3.5 text-base text-[var(--lp-text)] placeholder:text-[var(--lp-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--lp-ring)] ${
                  errors.email ? "border-rose-500" : "border-[var(--lp-border-strong)] focus:border-emerald-500"
                }`}
              />
              {errors.email && <p id="ct-email-err" className="mt-1.5 text-xs font-medium text-rose-400">{errors.email}</p>}
            </div>

            <div>
              <label htmlFor="ct-size" className="mb-1.5 block text-xs font-semibold text-[var(--lp-text)]">Company size</label>
              <select
                id="ct-size"
                value={form.size}
                onChange={set("size")}
                aria-invalid={!!errors.size}
                aria-describedby={errors.size ? "ct-size-err" : undefined}
                className={`min-h-11 w-full appearance-none rounded-xl border bg-[var(--lp-surface-2)] px-3.5 text-base text-[var(--lp-text)] focus:outline-none focus:ring-2 focus:ring-[var(--lp-ring)] ${
                  errors.size ? "border-rose-500" : "border-[var(--lp-border-strong)] focus:border-emerald-500"
                }`}
              >
                <option value="">Select…</option>
                {COMPANY_SIZES.map((s) => (
                  <option key={s} value={s}>{s} people</option>
                ))}
              </select>
              {errors.size && <p id="ct-size-err" className="mt-1.5 text-xs font-medium text-rose-400">{errors.size}</p>}
            </div>

            <div>
              <label htmlFor="ct-msg" className="mb-1.5 block text-xs font-semibold text-[var(--lp-text)]">How can we help?</label>
              <textarea
                id="ct-msg"
                rows={4}
                value={form.message}
                onChange={set("message")}
                aria-invalid={!!errors.message}
                aria-describedby={errors.message ? "ct-msg-err" : undefined}
                placeholder="Tell us about your stack, scale and timeline…"
                className={`w-full resize-none rounded-xl border bg-[var(--lp-surface-2)] px-3.5 py-3 text-base text-[var(--lp-text)] placeholder:text-[var(--lp-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--lp-ring)] ${
                  errors.message ? "border-rose-500" : "border-[var(--lp-border-strong)] focus:border-emerald-500"
                }`}
              />
              {errors.message && <p id="ct-msg-err" className="mt-1.5 text-xs font-medium text-rose-400">{errors.message}</p>}
            </div>

            <motion.button
              whileTap={{ scale: 0.98 }}
              type="submit"
              disabled={status === "submitting"}
              className="flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-emerald-500 text-sm font-semibold text-emerald-950 shadow-md shadow-emerald-500/25 transition-colors hover:bg-emerald-400 disabled:opacity-60"
            >
              {status === "submitting" ? (
                <>
                  <Loader2 className="size-4 animate-spin" /> Sending…
                </>
              ) : (
                <>
                  Send message <ArrowRight className="size-4" />
                </>
              )}
            </motion.button>
            <p className="text-center text-[11px] leading-relaxed text-[var(--lp-muted)]">
              By submitting, you agree to our{" "}
              <span className="underline decoration-dotted underline-offset-2">Privacy Policy</span>. We never share
              your details with third parties.
            </p>
          </form>
        )}
      </DialogShell>
      )}
    </AnimatePresence>
  );
}

/* ─────────────────────────────────────────────────────────────────────────── */
/* Root composition                                                            */
/* ─────────────────────────────────────────────────────────────────────────── */

export default function LandingPage() {
  const [theme, setTheme] = useState<Theme>("dark");
  const [mobileOpen, setMobileOpen] = useState(false);
  const [legal, setLegal] = useState<LegalKind | null>(null);
  const [contact, setContact] = useState<{ open: boolean; plan: string | null }>({ open: false, plan: null });
  const [cookiePhase, setCookiePhase] = useState<CookiePhase>("hidden");
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const [activeId, setActiveId] = useState("");

  /* Toast queue */
  const notify = useCallback((kind: ToastKind, title: string, desc?: string) => {
    const id = Date.now() + Math.random();
    setToasts((prev) => [...prev.slice(-3), { id, kind, title, desc }]);
    window.setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 4500);
  }, []);

  /* Reveal cookie banner shortly after load if no stored choice. */
  useEffect(() => {
    const t = window.setTimeout(() => {
      if (!readConsent()) setCookiePhase("banner");
    }, 900);
    return () => window.clearTimeout(t);
  }, []);

  /* Scroll-lock while any blocking overlay is open. */
  const overlayBlocking = mobileOpen || !!legal || contact.open;
  useScrollLock(overlayBlocking);

  /* Highlight the nav item for the section currently in view. */
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) setActiveId(entry.target.id);
        });
      },
      { rootMargin: "-40% 0px -55% 0px" },
    );
    NAV_LINKS.forEach(({ id }) => {
      const el = document.getElementById(id);
      if (el) observer.observe(el);
    });
    return () => observer.disconnect();
  }, []);

  const openContactWithPlan = (plan: string) => setContact({ open: true, plan });

  return (
    <div
      style={THEME_VARS[theme] as CSSProperties}
      className="min-h-screen bg-[var(--lp-bg)] font-sans text-[var(--lp-text)] antialiased selection:bg-emerald-500/30"
    >
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-[100] focus:rounded-lg focus:bg-emerald-500 focus:px-4 focus:py-2 focus:text-sm focus:font-semibold focus:text-emerald-950"
      >
        Skip to main content
      </a>

      <Header
        onOpenMobile={() => setMobileOpen(true)}
        onContact={() => setContact({ open: true, plan: null })}
        activeId={activeId}
      />

      <MobileSheet
        open={mobileOpen}
        onClose={() => setMobileOpen(false)}
        theme={theme}
        onToggleTheme={() => setTheme((t) => (t === "dark" ? "light" : "dark"))}
        onContact={() => setContact({ open: true, plan: null })}
        onLegal={(k) => setLegal(k)}
      />

      <main id="main-content">
        <Hero onContact={() => setContact({ open: true, plan: null })} />
        <ProofBar />
        <BentoGrid />
        <AboutSpotlight />
        <PricingSection onSelectPlan={openContactWithPlan} />
        <FaqSection />
        <NewsletterBand notify={notify} />
      </main>

      <SiteFooter
        onLegal={(k) => setLegal(k)}
        onCookieSettings={() => setCookiePhase("customize")}
        notify={notify}
      />

      {/* Overlays */}
      <AnimatePresence>
        {legal && <LegalDialog key={legal} kind={legal} onClose={() => setLegal(null)} />}
      </AnimatePresence>

      <ContactDialog
        open={contact.open}
        planHint={contact.plan}
        onClose={() => setContact({ open: false, plan: null })}
        notify={notify}
      />

      <CookieBanner phase={cookiePhase} setPhase={setCookiePhase} notify={notify} />
      <ToastHost toasts={toasts} />
    </div>
  );
}
