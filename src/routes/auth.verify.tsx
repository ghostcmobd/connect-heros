import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Loader2 } from "lucide-react";

export const Route = createFileRoute("/auth/verify")({
  head: () => ({ meta: [{ title: "Signing you in — Almanac" }] }),
  component: VerifyPage,
});

function VerifyPage() {
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const token_hash = params.get("token_hash");
    const type = params.get("type") as "magiclink" | null;
    const next = params.get("next") || "/profile";

    if (!token_hash || !type) {
      setError("Missing verification token.");
      return;
    }

    supabase.auth.verifyOtp({ token_hash, type }).then(({ error }) => {
      if (error) {
        setError(error.message);
        return;
      }
      navigate({ to: next, replace: true });
    });
  }, [navigate]);

  return (
    <div className="mx-auto flex min-h-[60vh] max-w-md flex-col items-center justify-center px-5 text-center">
      {error ? (
        <>
          <p className="text-sm text-destructive">{error}</p>
          <a href="/auth" className="mt-4 text-sm font-medium text-primary hover:underline">
            Try again
          </a>
        </>
      ) : (
        <>
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
          <p className="mt-3 text-sm text-muted-foreground">Signing you in…</p>
        </>
      )}
    </div>
  );
}
