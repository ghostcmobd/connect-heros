import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { getMyProfile, updateMyProfile, upsertMyWisdom } from "@/lib/me.functions";
import { getHelpTags } from "@/lib/site.functions";
import { DEPARTMENTS } from "@/lib/departments";
import { LocationPicker } from "@/components/LocationPicker";
import { toast } from "sonner";
import { Loader2, ArrowRight } from "lucide-react";

const STUDENT_ID_RE = /^\d{8}$/;

export const Route = createFileRoute("/_authenticated/onboarding")({
  head: () => ({ meta: [{ title: "Complete your profile — THE KNOT" }] }),
  component: Onboarding,
});

function Onboarding() {
  const navigate = useNavigate();
  const fetchMe = useServerFn(getMyProfile);
  const fetchTags = useServerFn(getHelpTags);
  const updateFn = useServerFn(updateMyProfile);
  const wisdomFn = useServerFn(upsertMyWisdom);

  const meQ = useQuery({ queryKey: ["me"], queryFn: () => fetchMe() });
  const tagsQ = useQuery({ queryKey: ["help_tags"], queryFn: () => fetchTags() });

  const [form, setForm] = useState({
    full_name: "",
    headline: "",
    role_title: "",
    company: "",
    grad_year: "",
    city_name: "",
    city_lat: null as number | null,
    city_lng: null as number | null,
    message_to_juniors: "",
    linkedin_url: "",
    department: "",
    student_id: "",
  });
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [wisdom, setWisdom] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (meQ.data) {
      const m: any = meQ.data;
      setForm({
        full_name: m.full_name ?? "",
        headline: m.headline ?? "",
        role_title: m.role_title ?? "",
        company: m.company ?? "",
        grad_year: m.grad_year ? String(m.grad_year) : "",
        city_name: m.city_name ?? "",
        city_lat: m.city_lat ?? null,
        city_lng: m.city_lng ?? null,
        message_to_juniors: m.message_to_juniors ?? "",
        linkedin_url: m.linkedin_url ?? "",
        department: m.department ?? "",
        student_id: m.student_id ?? "",
      });
      setSelectedTags((m.profile_help_tags ?? []).map((p: any) => p.help_tags?.slug).filter(Boolean));
    }
  }, [meQ.data]);

  const toggleTag = (slug: string) =>
    setSelectedTags((prev) => (prev.includes(slug) ? prev.filter((s) => s !== slug) : prev.length < 6 ? [...prev, slug] : prev));

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.department) {
      toast.error("Please select your department");
      return;
    }
    const sid = form.student_id.trim();
    if (!STUDENT_ID_RE.test(sid)) {
      toast.error("Student ID must be 8 digits (e.g. 23103113 — first 3 digits are your batch)");
      return;
    }
    setBusy(true);
    try {
      // Fall back to geocoding the typed city only when the map pin wasn't used
      let lat: number | null = form.city_lat;
      let lng: number | null = form.city_lng;
      if ((lat == null || lng == null) && form.city_name) {
        try {
          const res = await fetch(
            `https://nominatim.openstreetmap.org/search?format=json&limit=1&q=${encodeURIComponent(form.city_name)}`
          );
          const arr = await res.json();
          if (arr?.[0]) {
            lat = parseFloat(arr[0].lat);
            lng = parseFloat(arr[0].lon);
          }
        } catch {
          /* ignore */
        }
      }
      await updateFn({
        data: {
          full_name: form.full_name,
          headline: form.headline || null,
          role_title: form.role_title || null,
          company: form.company || null,
          grad_year: form.grad_year ? parseInt(form.grad_year, 10) : null,
          city_name: form.city_name || null,
          city_lat: lat,
          city_lng: lng,
          message_to_juniors: form.message_to_juniors || null,
          linkedin_url: form.linkedin_url || null,
          department: form.department || null,
          student_id: sid,
          tag_slugs: selectedTags,
        },
      });
      if (wisdom.trim().length >= 8) {
        await wisdomFn({ data: { quote: wisdom.trim(), category: "career" } });
      }
      toast.success("You're on the wall");
      navigate({ to: "/profile" });
    } catch (err: any) {
      toast.error(err?.message ?? "Couldn't save profile");
    } finally {
      setBusy(false);
    }
  };

  if (meQ.isLoading) return <div className="grid h-[60vh] place-items-center"><Loader2 className="h-5 w-5 animate-spin" /></div>;

  return (
    <div className="mx-auto max-w-2xl px-5 py-12">
      <span className="pill mb-4">Welcome</span>
      <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">Complete your profile</h1>
      <p className="mt-2 text-muted-foreground">Takes about two minutes. You can edit any of this later.</p>

      <form onSubmit={onSubmit} className="mt-8 space-y-6">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <Field label="Full name" required value={form.full_name} onChange={(v) => setForm((f) => ({ ...f, full_name: v }))} />
          <label className="block">
            <span className="text-sm font-medium">Student ID <span className="text-destructive">*</span></span>
            <input
              required
              inputMode="numeric"
              pattern="\d{8}"
              maxLength={8}
              value={form.student_id}
              onChange={(e) => setForm((f) => ({ ...f, student_id: e.target.value.replace(/\D/g, "").slice(0, 8) }))}
              placeholder="23103113"
              className="mt-1.5 w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm outline-none focus:border-primary"
            />
            <p className="mt-1 text-xs text-muted-foreground">
              8 digits. First 3 are your batch
              {form.student_id.length >= 3 && (
                <> — yours is batch <span className="font-semibold text-primary">{form.student_id.slice(0, 3)}</span></>
              )}
              .
            </p>
          </label>
        </div>

        <label className="block">
          <span className="text-sm font-medium">Department <span className="text-destructive">*</span></span>
          <select
            required
            value={form.department}
            onChange={(e) => setForm((f) => ({ ...f, department: e.target.value }))}
            className="mt-1.5 w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm outline-none focus:border-primary"
          >
            <option value="">Select your program…</option>
            {Object.entries(DEPARTMENTS).map(([group, items]) => (
              <optgroup key={group} label={group}>
                {items.map((d) => (
                  <option key={d} value={d}>{d}</option>
                ))}
              </optgroup>
            ))}
          </select>
        </label>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <Field label="Class year" value={form.grad_year} onChange={(v) => setForm((f) => ({ ...f, grad_year: v }))} placeholder="2022" />
          <Field label="Role" value={form.role_title} onChange={(v) => setForm((f) => ({ ...f, role_title: v }))} placeholder="Product Designer" />
          <Field label="Company" value={form.company} onChange={(v) => setForm((f) => ({ ...f, company: v }))} placeholder="Stripe" />
          <Field label="LinkedIn URL" value={form.linkedin_url} onChange={(v) => setForm((f) => ({ ...f, linkedin_url: v }))} placeholder="https://linkedin.com/in/..." />
        </div>

        <div>
          <label className="text-sm font-medium">Where are you based?</label>
          <p className="mb-2 text-xs text-muted-foreground">Drop a pin or share your live location — used on the alumni map.</p>
          <LocationPicker
            value={{ city_name: form.city_name, city_lat: form.city_lat, city_lng: form.city_lng }}
            onChange={(v) => setForm((f) => ({ ...f, ...v }))}
          />
        </div>

        <Field label="Headline" value={form.headline} onChange={(v) => setForm((f) => ({ ...f, headline: v }))} placeholder="Designing payments at Stripe" />

        <div>
          <label className="text-sm font-medium">Message to juniors</label>
          <p className="text-xs text-muted-foreground">One honest sentence — the kind of thing you wish someone had told you.</p>
          <textarea
            rows={3}
            maxLength={400}
            value={form.message_to_juniors}
            onChange={(e) => setForm((f) => ({ ...f, message_to_juniors: e.target.value }))}
            className="mt-2 w-full rounded-xl border border-border bg-background px-4 py-3 text-sm outline-none focus:border-primary"
          />
        </div>

        <div>
          <label className="text-sm font-medium">How can you help? (pick up to 6)</label>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {(tagsQ.data ?? []).map((t: any) => {
              const on = selectedTags.includes(t.slug);
              return (
                <button
                  key={t.slug}
                  type="button"
                  onClick={() => toggleTag(t.slug)}
                  className={`btn-press rounded-full px-3.5 py-1.5 text-sm ${
                    on ? "bg-primary text-primary-foreground" : "border border-border bg-background text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {t.label}
                </button>
              );
            })}
          </div>
        </div>

        <div>
          <label className="text-sm font-medium">Add a Words-of-Wisdom snippet (optional)</label>
          <p className="text-xs text-muted-foreground">Appears on the homepage wall under your name.</p>
          <textarea
            rows={3}
            maxLength={400}
            value={wisdom}
            onChange={(e) => setWisdom(e.target.value)}
            placeholder="Don't stress too much about having the perfect GPA…"
            className="mt-2 w-full rounded-xl border border-border bg-background px-4 py-3 text-sm outline-none focus:border-primary"
          />
        </div>

        <button
          disabled={busy}
          className="btn-press inline-flex items-center gap-2 rounded-full bg-primary px-6 py-3 text-sm font-medium text-primary-foreground disabled:opacity-50"
        >
          {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <ArrowRight className="h-4 w-4" />}
          Save and continue
        </button>
      </form>
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  placeholder,
  required,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  required?: boolean;
}) {
  return (
    <label className="block">
      <span className="text-sm font-medium">{label}</span>
      <input
        required={required}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="mt-1.5 w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm outline-none focus:border-primary"
      />
    </label>
  );
}
