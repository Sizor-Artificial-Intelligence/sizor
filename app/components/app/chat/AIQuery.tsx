import { useState, useRef, useEffect } from "react";
import { useFetcher, useParams } from "react-router";
import { Loader2, Send } from "lucide-react";
import useToast from "~/hooks/useToast";
import usePath from "~/hooks/usePath";
import { APP_NAME } from "~/config/app";

interface CopilotMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}

interface CopilotUsageStatus {
  date: string;
  copilotUnlimited: boolean;
  dailyLimit: number;
  tokensUsedToday: number;
  blocked: boolean;
  upgradePrice: number;
}

interface AIQueryProps {
  contactId: string | null;
}

export default function AIQuery({ contactId }: AIQueryProps) {
  const params = useParams();
  const companyId = params.companyId;
  const [query, setQuery] = useState("");
  const [messages, setMessages] = useState<CopilotMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [copilotStatus, setCopilotStatus] = useState<CopilotUsageStatus | null>(
    null
  );
  const [isLoadingStatus, setIsLoadingStatus] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fetcher = useFetcher<any>();
  const PATH = usePath();

  // Auto-scroll al final cuando hay nuevos mensajes
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const refreshCopilotStatus = async () => {
    if (!companyId) return;
    setIsLoadingStatus(true);

    try {
      const copilotPath = `/app/${companyId}/api/copilot`;
      const response = await fetch(copilotPath, { method: "GET" });
      const result = await response.json();

      if (result?.success) {
        setCopilotStatus({
          date: result.date,
          copilotUnlimited: Boolean(result.copilotUnlimited),
          dailyLimit: Number(result.dailyLimit ?? 0),
          tokensUsedToday: Number(result.tokensUsedToday ?? 0),
          blocked: Boolean(result.blocked),
          upgradePrice: Number(result.upgradePrice ?? 0),
        });
      }
    } catch (error) {
      console.error("Error obteniendo estado del copilot:", error);
    } finally {
      setIsLoadingStatus(false);
    }
  };

  useEffect(() => {
    refreshCopilotStatus();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [companyId]);

  // Ajustar altura del textarea automáticamente
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  }, [query]);

  const isCopilotBlocked = Boolean(copilotStatus?.blocked);

  useEffect(() => {
    if (fetcher.data) {
      if (fetcher.data?.success) {
        window.location.href = fetcher.data.url;
      } else {
        useToast({
          icon: "error",
          title: fetcher.data?.message || "Error al realizar el pago",
        });
        setIsLoading(false);
      }
    }
  }, [fetcher.data]);

  const handleUpgradeCopilot = () => {
    setIsLoading(true);
    fetcher.submit({
      price: copilotStatus?.upgradePrice ?? 5,
      description: `${APP_NAME} - Upgrade Copilot`,
      type: "COPILOT_UNLIMITED",
    }, {
      method: "POST",
      action: `${PATH}/pay-license`,
    });
  };

  const handleSend = async () => {
    if (!query.trim() || isLoading || !companyId) return;

    if (!contactId) {
      useToast({
        icon: "error",
        title: "Por favor, selecciona un chat primero",
      });
      return;
    }

    if (isCopilotBlocked) {
      useToast({
        icon: "error",
        title: "Copilot bloqueado por límite diario",
      });
      return;
    }

    const userMessage: CopilotMessage = {
      id: `user_${Date.now()}`,
      role: "user",
      content: query.trim(),
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    const currentQuery = query.trim();
    setQuery("");
    setIsLoading(true);

    try {

      // Construir la ruta correcta: /app/$companyId/api/copilot
      const copilotPath = `/app/${companyId}/api/copilot`;
      const response = await fetch(copilotPath, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          contactId,
          query: currentQuery,
        }),
      });

      const result = await response.json();

      if (result?.code === "COPILOT_DAILY_LIMIT_REACHED") {
        // Revertir el mensaje del usuario (no se procesó por límite)
        setMessages((prev) => prev.filter((m) => m.id !== userMessage.id));

        setCopilotStatus((prev) => ({
          date: result.date ?? prev?.date ?? "",
          copilotUnlimited: Boolean(result.copilotUnlimited ?? prev?.copilotUnlimited),
          dailyLimit: Number(result.dailyLimit ?? prev?.dailyLimit ?? 0),
          tokensUsedToday: Number(result.tokensUsedToday ?? prev?.tokensUsedToday ?? 0),
          blocked: true,
          upgradePrice: Number(result.upgradePrice ?? prev?.upgradePrice ?? 0),
        }));

        useToast({
          icon: "error",
          title: result.error || "Límite diario de Copilot alcanzado",
        });
        return;
      }

      if (result.success && result.response) {
        if (typeof result.tokensUsedToday === "number" || typeof result.dailyLimit === "number") {
          setCopilotStatus((prev) => ({
            date: result.date ?? prev?.date ?? "",
            copilotUnlimited: Boolean(result.copilotUnlimited ?? prev?.copilotUnlimited),
            dailyLimit: Number(result.dailyLimit ?? prev?.dailyLimit ?? 0),
            tokensUsedToday: Number(result.tokensUsedToday ?? prev?.tokensUsedToday ?? 0),
            blocked: Boolean(result.blocked ?? prev?.blocked),
            upgradePrice: Number(result.upgradePrice ?? prev?.upgradePrice ?? 0),
          }));
        }

        const assistantMessage: CopilotMessage = {
          id: `assistant_${Date.now()}`,
          role: "assistant",
          content: result.response,
          timestamp: new Date(),
        };
        setMessages((prev) => [...prev, assistantMessage]);
      } else {
        useToast({
          icon: "error",
          title: result.error || "Error al obtener respuesta",
        });
      }
    } catch (error) {
      console.error("Error enviando consulta al copilot:", error);
      useToast({
        icon: "error",
        title: "Error al comunicarse con el servidor",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="flex-1 min-h-0 flex flex-col bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-700">
      {isLoading && (
        <div className="flex justify-center items-center h-full">
          <Loader2 className="w-4 h-4 animate-spin" />
        </div>
      )}
      {/* Área de mensajes del copilot - ocupa el espacio disponible */}
      {messages.length > 0 && (
        <div className="flex-1 min-h-0 overflow-y-auto p-4 space-y-3">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${message.role === "user" ? "justify-end" : "justify-start"
                }`}
            >
              <div
                className={`max-w-[85%] rounded-lg p-2.5 text-xs ${message.role === "user"
                  ? "bg-primary dark:bg-primary/20 text-white"
                  : "bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                  }`}
              >
                <p className="whitespace-pre-wrap">{message.content}</p>
              </div>
            </div>
          ))}
          {isLoading && (
            <div className="flex justify-start">
              <div className="bg-slate-100 dark:bg-slate-800 rounded-lg p-2.5">
                <Loader2 className="w-3.5 h-3.5 animate-spin text-primary" />
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>
      )}

      {/* Input area - fijo abajo */}
      <div className="shrink-0 p-4 border-t border-slate-200 dark:border-slate-700">
        {isCopilotBlocked && (
          <div className="mb-3 rounded-lg border border-amber-200 bg-amber-50 p-3 text-xs text-amber-900 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-200">
            <p className="font-semibold">Límite diario de Copilot alcanzado</p>
            <p className="mt-1">
              Hoy consumiste{" "}
              <span className="font-semibold">
                {copilotStatus?.tokensUsedToday ?? 0}
              </span>{" "}
              / {copilotStatus?.dailyLimit ?? 0} créditos.
            </p>
            {!copilotStatus?.copilotUnlimited && (
              <div className="mt-2 flex items-center justify-center">
                <button
                  disabled={isLoading}
                  onClick={handleUpgradeCopilot}
                  className="cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed dark:bg-gray-900 dark:hover:bg-gray-800 rounded-md bg-primary px-3 py-2 text-xs font-semibold text-white hover:bg-primary/90 transition-colors"
                >
                  Pagar ${copilotStatus?.upgradePrice ?? 5} y desbloquear
                </button>
              </div>
            )}
          </div>
        )}

        <div className="relative">
          <textarea
            ref={textareaRef}
            className="w-full resize-none bg-slate-50 rounded-lg dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm p-3 pr-12 focus:outline-none focus:border-primary dark:focus:border-primary transition-colors text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500"
            placeholder={
              isCopilotBlocked
                ? "Copilot está bloqueado por límite diario"
                : isLoadingStatus
                  ? "Cargando estado de Copilot..."
                  : contactId
                    ? "Pregunta a tu asistente de IA..."
                    : "Selecciona un chat para usar Copilot..."
            }
            rows={2}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={isLoading || isLoadingStatus || !contactId || isCopilotBlocked}
          />
          <button
            onClick={handleSend}
            disabled={!query.trim() || isLoading || isLoadingStatus || isCopilotBlocked}
            className="cursor-pointer dark:bg-gray-900 dark:hover:bg-gray-800 absolute bottom-3 right-3 p-1.5 rounded-md bg-primary text-white hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Send className="w-4 h-4" />
            )}
          </button>
        </div>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 text-center">
          Copilot entiende la conversación que se está teniendo y según su base
          de conocimiento puede ayudar a dar mejores respuestas
        </p>
      </div>
    </div>
  );
}

