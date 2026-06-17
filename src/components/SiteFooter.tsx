import { Link } from "@tanstack/react-router";

export function SiteFooter() {
  return (
    <footer className="mt-24 border-t border-[color:var(--gold)]/25 bg-[color:var(--parchment)]">
      <div className="mx-auto max-w-7xl px-5 py-10">
        <div className="flex flex-col items-start justify-between gap-6 sm:flex-row sm:items-center">
          <div className="flex items-center gap-3">
            <span className="relative grid h-9 w-9 place-items-center rounded-lg bg-primary font-display text-base font-black text-primary-foreground">
              A
              <span className="absolute -right-0.5 -top-0.5 h-2 w-2 rounded-full bg-[color:var(--gold)]" />
            </span>
            <div className="leading-tight">
              <div className="font-display text-base font-black tracking-tight">Almanac</div>
              <div className="text-[10px] font-bold uppercase tracking-[0.22em] text-[color:var(--gold-deep)]">
                Est. Alumni Registry
              </div>
            </div>
          </div>
          <nav className="flex flex-wrap gap-x-7 gap-y-2 font-display text-[11px] font-bold uppercase tracking-[0.18em]">
            <Link to="/wisdom" className="text-primary-soft hover:text-primary">Wisdom</Link>
            <Link to="/directory" className="text-primary-soft hover:text-primary">Directory</Link>
            <Link to="/map" className="text-primary-soft hover:text-primary">Map</Link>
            <Link to="/match" className="text-primary-soft hover:text-primary">Match</Link>
            <Link to="/auth" className="text-primary-soft hover:text-primary">Join</Link>
          </nav>
        </div>
        <div className="mt-8 flex flex-col gap-2 border-t border-[color:var(--gold)]/15 pt-5 text-[10px] font-semibold uppercase tracking-[0.22em] text-primary-soft/80 sm:flex-row sm:items-center sm:justify-between">
          <span>© {new Date().getFullYear()} Almanac — Alumni × Students</span>
          <span>Bound by curiosity, carried by network.</span>
        </div>
      </div>
    </footer>
  );
}
