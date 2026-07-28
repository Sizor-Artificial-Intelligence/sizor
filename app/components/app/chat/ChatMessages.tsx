import { useEffect, useRef, useState } from "react";
import ChatMessage from "./ChatMessage";
import type { ChatMessage as ChatMessageType } from "~/types/app";

interface ChatMessagesProps {
  messages: ChatMessageType[];
  onRetryMessage?: (message: ChatMessageType) => void;
  onImageClick?: (url: string) => void;
  contactAvatar?: string;
}

export default function ChatMessages({
  messages,
  onRetryMessage,
  onImageClick,
  contactAvatar = "https://firebasestorage.googleapis.com/v0/b/chatzy-bca9e.firebasestorage.app/o/default-avatar-icon-of-social-media-user-vector.jpg?alt=media&token=970f912c-6aa7-4d7d-9cf1-4970a1411624",
}: ChatMessagesProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const [loadingImages, setLoadingImages] = useState<Set<string>>(new Set());

  // Función para hacer scroll al final
  const scrollToBottom = (behavior: ScrollBehavior = "smooth") => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior, block: "end" });
    }
  };

  // Manejar el inicio de carga de imagen
  const handleImageLoadStart = (imageUrl: string) => {
    setLoadingImages((prev) => new Set(prev).add(imageUrl));
  };

  // Manejar el fin de carga de imagen
  const handleImageLoad = (imageUrl: string) => {
    setLoadingImages((prev) => {
      const newSet = new Set(prev);
      newSet.delete(imageUrl);
      return newSet;
    });

    // Scroll al final después de que la imagen termine de cargar
    setTimeout(() => {
      scrollToBottom("smooth");
    }, 100);
  };

  // Scroll al final cuando cambien los mensajes o al montar el componente
  useEffect(() => {
    // Pequeño delay para asegurar que el DOM se haya actualizado
    const timeoutId = setTimeout(() => {
      scrollToBottom("auto");
    }, 100);

    return () => clearTimeout(timeoutId);
  }, [messages.length]);

  // Scroll suave cuando se agrega un nuevo mensaje
  useEffect(() => {
    if (messages.length > 0) {
      const lastMessage = messages[messages.length - 1];
      // Si el último mensaje es mío (ME), hacer scroll suave
      if (lastMessage.sender === "ME") {
        scrollToBottom("smooth");
      }
    }
  }, [messages]);
  // Transformar mensajes al formato esperado por ChatMessage
  const transformedMessages = messages.map((msg) => ({
    id: msg.id,
    message: msg.content || "",
    time: msg.timeAgo || "",
    avatar: contactAvatar, // Usar el avatar del contacto para mensajes entrantes (no se usará para salientes)
    isOutgoing: msg.sender === "ME",
    isHighlighted: false,
    status: msg.status,
    originalMessage: msg, // Para pasar al onRetryMessage
    // Usar messageId si existe, sino usar id
    uniqueKey: msg.messageId || msg.id,
  }));

  if (messages.length === 0) {
    return (
      <div className="flex-1 min-h-0 overflow-y-auto p-6 flex items-center justify-center custom-scrollbar">
        <div className="text-center text-slate-500 dark:text-slate-400">
          <p className="text-sm">No hay mensajes en esta conversación</p>
        </div>
      </div>
    );
  }

  return (
    <div
      ref={messagesContainerRef}
      className="flex-1 min-h-0 overflow-y-auto px-4 py-4 sm:p-6 flex flex-col gap-6 sm:gap-7 custom-scrollbar"
    >
      {transformedMessages.map((msg) => {
        // Determinar si alguna imagen del mensaje está cargando
        const isImageLoading = msg.originalMessage?.attachments
          ? (() => {
              try {
                const attachments = JSON.parse(msg.originalMessage.attachments);
                const attachmentsArray = Array.isArray(attachments)
                  ? attachments
                  : [attachments];
                return attachmentsArray.some(
                  (att: any) =>
                    att.type === "image" &&
                    att.payload?.url &&
                    loadingImages.has(att.payload.url)
                );
              } catch {
                return false;
              }
            })()
          : false;

        return (
          <ChatMessage
            key={msg.uniqueKey}
            message={msg.message}
            time={msg.time}
            avatar={msg.avatar}
            isOutgoing={msg.isOutgoing}
            isHighlighted={msg.isHighlighted}
            status={msg.status}
            originalMessage={msg.originalMessage}
            onRetryMessage={
              onRetryMessage
                ? () => onRetryMessage(msg.originalMessage)
                : undefined
            }
            onImageClick={onImageClick}
            onImageLoad={handleImageLoad}
            onImageLoadStart={handleImageLoadStart}
            isImageLoading={isImageLoading}
          />
        );
      })}
      {/* Elemento invisible para hacer scroll al final */}
      <div ref={messagesEndRef} />
    </div>
  );
}

