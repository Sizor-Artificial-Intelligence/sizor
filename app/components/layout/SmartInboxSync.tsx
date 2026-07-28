import { useEffect, useCallback } from "react";
import { useWebSocket } from "~/hooks/useWebSocket";
import { useSmartInbox } from "~/contexts/SmartInboxContext";
import { useCompany } from "~/hooks/useCompany";
import usePath from "~/hooks/usePath";

/**
 * Componente que sincroniza el contador de smart inbox (respuestas de formularios)
 * en tiempo real usando WebSocket. Este componente debe estar montado
 * en el layout principal para que funcione en todas las rutas.
 */
export function SmartInboxSync() {
  const { setUnreadSmartInbox } = useSmartInbox();
  const company = useCompany();
  const PATH = usePath();

  // Obtener el conteo actualizado desde el servidor (fallback inicial)
  const fetchSmartInboxCount = useCallback(async () => {
    if (!company?.id) return;

    try {
      const response = await fetch(`${PATH}/api/unread-smart-inbox`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ companyId: company.id }),
      });

      if (response.ok) {
        const data = await response.json();
        setUnreadSmartInbox(data.unreadSmartInbox || 0);
      }
    } catch (error) {
      console.error("Error obteniendo contador de smart inbox:", error);
    }
  }, [company?.id, PATH, setUnreadSmartInbox]);

  // Manejar actualización del contador de smart inbox
  const handleSmartInboxUpdate = useCallback(
    (unreadCount: number) => {
      setUnreadSmartInbox(unreadCount);
    },
    [setUnreadSmartInbox]
  );

  // Cargar contador inicial al montar
  useEffect(() => {
    fetchSmartInboxCount();
  }, [fetchSmartInboxCount]);

  // Inicializar WebSocket para smart inbox
  useWebSocket({
    onSmartInboxUpdate: handleSmartInboxUpdate,
  });

  return null; // Este componente no renderiza nada
}
