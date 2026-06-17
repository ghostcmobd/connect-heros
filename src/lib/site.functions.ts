import { createServerFn } from "@tanstack/react-start";
import { createClient } from "@supabase/supabase-js";
import { z } from "zod";

function publicClient() {
  return createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_PUBLISHABLE_KEY!, {
    auth: { storage: undefined, persistSession: false, autoRefreshToken: false },
  });
}

export type WisdomItem = {
  id: string;
  quote: string;
  category: "career" | "academics" | "life" | "internships";
  created_at: string;
  profile: {
    id: string;
    full_name: string;
    grad_year: number | null;
    role_title: string | null;
    company: string | null;
    avatar_url: string | null;
  };
};

export type DirectoryItem = {
  id: string;
  full_name: string;
  headline: string | null;
  role_title: string | null;
  company: string | null;
  grad_year: number | null;
  city_name: string | null;
  department: string | null;
  message_to_juniors: string | null;
  avatar_url: string | null;
  linkedin_url: string | null;
  is_verified: boolean;
  tags: { slug: string; label: string }[];
};

export type CityPin = {
  city_name: string;
  lat: number;
  lng: number;
  count: number;
  alumni: { id: string; full_name: string; role_title: string | null; company: string | null }[];
};

export const getWisdomFeed = createServerFn({ method: "GET" })
  .inputValidator((input: unknown) =>
    z
      .object({
        category: z.enum(["career", "academics", "life", "internships"]).optional(),
        limit: z.number().int().min(1).max(200).default(80),
      })
      .parse(input ?? {})
  )
  .handler(async ({ data }): Promise<WisdomItem[]> => {
    const sb = publicClient();
    let q = sb
      .from("wisdom")
      .select(
        "id, quote, category, created_at, profile:profiles!inner(id, full_name, grad_year, role_title, company, avatar_url, is_published)"
      )
      .order("created_at", { ascending: false })
      .limit(data.limit);
    if (data.category) q = q.eq("category", data.category);
    const { data: rows, error } = await q;
    if (error) throw error;
    return (rows ?? [])
      .filter((r: any) => r.profile?.is_published)
      .map((r: any) => ({
        id: r.id,
        quote: r.quote,
        category: r.category,
        created_at: r.created_at,
        profile: {
          id: r.profile.id,
          full_name: r.profile.full_name,
          grad_year: r.profile.grad_year,
          role_title: r.profile.role_title,
          company: r.profile.company,
          avatar_url: r.profile.avatar_url,
        },
      }));
  });

export const getDirectory = createServerFn({ method: "GET" })
  .inputValidator((input: unknown) =>
    z
      .object({
        q: z.string().trim().max(80).optional(),
        tag: z.string().trim().max(60).optional(),
        gradYearMin: z.number().int().optional(),
        gradYearMax: z.number().int().optional(),
        city: z.string().trim().max(80).optional(),
      })
      .parse(input ?? {})
  )
  .handler(async ({ data }): Promise<DirectoryItem[]> => {
    const sb = publicClient();
    let query = sb
      .from("profiles")
      .select(
        "id, full_name, headline, role_title, company, grad_year, city_name, department, message_to_juniors, avatar_url, linkedin_url, profile_help_tags(help_tags(slug,label))"
      )
      .eq("is_published", true)
      .order("full_name", { ascending: true });
    if (data.q) {
      const s = `%${data.q}%`;
      query = query.or(`full_name.ilike.${s},company.ilike.${s},role_title.ilike.${s},headline.ilike.${s}`);
    }
    if (data.city) query = query.ilike("city_name", `%${data.city}%`);
    if (data.gradYearMin) query = query.gte("grad_year", data.gradYearMin);
    if (data.gradYearMax) query = query.lte("grad_year", data.gradYearMax);
    const { data: rows, error } = await query;
    if (error) throw error;
    let mapped: DirectoryItem[] = (rows ?? []).map((r: any) => ({
      id: r.id,
      full_name: r.full_name,
      headline: r.headline,
      role_title: r.role_title,
      company: r.company,
      grad_year: r.grad_year,
      city_name: r.city_name,
      department: r.department ?? null,
      message_to_juniors: r.message_to_juniors,
      avatar_url: r.avatar_url,
      linkedin_url: r.linkedin_url,
      tags: (r.profile_help_tags ?? []).map((p: any) => p.help_tags).filter(Boolean),
    }));
    if (data.tag) mapped = mapped.filter((p) => p.tags.some((t) => t.slug === data.tag));
    return mapped;
  });


export const getAlumnusById = createServerFn({ method: "GET" })
  .inputValidator((input: unknown) => z.object({ id: z.string().uuid() }).parse(input))
  .handler(async ({ data }) => {
    const sb = publicClient();
    const { data: profile, error } = await sb
      .from("profiles")
      .select(
        "id, full_name, headline, role_title, company, grad_year, city_name, city_lat, city_lng, message_to_juniors, avatar_url, linkedin_url, department, profile_help_tags(help_tags(slug,label))"
      )
      .eq("id", data.id)
      .eq("is_published", true)
      .maybeSingle();
    if (error) throw error;
    if (!profile) return null;
    const { data: wisdom } = await sb
      .from("wisdom")
      .select("id, quote, category, created_at")
      .eq("profile_id", data.id)
      .order("created_at", { ascending: false });
    return {
      ...(profile as any),
      tags: ((profile as any).profile_help_tags ?? []).map((p: any) => p.help_tags).filter(Boolean),
      wisdom: wisdom ?? [],
    };
  });

export const getMapPins = createServerFn({ method: "GET" }).handler(async (): Promise<CityPin[]> => {
  const sb = publicClient();
  const { data, error } = await sb
    .from("profiles")
    .select("id, full_name, role_title, company, city_name, city_lat, city_lng")
    .eq("is_published", true)
    .not("city_lat", "is", null);
  if (error) throw error;
  const groups = new Map<string, CityPin>();
  for (const r of (data ?? []) as any[]) {
    const key = r.city_name;
    if (!key || r.city_lat == null || r.city_lng == null) continue;
    if (!groups.has(key)) {
      groups.set(key, { city_name: key, lat: r.city_lat, lng: r.city_lng, count: 0, alumni: [] });
    }
    const g = groups.get(key)!;
    g.count += 1;
    g.alumni.push({ id: r.id, full_name: r.full_name, role_title: r.role_title, company: r.company });
  }
  return [...groups.values()];
});

export const getHelpTags = createServerFn({ method: "GET" }).handler(async () => {
  const sb = publicClient();
  const { data, error } = await sb.from("help_tags").select("slug, label").order("label");
  if (error) throw error;
  return data ?? [];
});
