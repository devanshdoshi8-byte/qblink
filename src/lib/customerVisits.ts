export const ACTIVE_VISIT_STATUSES = ["waiting", "checked_in", "called", "serving"] as const;

export function isActiveVisit(status: string) {
  return ACTIVE_VISIT_STATUSES.some(value => value === status);
}

export function visitStatusLabel(status: string) {
  const labels: Record<string, string> = {
    waiting: "Waiting", checked_in: "Checked in", called: "Called", serving: "Being served",
    served: "Completed", completed: "Completed", removed: "Left queue", cancelled: "Cancelled",
    skipped: "Skipped", no_show: "No show", expired: "Expired",
  };
  return labels[status] || status.replace(/_/g, " ");
}