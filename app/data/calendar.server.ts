import { prisma } from "~/lib/prisma";

export interface CalendarEvent {
  id: string;
  summary: string;
  description?: string;
  start: {
    dateTime?: string;
    date?: string;
  };
  end: {
    dateTime?: string;
    date?: string;
  };
  location?: string;
  attendees?: Array<{
    email: string;
    displayName?: string;
    responseStatus: string;
  }>;
}

// Obtener los eventos del calendario
export async function getCalendarEvents(
  companyId: string
): Promise<{ events: CalendarEvent[] }> {
  try {
    const company = await prisma.company.findUnique({
      where: { id: companyId },
      select: {
        googleAccessToken: true,
        googleRefreshToken: true,
        googleTokenExpiry: true,
        googleCalendarId: true,
        conectedWithCalendar: true,
      },
    });

    // Si no está conectado, devolver lista vacía sin error
    if (!company?.conectedWithCalendar || !company.googleAccessToken) {
      return { events: [] };
    }

    // Verificar si el token ha expirado
    const now = new Date();
    const tokenExpiry = company.googleTokenExpiry;

    let accessToken = company.googleAccessToken;

    if (tokenExpiry && now >= tokenExpiry) {
      // Token expirado, intentar renovar
      if (company.googleRefreshToken) {
        accessToken = await refreshGoogleToken(
          company.googleRefreshToken,
          companyId
        );
      } else {
        throw new Error("Token expired and no refresh token available");
      }
    }

    // Obtener eventos del calendario
    const calendarId = company.googleCalendarId || "primary";
    const eventsResponse = await fetch(
      `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calendarId)}/events?timeMin=${new Date().toISOString()}&maxResults=50&singleEvents=true&orderBy=startTime`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }
    );

    if (!eventsResponse.ok) {
      if (eventsResponse.status === 401) {
        // Token inválido, intentar renovar
        if (company.googleRefreshToken) {
          accessToken = await refreshGoogleToken(
            company.googleRefreshToken,
            companyId
          );
          // Reintentar la petición con el nuevo token
          const retryResponse = await fetch(
            `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calendarId)}/events?timeMin=${new Date().toISOString()}&maxResults=50&singleEvents=true&orderBy=startTime`,
            {
              headers: {
                Authorization: `Bearer ${accessToken}`,
              },
            }
          );

          if (!retryResponse.ok) {
            throw new Error(
              `Failed to fetch calendar events: ${retryResponse.status}`
            );
          }

          const retryData = await retryResponse.json();
          return retryData.items || [];
        } else {
          throw new Error("Token expired and no refresh token available");
        }
      }
      throw new Error(
        `Failed to fetch calendar events: ${eventsResponse.status}`
      );
    }

    const data = await eventsResponse.json();
    return data.items || [];
  } catch (error) {
    console.error("Error fetching calendar events:", error);
    throw error;
  }
}

// Renovar el token de Google
async function refreshGoogleToken(
  refreshToken: string,
  companyId: string
): Promise<string> {
  const { VITE_GOOGLE_CLIENT_ID } = await import("~/config/env");

  const tokenResponse = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({
      client_id: VITE_GOOGLE_CLIENT_ID,
      client_secret: process.env.GOOGLE_CLIENT_SECRET as any,
      refresh_token: refreshToken,
      grant_type: "refresh_token",
    }),
  });

  if (!tokenResponse.ok) {
    throw new Error("Failed to refresh token");
  }

  const tokens = await tokenResponse.json();

  // Actualizar el token en la base de datos
  await prisma.company.update({
    where: { id: companyId },
    data: {
      googleAccessToken: tokens.access_token,
      googleTokenExpiry: new Date(Date.now() + tokens.expires_in * 1000),
    },
  });

  return tokens.access_token;
}

// Desconectar el calendario de Google
export async function disconnectGoogleCalendar(companyId: string) {
  await prisma.company.update({
    where: { id: companyId },
    data: {
      conectedWithCalendar: false,
      googleCalendarId: null,
      googleAccessToken: null,
      googleRefreshToken: null,
      googleTokenExpiry: null,
      googleCalendarName: null,
      googleCalendarEmail: null,
    },
  });
}
