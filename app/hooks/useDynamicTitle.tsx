import { useEffect } from "react";
import { useMessages } from "~/contexts/MessagesContext";
import { APP_NAME } from "~/config/app";

/**
 * Hook personalizado para actualizar dinámicamente el título de la página
 * basado en el número de mensajes sin leer, similar a Instagram o Facebook
 */
export function useDynamicTitle() {
  const { unreadMessages } = useMessages();

  useEffect(() => {
    const updateTitle = () => {
      if (unreadMessages > 0) {
        // Mostrar el contador en el título como (3) NombreApp
        document.title = `(${unreadMessages}) ${APP_NAME}`;
      } else {
        // Mostrar solo el nombre de la app cuando no hay mensajes sin leer
        document.title = APP_NAME;
      }
    };

    updateTitle();
  }, [unreadMessages]);

  return null;
}
