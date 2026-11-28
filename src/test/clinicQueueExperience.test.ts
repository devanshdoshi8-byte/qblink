import { describe, it, expect } from "vitest";
import { isClinicIndustry, INDUSTRY_DEFAULTS, getIndustryDefaults } from "@/lib/industryDefaults";

describe("Clinic Queue Experience & Auto-Serve Logic", () => {
  it("correctly identifies clinic and healthcare categories", () => {
    expect(isClinicIndustry("Clinic")).toBe(true);
    expect(isClinicIndustry("clinic")).toBe(true);
    expect(isClinicIndustry("Hospital")).toBe(true);
    expect(isClinicIndustry("Healthcare")).toBe(true);
    expect(isClinicIndustry("Dental Clinic")).toBe(true);
    expect(isClinicIndustry("Doctor's Practice")).toBe(true);
    expect(isClinicIndustry("Diagnostic Centre")).toBe(true);
    expect(isClinicIndustry("Medical Center")).toBe(true);
  });

  it("returns false for non-clinic business categories", () => {
    expect(isClinicIndustry("Restaurant")).toBe(false);
    expect(isClinicIndustry("Cafe")).toBe(false);
    expect(isClinicIndustry("Salon")).toBe(false);
    expect(isClinicIndustry("Retail")).toBe(false);
    expect(isClinicIndustry("Government Office")).toBe(false);
    expect(isClinicIndustry("Service Centre")).toBe(false);
    expect(isClinicIndustry("Others")).toBe(false);
    expect(isClinicIndustry(null)).toBe(false);
    expect(isClinicIndustry(undefined)).toBe(false);
    expect(isClinicIndustry("")).toBe(false);
  });

  it("sets auto_complete_on_call to true for Clinic defaults", () => {
    const clinicDefaults = getIndustryDefaults("Clinic");
    expect(clinicDefaults.auto_complete_on_call).toBe(true);
    expect(clinicDefaults.queue_type).toBe("standard");
    expect(clinicDefaults.highlights).toEqual(
      expect.arrayContaining([
        expect.stringMatching(/Auto-completes on Next Patient/i),
      ])
    );
  });

  it("does not set auto_complete_on_call for Restaurant or Salon", () => {
    const restaurantDefaults = getIndustryDefaults("Restaurant");
    expect(restaurantDefaults.auto_complete_on_call).toBeUndefined();

    const salonDefaults = getIndustryDefaults("Salon");
    expect(salonDefaults.auto_complete_on_call).toBeUndefined();
  });

  it("handles clinic detection for queue naming heuristics", () => {
    const isClinicQueueName = (name: string) =>
      /^(dr\b|doctor|clinic|opd|patient|healthcare|medical)/i.test(name);

    expect(isClinicQueueName("Dr. Sharma OPD")).toBe(true);
    expect(isClinicQueueName("Clinic Room 1")).toBe(true);
    expect(isClinicQueueName("OPD General")).toBe(true);
    expect(isClinicQueueName("Patient Consultation")).toBe(true);
    expect(isClinicQueueName("Table 4 Dining")).toBe(false);
    expect(isClinicQueueName("Haircut Station")).toBe(false);
  });
});
