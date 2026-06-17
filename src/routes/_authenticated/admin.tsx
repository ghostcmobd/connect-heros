import { createFileRoute, redirect, useRouter } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import {
  getMyAdminStatus,
  listAllUsers,
  setVerified,
  type AdminUserRow,
} from "@/lib/admin.functions";
import { BadgeCheck, Search, ShieldCheck, ExternalLink } from "lucide-react";

export const Route = createFileRoute("/_authenticated/admin")({
  beforeLoad: async () => {
    try {
      const { isAdmin } = await getMyAdminStatus();
      if (!isAdmin) throw redirect({ to: "/" });
    } catch (e: any) {
      if (e?.isRedirect) throw e;
      throw redirect({ to: "/" });
    }
  },
  component: AdminPage,
});

function AdminPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const list = useServerFn(listAllUsers);
  const toggle = useServerFn(setVerified);

  const { data, isLoading } = useQuery({
    queryKey: ["admin", "users"],
    queryFn: () => list(),
  });

  const mutation = useMutation({
    mutationFn: (vars: { userId: string; verified: boolean }) =>
      toggle({ data: vars }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "users"] });
      router.invalidate();
    },
  });

  const [q, setQ] = useState("");
  const [showOnlyUnverified, setShowOnlyUnverified] = useState(false);

  const filtered = useMemo(() => {
    const rows: AdminUserRow[] = data ?? [];
    const needle = q.trim().toLowerCase();
    return rows.filter((r) => {
      if (showOnlyUnverified && r.is_verified) return false;
      if (!needle) return true;
      const hay = `${r.full_name} ${r.email ?? ""} ${r.company ?? ""} ${r.department ?? ""} ${r.student_id ?? ""}`.toLowerCase();
      return hay.includes(needle);
    });
  }, [data, q, showOnlyUnverified]);

  const stats = useMemo(() => {
    const rows: AdminUserRow[] = data ?? [];
    return {
      total: rows.length,
      verified: rows.filter((r) => r.is_verified).length,
      admins: rows.filter((r) => r.is_admin).length,
    };
  }, [data]);

  return (
    <div className="mx-auto max-w-7xl px-5 py-10">
      <header className="mb-8 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="font-display text-[11px] font-bold uppercase tracking-[0.18em] text-[color:var(--gold-deep)]">
            <ShieldCheck className="-mt-1 mr-1 inline h-4 w-4" /> Admin
          </p>
          <h1 className="font-display text-3xl font-black tracking-tight sm:text-4xl">
            Members & verification
          </h1>
          <p className="mt-2 text-sm text-primary-soft">
            Review every signed-in alum and grant verified badges after checking their student ID.
          </p>
        </div>
        <div className="flex gap-3 text-xs">
          <Stat label="Total" value={stats.total} />
          <Stat label="Verified" value={stats.verified} />
          <Stat label="Admins" value={stats.admins} />
        </div>
      </header>

      <div className="soft-card mb-6 flex flex-col gap-3 p-4 sm:flex-row sm:items-center">
        <div className="flex flex-1 items-center gap-2 rounded-full border border-border bg-background px-4 py-2.5">
          <Search className="h-4 w-4 text-muted-foreground" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search by name, email, student ID, company, department"
            className="w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground"
          />
        </div>
        <label className="inline-flex cursor-pointer items-center gap-2 rounded-full border border-border bg-background px-4 py-2.5 text-sm">
          <input
            type="checkbox"
            checked={showOnlyUnverified}
            onChange={(e) => setShowOnlyUnverified(e.target.checked)}
          />
          Only unverified
        </label>
      </div>

      {isLoading ? (
        <p className="p-8 text-center text-sm text-muted-foreground">Loading members…</p>
      ) : filtered.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-border bg-surface/40 p-12 text-center text-sm text-muted-foreground">
          No members match those filters.
        </p>
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-border bg-background">
          <table className="w-full min-w-[900px] text-sm">
            <thead className="bg-surface/60 text-left text-[11px] font-bold uppercase tracking-wider text-primary-soft">
              <tr>
                <th className="px-4 py-3">Alum</th>
                <th className="px-4 py-3">Email</th>
                <th className="px-4 py-3">Student ID</th>
                <th className="px-4 py-3">Department</th>
                <th className="px-4 py-3">Role / Company</th>
                <th className="px-4 py-3">Joined</th>
                <th className="px-4 py-3">Last sign-in</th>
                <th className="px-4 py-3 text-right">Verified</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filtered.map((r) => (
                <tr key={r.id} className="hover:bg-surface/40">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{r.full_name}</span>
                      {r.is_verified && (
                        <BadgeCheck className="h-4 w-4 text-[color:var(--gold-deep)]" fill="currentColor" stroke="white" strokeWidth={2} />
                      )}
                      {r.is_admin && (
                        <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-primary">
                          Admin
                        </span>
                      )}
                    </div>
                    {r.linkedin_url && (
                      <a href={r.linkedin_url} target="_blank" rel="noreferrer" className="mt-0.5 inline-flex items-center gap-1 text-[11px] text-primary-soft hover:text-primary">
                        LinkedIn <ExternalLink className="h-3 w-3" />
                      </a>
                    )}
                  </td>
                  <td className="px-4 py-3 text-xs text-primary-soft">{r.email ?? "—"}</td>
                  <td className="px-4 py-3 font-mono text-xs">{r.student_id ?? <span className="text-muted-foreground">—</span>}</td>
                  <td className="px-4 py-3 text-xs">{r.department ?? <span className="text-muted-foreground">—</span>}</td>
                  <td className="px-4 py-3 text-xs">
                    {r.role_title ? `${r.role_title}${r.company ? ` @ ${r.company}` : ""}` : <span className="text-muted-foreground">—</span>}
                  </td>
                  <td className="px-4 py-3 text-xs text-primary-soft">{fmt(r.created_at)}</td>
                  <td className="px-4 py-3 text-xs text-primary-soft">{fmt(r.last_sign_in_at)}</td>
                  <td className="px-4 py-3 text-right">
                    <button
                      onClick={() =>
                        mutation.mutate({ userId: r.id, verified: !r.is_verified })
                      }
                      disabled={mutation.isPending}
                      className={`btn-press inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[11px] font-bold uppercase tracking-wider transition-colors ${
                        r.is_verified
                          ? "bg-[color:var(--gold)]/20 text-[color:var(--gold-deep)] hover:bg-[color:var(--gold)]/30"
                          : "border border-border bg-background text-primary-soft hover:border-[color:var(--gold)] hover:text-primary"
                      }`}
                    >
                      <BadgeCheck className="h-3.5 w-3.5" />
                      {r.is_verified ? "Verified" : "Verify"}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-xl border border-border bg-background px-4 py-2 text-center">
      <p className="font-display text-xl font-black leading-none">{value}</p>
      <p className="mt-1 text-[10px] font-bold uppercase tracking-wider text-primary-soft">{label}</p>
    </div>
  );
}

function fmt(s: string | null) {
  if (!s) return "—";
  try {
    return new Date(s).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
  } catch {
    return "—";
  }
}
