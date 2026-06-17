import type { WisdomItem } from "@/lib/site.functions";
import { Link } from "@tanstack/react-router";
import { Quote } from "lucide-react";

const categoryStyles: Record<string, string> = {
  career: "from-[oklch(0.94_0.04_145)] to-transparent",
  academics: "from-[oklch(0.94_0.025_250)] to-transparent",
  life: "from-[oklch(0.94_0.04_85)] to-transparent",
  internships: "from-[oklch(0.94_0.04_320)] to-transparent",
};

export function WisdomCard({ item }: { item: WisdomItem }) {
  const initials = item.profile.full_name
    .split(" ")
    .map((s) => s[0])
    .slice(0, 2)
    .join("");
  return (
    <Link
      to="/alumni/$id"
      params={{ id: item.profile.id }}
      className={`soft-card soft-card-hover relative block break-avoid mb-5 overflow-hidden p-6`}
    >
      <div className={`pointer-events-none absolute inset-0 bg-gradient-to-br ${categoryStyles[item.category] ?? ""} opacity-60`} />
      <div className="relative">
        <Quote className="h-5 w-5 text-primary-soft" strokeWidth={2.25} />
        <p className="mt-3 text-[15px] leading-relaxed text-foreground">
          {item.quote}
        </p>
        <div className="mt-5 flex items-center gap-3">
          <div className="grid h-9 w-9 place-items-center rounded-full border border-border bg-surface text-xs font-semibold text-primary">
            {initials}
          </div>
          <div className="leading-tight">
            <div className="text-sm font-semibold">{item.profile.full_name}</div>
            <div className="text-xs text-muted-foreground">
              Class of {item.profile.grad_year ?? "—"} · {item.profile.role_title}
              {item.profile.company ? ` at ${item.profile.company}` : ""}
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
}
