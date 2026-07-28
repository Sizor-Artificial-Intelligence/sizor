import { redirect } from "react-router";
import { VITE_GOOGLE_CLIENT_ID } from "~/config/env";

export async function loader({ request }: { request: Request }) {
  const url = new URL(request.url);
  const companyId = url.searchParams.get("companyId");

  if (!companyId) {
    return redirect("/app/calendar?error=no_company");
  }

  // Generar URL de autorización de Google
  const redirectUri = `${new URL(request.url).origin}/auth/google-calendar/callback`;

  const authUrl = new URL("https://accounts.google.com/o/oauth2/v2/auth");
  authUrl.searchParams.set("client_id", VITE_GOOGLE_CLIENT_ID);
  authUrl.searchParams.set("redirect_uri", redirectUri);
  authUrl.searchParams.set("response_type", "code");
  authUrl.searchParams.set(
    "scope",
    "https://www.googleapis.com/auth/calendar.readonly https://www.googleapis.com/auth/calendar.events https://www.googleapis.com/auth/userinfo.email https://www.googleapis.com/auth/userinfo.profile"
  );
  authUrl.searchParams.set("access_type", "offline");
  authUrl.searchParams.set("prompt", "consent");
  authUrl.searchParams.set("state", companyId);

  return redirect(authUrl.toString());
}

export default function GoogleCalendarAuth() {
  return null;
}
