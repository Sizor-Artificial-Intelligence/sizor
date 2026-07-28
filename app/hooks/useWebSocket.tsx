import { useEffect, useRef, useState, useCallback } from "react";
import { useParams } from "react-router";
import { NODE_ENV, VITE_API_URL, VITE_API_URL_DEV } from "~/config/env";
import type { User } from "~/types/schema";

interface WebSocketMessage {
  type: string;
  contactId?: string;
  message?: any;
  messageIds?: string[];
  contacts?: any[];
  contact?: any;
  messageId?: string;
  reaction?: any;
  tokensData?: {
    tokensUsed: number;
    maxTokens: number;
    isFree: boolean;
  };
  notification?: any;
  unreadCount?: number;
  respondWithIa?: boolean;
  contactName?: string;
  assignedUserId?: string;
  assignedUserName?: string;
  assignedUser?: User;
  reason?: string;
  sentiment?: string;
  leadTemperature?: string;
  confidence?: number;
  timestamp: string;
}

interface UseWebSocketOptions {
  onNewMessage?: (contactId: string, message: any) => void;
  onMessageRead?: (contactId: string, messageIds: string[]) => void;
  onContactsUpdate?: (contacts: any[]) => void;
  onNewContact?: (contact: any) => void;
  onReactionUpdate?: (
    contactId: string,
    messageId: string,
    reaction: any
  ) => void;
  onTokensUpdate?: (tokensData: {
    tokensUsed: number;
    maxTokens: number;
    isFree: boolean;
  }) => void;
  onNewNotification?: (notification: any) => void;
  onNotificationsCountUpdate?: (unreadCount: number) => void;
  onSmartInboxUpdate?: (unreadCount: number) => void;
  onChatAssignmentUpdate?: (
    contactId: string,
    assignedUserId: string | null,
    assignedUserName: string | null,
    assignedUser: User | null,
    reason: string
  ) => void;
  onSystemMessage?: (contactId: string, message: any) => void;
  onSentimentAnalysisUpdate?: (data: {
    contactId: string;
    sentiment: string;
    leadTemperature: string;
    confidence: number;
  }) => void;
  onRefreshLoaders?: () => void;
  userId?: string;
}

