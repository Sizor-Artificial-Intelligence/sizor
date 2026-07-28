import { NODE_ENV } from "~/config/env";
import axios from "axios";

/**
 * Determina el tipo de mensaje basado en attachments
 */
function getMessageType(message: any): string {
  if (!message?.attachments) return "TEXT";

  const hasAudio = message.attachments.some((att: any) => att.type === "audio");
  const hasImage = message.attachments.some((att: any) => att.type === "image");
  const hasVideo = message.attachments.some((att: any) => att.type === "video");

  if (hasAudio) return "AUDIO";
  if (hasVideo) return "VIDEO";
  if (hasImage) return "IMAGE";
  return "ATTACHMENT";
}

/**
 * Encola un mensaje para procesamiento de IA
 */
export async function enqueueAIResponse(
  tenantId: string,
  companyId: string,
  contactId: string,
  message: any,
  socialNetwork: string
) {
  try {
    const API_URL_FULL =
      NODE_ENV == "development"
        ? process.env.VITE_API_URL_DEV
        : process.env.VITE_API_URL;

    if (!process.env.SIZOR_API_KEY) {
      console.warn("⚠️ SIZOR_API_KEY no configurada, saltando envío a cola");
      return;
    }

    // Preparar datos del mensaje para la cola
    const queueData = {
      tenantId,
      companyId,
      contactId,
      messageData: {
        text: message?.text || null,
        attachments: message?.attachments || null,
        type: getMessageType(message),
      },
      timestamp: Date.now(),
      priority: 1, // Prioridad normal
      socialNetwork,
    };

    // Enviar a la cola de IA
    const response = await fetch(`${API_URL_FULL}/queue`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-API-KEY": process.env.SIZOR_API_KEY,
      },
      body: JSON.stringify({
        name: "AI_RESPONSE",
        data: queueData,
      }),
    });

    if (!response.ok) {
      throw new Error(`Error enviando a cola: ${response.status}`);
    }

    console.log(
      `📤 Mensaje enviado a cola AI_RESPONSE para contacto ${contactId}`
    );
  } catch (error) {
    console.error(`❌ Error enviando mensaje a cola de IA:`, error);
    throw error;
  }
}

/* Generar mensaje de la IA usando Threads */
export async function generateIAResponse(
  tenantId: string,
  companyId: string,
  contactId: string,
  metadata: any,
  socialNetwork: string
): Promise<{
  tokens: number;
  response: string;
}> {
  try {
    const baseUrl = (
      NODE_ENV == "development"
        ? process.env.AI_API_URL_DEV
        : process.env.AI_API_URL
    )?.replace(/\/+$/, "") ?? "";
    const url = `${baseUrl}/v1/generate`;

    const responseAI = await axios({
      method: "POST",
      url,
      data: {
        tenantId,
        companyId,
        contactId,
        metadata,
      },
      headers: {
        "Content-Type": "application/json",
        "X-Api-Key": process.env.SIZOR_API_KEY,
        "X-Tenant-Id": tenantId,
      },
      maxRedirects: 0,
    });
    const responseData = responseAI.data;
    const { tokens, response } = responseData;


    return {
      tokens: tokens,
      response: response,
    };
  } catch (error) {
    console.error(`❌ Error generando mensaje de IA:`, error);
    throw error;
  }
}
