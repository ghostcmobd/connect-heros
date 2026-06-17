import { createFileRoute } from "@tanstack/react-router";
import { getCookie, deleteCookie } from "@tanstack/react-start/server";

export const Route = createFileRoute("/api/auth/linkedin/callback")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const url = new URL(request.url);
        const code = url.searchParams.get("code");
        const state = url.searchParams.get("state");
        const error = url.searchParams.get("error");
        const redirectUri = `${url.origin}/api/auth/linkedin/callback`;

        if (error) {
          return redirectToAuth(url.origin, `LinkedIn error: ${error}`);
        }
        if (!code || !state) {
          return redirectToAuth(url.origin, "Missing code or state");
        }

        const cookieState = getCookie("li_oauth_state");
        deleteCookie("li_oauth_state", { path: "/" });
        if (!cookieState || cookieState !== state) {
          return redirectToAuth(url.origin, "Invalid OAuth state");
        }

        const clientId = process.env.LINKEDIN_CLIENT_ID;
        const clientSecret = process.env.LINKEDIN_CLIENT_SECRET;
        if (!clientId || !clientSecret) {
          return redirectToAuth(url.origin, "LinkedIn credentials missing");
        }

        // 1. Exchange code -> access token
        const tokenRes = await fetch("https://www.linkedin.com/oauth/v2/accessToken", {
          method: "POST",
          headers: { "Content-Type": "application/x-www-form-urlencoded" },
          body: new URLSearchParams({
            grant_type: "authorization_code",
            code,
            redirect_uri: redirectUri,
            client_id: clientId,
            client_secret: clientSecret,
          }),
        });
        if (!tokenRes.ok) {
          const t = await tokenRes.text();
          console.error("LinkedIn token exchange failed", tokenRes.status, t);
          return redirectToAuth(url.origin, "Token exchange failed");
        }
        const { access_token } = (await tokenRes.json()) as { access_token: string };

        // 2. Fetch profile
        const userRes = await fetch("https://api.linkedin.com/v2/userinfo", {
          headers: { Authorization: `Bearer ${access_token}` },
        });
        if (!userRes.ok) {
          return redirectToAuth(url.origin, "Failed to fetch LinkedIn profile");
        }
        const profile = (await userRes.json()) as {
          sub: string;
          name?: string;
          given_name?: string;
          family_name?: string;
          email?: string;
          picture?: string;
        };

        if (!profile.email) {
          return redirectToAuth(url.origin, "LinkedIn did not return an email");
        }

        const fullName = profile.name ?? [profile.given_name, profile.family_name].filter(Boolean).join(" ") || profile.email;
        const avatarUrl = profile.picture ?? null;
        const linkedinId = profile.sub;

        // 3. Create or update Supabase user
        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

        // Find existing user by email
        let userId: string | null = null;
        const { data: list, error: listErr } = await supabaseAdmin.auth.admin.listUsers({
          page: 1,
          perPage: 200,
        });
        if (listErr) {
          console.error("listUsers failed", listErr);
          return redirectToAuth(url.origin, "Auth lookup failed");
        }
        const existing = list.users.find((u) => u.email?.toLowerCase() === profile.email!.toLowerCase());

        if (existing) {
          userId = existing.id;
          await supabaseAdmin.auth.admin.updateUserById(existing.id, {
            user_metadata: {
              ...existing.user_metadata,
              full_name: fullName,
              avatar_url: avatarUrl,
              linkedin_id: linkedinId,
            },
          });
        } else {
          const { data: created, error: createErr } = await supabaseAdmin.auth.admin.createUser({
            email: profile.email,
            email_confirm: true,
            user_metadata: {
              full_name: fullName,
              avatar_url: avatarUrl,
              linkedin_id: linkedinId,
            },
          });
          if (createErr || !created.user) {
            console.error("createUser failed", createErr);
            return redirectToAuth(url.origin, "Could not create account");
          }
          userId = created.user.id;
        }

        // 4. Generate magic link to establish session
        const { data: linkData, error: linkErr } = await supabaseAdmin.auth.admin.generateLink({
          type: "magiclink",
          email: profile.email,
        });
        if (linkErr || !linkData.properties?.hashed_token) {
          console.error("generateLink failed", linkErr);
          return redirectToAuth(url.origin, "Could not create session");
        }

        const tokenHash = linkData.properties.hashed_token;
        const next = existing ? "/profile" : "/onboarding";
        const dest = new URL(`${url.origin}/auth/verify`);
        dest.searchParams.set("token_hash", tokenHash);
        dest.searchParams.set("type", "magiclink");
        dest.searchParams.set("next", next);

        return new Response(null, {
          status: 302,
          headers: { Location: dest.toString() },
        });
      },
    },
  },
});

function redirectToAuth(origin: string, message: string) {
  const dest = new URL(`${origin}/auth`);
  dest.searchParams.set("error", message);
  return new Response(null, { status: 302, headers: { Location: dest.toString() } });
}
