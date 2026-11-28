import { describe, it, expect } from "vitest";
import { nextTicketStage, shouldReturn, ticketCopy } from "@/lib/waitingExperience";

describe("pilot ticket rules", () => {
  it("advances 2 ahead → 1 ahead → called → reset", () => {
    const ahead = [2, 1, 0];
    let stage = 0;
    stage = nextTicketStage(stage); expect(ahead[stage]).toBe(1);
    stage = nextTicketStage(stage); expect(ahead[stage]).toBe(0);
    stage = nextTicketStage(stage); expect(ahead[stage]).toBe(2);
  });
  it("reminds stepping-out visitors at ten minutes or two tokens ahead", () => {
    expect(shouldReturn("out", 3, 11, "waiting")).toBe(false);
    expect(shouldReturn("out", 3, 10, "waiting")).toBe(true);
    expect(shouldReturn("out", 2, 20, "waiting")).toBe(true);
  });
  it("reminds nearby visitors at three minutes or one token ahead", () => {
    expect(shouldReturn("nearby", 2, 4, "waiting")).toBe(false);
    expect(shouldReturn("nearby", 2, 3, "waiting")).toBe(true);
    expect(shouldReturn("nearby", 1, 10, "waiting")).toBe(true);
  });
  it("does not give return reminders in the waiting area or after waiting ends", () => {
    expect(shouldReturn("area", 0, 0, "waiting")).toBe(false);
    for (const status of ["called", "served", "skipped"]) expect(shouldReturn("out", 0, 0, status)).toBe(false);
  });
  it("keeps every ticket label translated in Hindi and Marathi", () => {
    const enKeys = Object.keys(ticketCopy.en).sort();
    for (const lang of ["hi", "mr"] as const) {
      expect(Object.keys(ticketCopy[lang]).sort()).toEqual(enKeys);
      for (const key of enKeys) {
        const value = (ticketCopy[lang] as Record<string, string>)[key];
        expect(value.trim().length).toBeGreaterThan(0);
        expect(value).not.toBe((ticketCopy.en as Record<string, string>)[key]);
      }
    }
  });
});