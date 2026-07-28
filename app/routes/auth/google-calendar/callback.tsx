import { redirect } from "react-router";
import { VITE_GOOGLE_CLIENT_ID } from "~/config/env";
import { prisma } from "~/lib/prisma";

export async function loader({
  request,
  params,
}: {
  request: Request;
  params: any;
}) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const error = url.searchParams.get("error");
  const companyId = url.searchParams.get("state");

  if (error) {
    return redirect(`/app/${companyId}/calendar?error=access_denied`);
  }

  if (!code) {
    return redirect(`/app/${companyId}/calendar?error=no_code`);
  }

  if (!companyId) {
    return redirect("/app/calendar?error=no_company");
  }

  try {
    // Intercambiar código por tokens
    const tokenResponse = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        client_id: VITE_GOOGLE_CLIENT_ID,
        client_secret: process.env.GOOGLE_CLIENT_SECRET as any,
        code,
        grant_type: "authorization_code",
        redirect_uri: `${new URL(request.url).origin}/auth/google-calendar/callback`,
      }),
    });

    if (!tokenResponse.ok) {
      const errorText = await tokenResponse.text();
      console.error("Token exchange error:", errorText);
      throw new Error(
        `Failed to exchange code for tokens: ${tokenResponse.status}`
      );
    }

    const tokens = await tokenResponse.json();
    console.log("Tokens received:", {
      hasAccessToken: !!tokens.access_token,
      hasRefreshToken: !!tokens.refresh_token,
      expiresIn: tokens.expires_in,
    });

    // Obtener información del usuario usando el header Authorization
    const userInfoResponse = await fetch(
      "https://www.googleapis.com/oauth2/v2/userinfo",
      {
        headers: {
          Authorization: `Bearer ${tokens.access_token}`,
        },
      }
    );

    if (!userInfoResponse.ok) {
      const errorText = await userInfoResponse.text();
      console.error("User info error:", errorText);
      throw new Error(`Failed to get user info: ${userInfoResponse.status}`);
    }

    const userInfo = await userInfoResponse.json();
    console.log("User info received:", {
      email: userInfo.email,
      name: userInfo.name,
    });

    // Obtener información del calendario principal usando el header Authorization
    const calendarResponse = await fetch(
      "https://www.googleapis.com/calendar/v3/calendars/primary",
      {
        headers: {
          Authorization: `Bearer ${tokens.access_token}`,
        },
      }
    );

    if (!calendarResponse.ok) {
      const errorText = await calendarResponse.text();
      console.error("Calendar info error:", errorText);
      throw new Error(
        `Failed to get calendar info: ${calendarResponse.status}`
      );
    }

    const calendarInfo = await calendarResponse.json();
    console.log("Calendar info received:", {
      id: calendarInfo.id,
      summary: calendarInfo.summary,
    });

    // Guardar información en la base de datos
    await prisma.company.update({
      where: { id: companyId },
      data: {
        conectedWithCalendar: true,
        googleCalendarId: calendarInfo.id,
        googleAccessToken: tokens.access_token,
        googleRefreshToken: tokens.refresh_token,
        googleTokenExpiry: new Date(Date.now() + tokens.expires_in * 1000),
        googleCalendarName: calendarInfo.summary,
        googleCalendarEmail: userInfo.email,
      },
    });

    return redirect(`/app/${companyId}/calendar?success=connected`);
  } catch (error) {
    console.error("Google Calendar auth error:", error);
    console.error("Error details:", {
      message: error instanceof Error ? error.message : "Unknown error",
      stack: error instanceof Error ? error.stack : undefined,
      companyId,
      hasCode: !!code,
      hasCompanyId: !!companyId,
    });
    return redirect(`/app/${companyId}/calendar?error=auth_failed`);
  }
}

export default function GoogleCalendarCallback() {
  return null;
}
