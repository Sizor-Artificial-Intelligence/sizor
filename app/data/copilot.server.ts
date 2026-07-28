/**
 * Copilot Server
 * 
 * Este módulo maneja las consultas del chat Copilot que utiliza RAG (Retrieval Augmented Generation)
 * para proporcionar respuestas contextualizadas basadas en:
 * - El historial de conversación del chat (embeddings de mensajes)
 * - La base de conocimiento del agente (carpetas y archivos de entrenamiento)
 * 
 * IMPORTANTE: La API key de OpenAI debe estar configurada en el .env como:
 * OPENAI_API_KEY=tu_api_key_aqui
 * 
 * El modelo utilizado es: gpt-5-nano
 */

import { getPrismaTenant } from "~/data/database.server";
import { getTenantId } from "~/data/auth.server";
import { searchSimilarEmbeddings } from "./qdrant.server";
import {
  COPILOT_DAILY_TOKEN_LIMIT,
  COPILOT_UNLIMITED_DAILY_TOKEN_LIMIT,
  COPILOT_UNLIMITED_PRICE,
} from "~/config/app";
import { getDateTime } from "~/lib/utils.functions";
import OpenAI from "openai";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

const COPILOT_DAILY_LIMIT_REACHED_CODE = "COPILOT_DAILY_LIMIT_REACHED";

export type CopilotUsageStatus = {
  companyId: string;
  date: string; // YYYY-MM-DD (local)
  copilotUnlimited: boolean;
  dailyLimit: number;
  tokensUsedToday: number;
  blocked: boolean;
  upgradePrice: number;
};

export async function getCopilotUsageStatus(
  request: Request,
  companyId: string
): Promise<CopilotUsageStatus> {
  const prisma = await getPrismaTenant(request);
  const company = await prisma.company.findFirst({
    where: { id: companyId },
    select: { id: true, copilotUnlimited: true },
  });

  if (!company) {
    throw new Error("No se encontró la compañía");
  }

  const date = getDateTime().substring(0, 10);
  const usage = await prisma.copilotTokenUsage.findUnique({
    where: {
      companyId_date: {
        companyId,
        date,
      },
    },
    select: { tokensUsed: true },
  });

  const tokensUsedToday = usage?.tokensUsed ?? 0;
  const dailyLimit = company.copilotUnlimited
    ? COPILOT_UNLIMITED_DAILY_TOKEN_LIMIT
    : COPILOT_DAILY_TOKEN_LIMIT;
  const blocked = dailyLimit > 0 && tokensUsedToday >= dailyLimit;

  return {
    companyId,
    date,
    copilotUnlimited: company.copilotUnlimited,
    dailyLimit,
    tokensUsedToday,
    blocked,
    upgradePrice: COPILOT_UNLIMITED_PRICE,
  };
}

async function addCopilotTokensUsedToday(
  request: Request,
  companyId: string,
  tokensToAdd: number
) {
  const tokens = Math.max(0, Math.floor(tokensToAdd || 0));
  if (tokens <= 0) return;

  const prisma = await getPrismaTenant(request);
  const date = getDateTime().substring(0, 10);

  await prisma.copilotTokenUsage.upsert({
    where: {
      companyId_date: {
        companyId,
        date,
      },
    },
    update: {
      tokensUsed: { increment: tokens },
    },
    create: {
      companyId,
      date,
      tokensUsed: tokens,
    },
  });
}

/**
 * Obtiene el agente del contacto o el agente global del plan
 */