export function useWebSocket(options: UseWebSocketOptions = {}) {
  const { companyId } = useParams();
  const { userId } = options;
  const [isConnected, setIsConnected] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<
    "connecting" | "connected" | "disconnected" | "error"
  >("disconnected");
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const reconnectAttempts = useRef(0);
  const maxReconnectAttempts = 5;
  const optionsRef = useRef(options);

  // Actualizar las opciones en el ref para evitar re-renders
  useEffect(() => {
    optionsRef.current = options;
  }, [options]);

  const connect = useCallback(() => {
    if (!companyId || wsRef.current?.readyState === WebSocket.OPEN) {
      return;
    }

    setConnectionStatus("connecting");

    try {
      // Determinar la URL del WebSocket (conectar a la API)
      const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
      const API_HOST =
        NODE_ENV == "development" ? VITE_API_URL_DEV : VITE_API_URL;
      // Remover el protocolo http:// o https:// de la URL para WebSocket
      const cleanHost = API_HOST?.replace(/^https?:\/\//, "");
      let wsUrl = `${protocol}//${cleanHost}/ws?companyId=${companyId}`;
      // Agregar userId si está disponible
      if (userId) {
        wsUrl += `&userId=${userId}`;
      }

      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;

      ws.onopen = () => {
        setIsConnected(true);
        setConnectionStatus("connected");
        reconnectAttempts.current = 0;
      };

      ws.onmessage = (event) => {
        try {
          const message: WebSocketMessage = JSON.parse(event.data);
          switch (message.type) {
            case "connected":
              break;

            case "new_message":
              if (
                message.contactId &&
                message.message &&
                optionsRef.current.onNewMessage
              ) {
                optionsRef.current.onNewMessage(
                  message.contactId,
                  message.message
                );
              }
              break;

            case "message_read":
              if (
                message.contactId &&
                message.messageIds &&
                optionsRef.current.onMessageRead
              ) {
                optionsRef.current.onMessageRead(
                  message.contactId,
                  message.messageIds
                );
              }
              break;

            case "contacts_update":
              if (message.contacts && optionsRef.current.onContactsUpdate) {
                optionsRef.current.onContactsUpdate(message.contacts);
              }
              break;

            case "new_contact":
              if (message.contact && optionsRef.current.onNewContact) {
                optionsRef.current.onNewContact(message.contact);
              }
              break;

            case "reaction_update":
              if (
                message.contactId &&
                message.messageId &&
                message.reaction &&
                optionsRef.current.onReactionUpdate
              ) {
                optionsRef.current.onReactionUpdate(
                  message.contactId,
                  message.messageId,
                  message.reaction
                );
              }
              break;

            case "tokens_update":
              if (message.tokensData && optionsRef.current.onTokensUpdate) {
                optionsRef.current.onTokensUpdate(message.tokensData);
              }
              break;

            case "new_notification":
              if (
                message.notification &&
                optionsRef.current.onNewNotification
              ) {
                // Pasar el conteo junto con la notificación
                optionsRef.current.onNewNotification({
                  ...message.notification,
                  unreadCount: message.unreadCount,
                });
              }
              // Si también viene el conteo actualizado, actualizarlo
              if (
                message.unreadCount !== undefined &&
                optionsRef.current.onNotificationsCountUpdate
              ) {
                optionsRef.current.onNotificationsCountUpdate(
                  message.unreadCount
                );
              }
              break;

            case "notifications_count_update":
              if (
                message.unreadCount !== undefined &&
                optionsRef.current.onNotificationsCountUpdate
              ) {
                optionsRef.current.onNotificationsCountUpdate(
                  message.unreadCount
                );
              }
              break;

            case "smart_inbox_update":
              if (
                message.unreadCount !== undefined &&
                optionsRef.current.onSmartInboxUpdate
              ) {
                optionsRef.current.onSmartInboxUpdate(message.unreadCount);
              }
              break;

            case "chat_assignment_update":
              if (
                message.contactId &&
                optionsRef.current.onChatAssignmentUpdate
              ) {
                optionsRef.current.onChatAssignmentUpdate(
                  message.contactId,
                  message.assignedUserId || null,
                  message.assignedUserName || null,
                  message.assignedUser || null,
                  message.reason || "Unknown"
                );
              }
              break;

            case "system_message":
              if (
                message.contactId &&
                message.message &&
                optionsRef.current.onSystemMessage
              ) {
                optionsRef.current.onSystemMessage(
                  message.contactId,
                  message.message
                );
              }
              break;

            case "sentiment_analysis_update":
              if (
                message.contactId &&
                message.sentiment &&
                message.leadTemperature !== undefined &&
                optionsRef.current.onSentimentAnalysisUpdate
              ) {
                optionsRef.current.onSentimentAnalysisUpdate({
                  contactId: message.contactId,
                  sentiment: message.sentiment,
                  leadTemperature: message.leadTemperature,
                  confidence: message.confidence || 0,
                });
              }
              break;

            case "refreshLoaders":
              if (optionsRef.current.onRefreshLoaders) {
                optionsRef.current.onRefreshLoaders();
              }
              break;

            default:
          }
        } catch (error) {
          console.error("❌ Error procesando mensaje WebSocket:", error);
        }
      };

      ws.onclose = (event) => {
        setIsConnected(false);
        setConnectionStatus("disconnected");

        // Intentar reconectar si no fue un cierre intencional
        if (
          event.code !== 1000 &&
          reconnectAttempts.current < maxReconnectAttempts
        ) {
          scheduleReconnect();
        }
      };

      ws.onerror = (error) => {
        setConnectionStatus("error");
        setIsConnected(false);
      };
    } catch (error) {
      console.log(error, "error");
      setConnectionStatus("error");
    }
  }, [companyId]);

  const scheduleReconnect = () => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
    }

    const delay = Math.min(
      1000 * Math.pow(2, reconnectAttempts.current),
      30000
    );
    reconnectAttempts.current++;

    reconnectTimeoutRef.current = setTimeout(() => {
      connect();
    }, delay);
  };

  const disconnect = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }

    if (wsRef.current) {
      wsRef.current.close(1000, "Desconexión intencional");
      wsRef.current = null;
    }

    setIsConnected(false);
    setConnectionStatus("disconnected");
    reconnectAttempts.current = 0;
  }, []);

  const sendMessage = (message: any) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(message));
    } else {
      console.warn("⚠️ WebSocket no está conectado");
    }
  };

  // Conectar al montar el componente y cuando cambie companyId o userId
  useEffect(() => {
    if (companyId) {
      connect();
    }

    // Limpiar al desmontar o cuando cambie companyId o userId
    return () => {
      disconnect();
    };
  }, [companyId, userId, connect, disconnect]);

  return {
    isConnected,
    connectionStatus,
    sendMessage,
    connect,
    disconnect,
  };
}
