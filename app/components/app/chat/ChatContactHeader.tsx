import {
  EllipsisVerticalIcon,
  InstagramIcon,
  Bot,
  BotOff,
  Loader2,
  Home,
  Trash2,
  ChevronLeft,
} from "lucide-react";
import type { User, Agent } from "~/types/schema";
import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router";
import usePath from "~/hooks/usePath";

interface ChatContactHeaderProps {
  name: string;
  lastSeen: string;
  avatar: string;
  network: "whatsapp" | "instagram" | "facebook";
  assignedUser?: User | null;
  onAssignClick: () => void;
  aiResponseEnabled: boolean;
  onToggleAI: () => void;
  loadingStatusIA: boolean;
  agent?: Agent | null;
  onAgentClick: () => void;
  onClearChat?: () => void;
  showBackButton?: boolean;
  onBackToList?: () => void;
}

export default function ChatContactHeader({
  name,
  lastSeen,
  avatar,
  network,
  assignedUser,
  onAssignClick,
  aiResponseEnabled,
  onToggleAI,
  loadingStatusIA,
  agent,
  onAgentClick,
  onClearChat,
  showBackButton = false,
  onBackToList,
}: ChatContactHeaderProps) {
  const [showTooltip, setShowTooltip] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const PATH = usePath();

  const handleGoToDashboard = () => {
    navigate(PATH);
  };

  // Cerrar menú al hacer clic fuera
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowMenu(false);
      }
    };

    if (showMenu) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [showMenu]);

  const handleClearChat = () => {
    if (onClearChat) {
      onClearChat();
    }
    setShowMenu(false);
  };

  return (
    <div className="px-4 md:px-6 py-4 flex items-center justify-between border-b border-slate-200 dark:border-[#232f48] bg-white dark:bg-slate-900/80 backdrop-blur-md shrink-0">
      <div className="flex items-center gap-3 md:gap-4 min-w-0 flex-1">
        {showBackButton && onBackToList && (
          <button
            type="button"
            onClick={onBackToList}
            className="hidden sm:flex cursor-pointer shrink-0 p-2 -ml-1 rounded-lg text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-[#232f48] transition-colors"
            aria-label="Volver a conversaciones"
          >
            <ChevronLeft className="w-6 h-6" />
          </button>
        )}
        <div
          className="bg-center relative bg-no-repeat aspect-square bg-cover rounded-full h-10 w-10 shrink-0"
          data-alt={`${name} large avatar`}
          style={{ backgroundImage: `url("${avatar}")` }}
        >
          {network === "instagram" && (
            <span className="absolute -bottom-1 -right-1 bg-gradient-to-br from-purple-500 to-pink-500 dark:from-purple-400 dark:to-pink-400 rounded-full w-4 h-4 flex items-center justify-center">
              <InstagramIcon className="w-2.5 h-2.5 text-white" />
            </span>
          )}
        </div>
        <div className="min-w-0">
          <h3 className="text-slate-900 dark:text-white font-bold text-base truncate">
            {name}
          </h3>
          <p className="hidden sm:block text-xs flex items-center gap-1 text-slate-500 dark:text-slate-400">
            {lastSeen}
          </p>
        </div>
      </div>
      {/* En pantallas pequeñas no se muestran botones, solo nombre + avatar */}
      <div className="hidden sm:flex items-center gap-1.5 md:gap-2 shrink-0">
        <button
          onClick={onAssignClick}
          className="cursor-pointer px-3 py-1.5 rounded-lg border border-slate-200 dark:border-[#232f48] text-xs font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-[#232f48] transition-colors"
        >
          {assignedUser
            ? `${assignedUser.firstName} ${assignedUser.lastName || ""}`
            : "Asignar"}
        </button>

        {/* Botón de selección de agente (solo visible cuando IA está ON) */}
        {aiResponseEnabled && (
          <button
            onClick={onAgentClick}
            className="cursor-pointer max-w-48 truncate flex items-center gap-2 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-[#232f48] text-xs font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-[#232f48] transition-colors"
          >
            <Bot className="w-3.5 h-3.5" />
            <span className="truncate">{agent?.name || "Agente"}</span>
          </button>
        )}

        {/* Botón de IA ON/OFF */}
        <div className="relative">
          <button
            onClick={onToggleAI}
            onMouseEnter={() => setShowTooltip(true)}
            onMouseLeave={() => setShowTooltip(false)}
            disabled={loadingStatusIA}
            className={`cursor-pointer disabled:cursor-not-allowed flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${aiResponseEnabled
              ? "text-white bg-blue-500 dark:bg-blue-600 hover:bg-blue-600 dark:hover:bg-blue-700"
              : "text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-[#232f48] hover:bg-slate-50 dark:hover:bg-[#232f48]"
              }`}
          >
            {aiResponseEnabled ? (
              <Bot className="w-3.5 h-3.5" />
            ) : (
              <BotOff className="w-3.5 h-3.5" />
            )}
            <span>{aiResponseEnabled ? "IA ON" : "IA OFF"}</span>
            {loadingStatusIA && (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            )}
          </button>

          {showTooltip && !loadingStatusIA && (
            <div className="absolute top-full left-1/2 transform -translate-x-1/2 mt-2 px-3 py-2 bg-slate-900 dark:bg-slate-700 text-white text-xs rounded-lg shadow-lg whitespace-nowrap z-50">
              {aiResponseEnabled ? "Desactivar IA" : "Activar IA"}
              <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-b-4 border-transparent border-b-slate-900 dark:border-b-slate-700"></div>
            </div>
          )}
        </div>

        <div className="relative" ref={menuRef}>
          <button
            onClick={() => setShowMenu(!showMenu)}
            className="cursor-pointer p-2 rounded-lg bg-slate-100 dark:bg-[#232f48] text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-[#1a2333] transition-colors"
          >
            <EllipsisVerticalIcon className="w-4 h-4" />
          </button>

          {showMenu && (
            <div className="absolute right-0 top-full mt-2 w-48 bg-white dark:bg-slate-800 rounded-lg shadow-lg border border-slate-200 dark:border-[#232f48] z-50 overflow-hidden">
              <button
                onClick={handleClearChat}
                className="cursor-pointer w-full px-4 py-3 text-left text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-[#232f48] transition-colors flex items-center gap-3"
              >
                <Trash2 className="w-4 h-4 text-red-500" />
                <span>Vaciar chat</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
