import { getUserFromSession, isRequiredPayment } from "~/data/auth.server";
import { getTimeAgo } from "~/lib/utils.functions";
import { notifyRealtimeAPI } from "./REALTIME.server";
import type { Chat, ChatMessage } from "~/types/app";
import { generateIAResponse } from "./IA.server";
import { sendMessageToSocialNetwork } from "./META.server";
import { getPrismaTenant } from "./database.server";

// Declarar el tipo global para el cache de mensajes procesados
declare global {
  var processedMessages:
    | Map<
      string,
      {
        timestamp: number;
        companyId: string;
        messageId: string;
        content: string;
      }
    >
    | undefined;
}
export interface ChatFilters {
  channels?: string[];
  assignmentType?: "all" | "my" | "specific";
  specificUsers?: string[];
}

// Obtener los chats
export async function getChats(
  request: Request,
  companyId: string,
  searchQuery?: string,
  filters?: ChatFilters
): Promise<Chat[] | null> {
  try {
    const prisma = await getPrismaTenant(request);

    // Si hay búsqueda, primero encontrar los contactos que coinciden
    let contactIdsFromSearch: string[] | undefined;

    if (searchQuery && searchQuery.trim()) {
      const query = searchQuery.trim();

      // Buscar en mensajes que contengan el texto
      const messagesWithQuery = await prisma.message.findMany({
        where: {
          companyId,
          content: {
            contains: query,
          },
        },
        select: {
          contactId: true,
        },
        distinct: ["contactId"],
        take: 10,
      });

      // Buscar en contactos por nombre, apellido, email o teléfono
      const searchWhereClause: any = {
        companyId,
        OR: [
          { name: { contains: query } },
          { lastName: { contains: query } },
          { email: { contains: query } },
          { phone: { contains: query } },
        ],
      };

      // Aplicar filtros de canal en la búsqueda también
      if (filters?.channels && filters.channels.length > 0) {
        searchWhereClause.origin = {
          in: filters.channels,
        };
      } else {
        searchWhereClause.origin = {
          not: "Manual",
        };
      }

      const contactsWithQuery = await prisma.contact.findMany({
        where: searchWhereClause,
        select: {
          id: true,
        },
        take: 10,
      });

      // Combinar IDs de contactos encontrados por mensajes y por datos del contacto
      const messageContactIds = messagesWithQuery.map((m) => m.contactId);
      const directContactIds = contactsWithQuery.map((c) => c.id);
      contactIdsFromSearch = [
        ...new Set([...messageContactIds, ...directContactIds]),
      ];
    }

    // Construir filtros dinámicamente
    const whereClause: any = {
      companyId,
      Message: {
        some: {},
      },
      // Si hay búsqueda, filtrar por los IDs encontrados
      ...(contactIdsFromSearch !== undefined && {
        id: {
          in: contactIdsFromSearch,
        },
      }),
    };

    // Aplicar filtros de canal
    if (filters?.channels && filters.channels.length > 0) {
      whereClause.origin = {
        in: filters.channels,
      };
    } else {
      // Si no hay filtros de canal, excluir Manual
      whereClause.origin = {
        not: "Manual",
      };
    }

    // Aplicar filtros de asignación
    if (filters?.assignmentType) {
      if (filters.assignmentType === "my") {
        // Necesitamos obtener el userId del request
        const userId = await getUserFromSession(request);
        if (userId) {
          whereClause.assignedUserId = userId;
        }
      } else if (
        filters.assignmentType === "specific" &&
        filters.specificUsers &&
        filters.specificUsers.length > 0
      ) {
        whereClause.assignedUserId = {
          in: filters.specificUsers,
        };
      }
    }

    const contacts = await prisma.contact.findMany({
      where: whereClause,
      include: {
        Message: {
          orderBy: {
            createdAt: "desc",
          },
          take: 1,
        },
        _count: {
          select: {
            Message: {
              where: {
                status: "UNREAD",
                sender: "THEM",
              },
            },
          },
        },
        ContactCustomFieldValue: {
          include: {
            customField: true,
          },
        },
        agent: true,
        assignedUser: true,
      },
      orderBy: {
        Message: {
          _count: "desc",
        },
      },
      take: 10,
    });

    const processedContacts: any[] = contacts.map((contact: any) => {
      const lastMessage = contact.Message[0] || null;

      return {
        id: contact.id,
        createdAt: contact.createdAt,
        updatedAt: contact.updatedAt,
        name: contact.name,
        lastName: contact.lastName,
        phone: contact.phone,
        email: contact.email,
        origin: contact.origin,
        senderId: contact.senderId,
        sentiment: contact.sentiment,
        leadTemperature: contact.leadTemperature,
        lastMessage: lastMessage
          ? {
            id: lastMessage.id,
            content: lastMessage.content,
            sender: lastMessage.sender,
            senderId: lastMessage.senderId,
            timestamp: lastMessage.timestamp,
            messageId: lastMessage.messageId,
            status: lastMessage.status,
            type: lastMessage.type,
            attachments: lastMessage.attachments,
            createdAt: lastMessage.createdAt,
            timeAgo: getTimeAgo(lastMessage.createdAt),
          }
          : null,
        unreadCount: contact._count.Message,
        contact,
        assignedUser: contact.assignedUser || null,
      };
    });

    processedContacts.sort((a, b) => {
      if (!a.lastMessage && !b.lastMessage) return 0;
      if (!a.lastMessage) return 1;
      if (!b.lastMessage) return -1;
      return (
        new Date(b.lastMessage.createdAt).getTime() -
        new Date(a.lastMessage.createdAt).getTime()
      );
    });

    return processedContacts;
  } catch (error) {
    console.log(`❌ Error en getDataChat: ${error}`);
    return null;
  }
}

