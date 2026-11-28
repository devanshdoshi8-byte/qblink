import { useState } from "react";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

interface GoogleSignInButtonProps {
  disabled?: boolean;
  onBeforeOAuth?: () => void | Promise<void>;
  onError?: (message: string) => void;
}

/**
 * Shared Google OAuth trigger using Supabase's built-in OAuth flow.
 * Redirects back to `${window.location.origin}/dashboard` where PostAuthRouter
 * and role guards complete provisioning and routing.
 */
export function GoogleSignInButton({ disabled, onBeforeOAuth, onError }: GoogleSignInButtonProps) {
  const [loading, setLoading] = useState(false);

  const handleClick = async () => {
    setLoading(true);
    try {
      await onBeforeOAuth?.();
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${window.location.origin}/dashboard`,
        },
      });
      if (error) {
        const msg = error.message || "Could not start Google sign-in. Please try again.";
        onError?.(msg);
        toast.error(msg);
        setLoading(false);
      }
    } catch (err: any) {
      const msg = err?.message || "Could not start Google sign-in. Please try again.";
      onError?.(msg);
      toast.error(msg);
      setLoading(false);
    }
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={disabled || loading}
      className="w-full flex items-center justify-center gap-2.5 py-3 px-4 rounded-xl bg-background border border-border text-foreground text-sm font-semibold hover:bg-muted/60 active:scale-[0.99] transition-all disabled:opacity-50"
    >
      {loading ? (
        <Loader2 className="w-4 h-4 animate-spin" />
      ) : (
        <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24" aria-hidden="true">
          <path
            fill="#4285F4"
            d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.17Z"
          />
          <path
            fill="#34A853"
            d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.11-6.72-4.96H1.29v3.14C3.26 21.3 7.31 24 12 24Z"
          />
          <path
            fill="#FBBC05"
            d="M5.28 14.24c-.24-.72-.38-1.49-.38-2.24s.14-1.52.38-2.24V6.62H1.29C.47 8.24 0 10.06 0 12s.47 3.76 1.29 5.38l3.99-3.14Z"
          />
          <path
            fill="#EA4335"
            d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.31 0 3.26 2.7 1.29 6.62l3.99 3.14c.95-2.85 3.6-4.96 6.72-4.96Z"
          />
        </svg>
      )}
      <span>{loading ? "Redirecting to Google..." : "Continue with Google"}</span>
    </button>
  );
}
