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

    // Contar respuestas de formularios no leídas
    const unreadSmartInbox = await prisma.formResponse.count({
      where: {
        companyId: companyId,
        read: false,
        active: true,
      },
    });

    return Response.json({ unreadSmartInbox });
  } catch (error) {
    console.error("Error obteniendo contador de smart inbox:", error);
    return Response.json(
      { error: "Error al obtener contador de smart inbox" },
      { status: 500 }
    );
  }
}
