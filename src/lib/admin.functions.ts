import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";

export type AdminUserRow = {
  id: string;
  email: string | null;
  created_at: string;
  last_sign_in_at: string | null;
  provider: string | null;
  full_name: string;
  role_title: string | null;
  company: string | null;
  department: string | null;
  student_id: string | null;
  grad_year: number | null;
  city_name: string | null;
  linkedin_url: string | null;
  is_verified: boolean;
  is_published: boolean;
  is_admin: boolean;
};

async function assertAdmin(context: { supabase: any; userId: string }) {
  const { data, error } = await context.supabase.rpc("has_role", {
    _user_id: context.userId,
    _role: "admin",
  });
  if (error) throw error;
  if (!data) throw new Error("Forbidden");
}

export const listAllUsers = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<AdminUserRow[]> => {
    await assertAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const { data: usersData, error: usersErr } = await supabaseAdmin.auth.admin.listUsers({
      page: 1,
      perPage: 1000,
    });
    if (usersErr) throw usersErr;

    const userIds = usersData.users.map((u) => u.id);
    if (userIds.length === 0) return [];

    const { data: profiles } = await supabaseAdmin
      .from("profiles")
      .select(
        "id, full_name, role_title, company, department, student_id, grad_year, city_name, linkedin_url, is_verified, is_published"
      )
      .in("id", userIds);

    const { data: roles } = await supabaseAdmin
      .from("user_roles")
      .select("user_id, role")
      .in("user_id", userIds);

    const profileMap = new Map<string, any>((profiles ?? []).map((p: any) => [p.id, p]));
    const adminSet = new Set<string>(
      (roles ?? []).filter((r: any) => r.role === "admin").map((r: any) => r.user_id)
    );

    return usersData.users.map((u) => {
      const p = profileMap.get(u.id) ?? {};
      return {
        id: u.id,
        email: u.email ?? null,
        created_at: u.created_at,
        last_sign_in_at: u.last_sign_in_at ?? null,
        provider: u.app_metadata?.provider ?? null,
        full_name: p.full_name ?? "—",
        role_title: p.role_title ?? null,
        company: p.company ?? null,
        department: p.department ?? null,
        student_id: p.student_id ?? null,
        grad_year: p.grad_year ?? null,
        city_name: p.city_name ?? null,
        linkedin_url: p.linkedin_url ?? null,
        is_verified: !!p.is_verified,
        is_published: p.is_published ?? false,
        is_admin: adminSet.has(u.id),
      };
    });
  });

export const setVerified = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z.object({ userId: z.string().uuid(), verified: z.boolean() }).parse(input)
  )
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin
      .from("profiles")
      .update({ is_verified: data.verified })
      .eq("id", data.userId);
    if (error) throw error;
    return { ok: true };
  });

export const getMyAdminStatus = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<{ isAdmin: boolean }> => {
    const { data, error } = await context.supabase.rpc("has_role", {
      _user_id: context.userId,
      _role: "admin",
    });
    if (error) throw error;
    return { isAdmin: !!data };
  });
