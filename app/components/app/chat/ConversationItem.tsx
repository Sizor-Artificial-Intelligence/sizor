import { FacebookIcon, InstagramIcon, FileText, Mic, Image as ImageIcon, Video } from "lucide-react";
import { FaWhatsapp } from "react-icons/fa";
import type { ReactNode } from "react";

interface ConversationItemProps {
  name: string;
  message: string;
  time: string;
  avatar: string;
  network: "whatsapp" | "instagram" | "facebook";
  isActive?: boolean;
  isOnline?: boolean;
  unreadCount?: number;
  onClick?: () => void;
  messageType?: string;
}

const networkIcons: Record<string, ReactNode> = {
  whatsapp: <FaWhatsapp className="w-4 h-4 text-[#25D366] dark:text-[#20BA5A]" />,
  instagram: <InstagramIcon className="w-4 h-4 text-[#E1306C]" />,
  facebook: <FacebookIcon className="w-4 h-4 text-blue-500 dark:text-blue-400" />,
};

export default function ConversationItem({
  name,
  message,
  time,
  avatar,
  network,
  isActive = false,
  isOnline = false,
  unreadCount = 0,
  onClick,
  messageType,
}: ConversationItemProps) {
  const baseClasses = "flex items-center gap-3 px-4 py-4 cursor-pointer transition-colors";
  const activeClasses = isActive
    ? "bg-primary/5 dark:bg-primary/10 border-l-4 border-primary dark:border-primary/80 hover:bg-primary/10 dark:hover:bg-primary/15"
    : "hover:bg-slate-50 dark:hover:bg-[#1a2333] border-b border-slate-100 dark:border-[#232f48]/30";

  // Función para obtener el ícono y texto según el tipo de mensaje
  const getMessageDisplay = () => {
    switch (messageType?.toUpperCase()) {
      case "IMAGE":
        return (
          <div className="flex items-center gap-1">
            <ImageIcon className="w-3.5 h-3.5 flex-shrink-0" />
            <span className="truncate">Imagen</span>
          </div>
        );
      case "AUDIO":
        return (
          <div className="flex items-center gap-1">
            <Mic className="w-3.5 h-3.5 flex-shrink-0" />
            <span className="truncate">Audio</span>
          </div>
        );
      case "VIDEO":
        return (
          <div className="flex items-center gap-1">
            <Video className="w-3.5 h-3.5 flex-shrink-0" />
            <span className="truncate">Video</span>
          </div>
        );
      case "ATTACHMENT":
        return (
          <div className="flex items-center gap-1">
            <FileText className="w-3.5 h-3.5 flex-shrink-0" />
            <span className="truncate">Archivo</span>
          </div>
        );
      default:
        return <span className="truncate">{message || "Sin mensaje"}</span>;
    }
  };

  return (
    <div className={`${baseClasses} ${activeClasses}`} onClick={onClick}>
      <div className="relative flex-shrink-0">
        <div
          className="bg-center bg-no-repeat aspect-square bg-cover rounded-full h-12 w-12"
          data-alt={name}
          style={{ backgroundImage: `url("${avatar}")` }}
        ></div>
        {isOnline && (
          <div className="absolute -bottom-1 -right-1 bg-green-500 dark:bg-green-400 border-2 border-white dark:border-slate-900 h-3.5 w-3.5 rounded-full"></div>
        )}
      </div>
      <div className="flex flex-col flex-1 min-w-0">
        <div className="flex justify-between items-start gap-2 mb-0.5">
          <p
            className={`text-sm truncate flex-1 ${
              isActive
                ? "text-slate-900 dark:text-white font-semibold"
                : "text-slate-900 dark:text-white font-medium"
            }`}
          >
            {name}
          </p>
          <span className="text-[10px] text-slate-400 dark:text-slate-500 whitespace-nowrap flex-shrink-0">
            {time}
          </span>
        </div>
        <div className="text-slate-500 dark:text-[#92a4c9] text-xs flex items-center gap-1 min-w-0">
          {getMessageDisplay()}
        </div>
      </div>
      <div className="flex flex-col items-center gap-1 flex-shrink-0">
        {networkIcons[network]}
        {unreadCount > 0 && (
          <div className="bg-blue-500 text-white text-[10px] font-semibold rounded-full h-5 min-w-[20px] px-1.5 flex items-center justify-center">
            {unreadCount > 99 ? "99+" : unreadCount}
          </div>
        )}
      </div>
    </div>
  );
}

