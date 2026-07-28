import {
  FacebookIcon,
  InstagramIcon,
  MessageSquareText,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { FaWhatsapp } from "react-icons/fa";
import { useRef, useState, useEffect } from "react";

interface ConversationFiltersProps {
  selectedChannels: string[];
  onChannelToggle: (channel: string) => void;
}

export default function ConversationFilters({
  selectedChannels,
  onChannelToggle,
}: ConversationFiltersProps) {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [showLeftButton, setShowLeftButton] = useState(false);
  const [showRightButton, setShowRightButton] = useState(false);

  const channels = [
    {
      value: "all",
      label: "Todas",
      icon: <MessageSquareText className="w-4 h-4" />,
    },
    {
      value: "Whatsapp",
      label: "WhatsApp",
      icon: <FaWhatsapp className="w-4 h-4" />,
    },
    {
      value: "Instagram",
      label: "Instagram",
      icon: <InstagramIcon className="w-4 h-4" />,
    },
    {
      value: "Facebook",
      label: "Facebook",
      icon: <FacebookIcon className="w-4 h-4" />,
    },
  ];

  const isActive = (channelValue: string) => {
    if (channelValue === "all") {
      return selectedChannels.length === 0;
    }
    return selectedChannels.includes(channelValue);
  };

  const handleClick = (channelValue: string) => {
    if (channelValue === "all") {
      // Si hace click en "Todas", limpia todos los filtros
      if (selectedChannels.length > 0) {
        // Limpia todos los canales seleccionados
        selectedChannels.forEach((channel) => onChannelToggle(channel));
      }
    } else {
      onChannelToggle(channelValue);
    }
  };

  // Función para verificar si hay overflow y actualizar botones
  const checkForOverflow = () => {
    const container = scrollContainerRef.current;
    if (!container) return;

    const hasOverflow = container.scrollWidth > container.clientWidth;
    const isAtStart = container.scrollLeft === 0;
    const isAtEnd =
      container.scrollLeft + container.clientWidth >= container.scrollWidth - 1;

    setShowLeftButton(hasOverflow && !isAtStart);
    setShowRightButton(hasOverflow && !isAtEnd);
  };

  // Función para deslizar hacia la izquierda
  const scrollLeft = () => {
    const container = scrollContainerRef.current;
    if (!container) return;

    container.scrollBy({
      left: -200,
      behavior: "smooth",
    });
  };

  // Función para deslizar hacia la derecha
  const scrollRight = () => {
    const container = scrollContainerRef.current;
    if (!container) return;

    container.scrollBy({
      left: 200,
      behavior: "smooth",
    });
  };

  // Verificar overflow al montar y cuando cambie el tamaño
  useEffect(() => {
    checkForOverflow();

    const container = scrollContainerRef.current;
    if (!container) return;

    const handleScroll = () => checkForOverflow();
    const handleResize = () => checkForOverflow();

    container.addEventListener("scroll", handleScroll);
    window.addEventListener("resize", handleResize);

    return () => {
      container.removeEventListener("scroll", handleScroll);
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  return (
    <div className="relative">
      {/* Botón izquierdo */}
      {showLeftButton && (
        <button
          onClick={scrollLeft}
          className="cursor-pointer absolute left-0 top-1/2 -translate-y-1/2 z-10 w-6 h-6 flex items-center justify-center bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-full shadow-lg hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
          aria-label="Deslizar a la izquierda"
        >
          <ChevronLeft className="w-4 h-4 text-slate-600 dark:text-slate-400" />
        </button>
      )}

      {/* Contenedor de filtros */}
      <div
        ref={scrollContainerRef}
        className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide"
        style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
      >
        {channels.map((channel) => (
          <button
            key={channel.value}
            onClick={() => handleClick(channel.value)}
            className={`cursor-pointer flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors ${
              isActive(channel.value)
                ? "bg-primary dark:bg-blue-500/90 text-white"
                : "bg-slate-100 dark:bg-[#232f48] text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-[#2a3b5a]"
            }`}
          >
            {channel.icon}
            {channel.label}
          </button>
        ))}
      </div>

      {/* Botón derecho */}
      {showRightButton && (
        <button
          onClick={scrollRight}
          className="cursor-pointer absolute right-0 top-1/2 -translate-y-1/2 z-10 w-6 h-6 flex items-center justify-center bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-full shadow-lg hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
          aria-label="Deslizar a la derecha"
        >
          <ChevronRight className="w-4 h-4 text-slate-600 dark:text-slate-400" />
        </button>
      )}
    </div>
  );
}
