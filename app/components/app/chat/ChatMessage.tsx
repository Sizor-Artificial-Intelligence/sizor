import {
  CheckCheck,
  AlertCircle,
  RotateCcw,
  Play,
  Pause,
  Download,
  FileText,
  File,
} from "lucide-react";
import { useState, useRef, useEffect } from "react";
import type { ChatMessage as ChatMessageType } from "~/types/app";
import { getReactionBadges } from "./reactions";

// Componente de Audio Player personalizado
interface AudioPlayerProps {
  audioUrl: string;
  messageId: string;
  isOutgoing: boolean;
}

function AudioPlayer({ audioUrl, messageId, isOutgoing }: AudioPlayerProps) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const handleLoadedMetadata = () => {
      setDuration(audio.duration);
      setIsLoading(false);
    };

    const handleTimeUpdate = () => {
      setCurrentTime(audio.currentTime);
    };

    const handleEnded = () => {
      setIsPlaying(false);
      setCurrentTime(0);
    };

    const handleError = () => {
      setIsLoading(false);
      console.error("Error loading audio:", audioUrl);
    };

    audio.addEventListener("loadedmetadata", handleLoadedMetadata);
    audio.addEventListener("timeupdate", handleTimeUpdate);
    audio.addEventListener("ended", handleEnded);
    audio.addEventListener("error", handleError);

    return () => {
      audio.removeEventListener("loadedmetadata", handleLoadedMetadata);
      audio.removeEventListener("timeupdate", handleTimeUpdate);
      audio.removeEventListener("ended", handleEnded);
      audio.removeEventListener("error", handleError);
    };
  }, [audioUrl]);

  const togglePlayPause = () => {
    const audio = audioRef.current;
    if (!audio) return;

    if (isPlaying) {
      audio.pause();
    } else {
      audio.play();
    }
    setIsPlaying(!isPlaying);
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const audio = audioRef.current;
    if (!audio) return;

    const newTime = parseFloat(e.target.value);
    audio.currentTime = newTime;
    setCurrentTime(newTime);
  };

  const formatTime = (seconds: number): string => {
    if (isNaN(seconds) || !isFinite(seconds)) return "0:00";
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <div
      className={`flex items-center gap-3 p-3 rounded-2xl min-w-[250px] max-w-sm ${
        isOutgoing
          ? "bg-white/20 dark:bg-white/10"
          : "bg-slate-200 dark:bg-slate-700"
      }`}
    >
      <audio ref={audioRef} src={audioUrl} preload="metadata" />

      {/* Botón Play/Pause */}
      <button
        onClick={togglePlayPause}
        disabled={isLoading}
        className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center transition-all duration-200 cursor-pointer ${
          isOutgoing
            ? "bg-white/30 hover:bg-white/40 text-white"
            : "bg-primary hover:bg-primary/90 text-white"
        } ${isLoading ? "opacity-50 cursor-not-allowed" : ""}`}
      >
        {isLoading ? (
          <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-current"></div>
        ) : isPlaying ? (
          <Pause className="w-5 h-5" fill="currentColor" />
        ) : (
          <Play className="w-5 h-5 ml-0.5" fill="currentColor" />
        )}
      </button>

      {/* Barra de progreso y tiempo */}
      <div className="flex-1 min-w-0">
        {/* Barra de progreso */}
        <div className="relative mb-1">
          <div
            className={`w-full h-1 rounded-full ${
              isOutgoing
                ? "bg-white/20 dark:bg-white/10"
                : "bg-slate-300 dark:bg-slate-600"
            }`}
          >
            <div
              className={`h-1 rounded-full transition-all duration-100 ${
                isOutgoing
                  ? "bg-white dark:bg-white/80"
                  : "bg-primary dark:bg-primary/90"
              }`}
              style={{ width: `${progress}%` }}
            />
          </div>

          {/* Input range invisible para controlar el progreso */}
          <input
            type="range"
            min="0"
            max={duration || 0}
            value={currentTime}
            onChange={handleSeek}
            disabled={isLoading}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed"
          />
        </div>

        {/* Tiempo */}
        <div
          className={`flex justify-between text-xs ${
            isOutgoing
              ? "text-white/80 dark:text-white/70"
              : "text-slate-600 dark:text-slate-300"
          }`}
        >
          <span>{formatTime(currentTime)}</span>
          <span>{formatTime(duration)}</span>
        </div>
      </div>

      {/* Icono de micrófono */}
      <div className="flex-shrink-0">
        <svg
          className={`w-5 h-5 ${
            isOutgoing
              ? "text-white/60 dark:text-white/50"
              : "text-slate-500 dark:text-slate-400"
          }`}
          fill="currentColor"
          viewBox="0 0 24 24"
        >
          <path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3z" />
          <path d="M17 11c0 2.76-2.24 5-5 5s-5-2.24-5-5H5c0 3.53 2.61 6.43 6 6.92V21h2v-3.08c3.39-.49 6-3.39 6-6.92h-2z" />
        </svg>
      </div>
    </div>
  );
}

// Componente de Archivo Adjunto genérico
interface FileAttachmentProps {
  fileUrl: string;
  fileName?: string;
  fileType?: string;
  fileSize?: number;
  isOutgoing: boolean;
}

function FileAttachment({
  fileUrl,
  fileName,
  fileType,
  fileSize,
  isOutgoing,
}: FileAttachmentProps) {
  // Extraer nombre del archivo de la URL si no se proporciona
  const extractedFileName = fileName || fileUrl.split("/").pop() || "archivo";

  // Extraer extensión del archivo
  const fileExtension =
    extractedFileName.split(".").pop()?.toUpperCase() ||
    fileType?.toUpperCase() ||
    "FILE";

  // Formatear tamaño de archivo
  const formatFileSize = (bytes?: number): string => {
    if (!bytes) return "";
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  // Obtener icono según el tipo de archivo
  const getFileIcon = () => {
    const ext = fileExtension.toLowerCase();

    // Documentos
    if (["pdf", "doc", "docx", "txt", "odt"].includes(ext)) {
      return <FileText className="w-6 h-6" />;
    }

    // Archivo genérico
    return <File className="w-6 h-6" />;
  };

  // Obtener color según el tipo de archivo
  const getFileColor = () => {
    const ext = fileExtension.toLowerCase();

    if (["pdf"].includes(ext)) return "bg-red-500";
    if (["doc", "docx"].includes(ext)) return "bg-blue-500";
    if (["xls", "xlsx"].includes(ext)) return "bg-green-500";
    if (["zip", "rar", "7z"].includes(ext)) return "bg-yellow-500";
    if (["txt"].includes(ext)) return "bg-slate-500";

    return "bg-primary";
  };

  const handleDownload = (e: React.MouseEvent) => {
    e.preventDefault();
    window.open(fileUrl, "_blank");
  };

  return (
    <div
      className={`flex items-center gap-3 p-3 rounded-xl min-w-[280px] max-w-sm cursor-pointer transition-all duration-200 ${
        isOutgoing
          ? "bg-white/20 dark:bg-white/10 hover:bg-white/30 dark:hover:bg-white/20"
          : "bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600"
      }`}
      onClick={handleDownload}
    >
      {/* Icono del archivo con extensión */}
      <div
        className={`flex-shrink-0 w-12 h-12 ${getFileColor()} rounded-lg flex flex-col items-center justify-center text-white`}
      >
        {getFileIcon()}
        <span className="text-[9px] font-semibold mt-0.5">
          {fileExtension.substring(0, 4)}
        </span>
      </div>

      {/* Información del archivo */}
      <div className="flex-1 min-w-0">
        <p
          className={`text-sm font-medium truncate ${
            isOutgoing
              ? "text-white dark:text-white/90"
              : "text-slate-800 dark:text-slate-100"
          }`}
        >
          {extractedFileName}
        </p>
        {fileSize && (
          <p
            className={`text-xs ${
              isOutgoing
                ? "text-white/70 dark:text-white/60"
                : "text-slate-500 dark:text-slate-400"
            }`}
          >
            {formatFileSize(fileSize)}
          </p>
        )}
      </div>

      {/* Botón de descarga */}
      <button
        onClick={handleDownload}
        className={`cursor-pointer flex-shrink-0 w-9 h-9 rounded-full flex items-center justify-center transition-colors duration-200 ${
          isOutgoing
            ? "bg-white/20 hover:bg-white/30 text-white"
            : "bg-primary/10 hover:bg-primary/20 text-primary"
        }`}
        title="Descargar archivo"
      >
        <Download className="w-4 h-4" />
      </button>
    </div>
  );
}

interface ChatMessageProps {
  message: string;
  time: string;
  avatar: string;
  isOutgoing?: boolean;
  isHighlighted?: boolean;
  status?: string;
  onRetryMessage?: () => void;
  originalMessage?: ChatMessageType;
  onImageClick?: (url: string) => void;
  onImageLoad?: (url: string) => void;
  onImageLoadStart?: (url: string) => void;
  isImageLoading?: boolean;
}

export default function ChatMessage({
  message,
  time,
  avatar,
  isOutgoing = false,
  isHighlighted = false,
  status,
  onRetryMessage,
  originalMessage,
  onImageClick,
  onImageLoad,
  onImageLoadStart,
  isImageLoading = false,
}: ChatMessageProps) {
  const reactionBadges = getReactionBadges(originalMessage?.reactions);
  // Función para obtener el ícono de estado
  const getStatusIcon = (status: string) => {
    switch (status) {
      case "SENDING":
        return (
          <div className="w-4 h-4 flex items-center justify-center">
            <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-slate-400"></div>
          </div>
        );
      case "SENT":
        return <CheckCheck className="w-4 h-4 text-slate-400" />;
      case "DELIVERED":
        return <CheckCheck className="w-4 h-4 text-slate-400" />;
      case "READ":
        return <CheckCheck className="w-4 h-4 text-blue-500" />;
      case "FAILED":
        return (
          <div
            className="w-4 h-4 flex items-center justify-center"
            title="Error al enviar"
          >
            <AlertCircle className="w-4 h-4 text-red-500" />
          </div>
        );
      default:
        return null;
    }
  };

  // Parsear attachments
  const parseAttachments = (attachments: string | null) => {
    if (!attachments) return [];
    try {
      const parsed = JSON.parse(attachments);
      return Array.isArray(parsed) ? parsed : [parsed];
    } catch (error) {
      console.error("Error parsing attachments:", error);
      return [];
    }
  };

  // Renderizar attachments
  const renderAttachments = () => {
    if (!originalMessage?.attachments) return null;

    const attachments = parseAttachments(originalMessage.attachments);
    if (attachments.length === 0) return null;

    return (
      <div className="space-y-2">
        {attachments.map((attachment: any, index: number) => {
          // Imágenes
          if (attachment.type === "image" && attachment.payload?.url) {
            const imageUrl = attachment.payload.url;
            return (
              <div key={index} className="mb-2 relative">
                {isImageLoading && (
                  <div className="absolute inset-0 flex items-center justify-center bg-slate-100 dark:bg-slate-700 rounded-lg">
                    <div className="flex flex-col items-center space-y-2">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                      <span className="text-xs text-slate-500 dark:text-slate-400">
                        Cargando...
                      </span>
                    </div>
                  </div>
                )}
                <div className="relative group">
                  <img
                    src={imageUrl}
                    alt="Imagen adjunta"
                    className={`max-w-xs sm:max-w-sm rounded-lg cursor-pointer hover:opacity-90 transition-all duration-200 hover:scale-105 shadow-sm ${isImageLoading ? "opacity-0" : "opacity-100"}`}
                    loading="lazy"
                    onLoadStart={() => onImageLoadStart?.(imageUrl)}
                    onLoad={() => onImageLoad?.(imageUrl)}
                    onError={(e) => {
                      onImageLoad?.(imageUrl);
                      const target = e.target as HTMLImageElement;
                      target.style.display = "none";
                      const fallback = target.nextElementSibling as HTMLElement;
                      if (fallback) fallback.style.display = "block";
                    }}
                    onClick={() => onImageClick?.(imageUrl)}
                  />
                  <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                    <div className="bg-black bg-opacity-50 text-white p-1 rounded-full">
                      <svg
                        className="w-4 h-4"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7"
                        />
                      </svg>
                    </div>
                  </div>
                </div>
                <div
                  className="hidden text-sm text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-700 p-2 rounded"
                  style={{ display: "none" }}
                >
                  📷 Imagen no disponible
                </div>
              </div>
            );
          }

          // Audio
          if (attachment.type === "audio" && attachment.payload?.url) {
            const audioUrl = attachment.payload.url;
            return (
              <div key={index} className="mb-2">
                <AudioPlayer
                  audioUrl={audioUrl}
                  messageId={originalMessage?.id || `audio-${index}`}
                  isOutgoing={isOutgoing}
                />
              </div>
            );
          }

          // Video
          if (attachment.type === "video" && attachment.payload?.url) {
            return (
              <div key={index} className="mb-2">
                <video
                  controls
                  className="max-w-xs sm:max-w-sm rounded-lg shadow-sm"
                >
                  <source src={attachment.payload.url} type="video/mp4" />
                  Tu navegador no soporta el elemento de video.
                </video>
              </div>
            );
          }

          // Otros tipos de archivos
          return (
            <div key={index} className="mb-2">
              <FileAttachment
                fileUrl={attachment.payload?.url || attachment.url || "#"}
                fileName={attachment.payload?.name || attachment.name}
                fileType={attachment.type}
                fileSize={attachment.payload?.size || attachment.size}
                isOutgoing={isOutgoing}
              />
            </div>
          );
        })}
      </div>
    );
  };

  // Verificar si es mensaje del sistema
  const isSystemMessage = originalMessage?.sender === "SYSTEM";

  if (isSystemMessage) {
    return (
      <div className="flex justify-center my-4 w-full">
        <div className="bg-yellow-200 dark:bg-yellow-800 rounded px-4 py-2 max-w-[80%]">
          <p className="text-sm text-slate-700 dark:text-slate-300 text-center">
            {message}
          </p>
        </div>
      </div>
    );
  }

  // Determinar si tiene attachments
  const hasAttachments =
    originalMessage &&
    (originalMessage.type === "IMAGE" ||
      originalMessage.type === "AUDIO" ||
      originalMessage.type === "VIDEO" ||
      originalMessage.type === "ATTACHMENT") &&
    originalMessage.attachments;

  if (isOutgoing) {
    return (
      <div className="flex gap-2 sm:gap-3 max-w-[78%] sm:max-w-[75%] self-end flex-row-reverse">
        <div className="flex flex-col gap-1 items-end min-w-0">
          <div className="relative bg-primary dark:bg-slate-500/90 px-4 py-3.5 sm:p-4 rounded-2xl rounded-tr-none shadow-md dark:shadow-primary/30 text-white min-w-0">
            {/* Renderizar attachments si los hay */}
            {hasAttachments && renderAttachments()}

            {/* Mostrar el contenido del mensaje si existe */}
            {message && (
              <p
                className={`text-sm leading-relaxed ${hasAttachments ? "mt-2" : ""}`}
              >
                {message}
              </p>
            )}

            {/* Mensaje por defecto si no hay contenido ni attachments */}
            {!message && !hasAttachments && (
              <p className="text-sm opacity-70">Mensaje sin contenido</p>
            )}

            {/* Reacciones */}
            {reactionBadges.length > 0 && (
              <div className="absolute -bottom-3 -right-2 flex flex-wrap gap-1">
                {reactionBadges.map((badge) => (
                  <div
                    key={badge.emoji}
                    className="flex items-center gap-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-600 rounded-full px-2 h-6 shadow-sm hover:shadow-md transition-shadow duration-200"
                    title={`${badge.emoji} (${badge.count})`}
                  >
                    <span className="text-xs leading-none">{badge.emoji}</span>
                    {badge.count > 1 && (
                      <span className="text-[10px] leading-none text-slate-600 dark:text-slate-300">
                        {badge.count}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
          <div className="flex items-center gap-1.5 flex-row-reverse justify-end">
            <span className="text-[10px] text-slate-400 dark:text-slate-500">
              {time}
            </span>
            {status && (
              <div className="flex items-center gap-1 shrink-0">
                {getStatusIcon(status)}
                {status === "FAILED" && onRetryMessage && (
                  <button
                    onClick={onRetryMessage}
                    className="cursor-pointer flex items-center gap-1 px-2 py-1 text-[10px] bg-red-100 hover:bg-red-200 dark:bg-red-900/30 dark:hover:bg-red-900/50 text-red-600 dark:text-red-400 rounded-full transition-colors duration-200"
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
    );
  }

  const borderClasses = isHighlighted
    ? "border border-orange-500/20 dark:border-orange-500/30"
    : "";

  return (
    <div className="flex gap-2 sm:gap-3 max-w-[78%] sm:max-w-[75%]">
      <div
        className="bg-center bg-no-repeat aspect-square bg-cover rounded-full h-8 w-8 shrink-0"
        data-alt="User profile"
        style={{ backgroundImage: `url("${avatar}")` }}
      ></div>
      <div className="flex flex-col gap-1 min-w-0">
        <div
          className={`relative bg-white dark:bg-[#232f48] px-4 py-3.5 sm:p-4 rounded-2xl rounded-tl-none shadow-md dark:shadow-slate-900/20 ${borderClasses} min-w-0`}
        >
          {/* Renderizar attachments si los hay */}
          {hasAttachments && renderAttachments()}

          {/* Mostrar el contenido del mensaje si existe */}
          {message && (
            <p
              className={`text-sm text-slate-800 dark:text-slate-100 leading-relaxed ${hasAttachments ? "mt-2" : ""}`}
            >
              {message}
            </p>
          )}

          {/* Mensaje por defecto si no hay contenido ni attachments */}
          {!message && !hasAttachments && (
            <p className="text-sm opacity-70">Mensaje sin contenido</p>
          )}

          {/* Reacciones */}
          {reactionBadges.length > 0 && (
            <div className="absolute -bottom-3 -left-2 flex flex-wrap gap-1">
              {reactionBadges.map((badge) => (
                <div
                  key={badge.emoji}
                  className="flex items-center gap-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-600 rounded-full px-2 h-6 shadow-sm hover:shadow-md transition-shadow duration-200"
                  title={`${badge.emoji} (${badge.count})`}
                >
                  <span className="text-xs leading-none">{badge.emoji}</span>
                  {badge.count > 1 && (
                    <span className="text-[10px] leading-none text-slate-600 dark:text-slate-300">
                      {badge.count}
                    </span>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
        <span className="text-[10px] text-slate-400 dark:text-slate-500">
          {time}
        </span>
      </div>
    </div>
  );
}
