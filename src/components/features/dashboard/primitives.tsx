import { motion } from "framer-motion";
import type { ReactNode } from "react";
import { statusTone } from "@/lib/status";
import { cn } from "@/lib/utils";

/* ── StatCard ─────────────────────────────────────────────────────────────── */
/** Previously duplicated verbatim in RoleDashboards.tsx and CentralAdmin.tsx. */
export function StatCard({
  label,
  value,
  tone,
  icon,
}: {
  label: string;
  value: number;
  tone: string;
  icon: ReactNode;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn("rounded-xl border p-4", tone)}
    >
      <div className="flex items-center justify-between">
        <div className="min-w-0">
          <p className="text-2xl font-bold sm:text-3xl">{value}</p>
          <p className="mt-1 truncate text-xs font-medium">{label}</p>
        </div>
        <div className="opacity-40">{icon}</div>
      </div>
    </motion.div>
  );
}

/* ── SectionCard ──────────────────────────────────────────────────────────── */
export function SectionCard({
  title,
  icon,
  children,
  action,
}: {
  title: string;
  icon?: ReactNode;
  children: ReactNode;
  action?: ReactNode;
}) {
  return (
    <section className="rounded-xl border border-border bg-card p-5">
      <div className="mb-3 flex items-center justify-between gap-3">
        <h3
          className="flex min-w-0 items-center gap-2 font-bold text-foreground"
          style={{ fontFamily: "Lora, serif" }}
        >
          {icon}
          <span className="truncate">{title}</span>
        </h3>
        {action && <div className="shrink-0">{action}</div>}
      </div>
      {children}
    </section>
  );
}

/* ── StatusBadge ──────────────────────────────────────────────────────────── */
/** Resolves tones through the central registry — no per-view palettes. */
export function StatusBadge({ status }: { status: string }) {
  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center rounded-full px-2 py-0.5 text-xs font-semibold",
        statusTone(status),
      )}
    >
      {status}
    </span>
  );
}

/* ── CategoryChip ─────────────────────────────────────────────────────────── */
export function CategoryChip({ category }: { category: string }) {
  return (
    <span className="rounded-full bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground">
      {category}
    </span>
  );
}

/* ── EmptyState ───────────────────────────────────────────────────────────── */
/**
 * Production empty state: icon + explanatory copy + optional primary action.
 * Replaces the bare "No X yet." paragraphs the prototype shipped with.
 */
export function EmptyState({
  icon,
  title,
  body,
  action,
  className,
}: {
  icon: ReactNode;
  title: string;
  body?: string;
  action?: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex flex-col items-center rounded-xl border border-dashed border-border bg-card px-6 py-10 text-center",
        className,
      )}
      role="status"
    >
      <div
        aria-hidden
        className="mb-3 flex size-11 items-center justify-center rounded-full bg-muted text-muted-foreground"
      >
        {icon}
      </div>
      <p className="text-sm font-semibold text-foreground">{title}</p>
      {body && (
        <p className="mt-1 max-w-sm text-xs leading-relaxed text-muted-foreground">
          {body}
        </p>
      )}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

/* ── Skeleton primitives (loading mirrors of real shapes) ─────────────────── */
export function SkeletonText({ lines = 3 }: { lines?: number }) {
  return (
    <div className="space-y-2" aria-hidden>
      {Array.from({ length: lines }).map((_, i) => (
        <div
          key={i}
          className={cn(
            "h-3 animate-pulse rounded bg-muted",
            i === lines - 1 ? "w-2/3" : "w-full",
          )}
        />
      ))}
    </div>
  );
}

export function SkeletonCard() {
  return (
    <div
      aria-hidden
      className="rounded-xl border border-border bg-card p-4"
    >
      <SkeletonText lines={2} />
      <div className="mt-3 h-4 w-1/3 animate-pulse rounded bg-muted" />
    </div>
  );
}

/** Screen-reader-only announcement for async transitions. */
export function LoadingAnnounce({ label }: { label: string }) {
  return (
    <p role="status" aria-live="polite" className="sr-only">
      {label}
    </p>
  );
}
