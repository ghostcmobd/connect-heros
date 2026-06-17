import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Linkedin, Mail, Loader2 } from "lucide-react";
import { FadeIn } from "@/components/FadeIn";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Join Almanac — Sync with LinkedIn" },
      { name: "description", content: "1-click signup for alumni. Sync your LinkedIn profile and help current students." },
      { property: "og:title", content: "Join Almanac" },
      { property: "og:description", content: "1-click signup for alumni. Help current students." },
    ],
  }),
  component: AuthPage,
});

function AuthPage() {
  const navigate = useNavigate();
  const [mode, setMode] = useState<"signin" | "signup">("signup");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [busy, setBusy] = useState<string | null>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) navigate({ to: "/profile", replace: true });
    });
  }, [navigate]);

  const handleLinkedIn = async () => {
    setBusy("linkedin");
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "linkedin_oidc",
        options: { redirectTo: window.location.origin + "/onboarding" },
      });
      if (error) throw error;
    } catch (err: any) {
      toast.error("LinkedIn sign-in not configured yet", {
        description: "Use email below, or ask your admin to enable the LinkedIn provider in the backend settings.",
      });
      setBusy(null);
    }
  };

  const handleGoogle = async () => {
    setBusy("google");
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: { redirectTo: window.location.origin + "/onboarding" },
      });
      if (error) throw error;
    } catch (err: any) {
      toast.error(err.message ?? "Google sign-in failed");
      setBusy(null);
    }
  };

  const handleEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy("email");
    try {
      if (mode === "signup") {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: { emailRedirectTo: window.location.origin + "/onboarding", data: { full_name: name } },
        });
        if (error) throw error;
        toast.success("Welcome aboard", { description: "Check your inbox to confirm, then complete your profile." });
        navigate({ to: "/onboarding" });
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        toast.success("Signed in");
        navigate({ to: "/profile" });
      }
    } catch (err: any) {
      toast.error(err.message ?? "Something went wrong");
    } finally {
      setBusy(null);
    }
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
            Sync your LinkedIn and we'll prefill your role, company, and graduation year. Add one sentence of advice — that's it.
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
          <button
            disabled={busy !== null}
            onClick={handleLinkedIn}
            className="btn-press flex w-full items-center justify-center gap-2 rounded-full bg-[#0a66c2] px-5 py-3.5 text-base font-semibold text-white shadow-sm hover:opacity-95 disabled:opacity-50"
          >
            {busy === "linkedin" ? <Loader2 className="h-4 w-4 animate-spin" /> : <Linkedin className="h-5 w-5" />}
            Sync with LinkedIn · 1-click signup
          </button>

          <button
            disabled={busy !== null}
            onClick={handleGoogle}
            className="btn-press mt-3 flex w-full items-center justify-center gap-2 rounded-full border border-border bg-background px-5 py-3 text-sm font-medium hover:bg-surface disabled:opacity-50"
          >
            {busy === "google" ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
            Continue with Google
          </button>

          <div className="my-6 flex items-center gap-3 text-xs text-muted-foreground">
            <div className="h-px flex-1 bg-border" /> or use email <div className="h-px flex-1 bg-border" />
          </div>

          <form onSubmit={handleEmail} className="space-y-3">
            {mode === "signup" && (
              <input
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Full name"
                className="w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm outline-none focus:border-primary"
              />
            )}
            <input
              required
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Email"
              className="w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm outline-none focus:border-primary"
            />
            <input
              required
              type="password"
              minLength={6}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Password"
              className="w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm outline-none focus:border-primary"
            />
            <button
              disabled={busy !== null}
              className="btn-press flex w-full items-center justify-center gap-2 rounded-full bg-primary px-5 py-3 text-sm font-medium text-primary-foreground hover:opacity-95 disabled:opacity-50"
            >
              {busy === "email" ? <Loader2 className="h-4 w-4 animate-spin" /> : <Mail className="h-4 w-4" />}
              {mode === "signup" ? "Create account" : "Sign in"}
            </button>
          </form>

          <p className="mt-5 text-center text-xs text-muted-foreground">
            {mode === "signup" ? "Already on Almanac? " : "New here? "}
            <button onClick={() => setMode(mode === "signup" ? "signin" : "signup")} className="font-medium text-primary hover:underline">
              {mode === "signup" ? "Sign in" : "Create an account"}
            </button>
          </p>
        </div>
      </FadeIn>
    </div>
  );
}
