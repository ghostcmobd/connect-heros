import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Linkedin, LogOut } from "lucide-react";

export function SiteHeader() {
  const navigate = useNavigate();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setUserId(data.session?.user.id ?? null));
    const { data: sub } = supabase.auth.onAuthStateChange((_e, session) => {
      setUserId(session?.user.id ?? null);
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  const navItems = [
    { to: "/", label: "Home" },
    { to: "/directory", label: "Directory" },
    { to: "/companies", label: "Companies" },
    { to: "/map", label: "Map" },
    { to: "/wisdom", label: "Wisdom" },
  ] as const;

  const onSignOut = async () => {
    await supabase.auth.signOut();
    navigate({ to: "/", replace: true });
  };

  return (
    <header className="sticky top-0 z-30 border-b border-[color:var(--gold)]/20 bg-[color:var(--parchment)]/85 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-5">
        <Link to="/" className="flex items-center gap-2.5">
          <span className="relative grid h-9 w-9 place-items-center rounded-lg bg-primary font-display text-base font-black text-primary-foreground">
            A
            <span className="absolute -right-0.5 -top-0.5 h-2 w-2 rounded-full bg-[color:var(--gold)]" />
          </span>
          <span className="font-display text-lg font-black tracking-tight">Almanac</span>
        </Link>

        <nav className="hidden items-center gap-1 md:flex">
          {navItems.map((n) => {
            const active = pathname === n.to || (n.to !== "/" && pathname.startsWith(n.to));
            return (
              <Link
                key={n.to}
                to={n.to}
                className={`relative px-4 py-1.5 font-display text-[11px] font-bold uppercase tracking-[0.18em] transition-colors ${
                  active ? "text-primary" : "text-primary-soft hover:text-primary"
                }`}
              >
                {n.label}
                {active && (
                  <span className="absolute inset-x-3 -bottom-0.5 h-[2px] rounded-full bg-[color:var(--gold)]" />
                )}
              </Link>
            );
          })}
        </nav>

        <div className="flex items-center gap-2">
          {userId ? (
            <>
              <Link
                to="/profile"
                className="btn-press hidden rounded-full border border-[color:var(--gold)]/40 bg-background px-4 py-2 font-display text-[11px] font-bold uppercase tracking-[0.18em] hover:border-[color:var(--gold)] sm:inline-flex"
              >
                My profile
              </Link>
              <button
                onClick={onSignOut}
                className="btn-press inline-flex items-center gap-1.5 rounded-full px-3 py-2 text-sm text-primary-soft hover:text-primary"
              >
                <LogOut className="h-4 w-4" /> Sign out
              </button>
            </>
          ) : (
            <Link
              to="/auth"
              aria-label="Sign in with LinkedIn"
              className="btn-press inline-flex items-center gap-2 rounded-full bg-[#0A66C2] px-3 py-2 font-display text-[11px] font-bold uppercase tracking-[0.18em] text-white shadow-sm transition-colors hover:bg-[#004182] sm:px-4"
            >
              <Linkedin className="h-4 w-4 shrink-0" fill="currentColor" stroke="none" />
              <span className="hidden sm:inline">Sign in with LinkedIn</span>
              <span className="sm:hidden">Sign in</span>
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}
