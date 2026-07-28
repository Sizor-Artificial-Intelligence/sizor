import { useEffect, useCallback } from "react";
import { useWebSocket } from "~/hooks/useWebSocket";
import { useMessages } from "~/contexts/MessagesContext";
import { useTokens } from "~/contexts/TokensContext";
import { useCompany } from "~/hooks/useCompany";
import usePath from "~/hooks/usePath";
import { useMatches } from "react-router";

/**
 * Componente que sincroniza el contador de mensajes no leídos
 * y los tokens con los eventos de WebSocket en tiempo real.
 * Este componente debe estar montado en el layout principal
 * para que funcione en todas las rutas.
 *
 * Nota: Se desactiva cuando estamos en la ruta del chat para evitar
 * conflictos con la conexión WebSocket del componente de chat.
 */
export function MessagesSync() {
  const matches = useMatches();
  const { incrementMessages, setUnreadMessages } = useMessages();
  const { updateTokens } = useTokens();
  const company = useCompany();
  const PATH = usePath();

  // Verificar si estamos en la ruta del chat
  const isInChatRoute = matches.some(
    (match) =>
      match.id === "routes/app/$companyId/chat/index" ||
      match.id === "routes/app/$companyId/chat/details"
  );

  // Obtener el conteo actualizado desde el servidor
  const fetchUnreadCount = useCallback(async () => {
    if (!company?.id) return;

    try {
      const response = await fetch(`${PATH}/api/unread-messages`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ companyId: company.id }),
      });

      if (response.ok) {
        const data = await response.json();
        setUnreadMessages(data.unreadMessages || 0);
      }
    } catch (error) {
      console.error("Error obteniendo mensajes no leídos:", error);
    }
  }, [company?.id, PATH, setUnreadMessages]);

  // Manejar nuevos mensajes
  const handleNewMessage = useCallback(
    (contactId: string, message: any) => {
      // Solo incrementar si el mensaje es del contacto (THEM)
      if (message.sender === "THEM") {
        incrementMessages();
      }
    },
    [incrementMessages]
  );

  // Manejar mensajes leídos
  const handleMessageRead = useCallback(
    (contactId: string, messageIds: string[]) => {
      // Recalcular desde el servidor
      fetchUnreadCount();
    },
    [fetchUnreadCount]
  );

  // Manejar actualización de contactos
  const handleContactsUpdate = useCallback(
    (updatedContacts: any[]) => {
      // Calcular el total de mensajes no leídos de todos los contactos
      const totalUnread = updatedContacts.reduce(
        (total, contact) => total + (contact.unreadCount || 0),
        0
      );
      setUnreadMessages(totalUnread);
    },
    [setUnreadMessages]
  );

  // Manejar actualización de tokens
  const handleTokensUpdate = useCallback(
    (tokensData: {
      tokensUsed: number;
      maxTokens: number;
      isFree: boolean;
    }) => {
      updateTokens(tokensData);
    },
    [updateTokens]
  );

  // Inicializar tokens desde el plan de la empresa
  useEffect(() => {
    if (company?.plan) {
      updateTokens({
        tokensUsed: company.plan.tokensUsed,
        maxTokens: company.plan.maxTokens,
        isFree: company.plan.isFree,
      });
    }
  }, [company?.plan, updateTokens]);

  // Inicializar WebSocket
  // Para mensajes: solo activo si NO estamos en la ruta del chat
  // Para tokens: siempre activo
  useWebSocket({
    onNewMessage: !isInChatRoute ? handleNewMessage : undefined,
    onMessageRead: !isInChatRoute ? handleMessageRead : undefined,
    onContactsUpdate: !isInChatRoute ? handleContactsUpdate : undefined,
    onTokensUpdate: handleTokensUpdate, // Siempre activo
  });

  return null; // Este componente no renderiza nada
}
