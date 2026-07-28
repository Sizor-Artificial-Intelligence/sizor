import { getPrismaTenant } from "~/data/database.server";
import { requireUserSession } from "./auth.server";
import { notifyRealtimeAPI } from "./REALTIME.server";

// Obtener el conteo de notificaciones no leídas
async function getUnreadNotificationsCount(
  prisma: any,
  companyId: string,
  userId?: string
): Promise<number> {
  return await prisma.notification.count({
    where: {
      companyId,
      isRead: false,
      active: true,
      OR: [
        {
          userId: userId,
        },
        {
          isPublic: true,
        },
      ],
    },
  });
}

// Obtener las notificaciones
export async function getNotifications(
  request: Request,
  companyId: string,
  page: number = 1,
  limit: number = 10
) {
  const userId = await requireUserSession(request);
  const prisma = await getPrismaTenant(request);

  try {
    const skip = (page - 1) * limit;

    const where = {
      companyId: companyId,
      OR: [
        {
          userId: userId,
        },
        {
          isPublic: true,
        },
      ],
      active: true,
    };

    // Obtener el total de notificaciones y las notificaciones paginadas en paralelo
    const [notifications, totalCount] = await Promise.all([
      prisma.notification.findMany({
        where,
        orderBy: {
          createdAt: "desc",
        },
        skip,
        take: limit,
      }),
      prisma.notification.count({
        where,
      }),
    ]);

    const totalPages = Math.ceil(totalCount / limit);

    return {
      notifications,
      pagination: {
        currentPage: page,
        totalPages,
        totalCount,
        limit,
      },
    };
  } catch (error) {
    console.error("Error fetching notifications:", error);
    throw new Error("Error al obtener las notificaciones");
  }
}

// Marcar una notificación como leída
export async function markNotificationAsRead(
  request: Request,
  companyId: string,
  notificationId: string
) {
  const userId = await requireUserSession(request);
  const prisma = await getPrismaTenant(request);

  try {
    // Verificar que la notificación pertenece al usuario o es pública
    const notification = await prisma.notification.findFirst({
      where: {
        id: notificationId,
        companyId: companyId,
        OR: [
          {
            userId: userId,
          },
          {
            isPublic: true,
          },
        ],
      },
    });

    if (!notification) {
      return {
        success: false,
        message: "Notificación no encontrada",
      };
    }

    await prisma.notification.update({
      where: {
        id: notificationId,
      },
      data: {
        isRead: true,
      },
    });

    // Notificar actualización del contador
    const unreadCount = await getUnreadNotificationsCount(
      prisma,
      companyId,
      userId
    );
    await notifyRealtimeAPI("notifications-count-update", {
      companyId,
      unreadCount,
    });

    return {
      success: true,
      message: "Notificación marcada como leída",
    };
  } catch (error) {
    console.error("Error marking notification as read:", error);
    return {
      success: false,
      message: "Error al marcar la notificación como leída",
    };
  }
}

// Marcar todas las notificaciones como leídas
export async function markAllNotificationsAsRead(
  request: Request,
  companyId: string
) {
  const userId = await requireUserSession(request);
  const prisma = await getPrismaTenant(request);

  try {
    await prisma.notification.updateMany({
      where: {
        companyId: companyId,
        isRead: false,
        active: true,
        OR: [
          {
            userId: userId,
          },
          {
            isPublic: true,
          },
        ],
      },
      data: {
        isRead: true,
      },
    });

    // Notificar actualización del contador (ahora es 0)
    const unreadCount = await getUnreadNotificationsCount(
      prisma,
      companyId,
      userId
    );
    await notifyRealtimeAPI("notifications-count-update", {
      companyId,
      unreadCount,
    });

    return {
      success: true,
      message: "Todas las notificaciones marcadas como leídas",
    };
  } catch (error) {
    console.error("Error marking all notifications as read:", error);
    return {
      success: false,
      message: "Error al marcar todas las notificaciones como leídas",
    };
  }
}

// Eliminar una notificación
export async function deleteNotification(
  request: Request,
  companyId: string,
  notificationId: string
) {
  const userId = await requireUserSession(request);
  const prisma = await getPrismaTenant(request);

  try {
    // Verificar que la notificación pertenece al usuario o es pública
    const notification = await prisma.notification.findFirst({
      where: {
        id: notificationId,
        companyId: companyId,
        OR: [
          {
            userId: userId,
          },
          {
            isPublic: true,
          },
        ],
      },
    });

    if (!notification) {
      return {
        success: false,
        message: "Notificación no encontrada",
      };
    }

    await prisma.notification.update({
      where: {
        id: notificationId,
      },
      data: {
        active: false,
      },
    });

    return {
      success: true,
      message: "Notificación eliminada",
    };
  } catch (error) {
    console.error("Error deleting notification:", error);
    return {
      success: false,
      message: "Error al eliminar la notificación",
    };
  }
}

/* Crear notificación */
export async function createNotification(
  tenantId: string,
  companyId: string,
  title: string,
  message: string,
  type: "ESCALATION" | "FORM_FILLED" | "CONTACT_UPDATED" | "SYSTEM",
  userId?: string,
  isPublic: boolean = false,
  path?: string
) {
  try {
    const prisma = await getPrismaTenant(tenantId);

    const notification = await prisma.notification.create({
      data: {
        companyId,
        userId: userId || null,
        title,
        message,
        isPublic,
        path: path || null,
        active: true,
        isRead: false,
      },
    });

    // Obtener el conteo actualizado y notificar en una sola llamada
    const unreadCount = await getUnreadNotificationsCount(
      prisma,
      companyId,
      userId
    );

    // Notificar nueva notificación con conteo actualizado en una sola llamada
    await notifyRealtimeAPI("new-notification", {
      companyId,
      unreadCount,
      notification: {
        id: notification.id,
        title: notification.title,
        message: notification.message,
        type: type,
        isPublic: notification.isPublic,
        path: notification.path,
        createdAt: notification.createdAt,
        userId: notification.userId,
      },
    });

    return notification;
  } catch (error) {
    console.error("❌ Error creating notification:", error);
    throw new Error("Error creating notification");
  }
}
