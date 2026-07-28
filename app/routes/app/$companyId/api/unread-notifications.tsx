import type { ActionFunctionArgs } from "react-router";
import { requireUserSession } from "~/data/auth.server";
import { getPrismaTenant } from "~/data/database.server";

export async function action({ request }: ActionFunctionArgs) {
  if (request.method !== "POST") {
    return Response.json({ error: "Method not allowed" }, { status: 405 });
  }

  try {
    const body = await request.json();
    const { companyId } = body;

    if (!companyId) {
      return Response.json({ error: "companyId is required" }, { status: 400 });
    }

    const userId = await requireUserSession(request);
    if (!userId) {
      return Response.json(
        { error: "User not authenticated" },
        { status: 401 }
      );
    }

    const prisma = await getPrismaTenant(request);

    // Contar notificaciones no leídas (públicas o del usuario específico)
    const unreadNotifications = await prisma.notification.count({
      where: {
        companyId: companyId,
        OR: [
          {
            userId: userId,
          },
          {
            isPublic: true,
          },
        ],
        isRead: false,
      },
    });

    return Response.json({ unreadNotifications });
  } catch (error) {
    console.error("Error obteniendo notificaciones no leídas:", error);
    return Response.json(
      { error: "Error al obtener notificaciones no leídas" },
      { status: 500 }
    );
  }
}
