import { CheckCheck, RotateCcw } from "lucide-react";
import ContactAvatar from "../contacts/avatar";
import type { ChatMessage } from "~/types/app";
import { useLoaderData } from "react-router";
import { getReactionBadges } from "./reactions";

interface MessageItemProps {
  message: ChatMessage;
  renderAttachments: (
    attachments: string | null,
    messageId: string
  ) => React.ReactNode;
  formatMessageTime: (date: Date) => string;
  onRetryMessage?: (message: ChatMessage) => void;
}

export default function MessageItem({
  message,
  renderAttachments,
  formatMessageTime,
  onRetryMessage,
}: MessageItemProps) {
  const loaderData = useLoaderData<any>();
  const chat = loaderData?.chat;
  const reactionBadges = getReactionBadges(message.reactions);

  // Verificar si es un mensaje del sistema
  const isSystemMessage = message.sender === "SYSTEM";

  // Si es mensaje del sistema, renderizar de manera diferente
  if (isSystemMessage) {
    return (
      <div className="flex justify-center my-4 w-full">
        <div className="bg-yellow-200 dark:bg-yellow-800 rounded px-4 py-2 w-full">
          <p className="text-sm text-gray-700 dark:text-gray-300 text-center w-full">
            {message.content}
          </p>
        </div>
      </div>
    );
  }
  const getStatusIcon = (status: string) => {
    switch (status) {
      case "SENDING":
        return (
          <div className="w-4 h-4 flex items-center justify-center">
            <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-gray-400"></div>
          </div>
        );
      case "SENT":
        return <CheckCheck className="w-4 h-4 text-gray-400" />;
      case "DELIVERED":
        return <CheckCheck className="w-4 h-4 text-gray-400" />;
      case "READ":
        return <CheckCheck className="w-4 h-4 text-blue-500" />;
      case "FAILED":
        return (
          <div className="w-4 h-4 text-red-500" title="Error al enviar">
            ⚠️
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div
      key={`${message.id}-${message.messageId || message.createdAt}`}
      className={`flex ${message.sender === "THEM" ? "justify-start" : "justify-end"} mb-2`}
    >
      <div
        className={`flex max-w-[85%] sm:max-w-[70%] ${message.sender === "THEM" ? "flex-row" : "flex-row-reverse"} items-end space-x-2`}
      >
        {message.sender === "THEM" && <ContactAvatar contact={chat} />}

        <div
          className={`${message.sender === "THEM" ? "items-start" : "items-end"} flex flex-col space-y-1`}
        >
          <div
            className={`relative px-4 py-2 rounded-2xl ${
              message.sender === "THEM"
                ? "bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white rounded-bl-md"
                : "bg-blue-500 text-white rounded-br-md"
            }`}
          >
            {/* Renderizar archivos adjuntos */}
            {(message.type === "ATTACHMENT" ||
              message.type === "AUDIO" ||
              message.type === "IMAGE" ||
              message.type === "VIDEO") &&
              message.attachments &&
              renderAttachments(message.attachments, message.id)}

            {/* Mostrar contenido del mensaje si existe */}
            {message.content && (
              <div
                className={`text-sm whitespace-pre-wrap break-words ${(message.type === "ATTACHMENT" || message.type === "AUDIO" || message.type === "IMAGE" || message.type === "VIDEO") && message.attachments ? "mt-2" : ""}`}
              >
                {message.content}
              </div>
            )}

            {/* Mostrar mensaje por defecto si no hay contenido ni archivos */}
            {!message.content &&
              message.type !== "ATTACHMENT" &&
              message.type !== "AUDIO" &&
              message.type !== "IMAGE" &&
              message.type !== "VIDEO" && (
                <p className="text-sm opacity-70">Mensaje sin contenido</p>
              )}

            {/* Mostrar reacciones dentro del mensaje */}
            {reactionBadges.length > 0 && (
              <div
                className={`absolute -bottom-3 ${
                  message.sender === "THEM" ? "-left-2" : "-right-2"
                } flex flex-wrap gap-1`}
              >
                {reactionBadges.map((badge) => (
                  <div
                    key={badge.emoji}
                    className="flex items-center gap-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-full px-2 h-6 shadow-sm hover:shadow-md transition-shadow duration-200"
                    title={
                      badge.senderIds.length > 0
                        ? `${badge.emoji} (${badge.count})`
                        : `${badge.emoji}`
                    }
                  >
                    <span className="text-xs leading-none">{badge.emoji}</span>
                    {badge.count > 1 && (
                      <span className="text-[10px] leading-none text-gray-600 dark:text-gray-300">
                        {badge.count}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          <div
            className={`flex items-center space-x-1 text-xs text-gray-500 dark:text-gray-400 ${message.sender === "THEM" ? "" : "flex-row-reverse"} ${
              reactionBadges.length > 0 ? "mt-2" : ""
            }`}
          >
            <span>{formatMessageTime(new Date(message.createdAt))}</span>
            {message.sender === "ME" && message.status && (
              <div className="flex items-center space-x-1">
                {getStatusIcon(message.status)}
                {message.status === "FAILED" && onRetryMessage && (
                  <button
                    onClick={() => onRetryMessage(message)}
                    className="cursor-pointer flex items-center space-x-1 px-2 py-1 text-xs bg-red-100 hover:bg-red-200 dark:bg-red-900/30 dark:hover:bg-red-900/50 text-red-600 dark:text-red-400 rounded-full transition-colors duration-200"
                    title="Reenviar mensaje"
                  >
                    <RotateCcw className="w-3 h-3" />
                    <span>Reenviar</span>
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
