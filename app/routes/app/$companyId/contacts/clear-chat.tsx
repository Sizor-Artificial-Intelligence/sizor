import type { ActionFunctionArgs } from "react-router";
import { requireUserSession } from "~/data/auth.server";
import { getPrismaTenant } from "~/data/database.server";

export async function action({ request }: ActionFunctionArgs) {
  try {
    // Validar sesión del usuario
    await requireUserSession(request);

    const { contactId } = await request.json();

    if (!contactId) {
      return new Response(
        JSON.stringify({
          success: false,
          error: "Missing required field: contactId",
        }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    const prisma = await getPrismaTenant(request);

    // Verificar que el contacto existe
    const contact = await prisma.contact.findUnique({
      where: {
        id: contactId,
      },
    });

    if (!contact) {
      return new Response(
        JSON.stringify({
          success: false,
          error: "Contact not found",
        }),
        {
          status: 404,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Eliminar todos los mensajes del contacto
    const deleteResult = await prisma.message.deleteMany({
      where: {
        contactId: contactId,
      },
    });

    // Resetear sentimientos y lead temperature
    await prisma.contact.update({
      where: {
        id: contactId,
      },
      data: {
        sentiment: "neutral",
        leadTemperature: "cold",
      },
    });

    return new Response(
      JSON.stringify({
        success: true,
        deletedCount: deleteResult.count,
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Error clearing chat:", error);
    return new Response(
      JSON.stringify({
        success: false,
        error: "Internal server error",
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
}
