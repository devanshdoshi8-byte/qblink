import { describe, expect, it } from "vitest";
import { isActiveVisit } from "@/lib/customerVisits";

describe("customer current and past queues", () => {
  it.each(["waiting", "checked_in", "called", "serving"])("includes %s in current queues", status => {
    expect(isActiveVisit(status)).toBe(true);
  });
  it.each(["served", "completed", "removed", "cancelled", "skipped", "no_show", "expired"])("keeps %s in history, not current queues", status => {
    expect(isActiveVisit(status)).toBe(false);
  });
});