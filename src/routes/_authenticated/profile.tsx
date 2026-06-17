import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { getMyProfile, updateMyProfile, upsertMyWisdom } from "@/lib/me.functions";
import { getHelpTags } from "@/lib/site.functions";
import { toast } from "sonner";
import { Loader2, Save, MessageSquarePlus } from "lucide-react";

export const Route = createFileRoute("/_authenticated/profile")({
  head: () => ({ meta: [{ title: "My profile — Almanac" }] }),
  component: ProfilePage,
});

function ProfilePage() {
  const fetchMe = useServerFn(getMyProfile);
  const fetchTags = useServerFn(getHelpTags);
  const updateFn = useServerFn(updateMyProfile);
  const wisdomFn = useServerFn(upsertMyWisdom);
  const qc = useQueryClient();

  const meQ = useQuery({ queryKey: ["me"], queryFn: () => fetchMe() });
  const tagsQ = useQuery({ queryKey: ["help_tags"], queryFn: () => fetchTags() });

  const [form, setForm] = useState<any>(null);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);
  const [newWisdom, setNewWisdom] = useState("");

  useEffect(() => {
    if (meQ.data && !form) {
      const m: any = meQ.data;
      setForm({
        full_name: m.full_name ?? "",
        headline: m.headline ?? "",
        role_title: m.role_title ?? "",
        company: m.company ?? "",
        grad_year: m.grad_year ? String(m.grad_year) : "",
        city_name: m.city_name ?? "",
        city_lat: m.city_lat,
        city_lng: m.city_lng,
        message_to_juniors: m.message_to_juniors ?? "",
        linkedin_url: m.linkedin_url ?? "",
      });
      setSelectedTags((m.profile_help_tags ?? []).map((p: any) => p.help_tags?.slug).filter(Boolean));
    }
  }, [meQ.data, form]);

  if (meQ.isLoading || !form) return <div className="grid h-[60vh] place-items-center"><Loader2 className="h-5 w-5 animate-spin" /></div>;

  const toggleTag = (slug: string) =>
    setSelectedTags((prev) => (prev.includes(slug) ? prev.filter((s) => s !== slug) : prev.length < 6 ? [...prev, slug] : prev));

  const save = async () => {
    setBusy(true);
    try {
      let lat = form.city_lat ?? null;
      let lng = form.city_lng ?? null;
      if (form.city_name && (lat == null || lng == null)) {
        try {
          const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&limit=1&q=${encodeURIComponent(form.city_name)}`);
          const arr = await res.json();
          if (arr?.[0]) { lat = parseFloat(arr[0].lat); lng = parseFloat(arr[0].lon); }
        } catch { /* ignore */ }
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
          tag_slugs: selectedTags,
        },
      });
      toast.success("Profile saved");
      qc.invalidateQueries({ queryKey: ["me"] });
      qc.invalidateQueries({ queryKey: ["directory"] });
    } catch (e: any) {
      toast.error(e?.message ?? "Failed to save");
    } finally { setBusy(false); }
  };

  const postWisdom = async () => {
    if (newWisdom.trim().length < 8) return toast.error("A bit longer please");
    setBusy(true);
    try {
      await wisdomFn({ data: { quote: newWisdom.trim(), category: "career" } });
      toast.success("Posted to the Wisdom Wall");
      setNewWisdom("");
      qc.invalidateQueries({ queryKey: ["wisdom"] });
    } catch (e: any) {
      toast.error(e?.message ?? "Failed");
    } finally { setBusy(false); }
  };

  return (
    <div className="mx-auto max-w-3xl px-5 py-12">
      <div className="mb-8 flex items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">My profile</h1>
          <p className="mt-1 text-sm text-muted-foreground">Edit how you appear on the directory and the map.</p>
        </div>
        <Link to="/messages" className="text-sm text-primary underline-offset-4 hover:underline">My messages</Link>
      </div>

      <div className="soft-card space-y-5 p-6 sm:p-8">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <Input label="Full name" value={form.full_name} onChange={(v) => setForm({ ...form, full_name: v })} />
          <Input label="Class year" value={form.grad_year} onChange={(v) => setForm({ ...form, grad_year: v })} />
          <Input label="Role" value={form.role_title} onChange={(v) => setForm({ ...form, role_title: v })} />
          <Input label="Company" value={form.company} onChange={(v) => setForm({ ...form, company: v })} />
          <Input label="City" value={form.city_name} onChange={(v) => setForm({ ...form, city_name: v, city_lat: null, city_lng: null })} />
          <Input label="LinkedIn URL" value={form.linkedin_url} onChange={(v) => setForm({ ...form, linkedin_url: v })} />
        </div>
        <Input label="Headline" value={form.headline} onChange={(v) => setForm({ ...form, headline: v })} />
        <div>
          <label className="text-sm font-medium">Message to juniors</label>
          <textarea
            rows={3}
            maxLength={400}
            value={form.message_to_juniors}
            onChange={(e) => setForm({ ...form, message_to_juniors: e.target.value })}
            className="mt-2 w-full rounded-xl border border-border bg-background px-4 py-3 text-sm outline-none focus:border-primary"
          />
        </div>
        <div>
          <label className="text-sm font-medium">How you can help</label>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {(tagsQ.data ?? []).map((t: any) => {
              const on = selectedTags.includes(t.slug);
              return (
                <button
                  key={t.slug}
                  type="button"
                  onClick={() => toggleTag(t.slug)}
                  className={`btn-press rounded-full px-3.5 py-1.5 text-sm ${
                    on ? "bg-primary text-primary-foreground" : "border border-border bg-background text-muted-foreground"
                  }`}
                >
                  {t.label}
                </button>
              );
            })}
          </div>
        </div>
        <button onClick={save} disabled={busy} className="btn-press inline-flex items-center gap-2 rounded-full bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground disabled:opacity-50">
          {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          Save profile
        </button>
      </div>

      <div className="soft-card mt-8 p-6 sm:p-8">
        <h2 className="text-lg font-semibold">Post to the Wisdom Wall</h2>
        <p className="mt-1 text-sm text-muted-foreground">Short, honest, the kind of thing you'd say in person.</p>
        <textarea
          rows={3}
          value={newWisdom}
          onChange={(e) => setNewWisdom(e.target.value)}
          placeholder="One sentence of advice…"
          className="mt-3 w-full rounded-xl border border-border bg-background px-4 py-3 text-sm outline-none focus:border-primary"
        />
        <button onClick={postWisdom} disabled={busy} className="btn-press mt-3 inline-flex items-center gap-2 rounded-full border border-border bg-background px-5 py-2.5 text-sm font-medium hover:bg-surface disabled:opacity-50">
          <MessageSquarePlus className="h-4 w-4" /> Post snippet
        </button>
      </div>
    </div>
  );
}

function Input({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <label className="block">
      <span className="text-sm font-medium">{label}</span>
      <input
        value={value ?? ""}
        onChange={(e) => onChange(e.target.value)}
        className="mt-1.5 w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm outline-none focus:border-primary"
      />
    </label>
  );
}
