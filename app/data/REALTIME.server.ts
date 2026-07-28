import { NODE_ENV } from "~/config/env";

// Notificar a la API de tiempo real
export async function notifyRealtimeAPI(endpoint: string, data: any) {
  try {
    const API_URL_FULL =
      NODE_ENV == "development"
        ? process.env.VITE_API_URL_DEV
        : process.env.VITE_API_URL;

    if (!process.env.SIZOR_API_KEY) {
      console.warn(
        "⚠️ SIZOR_API_KEY no configurada, saltando notificación de tiempo real"
      );
      return;
    }

    const response = await fetch(`${API_URL_FULL}/realtime/${endpoint}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-API-KEY": process.env.SIZOR_API_KEY,
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      console.error(
        `❌ Error notificando a la API: ${response.status} ${response.statusText}`
      );
    } else {
      console.log(`✅ Notificación enviada a la API: ${endpoint}`);
    }
  } catch (error) {
    console.error(`❌ Error enviando notificación a la API:`, error);
  }
}
