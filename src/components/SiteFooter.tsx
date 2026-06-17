import { Link } from "@tanstack/react-router";

export function SiteFooter() {
  return (
    <footer className="border-t border-border/60 bg-background">
      <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 px-5 py-8 text-sm text-muted-foreground sm:flex-row">
        <div className="flex items-center gap-2">
          <span className="grid h-6 w-6 place-items-center rounded-md bg-primary text-primary-foreground text-xs font-semibold">A</span>
          <span>Almanac — Alumni × Students</span>
        </div>
        <nav className="flex gap-5">
          <Link to="/" className="hover:text-foreground">Wisdom</Link>
          <Link to="/directory" className="hover:text-foreground">Directory</Link>
          <Link to="/map" className="hover:text-foreground">Map</Link>
          <Link to="/auth" className="hover:text-foreground">Join</Link>
        </nav>
      </div>
    </footer>
  );
}
