import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";

export const getMyProfile = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("profiles")
      .select(
        "id, full_name, headline, role_title, company, grad_year, city_name, city_lat, city_lng, message_to_juniors, avatar_url, linkedin_url, department, student_id, profile_help_tags(tag_id, help_tags(slug,label))"
      )
      .eq("id", context.userId)
      .maybeSingle();
    if (error) throw error;
    return data;
  });

const profileSchema = z.object({
  full_name: z.string().trim().min(1).max(120),
  headline: z.string().trim().max(160).optional().nullable(),
  role_title: z.string().trim().max(120).optional().nullable(),
  company: z.string().trim().max(120).optional().nullable(),
  grad_year: z.number().int().min(1950).max(2035).optional().nullable(),
  city_name: z.string().trim().max(120).optional().nullable(),
  city_lat: z.number().min(-90).max(90).optional().nullable(),
  city_lng: z.number().min(-180).max(180).optional().nullable(),
  message_to_juniors: z.string().trim().max(400).optional().nullable(),
  linkedin_url: z.string().trim().url().max(200).optional().nullable().or(z.literal("")),
  department: z.string().trim().max(200).optional().nullable(),
  student_id: z.string().trim().max(64).optional().nullable(),
  tag_slugs: z.array(z.string().max(60)).max(10).default([]),
});

export const updateMyProfile = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => profileSchema.parse(input))
  .handler(async ({ data, context }) => {
    const { tag_slugs, ...patch } = data;
    const cleanLinkedin = patch.linkedin_url === "" ? null : patch.linkedin_url;
    const { error: upErr } = await context.supabase
      .from("profiles")
      .update({ ...patch, linkedin_url: cleanLinkedin })
      .eq("id", context.userId);
    if (upErr) throw upErr;

    // Reset tags
    await context.supabase.from("profile_help_tags").delete().eq("profile_id", context.userId);
    if (tag_slugs.length > 0) {
      const { data: tags } = await context.supabase.from("help_tags").select("id, slug").in("slug", tag_slugs);
      if (tags && tags.length > 0) {
        const rows = tags.map((t: any) => ({ profile_id: context.userId, tag_id: t.id }));
        const { error: tagErr } = await context.supabase.from("profile_help_tags").insert(rows);
        if (tagErr) throw tagErr;
      }
    }
    return { ok: true as const };
  });

export const upsertMyWisdom = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z
      .object({
        quote: z.string().trim().min(8).max(400),
        category: z.enum(["career", "academics", "life", "internships"]).default("career"),
      })
      .parse(input)
  )
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase
      .from("wisdom")
      .insert({ profile_id: context.userId, quote: data.quote, category: data.category });
    if (error) throw error;
    return { ok: true as const };
  });

export const sendMessage = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z.object({ recipient_id: z.string().uuid(), body: z.string().trim().min(1).max(2000) }).parse(input)
  )
  .handler(async ({ data, context }) => {
    if (data.recipient_id === context.userId) throw new Error("You can't message yourself.");
    const { error } = await context.supabase
      .from("messages")
      .insert({ sender_id: context.userId, recipient_id: data.recipient_id, body: data.body });
    if (error) throw error;
    return { ok: true as const };
  });

export const listMyMessages = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("messages")
      .select(
        "id, body, created_at, read_at, sender_id, recipient_id, sender:profiles!messages_sender_id_fkey(full_name, avatar_url), recipient:profiles!messages_recipient_id_fkey(full_name, avatar_url)"
      )
      .order("created_at", { ascending: false })
      .limit(100);
    if (error) throw error;
    return (data ?? []).map((m: any) => ({ ...m, direction: m.sender_id === context.userId ? "out" : "in" }));
  });
