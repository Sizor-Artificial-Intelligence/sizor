import axios from "axios";
import { NODE_ENV } from "~/config/env";

// Enviar un correo
type typeEmail =
  | "welcome"
  | "code-reset-password"
  | "password-changed"
  | "payment-success-admin"
  | "payment-success-user"
  | "contact"
  | "admin-notification";
export async function sendEmail(
  type: typeEmail,
  to: string | string[],
  subject: string,
  params: any
): Promise<boolean> {
  try {
    if (NODE_ENV === "development") {
      console.log("DEBUG: Enviando correo a:", to);
      console.log("DEBUG: Tipo de correo:", type);
      console.log("DEBUG: Asunto:", subject);
      console.log("DEBUG: Parámetros:", params);
      return true;
    }
    console.log("DEBUG: Enviando correo a:", to);
    const URL =
      NODE_ENV === "development"
        ? process.env.VITE_API_URL_DEV
        : process.env.VITE_API_URL;
    await axios.post(
      `${URL}/queue`,
      {
        name: "EMAIL",
        data: {
          to,
          type,
          subject,
          params,
        },
      },
      {
        headers: {
          "X-API-KEY": process.env.SIZOR_API_KEY,
        },
      }
    );
    return true;
  } catch (error) {
    console.log(error);
    throw `Error al enviar el correo: ${error}`;
    return false;
  }
}

/**
 * Enviar un mensaje a una cola de RabbitMQ
 */
type typeQueue =
  | "EMAIL"
  | "AI_RESPONSE"
  | "TRAINING_FILE"
  | "AI_SENTIMENT_ANALYSIS";
export async function sendMessageToQueue(
  queue: typeQueue,
  tenantId: string,
  message: any
) {
  try {
    const URL =
      NODE_ENV === "development"
        ? process.env.VITE_API_URL_DEV
        : process.env.VITE_API_URL;
    await axios.post(
      `${URL}/queue`,
      {
        name: queue,
        data: {
          ...message,
          tenantId,
        },
      },
      {
        headers: {
          "X-API-KEY": process.env.SIZOR_API_KEY,
        },
      }
    );
    console.log("DEBUG: Mensaje enviado a la cola", queue);
  } catch (error) {
    console.log(error);
    throw `Error al enviar el mensaje a la cola ${queue}: ${error}`;
  }
}

// Seguridad - Validando que el API KEY sea correcto
/**
 * Valida que la petición entrante tenga una API Key válida en los headers.
 * @returns Retorna `true` si la API Key es válida.
 * @throws Error si la API Key no está presente o es incorrecta.
 */
export async function requireAuthAPI(request: Request) {
  const headers = request.headers;
  const apiKey = headers.get("Authorization") || headers.get("X-API-KEY");

  if (!apiKey) {
    throw "API Key es requerido";
  }

  if (apiKey !== process.env.SIZOR_API_KEY) {
    throw "API Key no válido";
  }

  return true;
}