// Obtener los mensajes del chat
export async function getChatMessages(
  request: Request,
  companyId: string,
  contactId: string
): Promise<ChatMessage[] | null> {
  try {
    const prisma = await getPrismaTenant(request);

    const messages = await prisma.message.findMany({
      where: {
        contactId,
        contact: {
          companyId,
        },
      },
      include: {
        reactions: true,
      },
      orderBy: {
        createdAt: "desc",
      },
      take: 30,
    });

    const processedMessages: ChatMessage[] = messages.map((message) => ({
      id: message.id,
      content: message.content,
      sender: message.sender,
      senderId: message.senderId,
      timestamp: message.timestamp,
      messageId: message.messageId,
      status: message.status,
      type: message.type,
      attachments: message.attachments,
      createdAt: message.createdAt,
      timeAgo: getTimeAgo(message.createdAt),
      reactions: message.reactions || [],
    }));

    // Ordenar por fecha ascendente para mostrar los más antiguos primero
    return processedMessages?.reverse() || [];
  } catch (error) {
    console.log(`❌ Error en getChatMessages: ${error}`);
    return null;
  }
}

// Obtener los datos de un chat
export async function getChatById(
  request: Request,
  companyId: string,
  contactId: string
) {
  try {
    const prisma = await getPrismaTenant(request);
    let res: any = await prisma.contact.findFirst({
      where: {
        companyId,
        id: contactId,
      },
      include: {
        Message: {
          include: {
            reactions: true,
          },
          orderBy: {
            createdAt: "desc",
          },
          take: 30,
        },
        agent: true,
        assignedUser: true,
      },
    });
    let messages = res?.Message?.map((message: any) => ({
      id: message.id,
      content: message.content,
      sender: message.sender,
      senderId: message.senderId,
      timestamp: message.timestamp,
      messageId: message.messageId,
      status: message.status,
      type: message.type,
      attachments: message.attachments,
      createdAt: message.createdAt,
      timeAgo: getTimeAgo(message.createdAt),
      reactions: message.reactions || [],
    }));

    res["Message"] = messages?.reverse() || [];
    return res;
  } catch (error) {
    console.log(error);
    throw `Error al obtener el chat: ${error}`;
  }
}

