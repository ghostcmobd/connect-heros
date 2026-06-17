import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Linkedin, Loader2 } from "lucide-react";
import { FadeIn } from "@/components/FadeIn";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Join Almanac — Sign in with LinkedIn" },
      { name: "description", content: "1-click signup for alumni. Sign in with LinkedIn to help current students." },
      { property: "og:title", content: "Join Almanac" },
      { property: "og:description", content: "1-click signup for alumni. Help current students." },
    ],
  }),
  component: AuthPage,
});

function AuthPage() {
  const navigate = useNavigate();
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) navigate({ to: "/profile", replace: true });
    });
  }, [navigate]);

  const handleLinkedIn = () => {
    setBusy(true);
    window.location.href = "/api/auth/linkedin/start";
  };

  return (
    <div className="mx-auto grid min-h-[calc(100vh-8rem)] max-w-6xl grid-cols-1 items-center gap-12 px-5 py-12 lg:grid-cols-2">
      <FadeIn>
        <div className="max-w-md">
          <span className="pill mb-5">For alumni</span>
          <h1 className="text-balance text-3xl font-semibold tracking-tight sm:text-5xl">
            Help the next generation in about <span className="text-primary">five minutes.</span>
          </h1>
          <p className="mt-4 text-balance text-muted-foreground">
            Sign in with LinkedIn — we'll prefill your name, photo, and email. You add your role and one sentence of advice. That's it.
          </p>
          <ul className="mt-8 space-y-3 text-sm">
            {[
              "Your profile lives on the public directory",
              "Pick how you want to help: resume reviews, coffee chats, referrals",
              "Students reach out through Almanac — your inbox stays clean",
            ].map((t) => (
              <li key={t} className="flex items-start gap-2.5">
                <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
                {t}
              </li>
            ))}
          </ul>
        </div>
      </FadeIn>

      <FadeIn delay={0.08}>
        <div className="soft-card p-8">
          <h2 className="font-display text-xl font-bold tracking-tight">Sign in to Almanac</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            One way in. One click. We use LinkedIn to verify you're a real alum.
          </p>

          <button
            disabled={busy}
            onClick={handleLinkedIn}
            className="btn-press mt-6 flex w-full items-center justify-center gap-2 rounded-full bg-[#0a66c2] px-5 py-3.5 text-base font-semibold text-white shadow-sm hover:opacity-95 disabled:opacity-50"
          >
            {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Linkedin className="h-5 w-5" />}
            Continue with LinkedIn
          </button>

          <p className="mt-6 text-center text-xs text-muted-foreground">
            We'll never post on your behalf. We only read your name, photo, and email.
          </p>
        </div>
      </FadeIn>
    </div>
  );
}
