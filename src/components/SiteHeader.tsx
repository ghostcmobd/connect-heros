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
    { to: "/map", label: "Map" },
    { to: "/wisdom", label: "Wisdom" },
  ] as const;

  const onSignOut = async () => {
    await supabase.auth.signOut();
    navigate({ to: "/", replace: true });
  };

  return (
    <header className="sticky top-0 z-30 border-b border-border/60 bg-background/80 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-5">
        <Link to="/" className="flex items-center gap-2">
          <span className="grid h-8 w-8 place-items-center rounded-lg bg-primary text-primary-foreground font-semibold">A</span>
          <span className="text-base font-semibold tracking-tight">Almanac</span>
        </Link>

        <nav className="hidden items-center gap-1 md:flex">
          {navItems.map((n) => {
            const active = pathname === n.to || (n.to !== "/" && pathname.startsWith(n.to));
            return (
              <Link
                key={n.to}
                to={n.to}
                className={`rounded-full px-4 py-1.5 text-sm transition-colors ${
                  active ? "bg-surface text-primary" : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {n.label}
              </Link>
            );
          })}
        </nav>

        <div className="flex items-center gap-2">
          {userId ? (
            <>
              <Link
                to="/profile"
                className="btn-press hidden rounded-full border border-border bg-background px-4 py-2 text-sm font-medium hover:bg-surface sm:inline-flex"
              >
                My profile
              </Link>
              <button
                onClick={onSignOut}
                className="btn-press inline-flex items-center gap-1.5 rounded-full px-3 py-2 text-sm text-muted-foreground hover:text-foreground"
              >
                <LogOut className="h-4 w-4" /> Sign out
              </button>
            </>
          ) : (
            <Link
              to="/auth"
              className="btn-press inline-flex items-center gap-2 rounded-full bg-[#0a66c2] px-4 py-2 text-sm font-medium text-white shadow-sm hover:opacity-95"
            >
              <Linkedin className="h-4 w-4" />
              Sync with LinkedIn
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}