// Marcar los mensajes como leídos
export async function markMessagesAsRead(
  request: Request,
  companyId: string,
  contactId: string
): Promise<boolean> {
  try {
    const prisma = await getPrismaTenant(request);

    await prisma.message.updateMany({
      where: {
        companyId,
        contactId,
        status: "UNREAD",
        sender: "THEM",
      },
      data: {
        status: "READ",
      },
    });

    return true;
  } catch (error) {
    console.log(`❌ Error en markMessagesAsRead: ${error}`);
    return false;
  }
}

// Marcar un mensaje como procesado (para evitar duplicados en webhook)
export async function markMessageAsProcessed(
  companyId: string,
  messageId: string,
  content: string
) {
  try {
    // Usar una tabla temporal o cache para marcar mensajes procesados
    // Por simplicidad, se usa un Map en memoria (en producción usar Redis)
    if (!global.processedMessages) {
      global.processedMessages = new Map();
    }

    const key = `${companyId}_${messageId}_${content}`;
    global.processedMessages.set(key, {
      timestamp: Date.now(),
      companyId,
      messageId,
      content,
    });

    // Limpiar entradas antiguas (más de 5 minutos)
    const fiveMinutesAgo = Date.now() - 5 * 60 * 1000;
    for (const [k, v] of global.processedMessages.entries()) {
      if (v.timestamp < fiveMinutesAgo) {
        global.processedMessages.delete(k);
      }
    }
  } catch (error) {
    console.error("Error marking message as processed:", error);
  }
}

// Verificar si un mensaje ya fue procesado
export function isMessageProcessed(
  companyId: string,
  messageId: string,
  content: string
): boolean {
  try {
    if (!global.processedMessages) {
      return false;
    }

    const key = `${companyId}_${messageId}_${content}`;
    const processed = global.processedMessages.get(key);

    if (processed) {
      // Verificar que no sea muy antiguo (más de 5 minutos)
      const fiveMinutesAgo = Date.now() - 5 * 60 * 1000;
      if (processed.timestamp > fiveMinutesAgo) {
        return true;
      } else {
        global.processedMessages.delete(key);
      }
    }

    return false;
  } catch (error) {
    console.error("Error checking if message is processed:", error);
    return false;
  }
}

