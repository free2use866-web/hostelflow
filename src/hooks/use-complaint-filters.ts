import { useMemo, useState } from "react";
import type { Complaint } from "@/lib/types";
import { IS_SECY_ROLE, IS_WARDEN_ROLE } from "@/lib/types";

export interface ComplaintFilters {
  filter: string;
  setFilter: (c: string) => void;
  statusFilter: string;
  setStatusFilter: (s: string) => void;
  visible: Complaint[];
  /** True when filters (not the dataset itself) produced an empty result. */
  filteredToEmpty: boolean;
  clearFilters: () => void;
}

/**
 * Role-scoped filtering for the complaints list, extracted from JSX so the
 * view stays declarative. Memoized: recomputes only when inputs change.
 */
export function useComplaintFilters(
  complaints: Complaint[],
  role: Complaint["assignedRole"],
): ComplaintFilters {
  const [filter, setFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  const isWarden = IS_WARDEN_ROLE(role);
  const isSecy = IS_SECY_ROLE(role);

  return useMemo<ComplaintFilters>(() => {
    let visible = complaints;

    // Secretaries only see their own routed category (wardens see all).
    if (isSecy && !isWarden) {
      visible = visible.filter((c) => c.assignedRole === role);
    }
    if (filter !== "all") {
      visible = visible.filter((c) => c.category === filter);
    }
    if (statusFilter !== "all") {
      visible = visible.filter((c) => c.status === statusFilter);
    }

    const hasActiveFilters =
      filter !== "all" || statusFilter !== "all";

    return {
      filter,
      setFilter,
      statusFilter,
      setStatusFilter,
      visible,
      filteredToEmpty: visible.length === 0 && hasActiveFilters,
      clearFilters: () => {
        setFilter("all");
        setStatusFilter("all");
      },
    };
  }, [complaints, role, isSecy, isWarden, filter, statusFilter]);
}
