import { PlusIcon, SendIcon, SmileIcon, Paperclip, X, SparklesIcon } from "lucide-react";
import { useState, useRef, useEffect } from "react";
import EmojiPicker, { Theme } from "emoji-picker-react";

interface ChatInputProps {
  selectedChat: string | null;
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
  isAISidebarOpen: boolean;
  onToggleAISidebar: () => void;
}

export default function ChatInput({
  selectedChat,
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
  isAISidebarOpen,
  onToggleAISidebar,
}: ChatInputProps) {
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const emojiPickerRef = useRef<HTMLDivElement>(null);
  const emojiButtonRef = useRef<HTMLButtonElement>(null);

  // Auto-ajustar altura del textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "36px";
      const scrollHeight = textareaRef.current.scrollHeight;
      textareaRef.current.style.height = Math.min(scrollHeight, 128) + "px";
    }
  }, [messageInput]);

  // Auto-focus en el textarea cuando se selecciona un chat
  useEffect(() => {
    if (selectedChat && !aiResponseEnabled && textareaRef.current) {
      // Pequeño delay para asegurar que el chat esté completamente cargado
      const timeoutId = setTimeout(() => {
        textareaRef.current?.focus();
      }, 150);

      return () => clearTimeout(timeoutId);
    }
  }, [selectedChat, aiResponseEnabled]);

  // Cerrar emoji picker al hacer click fuera
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        emojiPickerRef.current &&
        !emojiPickerRef.current.contains(event.target as Node) &&
        emojiButtonRef.current &&
        !emojiButtonRef.current.contains(event.target as Node)
      ) {
        setShowEmojiPicker(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const handleEmojiClick = (emojiData: any) => {
    setMessageInput(messageInput + emojiData.emoji);
    setShowEmojiPicker(false);
    textareaRef.current?.focus();
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      onSendMessage();
    }
  };

  return (
    <div className="px-3 py-3 sm:p-4 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-[#232f48] shrink-0 relative">
      {/* Preview de imagen */}
      {imagePreviewUrl && (
        <div className="mb-3 relative inline-block">
          <img
            src={imagePreviewUrl}
            alt="Preview"
            className="max-h-32 rounded-lg border border-slate-300 dark:border-slate-600"
          />
          <button
            onClick={onCancelImage}
            className="cursor-pointer absolute -top-2 -right-2 bg-red-500 hover:bg-red-600 text-white rounded-full w-6 h-6 flex items-center justify-center transition-colors"
            title="Cancelar imagen"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Input principal */}
      <div className="flex items-end gap-2 sm:gap-3 bg-slate-50 dark:bg-[#111722] rounded-xl px-3 py-2 sm:p-3 sm:py-1 border border-slate-200 dark:border-[#232f48]">
        {/* Botones izquierdos: ocultos en móvil para dar espacio al input */}
        <div className="hidden sm:flex gap-1 pb-1 shrink-0">
          <button
            ref={emojiButtonRef}
            onClick={() => setShowEmojiPicker(!showEmojiPicker)}
            disabled={!selectedChat || aiResponseEnabled}
            className="cursor-pointer disabled:cursor-not-allowed p-1.5 text-slate-400 dark:text-slate-500 hover:text-primary dark:hover:text-primary transition-colors disabled:opacity-50"
            title="Emojis"
          >
            <SmileIcon className="w-4 h-4" />
          </button>
          <button
            onClick={onAttachmentClick}
            disabled={!selectedChat || aiResponseEnabled || isUploadingImage}
            className="cursor-pointer disabled:cursor-not-allowed p-1.5 text-slate-400 dark:text-slate-500 hover:text-primary dark:hover:text-primary transition-colors disabled:opacity-50"
            title="Adjuntar imagen"
          >
            {isUploadingImage ? (
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-slate-500"></div>
            ) : (
              <Paperclip className="w-4 h-4" />
            )}
          </button>
          {/* Botón Copilot IA */}
          {selectedChat && (
            <button
              onClick={onToggleAISidebar}
              disabled={!selectedChat}
              className={`cursor-pointer disabled:cursor-not-allowed p-1.5 transition-all ${
                isAISidebarOpen
                  ? "text-primary bg-primary/10 dark:bg-primary/20 rounded"
                  : "text-slate-400 dark:text-slate-500 hover:text-primary dark:hover:text-primary"
              }`}
              title={isAISidebarOpen ? "Cerrar Copilot IA" : "Abrir Copilot IA"}
            >
              <SparklesIcon className={`w-4 h-4 ${isAISidebarOpen ? "animate-pulse" : ""}`} />
            </button>
          )}
        </div>

        {/* Textarea */}
        <textarea
          ref={textareaRef}
          value={messageInput}
          onChange={(e) => setMessageInput(e.target.value)}
          onKeyPress={handleKeyPress}
          disabled={!selectedChat || aiResponseEnabled}
          placeholder={
            aiResponseEnabled
              ? "La IA responderá automáticamente"
              : selectedChat
                ? "Escribe tu respuesta..."
                : "Selecciona un chat para comenzar..."
          }
          className="flex-1 min-w-0 bg-transparent outline-none border-none focus:ring-0 text-sm resize-none py-2 sm:py-1.5 max-h-28 sm:max-h-32 min-h-[40px] sm:min-h-[36px] text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 disabled:cursor-not-allowed disabled:opacity-50"
          rows={1}
        />

        {/* Botón enviar */}
        <button
          onClick={onSendMessage}
          disabled={
            !selectedChat ||
            isSendingMessage ||
            aiResponseEnabled ||
            isUploadingImage ||
            (!messageInput.trim() && !imagePreviewUrl)
          }
          className="cursor-pointer disabled:cursor-not-allowed bg-primary dark:bg-blue-500/90 hover:bg-primary/90 dark:hover:bg-blue-500/80 text-white h-10 w-10 shrink-0 rounded-xl sm:rounded-lg flex items-center justify-center shadow-lg dark:shadow-blue-500/30 transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isSendingMessage ? (
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
          ) : (
            <SendIcon className="w-4 h-4" />
          )}
        </button>
      </div>

      {/* Emoji Picker */}
      {showEmojiPicker && (
        <div
          ref={emojiPickerRef}
          className="absolute bottom-20 left-4 right-4 z-50"
        >
          <div className="relative">
            <button
              onClick={() => setShowEmojiPicker(false)}
              className="cursor-pointer absolute top-2 right-2 z-10 w-6 h-6 bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 rounded-full flex items-center justify-center text-slate-600 dark:text-slate-300 text-sm font-bold"
            >
              ×
            </button>
            <EmojiPicker
              onEmojiClick={handleEmojiClick}
              theme={isDarkMode ? Theme.DARK : Theme.LIGHT}
              width="100%"
              height={350}
              searchDisabled={false}
              skinTonesDisabled={false}
              previewConfig={{
                showPreview: true,
                defaultEmoji: "1f60a",
                defaultCaption: "¡Elige un emoji!",
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
}