async function getAgentForContact(
  request: Request,
  companyId: string,
  contactId: string
) {
  const prisma = await getPrismaTenant(request);

  // Obtener el contacto con su agente
  const contact = await prisma.contact.findFirst({
    where: {
      id: contactId,
      companyId,
    },
    include: {
      agent: {
        include: {
          TrainingFolders: {
            include: {
              folder: true,
            },
          },
          TrainingFiles: {
            include: {
              file: true,
            },
          },
        },
      },
      company: {
        include: {
          plan: {
            include: {
              agent: {
                include: {
                  TrainingFolders: {
                    include: {
                      folder: true,
                    },
                  },
                  TrainingFiles: {
                    include: {
                      file: true,
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
  });

  if (!contact) {
    return null;
  }

  // Si el contacto tiene un agente asignado, usarlo
  if (contact.agent) {
    return contact.agent;
  }

  // Si no, usar el agente global del plan
  if (contact.company?.plan?.agent) {
    return contact.company.plan.agent;
  }

  return null;
}

/**
 * Obtiene recursivamente todos los archivos de una carpeta y sus subcarpetas
 */
async function getAllFilesFromFolderRecursively(
  prisma: any,
  companyId: string,
  folderId: string,
  fileUrls: Set<string>
) {
  // Obtener archivos directos de la carpeta
  const files = await prisma.trainingFile.findMany({
    where: {
      folderId,
      companyId,
      active: true,
      status: "ready", // Solo archivos procesados
    },
    select: {
      fileUrl: true,
    },
  });

  // Agregar fileUrls de los archivos directos
  files.forEach((file: any) => {
    if (file.fileUrl) {
      fileUrls.add(file.fileUrl);
    }
  });

  // Obtener subcarpetas
  const subfolders = await prisma.trainingFolder.findMany({
    where: {
      parentId: folderId,
      companyId,
      active: true,
    },
    select: {
      id: true,
    },
  });

  // Recursivamente obtener archivos de subcarpetas
  for (const subfolder of subfolders) {
    await getAllFilesFromFolderRecursively(
      prisma,
      companyId,
      subfolder.id,
      fileUrls
    );
  }
}

/**
 * Obtiene todas las URLs de archivos de la base de conocimiento del agente
 */
async function getKnowledgeBaseFileUrls(
  request: Request,
  companyId: string,
  agent: any
): Promise<string[]> {
  const prisma = await getPrismaTenant(request);
  const fileUrls = new Set<string>();

  // Obtener fileUrls de archivos seleccionados individualmente
  if (agent.TrainingFiles) {
    for (const tf of agent.TrainingFiles) {
      if (tf.file?.fileUrl && tf.file?.active && tf.file?.status === "ready") {
        fileUrls.add(tf.file.fileUrl);
      }
    }
  }

  // Obtener fileUrls de archivos en carpetas seleccionadas (recursivamente)
  if (agent.TrainingFolders) {
    for (const tf of agent.TrainingFolders) {
      if (tf.folder?.id) {
        await getAllFilesFromFolderRecursively(
          prisma,
          companyId,
          tf.folder.id,
          fileUrls
        );
      }
    }
  }

  return Array.from(fileUrls);
}

/**
 * Busca embeddings del historial del chat
 */
async function searchChatHistory(
  request: Request,
  companyId: string,
  contactId: string,
  query: string,
  limit: number = 10
) {
  const tenantId = await getTenantId(request);

  // Buscar mensajes del chat en embeddings
  const chatMessages = await searchSimilarEmbeddings(
    tenantId,
    query,
    "message",
    limit,
    {
      companyId,
      chatId: contactId,
    },
    ["content", "sender", "messageId", "createdAt"]
  );

  return chatMessages;
}

/**
 * Busca embeddings de la base de conocimiento usando fileUrls
 */
async function searchKnowledgeBase(
  request: Request,
  companyId: string,
  fileUrls: string[],
  query: string,
  limit: number = 10
) {
  const tenantId = await getTenantId(request);

  // Buscar en embeddings de archivos de entrenamiento
  const knowledgeResults: any[] = [];

  // Si hay fileUrls específicos, buscar en ellos
  if (fileUrls.length > 0) {
    // Buscar por cada fileUrl (puede haber múltiples embeddings por archivo)
    // Nota: Los embeddings se guardan con type "file" en la API, pero también pueden ser "trainingFile"
    for (const fileUrl of fileUrls) {
      // Buscar con tipo "All" para encontrar tanto "file" como "trainingFile"
      const results = await searchSimilarEmbeddings(
        tenantId,
        query,
        "All", // Buscar en todos los tipos ya que puede ser "file" o "trainingFile"
        10, // Obtener más resultados por archivo ya que puede haber múltiples fragmentos
        {
          fileUrl,
        },
        ["text", "fileUrl"]
      );
      console.log("DEBUG: results", results);
      // Los resultados ya están filtrados por fileUrl en la búsqueda, solo agregar
      knowledgeResults.push(...results);
    }
  } else {
    // Si no hay fileUrls específicos, buscar en todos los archivos de la compañía
    const results = await searchSimilarEmbeddings(
      tenantId,
      query,
      "All", // Buscar en todos los tipos
      limit,
      {
        companyId,
      },
      ["text", "fileUrl"]
    );
    // Filtrar solo los que son archivos (tienen fileUrl, lo que indica que son archivos de entrenamiento)
    const fileResults = results.filter((r: any) => r.fileUrl);
    knowledgeResults.push(...fileResults);
  }

  // Eliminar duplicados por id y limitar
  const uniqueResults = knowledgeResults.filter(
    (result, index, self) =>
      index === self.findIndex((r) => r.id === result.id)
  );

  // Ordenar por relevancia (score si está disponible) y limitar
  return uniqueResults.slice(0, limit);
}

/**
 * Construye el contexto RAG combinando historial y base de conocimiento
 */
function buildRAGContext(
  chatHistory: any[],
  knowledgeBase: any[],
): string {
  let context = "";

  // Agregar historial de conversación relevante
  if (chatHistory.length > 0) {
    context += `## Historial de Conversación Relevante\n`;
    // Ordenar por fecha (más reciente primero) si hay createdAt
    const sortedHistory = [...chatHistory].sort((a, b) => {
      const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
      const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
      return dateB - dateA;
    });

    sortedHistory.forEach((msg) => {
      const sender = msg.sender === "ME" ? "Usuario" : "Contacto";
      // Usar el campo 'text' que viene del embedding, o 'content' como fallback
      const content = msg.text || msg.content || "";
      if (content.trim()) {
        context += `${sender}: ${content}\n`;
      }
    });
    context += `\n`;
  }

  // Agregar base de conocimiento relevante
  if (knowledgeBase.length > 0) {
    context += `## Base de Conocimiento Relevante\n`;
    knowledgeBase.forEach((kb) => {
      const text = kb.text || "";
      const fileUrl = kb.fileUrl || "Documento";
      // Extraer nombre del archivo de la URL si es posible
      const fileName = fileUrl.split("/").pop()?.split("?")[0] || "Documento";
      if (text.trim()) {
        context += `[${fileName}]: ${text}\n`;
      }
    });
    context += `\n`;
  }

  return context;
}

/**
 * Llama a OpenAI para generar respuesta
 */
async function callOpenAI(
  systemPrompt: string,
  userPrompt: string
): Promise<{ content: string; tokensUsed: number }> {
  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-5-nano",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      // Nota: gpt-5-nano solo soporta temperature por defecto (1), no se puede configurar
    });

    const aiResponse = completion.choices[0]?.message?.content;
    const tokensUsed = completion.usage?.total_tokens ?? 0;

    if (!aiResponse) {
      throw new Error("No content in AI response");
    }

    return { content: aiResponse.trim(), tokensUsed };
  } catch (error) {
    console.error("Error llamando a OpenAI:", error);
    throw error;
  }
}

/**
 * Función principal para procesar consulta del copilot
 */
export async function processCopilotQuery(
  request: Request,
  companyId: string,
  contactId: string,
  userQuery: string
): Promise<{
  success: boolean;
  response?: string;
  error?: string;
  code?: string;
  tokensUsed?: number;
  tokensUsedToday?: number;
  dailyLimit?: number;
  copilotUnlimited?: boolean;
  date?: string;
  upgradePrice?: number;
  blocked?: boolean;
}> {
  try {
    if (!userQuery || !userQuery.trim()) {
      return {
        success: false,
        error: "La consulta no puede estar vacía",
      };
    }

    // Validar límite diario (antes de hacer búsquedas / llamar a OpenAI)
    const usageStatus = await getCopilotUsageStatus(request, companyId);
    if (usageStatus.blocked) {
      const error = usageStatus.copilotUnlimited
        ? `Has alcanzado el límite diario de Copilot (${usageStatus.dailyLimit} tokens). Contacta soporte si necesitas ampliarlo.`
        : `Has alcanzado el límite diario de Copilot (${usageStatus.dailyLimit} tokens). Si quieres Copilot ilimitado, paga $${usageStatus.upgradePrice}.`;

      return {
        success: false,
        code: COPILOT_DAILY_LIMIT_REACHED_CODE,
        error,
        tokensUsedToday: usageStatus.tokensUsedToday,
        dailyLimit: usageStatus.dailyLimit,
        copilotUnlimited: usageStatus.copilotUnlimited,
        date: usageStatus.date,
        upgradePrice: usageStatus.upgradePrice,
        blocked: true,
      };
    }

    // Obtener el agente (del contacto o global)
    const agent = await getAgentForContact(request, companyId, contactId);

    if (!agent) {
      return {
        success: false,
        error: "No se encontró un agente configurado para este chat",
      };
    }

    // Obtener todas las URLs de archivos de la base de conocimiento (recursivamente)
    const fileUrls = await getKnowledgeBaseFileUrls(request, companyId, agent);

    // Buscar en el historial del chat
    const chatHistory = await searchChatHistory(
      request,
      companyId,
      contactId,
      userQuery,
      10
    );

    // Buscar en la base de conocimiento usando fileUrls
    const knowledgeBase = await searchKnowledgeBase(
      request,
      companyId,
      fileUrls,
      userQuery,
      10
    );

    // Construir contexto RAG
    const context = buildRAGContext(chatHistory, knowledgeBase);

    console.log("DEBUG: context", context);

    // Construir el prompt del sistema
    const systemPrompt = `Eres un asistente de IA amigable y profesional que responde preguntas del usuario basándote ÚNICAMENTE en el contexto proporcionado.

REGLAS:
1. Responde SOLO con la información que está en el contexto proporcionado
2. Sé claro, natural y fluido en tus respuestas - no seas cortante ni demasiado breve
3. Usa un tono amigable y profesional al responder
4. Si la información NO está en el contexto, di de forma educada: "No tengo información sobre eso en la base de conocimiento proporcionada"
5. NO inventes información que no está en el contexto
6. NO hagas suposiciones o inferencias más allá de lo que dice el contexto

FORMATO DE RESPUESTAS:
- Si la respuesta es afirmativa: Responde de forma natural explicando brevemente. Ejemplo: "Sí, según la información disponible [explicación breve del contexto]"
- Si la respuesta es negativa: Responde de forma amigable explicando brevemente. Ejemplo: "No, según la información disponible [explicación breve del contexto]"
- Si no hay información: Responde: "No tengo información sobre eso en la base de conocimiento proporcionada"

Ejemplos:
- Pregunta: "Hacemos envios al Amazonas?" 
  - Si el contexto dice que sí → Responde: "Sí, hacemos envíos al Amazonas. [mencionar detalles relevantes del contexto si los hay]"
  - Si el contexto NO menciona nada → Responde: "No tengo información sobre envíos al Amazonas en la base de conocimiento proporcionada"

- Pregunta: "Puedo aceptar el método de pago que menciona el usuario?"
  - Si el contexto dice que sí → Responde: "Sí, puedes aceptar ese método de pago. [detalles relevantes si los hay]"
  - Si el contexto dice que no → Responde: "No, según la información disponible ese método de pago no está disponible. [razón si está en el contexto]"
  - Si el contexto NO menciona nada → Responde: "No tengo información sobre ese método de pago en la base de conocimiento proporcionada"`;

    // Construir el prompt del usuario
    const userPrompt = `${context}

## Pregunta del Usuario
${userQuery}

Responde la pregunta de forma natural y fluida usando SOLO la información del contexto proporcionado arriba. Mantén un tono amigable y profesional. Si la información no está en el contexto, di de forma educada que no tienes esa información.`;

    // Llamar a OpenAI
    const { content: response, tokensUsed } = await callOpenAI(
      systemPrompt,
      userPrompt
    );

    // Guardar consumo diario de tokens del copilot
    await addCopilotTokensUsedToday(request, companyId, tokensUsed);

    return {
      success: true,
      response,
      tokensUsed,
      tokensUsedToday: usageStatus.tokensUsedToday + tokensUsed,
      dailyLimit: usageStatus.dailyLimit,
      copilotUnlimited: usageStatus.copilotUnlimited,
      date: usageStatus.date,
      upgradePrice: usageStatus.upgradePrice,
      blocked: false,
    };
  } catch (error) {
    console.error("Error procesando consulta del copilot:", error);
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Error al procesar la consulta",
    };
  }
}
