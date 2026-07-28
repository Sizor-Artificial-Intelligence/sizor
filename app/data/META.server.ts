import { getPrismaTenant } from "~/data/database.server";
import { sendInstagramMessage } from "./INSTAGRAM.server";
import { sendFacebookMessage } from "./FACEBOOK.server";
import { sendWhatsappMessage } from "./WHATSAPP.server";
import {
  getChatBySenderId,
  isMessageProcessed,
  markMessageAsProcessed,
} from "./chat.server";
import { notifyRealtimeAPI } from "./REALTIME.server";
import { getFirstLetterInUpperCase, getTimeAgo } from "~/lib/utils.functions";
import { enqueueAIResponse } from "./IA.server";
import { sendMessageToQueue } from "./utils.server";
import { saveEmbedding } from "./qdrant.server";

// Enviar mensaje a red social
export async function sendMessageToSocialNetwork(
  request: Request | string,
  companyId: string,
  contactId: string,
  message: string,
  messageType: string = "TEXT",
  imageUrl: string | null = null,
  socialNetwork: string,
  isResend: boolean = false,
  resendMessageId: string | null = null
): Promise<{
  success: boolean;
  message?: any;
  messageId?: string;
  error?: string;
}> {
  try {
    const prisma = await getPrismaTenant(request);

    // Obtener el contacto y su información
    const contact = await prisma.contact.findFirst({
      where: {
        id: contactId,
        companyId,
      },
      include: {
        company: {
          include: {
            plan: true,
          },
        },
      },
    });

    if (!contact) {
      return { success: false, error: "Contact not found" };
    }

    // Obtener el plan para acceder a los tokens
    const plan = contact.company.plan;
    if (!plan) {
      return { success: false, error: "Plan not found" };
    }

    // Generar un ID único para el mensaje que incluya un prefijo para identificar mensajes enviados por nosotros
    const messageId: any = isResend
      ? resendMessageId
      : `sent_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    // Preparar attachments si hay imagen
    let attachments = null;
    if (imageUrl) {
      attachments = JSON.stringify([
        {
          type: "image",
          payload: {
            url: imageUrl,
          },
        },
      ]);
    }

    // Crear el mensaje en la base de datos primero
    const newMessage: any =
      isResend && resendMessageId
        ? await prisma.message.findFirst({
          where: {
            id: resendMessageId,
          },
        })
        : await prisma.message.create({
          data: {
            companyId,
            contactId,
            senderId:
              socialNetwork === "Instagram"
                ? (plan.ACCOUNT_ID_INSTAGRAM as string)
                : socialNetwork === "Facebook"
                  ? (plan.ACCOUNT_ID_FACEBOOK as string)
                  : "unknown",
            timestamp: Date.now().toString(),
            messageId,
            content: message,
            type: messageType,
            status: "SENT",
            sender: "ME",
            attachments,
          },
        });

    // Crear embedding para el mensaje enviado (solo si tiene texto y es nuevo mensaje)
    if (newMessage && !isResend && message && message.trim() !== "") {
      // Usar la red social del parámetro o del contacto
      const network = socialNetwork || contact.origin;
      await createMessageEmbedding(
        request,
        newMessage,
        contactId,
        companyId,
        network,
        "ME"
      );
    }

    // Enviar mensaje a la red social según el origen
    let apiResponse;
    console.log("Sending message to social network", contact.origin);

    if (contact.origin === "Instagram") {
      if (!contact.senderId) {
        return { success: false, error: "Contact senderId not found" };
      }
      apiResponse = await sendInstagramMessage(
        plan,
        contact.senderId,
        message,
        imageUrl ? imageUrl : undefined
      );
    } else if (contact.origin === "Facebook") {
      if (!contact.senderId) {
        return { success: false, error: "Contact senderId not found" };
      }
      apiResponse = await sendFacebookMessage(
        plan,
        contact.senderId,
        message,
        imageUrl ? imageUrl : undefined
      );
    } else if (contact.origin === "Whatsapp") {
      if (!contact.senderId) {
        return { success: false, error: "Contact senderId not found" };
      }
      apiResponse = await sendWhatsappMessage(
        plan,
        contact.senderId,
        message,
        imageUrl ? imageUrl : undefined
      );
    } else {
      return { success: false, error: "Unsupported social network" };
    }

    if (apiResponse.success) {
      // Actualizar el estado del mensaje a entregado y el messageId real si viene en la respuesta
      const updateData: any = { status: "DELIVERED" };

      // Si la API devuelve un message ID real, actualizarlo
      if (apiResponse.data?.message_id) {
        updateData.messageId = apiResponse.data.message_id;
      }

      await prisma.message.update({
        where: { id: newMessage.id },
        data: updateData,
      });

      // Marcar el mensaje como procesado para evitar duplicados en webhook
      await markMessageAsProcessed(companyId, newMessage.messageId, message);

      // Notificar a la API de tiempo real
      await notifyRealtimeAPI("new-message", {
        companyId,
        contactId,
        contact,
        message: {
          id: newMessage.id,
          messageId: newMessage.messageId,
          content: newMessage.content,
          sender: newMessage.sender,
          type: newMessage.type,
          createdAt: newMessage.createdAt,
          attachments: newMessage.attachments,
        },
      });

      // Obtener el contador real de mensajes no leídos desde la base de datos
      const unreadMessagesCount = await prisma.message.count({
        where: {
          contactId,
          companyId,
          status: "UNREAD",
          sender: "THEM",
        },
      });

      // Crear la estructura completa del chat
      const updatedChat = {
        id: contact.id,
        createdAt: contact.createdAt,
        updatedAt: contact.updatedAt,
        name: contact.name,
        lastName: contact.lastName,
        phone: contact.phone,
        email: contact.email,
        origin: contact.origin,
        senderId: contact.senderId,
        lastMessage: {
          id: newMessage.id,
          content: newMessage.content,
          sender: newMessage.sender,
          senderId: newMessage.senderId,
          timestamp: newMessage.timestamp,
          messageId: newMessage.messageId,
          status: newMessage.status,
          type: newMessage.type,
          attachments: newMessage.attachments,
          createdAt: newMessage.createdAt,
          timeAgo: getTimeAgo(newMessage.createdAt),
        },
        unreadCount: unreadMessagesCount,
        contact: contact,
      };

      await notifyRealtimeAPI("contacts-update", {
        companyId,
        contacts: [updatedChat],
      });

      return {
        success: true,
        message: newMessage,
        messageId: newMessage.messageId,
      };
    } else {
      // Marcar como fallido si no se pudo enviar
      await prisma.message.update({
        where: { id: newMessage.id },
        data: { status: "FAILED" },
      });

      return { success: false, error: apiResponse.error };
    }
  } catch (error) {
    console.error("Error sending message to social network:", error);
    return { success: false, error: "Internal server error" };
  }
}

// Marcar un mensaje como procesado en el webhook
export async function markMessageAsProcessedInWebhook(
  companyId: string,
  messageId: string,
  content: string
) {
  try {
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
  } catch (error) {
    console.error("Error marking message as processed in webhook:", error);
  }
}

// Manejar eventos de reacción
export async function handleReactionEvent(
  tenantId: string,
  companyId: string,
  senderId: string,
  recipientId: string,
  reactionEvent: any,
  socialNetwork: string
) {
  try {
    const prisma = await getPrismaTenant(tenantId);

    // Obtener el contacto
    const { contact } = await getChatBySenderId(
      tenantId,
      companyId,
      senderId,
      recipientId,
      socialNetwork
    );

    if (!contact?.id) {
      console.log("No se encontró contacto para la reacción");
      return;
    }

    // Buscar el mensaje al que se está reaccionando
    const targetMessage = await prisma.message.findFirst({
      where: {
        companyId,
        contactId: contact.id,
        messageId: reactionEvent.mid,
      },
    });

    if (!targetMessage) {
      console.log(`No se encontró mensaje con ID: ${reactionEvent.mid}`);
      return;
    }

    const action = reactionEvent.action;
    const emoji = reactionEvent.emoji || "❤️";

    // Normalizar emoji removiendo variaciones de presentación
    const normalizedEmoji = emoji.replace(/\ufe0e|\ufe0f/g, "");

    if (action === "react") {
      const existingReaction = await prisma.reaction.findFirst({
        where: {
          messageId: targetMessage.id,
          senderId: senderId,
          emoji: normalizedEmoji,
        },
      });

      if (existingReaction) {
        await prisma.reaction.delete({
          where: {
            id: existingReaction.id,
          },
        });
        return;
      }

      // Crear o actualizar reacción
      await prisma.reaction.upsert({
        where: {
          messageId_senderId_emoji: {
            messageId: targetMessage.id,
            senderId: senderId,
            emoji: emoji,
          },
        },
        update: {
          action: "react",
          updatedAt: new Date(),
        },
        create: {
          messageId: targetMessage.id,
          senderId: senderId,
          emoji: normalizedEmoji,
          action: "react",
          companyId: companyId,
        },
      });
    } else if (action === "unreact") {
      // Eliminar reacción
      await prisma.reaction.deleteMany({
        where: {
          messageId: targetMessage.id,
          senderId: senderId,
          emoji: normalizedEmoji,
        },
      });
    }

    await notifyRealtimeAPI("reaction-update", {
      companyId,
      contactId: contact.id,
      messageId: targetMessage.id,
      reaction: {
        action,
        emoji: normalizedEmoji,
        senderId,
      },
    });
  } catch (error) {
    console.error(`Error manejando reacción: ${error}`);
  }
}

// Crear embedding para un mensaje
async function createMessageEmbedding(
  tenantId: string | Request,
  message: any,
  contactId: string,
  companyId: string,
  socialNetwork: string,
  sender: string
) {
  try {
    // Solo crear embedding si el mensaje tiene contenido de texto
    if (!message?.content || message.content.trim() === "") {
      return;
    }

    // Crear metadata completa para búsquedas futuras
    const params = {
      chatId: contactId,
      companyId,
      socialNetwork,
      sender,
      messageId: message.messageId || message.id,
      messageType: message.type || "TEXT",
      createdAt: message.createdAt ? new Date(message.createdAt).toISOString() : new Date().toISOString(),
    };

    await saveEmbedding(
      tenantId,
      message.content || null,
      "message",
      message.id || null,
      params || {}
    );
  } catch (error) {
    console.error("Error al crear embedding para mensaje", {
      messageId: message?.messageId || message?.id,
      error: error instanceof Error ? error.message : String(error),
    });
  }
}

// Crear un mensaje
export async function createMessage(
  tenantId: string,
  companyId: string,
  contactId: string,
  senderId: string,
  sender: string,
  message: any,
  messageId: string,
  timestamp: string,
  socialNetwork: string
) {
  try {
    const prisma = await getPrismaTenant(tenantId);

    // Verificar si el mensaje ya existe
    const existingMessage = await prisma.message.findFirst({
      where: {
        companyId,
        messageId: messageId,
      },
    });

    if (existingMessage) {
      return existingMessage;
    }

    let messageText =
      socialNetwork === "whatsapp"
        ? message?.text?.body
        : message?.text || null;
    let attachments = message?.attachments || null;
    let messageType = "TEXT";
    if (messageText) messageText = String(messageText);
    if (message?.attachments) {
      // TODO: Manejar attachments de tipo template
      let processedAttachments = message?.attachments?.filter(
        (att: any) => att.type !== "template"
      );
      attachments =
        processedAttachments?.length > 0
          ? JSON.stringify(processedAttachments)
          : null;

      // Determinar el tipo de mensaje basado en los attachments
      const hasAudio = processedAttachments.some(
        (att: any) => att.type === "audio"
      );
      const hasImage = processedAttachments.some(
        (att: any) => att.type === "image"
      );
      const hasVideo = processedAttachments.some(
        (att: any) => att.type === "video"
      );
      const hasTemplate = processedAttachments.some(
        (att: any) => att.type === "template"
      );

      if (hasAudio) {
        messageType = "AUDIO";
      } else if (hasVideo) {
        messageType = "VIDEO";
      } else if (hasImage) {
        messageType = "IMAGE";
      } else if (hasTemplate) {
        messageType = "TEMPLATE";
      } else {
        messageType = "ATTACHMENT";
      }
    }

    // Crear mensaje
    if (attachments || messageText) {
      const newMessage = await prisma.message.create({
        data: {
          companyId,
          contactId,
          senderId,
          timestamp,
          messageId,
          content: messageText,
          type: messageType,
          status: "UNREAD",
          sender: sender,
          attachments,
        },
      });

      // Crear embedding para el mensaje (solo si tiene texto)
      if (messageText && messageText.trim() !== "") {
        await createMessageEmbedding(
          tenantId,
          newMessage,
          contactId,
          companyId,
          socialNetwork,
          sender
        );
      }

      // Analizar el sentimiento del contacto/chat
      if (sender === "THEM") {
        await sendMessageToQueue("AI_SENTIMENT_ANALYSIS", tenantId, {
          contactId,
        });
      }

      return newMessage;
    }
    return null;
  } catch (error) {
    console.error(`Error en createMessage: ${error}`);
    return null;
  }
}

// Manejar recibos de lectura
export async function handleReadReceipts(
  tenantId: string,
  companyId: string,
  senderId: string,
  receipts: any[],
  socialNetwork: string
) {
  try {
    const prisma = await getPrismaTenant(tenantId);
    const readMessageIds: string[] = [];

    // Obtener el plan para determinar quién es el usuario
    const plan: any = await prisma.plan.findFirst({
      where: {
        Company: {
          some: {
            id: companyId,
          },
        },
      },
    });

    // Determinar si el mensaje fue leído por el usuario (nosotros) o por el contacto
    const isReadByUser =
      plan?.[`ACCOUNT_ID_${socialNetwork?.toUpperCase()}`] === senderId;

    if (isReadByUser) {
      // Los mensajes fueron leídos por el usuario, marcar como leídos
      for (const receipt of receipts) {
        if (receipt.message_ids) {
          for (const messageId of receipt.message_ids) {
            const updatedMessages = await prisma.message.updateMany({
              where: {
                companyId,
                messageId: String(messageId),
                sender: "THEM",
              },
              data: {
                status: "READ",
              },
            });
            if (updatedMessages.count > 0) {
              readMessageIds.push(String(messageId));
            }
          }
        }
      }
    } else {
      // Los mensajes fueron leídos por el contacto, marcar como entregados
      for (const receipt of receipts) {
        if (receipt.message_ids) {
          for (const messageId of receipt.message_ids) {
            const updatedMessages = await prisma.message.updateMany({
              where: {
                companyId,
                messageId: String(messageId),
                sender: "ME",
              },
              data: {
                status: "DELIVERED",
              },
            });
            if (updatedMessages.count > 0) {
              readMessageIds.push(String(messageId));
            }
          }
        }
      }
    }

    return readMessageIds;
  } catch (error) {
    console.error(`Error en handleReadReceipts: ${error}`);
    return [];
  }
}

// Manejar eventos de lectura
export async function handleReadEvent(
  tenantId: string,
  companyId: string,
  senderId: string,
  readEvent: any,
  socialNetwork: string
) {
  try {
    const prisma = await getPrismaTenant(tenantId);
    const readMessageIds: string[] = [];

    // Obtener el plan para determinar quién es el usuario
    const plan: any = await prisma.plan.findFirst({
      where: {
        Company: {
          some: {
            id: companyId,
          },
        },
      },
    });

    // Determinar si el mensaje fue leído por el usuario (nosotros) o por el contacto
    const isReadByUser =
      plan?.[`ACCOUNT_ID_${socialNetwork?.toUpperCase()}`] === senderId;

    if (readEvent.mid) {
      const mid = String(readEvent.mid);

      // Buscar el mensaje específico por el mid de Instagram
      const specificMessage = await prisma.message.findFirst({
        where: {
          companyId,
          messageId: mid,
        },
      });

      if (specificMessage) {
        if (isReadByUser) {
          // El mensaje fue leído por el usuario, marcar todos los mensajes del contacto como leídos
          // hasta este punto (incluyendo este mensaje)
          const updatedMessages = await prisma.message.updateMany({
            where: {
              companyId,
              sender: "THEM",
              status: {
                not: "READ",
              },
              createdAt: {
                lte: specificMessage.createdAt,
              },
            },
            data: {
              status: "READ",
            },
          });
          if (updatedMessages.count > 0) {
            readMessageIds.push(mid);
          }
        } else {
          // El mensaje fue leído por el contacto, marcar todos nuestros mensajes como entregados
          // hasta este punto (incluyendo este mensaje)
          const updatedMessages = await prisma.message.updateMany({
            where: {
              companyId,
              sender: "ME",
              status: {
                not: "DELIVERED",
              },
              createdAt: {
                lte: specificMessage.createdAt,
              },
            },
            data: {
              status: "DELIVERED",
            },
          });
          if (updatedMessages.count > 0) {
            readMessageIds.push(mid);
          }
        }
      }
    }

    return readMessageIds;
  } catch (error) {
    console.error(`❌ Error en handleReadEvent: ${error}`);
    return [];
  }
}

// Procesar webhook
export async function processWebhook(data: any, params: any) {
  try {
    // Parametros en la url
    const { tenantId, companyId, socialNetwork } = params;

    // Validar parametros
    if (
      !tenantId ||
      !companyId ||
      !["instagram", "facebook", "whatsapp"].includes(socialNetwork)
    ) {
      throw new Error("Tenant ID, Company ID o Social Network no encontrados");
    }

    // Conexión con db
    const prisma = await getPrismaTenant(tenantId);
    const company = await prisma.company.findUnique({
      where: {
        id: companyId,
      },
      include: {
        plan: true,
      },
    });

    // Validar existencia de company
    if (!company) {
      throw new Error("Company no encontrada");
    }

    const entry = data.entry?.[0];
    const messagingEvent = entry?.messaging?.[0] || entry?.changes?.[0];

    // Procesar diferentes tipos de eventos
    if (messagingEvent) {
      const senderId = String(
        messagingEvent?.sender?.id || messagingEvent?.value?.messages?.[0]?.from
      ); // TODO: Revsiar que llega cuando se envia el mensaje desde acá en whatsapp
      const recipientId = String(
        messagingEvent?.recipient?.id ||
        messagingEvent?.value?.messages?.[0]?.to
      );
      const plan: any = await prisma.plan.findFirst({
        where: {
          Company: {
            some: {
              id: companyId,
            },
          },
        },
      });

      // Evento de reacción - TODO: Falta whatsapp
      if (messagingEvent.reaction) {
        await handleReactionEvent(
          tenantId,
          companyId,
          senderId,
          recipientId,
          messagingEvent.reaction,
          getFirstLetterInUpperCase(socialNetwork)
        );
      }

      // Evento de mensaje
      if (
        messagingEvent.message ||
        (socialNetwork === "whatsapp" && messagingEvent?.value?.messages?.[0])
      ) {
        const { contact, isNew } = await getChatBySenderId(
          tenantId,
          companyId,
          senderId,
          recipientId,
          getFirstLetterInUpperCase(socialNetwork),
          messagingEvent?.value?.contacts?.[0]
        );

        if (!contact && !isNew) {
          // TODO: Notificar al usuario que se le acabaron los contactos
          console.log(
            "Al usuario se le acabaron los contactos, no se puede continuar"
          );
          return true;
        }

        // Verificar si este mensaje ya fue procesado
        const messageId = String(
          socialNetwork === "whatsapp"
            ? messagingEvent?.value?.messages?.[0]?.id
            : messagingEvent?.message?.mid || entry?.id
        );
        const messageContent =
          socialNetwork === "whatsapp"
            ? messagingEvent?.value?.messages?.[0]?.text?.body
            : messagingEvent?.message?.text;

        // Solo verificar duplicados si el mensaje viene de nosotros
        const isFromUs =
          plan?.[`ACCOUNT_ID_${socialNetwork?.toUpperCase()}`] === senderId;

        if (isFromUs) {
          // Verificar si el mensaje ya fue procesado por nuestro sistema
          if (isMessageProcessed(companyId, messageId, messageContent || "")) {
            console.log(`Mensaje ya procesado, saltando: ${messageId}`);
            return true;
          }

          // Verificar si el mensaje ya existe en la base de datos
          if (contact?.id) {
            const existingMessage = await prisma.message.findFirst({
              where: {
                companyId,
                contactId: contact.id,
                messageId: messageId,
                sender: "ME",
                createdAt: {
                  gte: new Date(Date.now() - 300000),
                },
              },
            });

            if (existingMessage) {
              console.log(`Mensaje ya existe en DB, saltando: ${messageId}`);
              return true;
            }
          }
        }

        const newMessage = await createMessage(
          tenantId,
          companyId,
          contact?.id,
          plan?.[`ACCOUNT_ID_${socialNetwork?.toUpperCase()}`] == senderId
            ? recipientId
            : senderId,
          plan?.[`ACCOUNT_ID_${socialNetwork?.toUpperCase()}`] == senderId
            ? "ME"
            : "THEM",
          messagingEvent?.message || messagingEvent?.value?.messages?.[0],
          messageId,
          String(
            messagingEvent?.timestamp ||
            messagingEvent?.value?.messages?.[0]?.timestamp
          ),
          socialNetwork
        );

        // Marcar el mensaje como procesado para evitar duplicados futuros
        if (newMessage && messageContent && isFromUs) {
          await markMessageAsProcessedInWebhook(
            companyId,
            messageId,
            messageContent
          );
        }

        // Notificar nuevo mensaje en tiempo real
        if (newMessage && contact?.id) {
          await notifyRealtimeAPI("new-message", {
            companyId,
            contactId: contact.id,
            contact,
            message: {
              id: newMessage.id,
              messageId: newMessage.messageId,
              content: newMessage.content,
              sender: newMessage.sender,
              type: newMessage.type,
              createdAt: newMessage.createdAt,
              attachments: newMessage.attachments,
            },
          });

          // Si es un contacto nuevo, notificar también con la información completa del chat
          if (isNew) {
            // Crear el objeto de chat completo con el mensaje
            const chatWithMessage = {
              id: contact.id,
              createdAt: contact.createdAt,
              updatedAt: contact.updatedAt,
              name: contact.name,
              lastName: contact.lastName,
              phone: contact.phone,
              email: contact.email,
              origin: contact.origin,
              senderId: contact.senderId,
              lastMessage: {
                id: newMessage.id,
                content: newMessage.content,
                sender: newMessage.sender,
                senderId: newMessage.senderId,
                timestamp: newMessage.timestamp,
                messageId: newMessage.messageId,
                status: newMessage.status,
                type: newMessage.type,
                attachments: newMessage.attachments,
                createdAt: newMessage.createdAt,
                timeAgo: "Justo ahora",
              },
              unreadCount: newMessage.sender === "THEM" ? 1 : 0,
              contact: contact,
            };

            await notifyRealtimeAPI("new-contact", {
              companyId,
              contact: chatWithMessage,
            });
          }
        }

        // Reponder con IA
        if (
          (isNew && company?.SETT_IA_RESPONSE) ||
          (contact?.respondWithIa && !isNew && !isFromUs)
        ) {
          await enqueueAIResponse(
            tenantId,
            companyId,
            contact?.id,
            messagingEvent?.message || messagingEvent?.value?.messages?.[0],
            getFirstLetterInUpperCase(socialNetwork)
          );
        }
      }

      // Evento de lectura (delivery_receipts) - TODO: Falta whatsapp
      if (messagingEvent.delivery_receipts) {
        const readMessageIds = await handleReadReceipts(
          tenantId,
          companyId,
          senderId,
          messagingEvent.delivery_receipts,
          getFirstLetterInUpperCase(socialNetwork)
        );

        // Notificar mensajes leídos en tiempo real
        if (readMessageIds && readMessageIds.length > 0) {
          const { contact } = await getChatBySenderId(
            tenantId,
            companyId,
            senderId,
            recipientId,
            getFirstLetterInUpperCase(socialNetwork)
          );
          if (contact?.id) {
            await notifyRealtimeAPI("message-read", {
              companyId,
              contactId: contact.id,
              messageIds: readMessageIds,
            });
          }
        }
      }

      // Evento de lectura (read_receipts) - TODO: Falta whatsapp
      if (messagingEvent.read_receipts) {
        const readMessageIds = await handleReadReceipts(
          tenantId,
          companyId,
          senderId,
          messagingEvent.read_receipts,
          getFirstLetterInUpperCase(socialNetwork)
        );

        // Notificar mensajes leídos en tiempo real
        if (readMessageIds && readMessageIds.length > 0) {
          const { contact } = await getChatBySenderId(
            tenantId,
            companyId,
            senderId,
            recipientId,
            getFirstLetterInUpperCase(socialNetwork)
          );
          if (contact?.id) {
            await notifyRealtimeAPI("message-read", {
              companyId,
              contactId: contact.id,
              messageIds: readMessageIds,
            });
          }
        }
      }

      // Evento de lectura (read con mid) - TODO: Falta whatsapp
      if (messagingEvent.read) {
        const readMessageIds = await handleReadEvent(
          tenantId,
          companyId,
          senderId,
          messagingEvent.read,
          getFirstLetterInUpperCase(socialNetwork)
        );

        // Notificar mensajes leídos en tiempo real
        if (readMessageIds && readMessageIds.length > 0) {
          const { contact } = await getChatBySenderId(
            tenantId,
            companyId,
            senderId,
            recipientId,
            getFirstLetterInUpperCase(socialNetwork)
          );
          if (contact?.id) {
            await notifyRealtimeAPI("message-read", {
              companyId,
              contactId: contact.id,
              messageIds: readMessageIds,
            });
          }
        }
      }
    }

    return true;
  } catch (error) {
    console.error("❌ Error en processInstagramWebhook", error);
    throw error;
  }
}

// Verificar si el token de acceso a la red social es válido
export async function verifySocialNetworkToken(
  apiToken: string,
  accountId: string,
  tokenVerification: string,
  socialNetwork: "Facebook" | "Instagram" | "WhatsApp"
) {
  try {
    let apiUrl: string;
    let expectedField: string;

    return true;

    // Configurar URL y campo según la red social
    if (socialNetwork === "Facebook") {
      apiUrl = `https://graph.facebook.com/v21.0/me?access_token=${apiToken}`;
      expectedField = "id";
    } else if (socialNetwork === "Instagram") {
      apiUrl = `https://graph.facebook.com/v21.0/me/accounts?access_token=${apiToken}`;
      expectedField = "data";
    } else if (socialNetwork === "WhatsApp") return true;
    else {
      console.error("Red social no soportada:", socialNetwork);
      return false;
    }

    // 1. Validar el apiToken haciendo una llamada a la API correspondiente
    const response = await fetch(apiUrl);
    const data = await response.json();

    if (data.error) {
      console.error(`Error en apiToken para ${socialNetwork}:`, data.error);
      return false;
    }

    // 2. Validar que el accountId coincida según la red social
    if (socialNetwork === "Facebook") {
      if (data.id !== accountId) {
        console.error("accountId de Facebook no coincide:", {
          expected: accountId,
          received: data.id,
        });
        return false;
      }
    } else if (socialNetwork === "Instagram") {
      // Para Instagram, buscar en la lista de cuentas
      const instagramAccount = data.data?.find(
        (account: any) =>
          account.id === accountId && account.instagram_business_account
      );

      if (!instagramAccount) {
        console.error("accountId de Instagram no encontrado:", {
          expected: accountId,
          availableAccounts: data.data?.map((acc: any) => acc.id) || [],
        });
        return false;
      }
    }

    // 3. Validar el tokenVerification (identificador de verificación)
    if (!tokenVerification || tokenVerification.trim() === "") {
      console.error("tokenVerification está vacío o es inválido");
      return false;
    }

    console.log(`✅ Token verificado exitosamente para ${socialNetwork}`);
    return true;
  } catch (error) {
    console.error("Error en verifySocialNetworkToken", error);
    return false;
  }
}
