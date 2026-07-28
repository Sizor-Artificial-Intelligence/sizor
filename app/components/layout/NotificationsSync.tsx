import { useEffect, useCallback } from "react";
import { useWebSocket } from "~/hooks/useWebSocket";
import { useNotifications } from "~/contexts/NotificationsContext";
import { useCompany } from "~/hooks/useCompany";
import usePath from "~/hooks/usePath";
import { useMatches } from "react-router";
import { useUser } from "~/hooks/useUser";

/**
 * Componente que sincroniza el contador de notificaciones no leídas
 * en tiempo real usando WebSocket. Este componente debe estar montado
 * en el layout principal para que funcione en todas las rutas.
 */
export function NotificationsSync() {
  const matches = useMatches();
  const { setUnreadNotifications, incrementNotifications } = useNotifications();
  const company = useCompany();
  const PATH = usePath();
  const user = useUser();

  // Obtener el conteo actualizado desde el servidor (fallback inicial)
  const fetchNotificationsCount = useCallback(async () => {
    if (!company?.id) return;

    try {
      const response = await fetch(`${PATH}/api/unread-notifications`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ companyId: company.id }),
      });

      if (response.ok) {
        const data = await response.json();
        setUnreadNotifications(data.unreadNotifications || 0);
      }
    } catch (error) {
      console.error("Error obteniendo notificaciones no leídas:", error);
    }
  }, [company?.id, PATH, setUnreadNotifications]);

  // Manejar nueva notificación
  const handleNewNotification = useCallback(
    (notification: any) => {
      // Solo incrementar si no viene con conteo actualizado
      // (para mantener compatibilidad con notificaciones que no incluyen conteo)
      if (
        notification.unreadCount === undefined &&
        (notification.userId === user?.id || notification.isPublic)
      ) {
        incrementNotifications();
      }
    },
    [incrementNotifications]
  );

  // Manejar actualización del contador de notificaciones
  const handleNotificationsCountUpdate = useCallback(
    (unreadCount: number) => {
      setUnreadNotifications(unreadCount);
    },
    [setUnreadNotifications]
  );

  // Cargar contador inicial al montar
  useEffect(() => {
    fetchNotificationsCount();
  }, [fetchNotificationsCount]);

  // Inicializar WebSocket para notificaciones
  useWebSocket({
    onNewNotification: handleNewNotification,
    onNotificationsCountUpdate: handleNotificationsCountUpdate,
  });

  return null; // Este componente no renderiza nada
}
