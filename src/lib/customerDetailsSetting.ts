import { supabase } from "@/integrations/supabase/client";

/** Only this setting is shared across the business; other queue settings stay local. */
export async function saveCustomerDetailsSetting(businessId: string, required: boolean) {
  return supabase
    .from("queues")
    .update({ require_customer_details: required })
    .eq("business_id", businessId);
}