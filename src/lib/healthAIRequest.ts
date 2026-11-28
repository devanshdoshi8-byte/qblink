import { isStandaloneMode } from "@/integrations/supabase/client";

export function requestHealthAI(
  accessToken: string | undefined,
  payload: { messages: { role: "user" | "assistant"; content: string }[]; businessId: string; mode: "init" | "chat" },
) {
  if (isStandaloneMode) {
    return Promise.resolve(
      new Response(JSON.stringify({ score: 96, status: "healthy", recommendations: [] }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }),
    );
  }
  // This endpoint requires a user identity; a publishable key is not a session.
  if (!accessToken) throw new Error("Please sign in again to use the Health Coach");
  return fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/queue-health-ai`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${accessToken}` },
    body: JSON.stringify(payload),
  });
}