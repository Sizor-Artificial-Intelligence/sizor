import type { ActionFunctionArgs, LoaderFunctionArgs } from "react-router";
import NotificationsPage from "~/components/app/notifications";
import {
  getNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  deleteNotification,
} from "~/data/notification.server";

export default function Route() {
  return <NotificationsPage />;
}

export async function loader({ request, params }: LoaderFunctionArgs) {
  const { companyId }: any = params;
  const url = new URL(request.url);
  const page = parseInt(url.searchParams.get("page") || "1", 10);
  const limit = 10;
  return await getNotifications(request, companyId, page, limit);
}

export async function action({ request, params }: ActionFunctionArgs) {
  const formData: Record<any, any> = Object.fromEntries(
    await request.formData()
  );
  const { companyId }: any = params;

  if (request.method === "POST") {
    try {
      const action = formData?._action as string;

      if (action === "markAsRead") {
        const notificationId = formData?.notificationId as string;
        if (!notificationId) {
          return {
            success: false,
            message: "ID de notificación requerido",
          };
        }
        return await markNotificationAsRead(request, companyId, notificationId);
      }

      if (action === "markAllAsRead") {
        return await markAllNotificationsAsRead(request, companyId);
      }

      return { success: false, message: "Acción no válida" };
    } catch (error: any) {
      return {
        success: false,
        message: "Ocurrió un error inesperado. Por favor, inténtalo de nuevo.",
      };
    }
  }

  if (request.method === "DELETE") {
    try {
      const notificationId = formData?.notificationId as string;
      if (!notificationId) {
        return { success: false, message: "ID de notificación requerido" };
      }
      return await deleteNotification(request, companyId, notificationId);
    } catch (error: any) {
      return {
        success: false,
        message: "Ocurrió un error inesperado. Por favor, inténtalo de nuevo.",
      };
    }
  }

  return null;
}
