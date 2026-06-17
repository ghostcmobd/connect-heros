import { createFileRoute } from "@tanstack/react-router";
import { setCookie } from "@tanstack/react-start/server";

export const Route = createFileRoute("/api/auth/linkedin/start")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const clientId = process.env.LINKEDIN_CLIENT_ID;
        if (!clientId) {
          return new Response("LINKEDIN_CLIENT_ID not configured", { status: 500 });
        }

        const url = new URL(request.url);
        const redirectUri = `${url.origin}/api/auth/linkedin/callback`;

        const state = crypto.randomUUID();
        setCookie("li_oauth_state", state, {
          httpOnly: true,
          secure: true,
          sameSite: "lax",
          path: "/",
          maxAge: 60 * 10,
        });

        const authorize = new URL("https://www.linkedin.com/oauth/v2/authorization");
        authorize.searchParams.set("response_type", "code");
        authorize.searchParams.set("client_id", clientId);
        authorize.searchParams.set("redirect_uri", redirectUri);
        authorize.searchParams.set("state", state);
        authorize.searchParams.set("scope", "openid profile email");

        return new Response(null, {
          status: 302,
          headers: { Location: authorize.toString() },
        });
      },
    },
  },
});