// Responder a un mensaje
export async function respondToMessage(request: Request) {
  try {
    const headers = request.headers;

    // Verificar API key
    const apiKey = headers.get("X-API-KEY");
    if (apiKey !== process.env.SIZOR_API_KEY) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Obtener los datos del mensaje
    const data = await request.json();
    const { tenantId, companyId, contactId, metadata, socialNetwork } = data;

    // Validar datos requeridos
    if (!tenantId || !companyId || !contactId) {
      return Response.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Prisma
    const prisma = await getPrismaTenant(tenantId);

    // Obtener información de la empresa y plan
    const company = await prisma.company.findFirst({
      where: {
        id: companyId,
      },
      include: {
        plan: {
          include: {
            agent: true,
          },
        },
      },
    });
    const plan = company?.plan;

    // Validar que el plan exista
    if (!plan) {
      return Response.json({ error: "Plan not found" }, { status: 404 });
    }

    // Obtener información del contacto
    const contact = await prisma.contact.findFirst({
      where: {
        id: contactId,
      },
      include: {
        agent: true,
      },
    });

    // Validar que el contacto exista
    if (!contact) {
      return Response.json({ error: "Contact not found" }, { status: 404 });
    }

    // Verificar límites de tokens
    const license = await prisma.license.findFirst({});
    const validationPayment = await isRequiredPayment(
      plan as any,
      license?.isSon as boolean
    );
    // TODO: Tener en cuenta los tokens adicionales
    if (
      plan?.tokensUsed >= plan?.maxTokens ||
      validationPayment.requiredPayment
    ) {
      // TODO: Notificar que se quedó sin tokens pero que sea una sola vez por medio de un estado y al pagar resetear el estado
      // TODO: Establecer alertas de vencimiento de tokens por porcentaje
      console.log("Límite de créditos alcanzado");

      return Response.json({ error: "Límite de créditos alcanzado" }, { status: 429 });
    }

    // Generar mensaje de la IA
    console.log("Respondiendo a un mensaje - Licencia:", tenantId);
    const aiResponse = await generateIAResponse(
      tenantId,
      companyId,
      contactId,
      metadata,
      socialNetwork
    );
    const tokensUsed = aiResponse.tokens;

    // Validar que la respuesta no esté vacía
    if (!aiResponse.response || aiResponse.response.trim() === "") {
      return Response.json({
        success: false,
        message: "AI response is empty",
        tokensUsed: 0,
      });
    }

    // Enviar mensaje de IA
    await sendMessageToSocialNetwork(
      tenantId,
      companyId,
      contactId,
      aiResponse.response,
      "TEXT",
      null,
      socialNetwork
    );

    // Actualizar tokens usados
    const updatedPlan = await prisma.plan.update({
      where: {
        id: plan.id,
      },
      data: {
        tokensUsed: {
          increment: tokensUsed,
        },
      },
    });

    // Enviar evento de actualización de tokens usados
    await notifyRealtimeAPI("tokens-update", {
      companyId,
      tokensUsed: updatedPlan.tokensUsed,
      maxTokens: updatedPlan.maxTokens,
      isFree: updatedPlan.isFree,
    });

    console.log(`✅ Respuesta de IA enviada - Licencia: ${tenantId}`);

    return Response.json({
      success: true,
      message: "AI response sent successfully",
      tokensUsed,
      metadata,
    });
  } catch (error) {
    console.log("Error respondiendo a un mensaje:", error);
    return false;
  }
}

/* Crear mensaje del sistema */
export async function createSystemMessage(
  tenantId: string,
  companyId: string,
  contactId: string,
  content: string,
  type:
    | "ESCALATION"
    | "FORM_FILLED"
    | "CONTACT_UPDATED"
    | "AGENT_RESPONSE"
    | "SYSTEM"
) {
  try {
    const prisma = await getPrismaTenant(tenantId);

    const systemMessage = await prisma.message.create({
      data: {
        content,
        sender: "SYSTEM",
        senderId: "system",
        timestamp: new Date().toISOString(),
        messageId: `system-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        contactId,
        companyId,
        type: type,
        status: "READ",
        attachments: null,
      },
    });

    // Notificar mensaje del sistema en tiempo real
    await notifyRealtimeAPI("system-message", {
      companyId,
      contactId,
      message: {
        id: systemMessage.id,
        content: systemMessage.content,
        sender: systemMessage.sender,
        timestamp: systemMessage.timestamp,
        messageId: systemMessage.messageId,
        type: systemMessage.type,
        status: systemMessage.status,
        createdAt: systemMessage.createdAt,
      },
    });

    return systemMessage;
  } catch (error) {
    console.error("❌ Error creating system message:", error);
    throw new Error("Error creating system message");
  }
}

// Obtener el chat por senderId
export async function getChatBySenderId(
  tenantId: string,
  companyId: string,
  senderId: string,
  recipientId: string,
  socialNetwork: string,
  metadata?: any
): Promise<{ contact: any; isNew: boolean }> {
  try {
    const prisma = await getPrismaTenant(tenantId);
    const license = await prisma.license.findFirst({});
    const plan: any = await prisma.plan.findFirst({
      where: {
        Company: {
          some: {
            id: companyId,
          },
        },
      },
    });
    const accountId =
      plan?.[`ACCOUNT_ID_${socialNetwork?.toUpperCase()}`] == senderId
        ? recipientId
        : senderId;

    const existsContact = await prisma.contact.findFirst({
      where: {
        companyId,
        origin: socialNetwork,
        senderId: accountId,
      },
    });

    if (existsContact) {
      return { contact: existsContact, isNew: false };
    }

    if (
      (plan?.isFree && plan?.contactsUsed >= plan?.maxContacts) ||
      (license?.isSon &&
        !plan?.contactsUnlimited &&
        plan?.contactsUsed >= plan?.maxContacts)
    ) {
      return { contact: null, isNew: false };
    }

    const company = await prisma.company.findFirst({
      where: {
        id: companyId,
      },
    });

    const newContact = await prisma.contact.create({
      data: {
        companyId,
        name:
          socialNetwork === "Whatsapp"
            ? metadata?.profile?.name || senderId
            : senderId,
        senderId: accountId,
        origin: socialNetwork,
        respondWithIa: company?.SETT_IA_RESPONSE,
        ...(socialNetwork === "Whatsapp" && {
          phone: senderId,
        }),
      },
    });

    await prisma.plan.updateMany({
      where: {
        Company: {
          some: {
            id: companyId,
          },
        },
      },
      data: {
        contactsUsed: {
          increment: 1,
        },
      },
    });

    return { contact: newContact, isNew: true };
  } catch (error) {
    console.error(`❌ Error en getContactBySenderId: ${error}`);
    return { contact: null, isNew: false };
  }
}

/* Actualizar estado de IA para un contacto */
export async function updateContactIAStatus(
  tenantId: string,
  contactId: string,
  respondWithIa: boolean
) {
  try {
    const prisma = await getPrismaTenant(tenantId);

    // Obtener información del contacto antes de actualizar
    const contact = await prisma.contact.findFirst({
      where: { id: contactId },
      include: { company: true },
    });

    if (!contact) {
      throw new Error("Contact not found");
    }

    // Actualizar el estado de la IA
    await prisma.contact.update({
      where: { id: contactId },
      data: { respondWithIa },
    });

    // Crear mensaje del sistema
    const systemMessage = `IA ${respondWithIa ? "activada" : "desactivada"} para este contacto`;
    await createSystemMessage(
      tenantId,
      contact.companyId,
      contactId,
      systemMessage,
      "SYSTEM"
    );

    return { success: true };
  } catch (error) {
    console.error("❌ Error updating IA status:", error);
    throw new Error("Error updating IA status");
  }
}

/* Asignar usuario a un contacto */
export async function assignUserToContact(
  tenantId: string,
  contactId: string,
  userId: string | null
) {
  try {
    const prisma = await getPrismaTenant(tenantId);

    // Obtener información del contacto y usuario
    const [contact, user] = await Promise.all([
      prisma.contact.findFirst({
        where: { id: contactId },
        include: { company: true },
      }),
      userId ? prisma.user.findFirst({ where: { id: userId } }) : null,
    ]);

    if (!contact) {
      throw new Error("Contact not found");
    }

    // Actualizar la asignación
    await prisma.contact.update({
      where: { id: contactId },
      data: { assignedUserId: userId },
    });

    // Crear mensaje del sistema
    const systemMessage = userId
      ? `Chat asignado a ${user?.firstName} ${user?.lastName || ""}`
      : "Asignación de chat removida";

    await createSystemMessage(
      tenantId,
      contact.companyId,
      contactId,
      systemMessage,
      "SYSTEM"
    );

    // Notificar actualización en tiempo real
    await notifyRealtimeAPI("chat-assignment-update", {
      companyId: contact.companyId,
      contactId: contactId,
      assignedUserId: userId,
      assignedUserName: user
        ? `${user.firstName} ${user.lastName || ""}`
        : null,
      assignedUser: user || null,
      reason: "Manual assignment",
    });

    return { success: true };
  } catch (error) {
    console.error("❌ Error assigning user to contact:", error);
    throw new Error("Error assigning user to contact");
  }
}
