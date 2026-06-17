import { BadgeCheck } from "lucide-react";

export function VerifiedBadge({ size = "sm" }: { size?: "sm" | "md" }) {
  const cls = size === "md" ? "h-5 w-5" : "h-4 w-4";
  return (
    <span
      title="Verified alum"
      aria-label="Verified alum"
      className="inline-flex shrink-0 items-center text-[color:var(--gold-deep)]"
    >
      <BadgeCheck className={cls} fill="currentColor" stroke="white" strokeWidth={2} />
    </span>
  );
}
