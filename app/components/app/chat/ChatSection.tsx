import { useState, useEffect } from "react";
import ChatContactHeader from "./ChatContactHeader";
import ChatMessages from "./ChatMessages";
import ChatInput from "./ChatInput";
import { MessageSquare, X } from "lucide-react";
import type { Chat, ChatMessage } from "~/types/app";
import type { User, Agent } from "~/types/schema";

interface ChatSectionProps {
  selectedChat: string | null;
  messages: ChatMessage[];
  chat: Chat | null;
  onRetryMessage?: (message: ChatMessage) => void;
  messageInput: string;
  setMessageInput: (value: string) => void;
  onSendMessage: () => void;
  isSendingMessage: boolean;
  aiResponseEnabled: boolean;
  imagePreviewUrl: string | null;
  onCancelImage: () => void;
  onAttachmentClick: () => void;
  isUploadingImage: boolean;
  isDarkMode: boolean;
  fileInputRef: React.RefObject<HTMLInputElement | null>;
  handleImageSelect: (e: React.ChangeEvent<HTMLInputElement>) => void;
  assignedUser: User | null;
  onAssignClick: () => void;
  onToggleAI: () => void;
  loadingStatusIA: boolean;
  agent: Agent | null;
  onAgentClick: () => void;
  isAISidebarOpen: boolean;
  onToggleAISidebar: () => void;
  onClearChat?: () => void;
  showBackButton?: boolean;
  onBackToList?: () => void;
}

export default function ChatSection({
  selectedChat,
  messages,
  chat,
  onRetryMessage,
  messageInput,
  setMessageInput,
  onSendMessage,
  isSendingMessage,
  aiResponseEnabled,
  imagePreviewUrl,
  onCancelImage,
  onAttachmentClick,
  isUploadingImage,
  isDarkMode,
  fileInputRef,
  handleImageSelect,
  assignedUser,
  onAssignClick,
  onToggleAI,
  loadingStatusIA,
  agent,
  onAgentClick,
  isAISidebarOpen,
  onToggleAISidebar,
  onClearChat,
  showBackButton = false,
  onBackToList,
}: ChatSectionProps) {
  const [fullscreenImage, setFullscreenImage] = useState<string | null>(null);

  // Manejar imagen en fullscreen
  const openFullscreenImage = (imageUrl: string) => {
    setFullscreenImage(imageUrl);
  };

  const closeFullscreenImage = () => {
    setFullscreenImage(null);
  };

  // Cerrar modal con tecla Escape
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape" && fullscreenImage) {
        closeFullscreenImage();
      }
    };

    if (fullscreenImage) {
      document.addEventListener("keydown", handleKeyDown);
      // Prevenir scroll del body cuando el modal está abierto
      document.body.style.overflow = "hidden";
    }

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "unset";
    };
  }, [fullscreenImage]);
  // Estado vacío cuando no hay chat seleccionado
  if (!selectedChat) {
    return (
      <section className="flex-1 flex flex-col bg-slate-50 dark:bg-slate-900/50 relative min-h-0">
        <div className="flex-1 flex flex-col items-center justify-center p-8">
          <div className="text-center max-w-md">
            <div className="w-24 h-24 mx-auto mb-6 bg-primary/10 dark:bg-primary/20 rounded-full flex items-center justify-center">
              <MessageSquare className="w-12 h-12 text-primary dark:text-primary/80" />
            </div>
            
            <h3 className="text-2xl font-bold text-slate-900 dark:text-white mb-3">
              ¡Bienvenido al Chat en Vivo!
            </h3>
            
            <p className="text-slate-600 dark:text-slate-400 text-base leading-relaxed mb-6">
              Selecciona una conversación de la lista para comenzar a chatear con tus contactos.
            </p>

            <div className="flex flex-col gap-3 text-sm text-slate-500 dark:text-slate-500">
              <div className="flex items-center gap-2 justify-center">
                <div className="w-2 h-2 rounded-full bg-primary"></div>
                <span>Responde mensajes en tiempo real</span>
              </div>
              <div className="flex items-center gap-2 justify-center">
                <div className="w-2 h-2 rounded-full bg-primary"></div>
                <span>Gestiona múltiples canales</span>
              </div>
              <div className="flex items-center gap-2 justify-center">
                <div className="w-2 h-2 rounded-full bg-primary"></div>
                <span>Usa IA para respuestas automáticas</span>
              </div>
            </div>
          </div>
        </div>
      </section>
    );
  }

  // Vista normal con chat seleccionado
  return (
    <>
      <section className="flex-1 flex flex-col bg-slate-50 dark:bg-slate-900/50 relative min-h-0">
        <ChatContactHeader
          name={chat?.name || "Sin nombre"}
          lastSeen={chat?.lastMessage?.timeAgo || ""}
          avatar={
            chat?.avatar ||
            "https://firebasestorage.googleapis.com/v0/b/chatzy-bca9e.firebasestorage.app/o/default-avatar-icon-of-social-media-user-vector.jpg?alt=media&token=970f912c-6aa7-4d7d-9cf1-4970a1411624"
          }
          network={
            (chat?.origin?.toLowerCase() as "whatsapp" | "instagram" | "facebook") ||
            "whatsapp"
          }
          assignedUser={assignedUser}
          onAssignClick={onAssignClick}
          aiResponseEnabled={aiResponseEnabled}
          onToggleAI={onToggleAI}
          loadingStatusIA={loadingStatusIA}
          agent={agent}
          onAgentClick={onAgentClick}
          onClearChat={onClearChat}
          showBackButton={showBackButton}
          onBackToList={onBackToList}
        />
        <ChatMessages
          messages={messages}
          onRetryMessage={onRetryMessage}
          onImageClick={openFullscreenImage}
          contactAvatar={
            chat?.avatar ||
            "https://firebasestorage.googleapis.com/v0/b/chatzy-bca9e.firebasestorage.app/o/default-avatar-icon-of-social-media-user-vector.jpg?alt=media&token=970f912c-6aa7-4d7d-9cf1-4970a1411624"
          }
        />
        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/jpg,image/png"
          onChange={handleImageSelect}
          className="hidden"
        />
        <ChatInput
          selectedChat={selectedChat}
          messageInput={messageInput}
          setMessageInput={setMessageInput}
          onSendMessage={onSendMessage}
          isSendingMessage={isSendingMessage}
          aiResponseEnabled={aiResponseEnabled}
          imagePreviewUrl={imagePreviewUrl}
          onCancelImage={onCancelImage}
          onAttachmentClick={onAttachmentClick}
          isUploadingImage={isUploadingImage}
          isDarkMode={isDarkMode}
          isAISidebarOpen={isAISidebarOpen}
          onToggleAISidebar={onToggleAISidebar}
        />
      </section>

      {/* Modal de imagen en pantalla completa */}
      {fullscreenImage && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-90"
          onClick={closeFullscreenImage}
        >
          <div className="relative max-w-7xl max-h-full p-4">
            <button
              onClick={closeFullscreenImage}
              className="absolute top-2 right-2 z-10 w-10 h-10 bg-black bg-opacity-50 hover:bg-opacity-70 text-white rounded-full flex items-center justify-center transition-all duration-200 cursor-pointer"
            >
              <X className="w-6 h-6" />
            </button>

            <img
              src={fullscreenImage}
              alt="Imagen en pantalla completa"
              className="max-w-full max-h-full object-contain rounded-lg"
              onClick={(e) => e.stopPropagation()}
            />
          </div>
        </div>
      )}
    </>
  );
}

