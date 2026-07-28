import {
  Search,
  X,
  Loader2,
  Bot,
  ChevronDown,
  ChevronUp,
  Radio,
  Home,
} from "lucide-react";
import { useMemo, useState, useEffect } from "react";
import { useNavigate } from "react-router";
import usePath from "~/hooks/usePath";
import { useCompany } from "~/hooks/useCompany";
import ConversationFilters from "./ConversationFilters";
import ConversationItem from "./ConversationItem";
import AgentSelectionModal from "./AgentSelectionModal";
import type { Chat } from "~/types/app";
import type { ChatFilters } from "./ChatFiltersModal";
import type { Agent } from "~/types/schema";
import { executeSQL } from "~/lib/utils.functions";

interface ConversationsSidebarProps {
  className?: string;
  contacts: Chat[];
  selectedChat: string | null;
  setSelectedChat: (chatId: string | null) => void;
  isConnected: boolean;
  connectionStatus: string;
  chatFilters: ChatFilters;
  setChatFilters: (filters: ChatFilters) => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  isSearching: boolean;
  onConnectChannel?: (channel: string) => void;
}

export default function ConversationsSidebar({
  className = "",
  contacts,
  selectedChat,
  setSelectedChat,
  isConnected,
  connectionStatus,
  chatFilters,
  setChatFilters,
  searchQuery,
  setSearchQuery,
  isSearching,
  onConnectChannel,
}: ConversationsSidebarProps) {
  const navigate = useNavigate();
  const PATH = usePath();
  const company = useCompany();
  const plan = company?.plan;
  const [selectedAgent, setSelectedAgent] = useState<Agent | null>(
    company?.plan?.agent || null
  );
  const [showModalAgent, setShowModalAgent] = useState(false);
  const [isChannelsAccordionOpen, setIsChannelsAccordionOpen] = useState(false);
  const [networksConnected, setNetworksConnected] = useState(0);
  const [showChannelSelectionModal, setShowChannelSelectionModal] =
    useState(false);

  // Actualizar agente cuando cambie el plan
  useEffect(() => {
    if (company?.plan?.agent) {
      setSelectedAgent(company.plan.agent);
    }
  }, [company?.plan?.agent]);

  // Contar redes conectadas y abrir acordeón si no hay ninguna
  useEffect(() => {
    let count = 0;
    if (plan?.facebookConnected) count++;
    if (plan?.instagramConnected) count++;
    if (plan?.whatsappConnected) count++;
    setNetworksConnected(count);

    // Si no hay redes conectadas, abrir el acordeón automáticamente
    if (count === 0) {
      setIsChannelsAccordionOpen(true);
    }
  }, [
    plan?.facebookConnected,
    plan?.instagramConnected,
    plan?.whatsappConnected,
  ]);

  // Manejar toggle de canales
  const handleChannelToggle = (channel: string) => {
    const newFilters: ChatFilters = {
      ...chatFilters,
      channels: chatFilters.channels.includes(channel)
        ? chatFilters.channels.filter((c: string) => c !== channel)
        : [...chatFilters.channels, channel],
    };
    setChatFilters(newFilters);
  };

  // Manejar click en conversación
  const handleConversationClick = (contactId: string) => {
    const currentUrl = new URL(window.location.href);
    const currentParams = currentUrl.searchParams.toString();
    const chatUrl = `${PATH}/chat/${contactId}/`;
    const finalUrl = currentParams ? `${chatUrl}?${currentParams}` : chatUrl;
    navigate(finalUrl);
  };

  // Manejar selección de agente global
  const handleSelectAgent = async (agent: Agent | null) => {
    setSelectedAgent(agent);
    await executeSQL(
      PATH,
      `UPDATE Plan SET agentId = ${agent?.id ? "'" + agent?.id + "'" : "NULL"} WHERE id = '${company?.plan?.id}'`
    );
    setShowModalAgent(false);
  };

  // Definir canales disponibles
  const channels = [
    {
      id: "whatsapp",
      name: "WhatsApp",
      status: plan?.whatsappConnected ? "connected" : "not_configured",
      icon: (
        <div className="w-8 h-8 bg-[#25D366] rounded-full flex items-center justify-center">
          <svg
            className="w-5 h-5 text-white"
            fill="currentColor"
            viewBox="0 0 24 24"
          >
            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893A11.821 11.821 0 0020.885 3.488" />
          </svg>
        </div>
      ),
    },
    {
      id: "facebook",
      name: "Facebook",
      status: plan?.facebookConnected ? "connected" : "not_configured",
      icon: (
        <div className="w-8 h-8 bg-[#1877F2] rounded-full flex items-center justify-center">
          <svg
            className="w-5 h-5 text-white"
            fill="currentColor"
            viewBox="0 0 24 24"
          >
            <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
          </svg>
        </div>
      ),
    },
    {
      id: "instagram",
      name: "Instagram",
      status: plan?.instagramConnected ? "connected" : "not_configured",
      icon: (
        <div className="w-8 h-8 bg-gradient-to-br from-[#833AB4] via-[#FD1D1D] to-[#F77737] rounded-full flex items-center justify-center">
          <svg
            className="w-5 h-5 text-white"
            fill="currentColor"
            viewBox="0 0 24 24"
          >
            <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
          </svg>
        </div>
      ),
    },
  ];

  // Función para obtener color de estado
  const getStatusColor = (status: string) => {
    return status === "connected"
      ? "bg-green-500"
      : "bg-slate-400 dark:bg-slate-600";
  };

  // Función para obtener texto de estado
  const getStatusText = (status: string) => {
    return status === "connected" ? "Conectado" : "";
  };
  // Transformar conversaciones (sin filtrado, viene del servidor)
  const conversations = useMemo(() => {
    // Transformar los datos de Chat a formato esperado por ConversationItem
    return (
      contacts?.map((contact) => ({
        id: contact?.id,
        name: contact?.name || "Sin nombre",
        message: contact?.lastMessage?.content || "",
        time: contact?.lastMessage?.timeAgo || "",
        avatar:
          contact?.avatar ||
          "https://firebasestorage.googleapis.com/v0/b/chatzy-bca9e.firebasestorage.app/o/default-avatar-icon-of-social-media-user-vector.jpg?alt=media&token=970f912c-6aa7-4d7d-9cf1-4970a1411624",
        network: (contact?.origin?.toLowerCase() || "whatsapp") as
          | "whatsapp"
          | "instagram"
          | "facebook",
        isActive: selectedChat === contact?.id ? true : false,
        isOnline: false,
        unreadCount: contact?.unreadCount || 0,
        messageType: contact?.lastMessage?.type || "TEXT",
      })) || []
    );
  }, [contacts, selectedChat]);

  return (
    <aside
      className={`border-r border-slate-200 dark:border-[#232f48] flex flex-col bg-white dark:bg-slate-900 min-h-0 ${className}`}
    >
      <div className="p-4 flex flex-col gap-4 shrink-0">
        <div className="flex justify-between items-center">
          <h1 className="text-slate-900 dark:text-white text-lg font-bold">
            Conversaciones
          </h1>
          <div className="flex items-center gap-2">
            <button
              onClick={() => navigate(PATH)}
              className="cursor-pointer p-1.5 rounded-lg text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-[#232f48] hover:text-primary transition-colors"
              title="Volver al dashboard"
            >
              <Home className="w-4 h-4" />
            </button>
            <div
              className={`h-2 w-2 rounded-full ${
                isConnected ? "bg-green-500" : "bg-red-500"
              }`}
              title={connectionStatus}
            />
          </div>
        </div>
        <div className="flex flex-col gap-3">
          <ConversationFilters
            selectedChannels={chatFilters.channels}
            onChannelToggle={handleChannelToggle}
          />

          {/* Selector de Agente Global */}
          {networksConnected > 0 && (
            <button
              onClick={() => setShowModalAgent(true)}
              className="w-full p-1.5 bg-slate-100 dark:bg-[#232f48] hover:bg-slate-200 dark:hover:bg-[#1a2333] rounded-lg cursor-pointer transition-all duration-200 flex items-center justify-between group"
            >
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-primary/10 dark:bg-primary/20 rounded-lg flex items-center justify-center group-hover:bg-primary/20 dark:group-hover:bg-primary/30 transition-colors">
                  <Bot className="w-4 h-4 text-primary" />
                </div>
                <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                  Agente Global
                </span>
              </div>
              <span className="text-xs px-2 py-1 rounded-full bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-400 max-w-[120px] truncate">
                {selectedAgent?.name || "Sin asignar"}
              </span>
            </button>
          )}

          {/* Sección de Canales */}
          <div className="border border-slate-200 dark:border-[#232f48] rounded-lg overflow-hidden">
            <button
              onClick={() =>
                setIsChannelsAccordionOpen(!isChannelsAccordionOpen)
              }
              className="w-full p-2.5 bg-slate-50 dark:bg-[#232f48] hover:bg-slate-100 dark:hover:bg-[#1a2333] cursor-pointer transition-all duration-200 flex items-center justify-between"
            >
              <div className="flex items-center gap-2">
                <Radio className="w-4 h-4 text-slate-600 dark:text-slate-400" />
                <span className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                  Canales
                </span>
              </div>
              {isChannelsAccordionOpen ? (
                <ChevronUp className="w-4 h-4 text-slate-500 dark:text-slate-400" />
              ) : (
                <ChevronDown className="w-4 h-4 text-slate-500 dark:text-slate-400" />
              )}
            </button>

            {isChannelsAccordionOpen && (
              <div className="p-3 space-y-2 bg-white dark:bg-slate-900">
                {networksConnected === 0 ? (
                  <div className="text-center py-4 px-2">
                    <div className="w-12 h-12 mx-auto mb-3 bg-blue-100 dark:bg-blue-900/20 rounded-full flex items-center justify-center">
                      <Radio className="w-6 h-6 text-blue-500" />
                    </div>
                    <p className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                      No hay canales conectados
                    </p>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mb-3">
                      Conecta tus redes sociales para comenzar a automatizar
                    </p>
                    <button
                      onClick={() => setShowChannelSelectionModal(true)}
                      className="w-full px-4 py-2 bg-primary hover:bg-primary/90 text-white text-sm font-medium rounded-lg transition-colors cursor-pointer"
                    >
                      Conectar Canal
                    </button>
                  </div>
                ) : (
                  channels.map((channel) => (
                    <div
                      key={channel.id}
                      className="flex items-center justify-between p-2.5 bg-slate-50 dark:bg-[#232f48] rounded-lg hover:bg-slate-100 dark:hover:bg-[#1a2333] transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <div className="relative">
                          {channel.icon}
                          <div
                            className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-white dark:border-slate-900 ${getStatusColor(channel.status)}`}
                          />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-slate-800 dark:text-white">
                            {channel.name}
                          </p>
                          {channel.status === "connected" && (
                            <p className="text-xs text-green-600 dark:text-green-400">
                              {getStatusText(channel.status)}
                            </p>
                          )}
                        </div>
                      </div>
                      {channel.status === "not_configured" && (
                        <button
                          onClick={() => onConnectChannel?.(channel.name)}
                          className="text-xs text-primary hover:text-primary/80 font-medium transition-colors cursor-pointer"
                        >
                          Configurar
                        </button>
                      )}
                    </div>
                  ))
                )}
              </div>
            )}
          </div>

          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500 text-lg">
              {isSearching ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Search className="w-4 h-4" />
              )}
            </span>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full transition-all duration-300 hover:bg-slate-200 dark:hover:bg-[#1a2333] outline-none bg-slate-100 dark:bg-[#232f48] border-none rounded-lg pl-10 pr-10 py-2 text-sm focus:ring-1 focus:ring-slate-300 dark:focus:ring-primary/50 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500"
              placeholder="Buscar chats o mensajes..."
            />
            {searchQuery && !isSearching && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
                title="Limpiar búsqueda"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </div>
      <div className="flex-1 min-h-0 overflow-y-auto custom-scrollbar">
        {conversations.length > 0 ? (
          conversations.map((conversation) => (
            <ConversationItem
              key={conversation.id}
              {...conversation}
              onClick={() => handleConversationClick(conversation.id)}
            />
          ))
        ) : (
          <div className="flex flex-col items-center justify-center h-full p-6 text-center">
            <div className="w-16 h-16 mb-4 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center">
              {searchQuery ? (
                <Search className="w-8 h-8 text-slate-400 dark:text-slate-500" />
              ) : (
                <svg
                  className="w-8 h-8 text-slate-400 dark:text-slate-500"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                  />
                </svg>
              )}
            </div>
            <p className="text-slate-600 dark:text-slate-400 text-sm font-medium mb-1">
              {searchQuery
                ? "No se encontraron resultados"
                : "No hay conversaciones disponibles"}
            </p>
            {searchQuery && (
              <p className="text-slate-500 dark:text-slate-500 text-xs">
                Intenta con otro término de búsqueda
              </p>
            )}
          </div>
        )}
      </div>

      {/* Modal de Selección de Canal */}
      {showChannelSelectionModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-slate-900 rounded-lg shadow-xl p-6 w-full max-w-md mx-4">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
                Selecciona un canal para conectar
              </h3>
              <button
                onClick={() => setShowChannelSelectionModal(false)}
                className="cursor-pointer text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="space-y-3">
              {channels.map((channel) => (
                <button
                  key={channel.id}
                  onClick={() => {
                    // Verificar si es plan gratuito y ya tiene una red conectada
                    if (company?.plan?.isFree && networksConnected > 0) {
                      alert(
                        "Ya tienes una red social conectada. Para conectar más redes sociales, actualiza tu plan."
                      );
                      return;
                    }
                    onConnectChannel?.(channel.name);
                    setShowChannelSelectionModal(false);
                  }}
                  disabled={channel.status === "connected"}
                  className={`w-full p-4 rounded-lg border-2 transition-all ${
                    channel.status === "connected"
                      ? "border-green-300 dark:border-green-700 bg-green-50 dark:bg-green-900/20 opacity-60 cursor-not-allowed"
                      : "border-slate-200 dark:border-slate-700 hover:border-gray-400 dark:hover:border-primary hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className="relative">
                      {channel.icon}
                      {channel.status === "connected" && (
                        <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-500 rounded-full border-2 border-white dark:border-slate-900" />
                      )}
                    </div>
                    <div className="flex-1 text-left">
                      <p className="text-sm font-medium text-slate-800 dark:text-white">
                        {channel.name}
                      </p>
                      {channel.status === "connected" && (
                        <p className="text-xs text-green-600 dark:text-green-400">
                          Ya conectado
                        </p>
                      )}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Modal de Selección de Agente Global */}
      <AgentSelectionModal
        isOpen={showModalAgent}
        onClose={() => setShowModalAgent(false)}
        onSelectAgent={handleSelectAgent}
        selectedAgent={selectedAgent}
      />
    </aside>
  );
}
