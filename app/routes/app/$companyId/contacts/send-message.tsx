import type { ActionFunctionArgs } from "react-router";
import { sendMessageToSocialNetwork } from "~/data/META.server";
import { getPrismaTenant } from "~/data/database.server";

export async function action({ request }: ActionFunctionArgs) {
  try {
    const {
      companyId,
      contactId,
      message,
      messageType = "TEXT",
      imageUrl,
      isResend = false,
      messageId,
    } = await request.json();

    if (!companyId || !contactId) {
      return new Response(
        JSON.stringify({
          success: false,
          error: "Missing required fields: companyId or contactId",
        }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Validar que haya al menos un mensaje o una imagen
    if (!message && !imageUrl) {
      return new Response(
        JSON.stringify({
          success: false,
          error: "Message or image is required",
        }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    const prisma = await getPrismaTenant(request);

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

    // Para Meta platforms, asegurar que solo se envíe texto O imagen, no ambos
    const isMetaPlatform =
      contact.origin === "Facebook" || contact.origin === "Instagram";
    const hasBothTextAndImage = message && imageUrl;

    if (isMetaPlatform && hasBothTextAndImage) {
      return new Response(
        JSON.stringify({
          success: false,
          error:
            "Meta platforms (Facebook/Instagram) do not support sending text and image simultaneously. Please send them as separate messages.",
        }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    const result = await sendMessageToSocialNetwork(
      request,
      companyId,
      contactId,
      message || "",
      messageType,
      imageUrl,
      contact.origin,
      isResend,
      messageId
    );

    if (result.success) {
      return new Response(
        JSON.stringify({
          success: true,
          message: result.message,
          messageId: result.messageId,
        }),
        {
          status: 200,
          headers: { "Content-Type": "application/json" },
        }
      );
    } else {
      return new Response(
        JSON.stringify({
          success: false,
          error: result.error || "Failed to send message",
        }),
        {
          status: 500,
          headers: { "Content-Type": "application/json" },
        }
      );
    }
  } catch (error) {
    console.error("Error sending message:", error);
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
