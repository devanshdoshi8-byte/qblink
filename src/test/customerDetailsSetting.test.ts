import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({ from: vi.fn(), update: vi.fn(), eq: vi.fn() }));
vi.mock("@/integrations/supabase/client", () => ({ supabase: { from: mocks.from } }));
import { saveCustomerDetailsSetting } from "@/lib/customerDetailsSetting";

describe("business-wide customer details", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.from.mockReturnValue({ update: mocks.update });
    mocks.update.mockReturnValue({ eq: mocks.eq });
    mocks.eq.mockResolvedValue({ error: null });
  });

  it("turns details off for all queues of only the selected business", async () => {
    await saveCustomerDetailsSetting("clinic-a", false);
    expect(mocks.from).toHaveBeenCalledWith("queues");
    expect(mocks.update).toHaveBeenCalledWith({ require_customer_details: false });
    expect(mocks.eq).toHaveBeenCalledWith("business_id", "clinic-a");
  });

  it("can restore the details requirement across the business", async () => {
    await saveCustomerDetailsSetting("clinic-a", true);
    expect(mocks.update).toHaveBeenCalledWith({ require_customer_details: true });
  });

  it("returns save failures instead of reporting success", async () => {
    mocks.eq.mockResolvedValue({ error: { message: "denied" } });
    expect((await saveCustomerDetailsSetting("clinic-a", false)).error).toEqual({ message: "denied" });
  });
});